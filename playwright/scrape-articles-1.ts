console.info("Launching browser...");
const browser = await window.playwright.chromium.connectOverCDP(window.connectionString);
console.info('Connected!');

const page = await browser.newPage();
const categoryUrls = [
  'https://irricontrol.zendesk.com/hc/en-us/categories/4414432877467-Irricontrol-Platform',
  'https://irricontrol.zendesk.com/hc/en-us/categories/5715690941595-Know-the-Equipment',
  'https://irricontrol.zendesk.com/hc/en-us/categories/4415774040219-Equipment-Installation',
  'https://irricontrol.zendesk.com/hc/en-us/categories/4469384047131-Firmware-Update',
  'https://irricontrol.zendesk.com/hc/en-us/categories/4414424988059-General-Problems',
  'https://irricontrol.zendesk.com/hc/en-us/categories/4415760804635-Equipment-Testing',
];

const results = [];
let count = 0;

for (const url of categoryUrls) {
  if (count >= 3) break;

  console.info(`Visiting category: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const articleLinks = await page.$$eval('a.article-list-link', links =>
    links.map(link => ({
      href: link.href,
      title: link.textContent.trim()
    }))
  );

  for (const { href, title } of articleLinks) {
    if (count >= 3) break;

    console.info(`Opening article: ${title}`);
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const { blocks, base64Images } = await page.evaluate(() => {
      const body = document.querySelector('.article-body');
      if (!body) return { blocks: [], base64Images: [] };

      const result = [];
      const base64Images = [];
      let base64Counter = 0;

      for (const node of body.children) {
        const tag = node.tagName.toLowerCase();

        const pushBase64 = (src, alt) => {
          const refId = `base64-${base64Counter++}`;
          base64Images.push({ refId, src, alt });
          result.push({ type: 'image', encoding: 'base64', refId, alt });
        };

        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          result.push({ type: 'header', level: tag, text: node.innerText.trim() });
        } else if (tag === 'p') {
          const imgs = node.querySelectorAll('img');
          imgs.forEach(img => {
            if (img.src.startsWith('data:')) {
              pushBase64(img.src, img.alt || '');
            } else {
              result.push({ type: 'image', src: img.src, alt: img.alt || '', encoding: 'url' });
            }
          });
          const text = node.innerText.trim();
          if (text) result.push({ type: 'text', text });
        } else if (tag === 'img') {
          if (node.src.startsWith('data:')) {
            pushBase64(node.src, node.alt || '');
          } else {
            result.push({ type: 'image', src: node.src, alt: node.alt || '', encoding: 'url' });
          }
        } else if (tag === 'ul' || tag === 'ol') {
          const items = Array.from(node.querySelectorAll('li')).map(li => li.innerText.trim()).filter(Boolean);
          result.push({ type: 'list', ordered: tag === 'ol', items });
        } else if (tag === 'pre' || tag === 'code') {
          result.push({ type: 'code', code: node.innerText.trim() });
        }
      }

      return { blocks: result, base64Images };
    });

    results.push({
      title,
      url: href,
      blocks,
      base64Images
    });

    count++;
  }
}

console.log("Collected Articles:", results);
await browser.close();
