/** @format */

"use client";
import "@radix-ui/themes/styles.css";
import { Theme, Text, Button, Select, IconButton } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

// Type for article
interface Article {
  _id: Id<"articles">;
  title?: string;
  url: string;
}

// Type for block
interface Block {
  _id: Id<"blocks">;
  _creationTime: number;
  type: string;
  text?: string;
  items?: string[];
  code?: string;
  src?: string;
  alt?: string;
  encoding?: string;
  aiSummary?: string;
  articleId: Id<"articles">;
  ordered?: boolean;
}

const BLOCK_TYPES = [
  { value: "all", label: "All" },
  { value: "header", label: "Header" },
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "list", label: "List" },
  { value: "code", label: "Code" },
];

function ArticleBlocks({
  articleId,
  selectedArticleUrl,
}: {
  articleId: Id<"articles">;
  selectedArticleUrl: string | null;
}) {
  const [blockType, setBlockType] = useState<string>("all");
  const blocks = useQuery(api.blocks.getArticleBlocks, { articleId });
  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
    if (blockType === "all") return blocks;
    return blocks.filter((b: Block) => b.type === blockType);
  }, [blocks, blockType]);

  if (!blocks) return <Text>Loading blocks...</Text>;
  if (blocks.length === 0)
    return <Text>No blocks found for this article.</Text>;
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Text as="label" size="2">
          Block type:
        </Text>
        <Select.Root value={blockType} onValueChange={setBlockType} size={"1"}>
          <Select.Trigger />
          <Select.Content>
            {BLOCK_TYPES.map((t) => (
              <Select.Item key={t.value} value={t.value}>
                {t.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        {selectedArticleUrl && (
          <a
            href={selectedArticleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="1"
              className="flex items-center gap-2"
            >
              <ExternalLinkIcon />
              Open in new tab
            </Button>
          </a>
        )}
      </div>
      <div className="space-y-4">
        {filteredBlocks.map((block: Block) => (
          <div
            key={block._id}
            className="mb-2 p-4 border border-gray-200 rounded-lg bg-gray-50"
          >
            <Text size="2" color="gray" className="mb-1 block">
              <b>{block.type}</b>
            </Text>
            {block.type === "header" && (
              <Text as="div" size="4" weight="bold">
                {block.text}
              </Text>
            )}
            {block.type === "text" && <Text as="div">{block.text}</Text>}
            {block.type === "image" && (
              <div className="flex flex-col gap-2">
                <img
                  src={block.src}
                  alt={block.alt || "image"}
                  className="max-w-xs max-h-52 rounded border"
                />
                {block.alt && (
                  <Text size="1" color="gray">
                    {block.alt}
                  </Text>
                )}
              </div>
            )}
            {block.type === "list" && (
              <ul className="list-disc pl-6">
                {block.items?.map((item, i) => (
                  <li key={i}>
                    <Text>{item}</Text>
                  </li>
                ))}
              </ul>
            )}
            {block.type === "code" && (
              <pre className="bg-gray-900 text-white p-3 rounded text-sm overflow-x-auto">
                {block.code}
              </pre>
            )}
            {block.aiSummary && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <Text size="2" color="blue" weight="medium">
                  AI Summary:
                </Text>
                <Text as="div" size="2">
                  {block.aiSummary}
                </Text>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  // State for search and selected article
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"articles"> | null>(null);

  // Fetch all articles
  const articles = (useQuery(api.importArticles.listAllArticles) ??
    []) as Doc<"articles">[];

  // Filtered articles by search
  const filtered = useMemo<Doc<"articles">[]>(() => {
    if (!search) return articles;
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.url?.toLowerCase().includes(search.toLowerCase())
    );
  }, [articles.length, search]);

  // Magic article id for quick access (replace with a real one from your db)
  const MAGIC_ARTICLE_ID =
    articles[0]?._id || ("magic-article-id" as Id<"articles">);

  const selectedArticleUrl = useMemo(() => {
    if (!selectedId) return null;
    return articles.find((a) => a._id === selectedId)?.url;
  }, [selectedId, articles]);
  return (
    <Theme>
      <div className="flex h-screen">
        {/* Sidebar: Article list and search */}
        <div className="w-80 border-r border-gray-200 p-4 flex flex-col">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 p-2 rounded border border-gray-300"
          />
          <Button
            className="mb-3"
            onClick={() => setSelectedId(MAGIC_ARTICLE_ID)}
            variant="surface"
          >
            ✨ Magic Article
          </Button>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <Text>No articles found.</Text>}
            {filtered.map((article) => (
              <div
                key={article._id}
                onClick={() => setSelectedId(article._id)}
                className={`p-3 mb-2 rounded cursor-pointer ${
                  selectedId === article._id
                    ? "bg-blue-50 border border-blue-400 font-bold"
                    : "hover:bg-gray-100 border border-transparent"
                }`}
              >
                <Text as="div" size="3">
                  {article.title || (
                    <span className="text-gray-400">(No title)</span>
                  )}
                </Text>
              </div>
            ))}
          </div>
        </div>
        {/* Main: Article blocks */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!selectedId && (
            <Text color="gray">Select an article to view its blocks.</Text>
          )}
          {selectedId && (
            <ArticleBlocks
              articleId={selectedId}
              selectedArticleUrl={selectedArticleUrl ?? null}
            />
          )}
        </div>
      </div>
    </Theme>
  );
}
