/** @format */

"use client";

import "@radix-ui/themes/styles.css";
import {
  Theme,
  Text,
  Button,
  Card,
  Flex,
  TextField,
  Spinner,
} from "@radix-ui/themes";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ExternalLinkIcon } from "@radix-ui/react-icons";

type Article = {
  _id: Id<"articles">;
  _creationTime: number;
  title?: string;
  categoryId?: Id<"categories">;
  url: string;
};

type Block = {
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
};

export default function VectorSearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    article: Article;
    blocks: Block[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchBlocks = useAction(api.blocks.getBlocksByVectorSearch);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await searchBlocks({ query });
      if (res.articles && res.articles.length > 0) {
        setResult({ article: res.articles[0], blocks: res.blocks });
      } else {
        setResult(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Theme>
      <Flex
        direction="column"
        align="center"
        style={{ maxWidth: 700, margin: "2rem auto", padding: 24 }}
      >
        <Text as="div" size="6" weight="bold" mb="4">
          Block Vector Search
        </Text>
        <form
          onSubmit={handleSearch}
          style={{ width: "100%", marginBottom: 24 }}
        >
          <Flex gap="3">
            <TextField.Root
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              style={{ flex: 1 }}
              size="3"
            />
            <Button type="submit" size="3" disabled={loading}>
              {loading ? <Spinner /> : "Search"}
            </Button>
          </Flex>
        </form>
        {error && (
          <Text color="red" mb="4">
            {error}
          </Text>
        )}
        {loading && <Spinner />}
        {result && (
          <Card style={{ width: "100%", marginTop: 24 }}>
            <div className="flex gap-4">
              <Text as="div" size="5" weight="bold" mb="2">
                Most Relevant Article
              </Text>
              <div className="grow"></div>
              <a
                href={result.article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="1">
                  <ExternalLinkIcon />
                  Open in new tab
                </Button>
              </a>
            </div>

            <Text as="div" size="4" weight="medium" mb="1">
              {result.article.title || (
                <span className="text-gray-400">(No title)</span>
              )}
            </Text>
            <Text as="div" size="4" weight="bold" mt="4" mb="2">
              Blocks
            </Text>
            <Flex direction="column" gap="4">
              {result.blocks.length === 0 && (
                <Text>No blocks found for this article.</Text>
              )}
              {result.blocks.map((block) => (
                <Card key={block._id} style={{ background: "#f9f9fb" }}>
                  <Text size="2" color="gray" mb="1">
                    <b>{block.type}</b>
                  </Text>
                  {block.type === "header" && (
                    <Text as="div" size="4" weight="bold">
                      {block.text}
                    </Text>
                  )}
                  {block.type === "text" && <Text as="div">{block.text}</Text>}
                  {block.type === "image" && (
                    <Flex direction="column" gap="2">
                      {block.src && (
                        <img
                          src={block.src}
                          alt={block.alt || "image"}
                          style={{
                            maxWidth: 300,
                            maxHeight: 200,
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                        />
                      )}
                      {block.alt && (
                        <Text size="1" color="gray">
                          {block.alt}
                        </Text>
                      )}
                    </Flex>
                  )}
                  {block.type === "list" && (
                    <ul style={{ paddingLeft: 24 }}>
                      {block.items?.map((item, i) => (
                        <li key={i}>
                          <Text>{item}</Text>
                        </li>
                      ))}
                    </ul>
                  )}
                  {block.type === "code" && (
                    <pre
                      style={{
                        background: "#222",
                        color: "#fff",
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 14,
                        overflowX: "auto",
                      }}
                    >
                      {block.code}
                    </pre>
                  )}
                  {block.aiSummary && (
                    <Card mt="3" style={{ background: "#eaf4ff" }}>
                      <Text size="2" color="blue" weight="medium">
                        AI Summary:
                      </Text>
                      <Text as="div" size="2">
                        {block.aiSummary}
                      </Text>
                    </Card>
                  )}
                </Card>
              ))}
            </Flex>
          </Card>
        )}
        {!loading && !result && (
          <Text color="gray" mt="4">
            Enter a query and search for relevant blocks.
          </Text>
        )}
      </Flex>
    </Theme>
  );
}
