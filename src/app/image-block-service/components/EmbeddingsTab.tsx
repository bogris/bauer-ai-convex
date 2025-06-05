"use client";
import { Card, Text, Button, Flex, Progress } from "@radix-ui/themes";
import { Id } from "@/convex/_generated/dataModel";

interface Article {
  _id: Id<"articles">;
  title?: string;
  url: string;
}

interface EmbeddingsTabProps {
  articles: Article[] | undefined;
  embeddingsLoading: boolean;
  embeddingsProgress: number;
  embeddingsDone: boolean;
  embeddingsError: string | null;
  handleGenerateEmbeddings: () => void;
}

export default function EmbeddingsTab({
  articles,
  embeddingsLoading,
  embeddingsProgress,
  embeddingsDone,
  embeddingsError,
  handleGenerateEmbeddings,
}: EmbeddingsTabProps) {
  return (
    <>
      <Card style={{ width: "100%", marginBottom: 24 }}>
        <Text as="div" size="4" weight="medium" mb="2">
          Total Articles: {articles ? articles.length : "..."}
        </Text>
        <Button
          onClick={handleGenerateEmbeddings}
          disabled={embeddingsLoading || !articles || articles.length === 0}
          size="3"
        >
          {embeddingsLoading
            ? "Generating..."
            : "Generate Embeddings For All Articles"}
        </Button>
        {embeddingsLoading && (
          <Flex direction="column" align="center" mt="4">
            <Progress
              value={embeddingsProgress}
              max={100}
              style={{ width: 300 }}
            />
            <Text mt="2">
              {articles
                ? Math.round((embeddingsProgress / 100) * articles.length)
                : 0}{" "}
              / {articles ? articles.length : 0} articles complete
            </Text>
          </Flex>
        )}
        {embeddingsDone && (
          <Text color="green" mt="4">
            All article embeddings generated!
          </Text>
        )}
        {embeddingsError && (
          <Text color="red" mt="4">
            {embeddingsError}
          </Text>
        )}
      </Card>
      <Card style={{ width: "100%" }}>
        <Text as="div" size="4" weight="bold" mb="2">
          Article List
        </Text>
        <Flex direction="column" gap="3">
          {(!articles || articles.length === 0) && (
            <Text color="gray">No articles found.</Text>
          )}
          {articles &&
            articles.map((article) => (
              <Card key={article._id} style={{ background: "#f9f9fb" }}>
                <Text size="3" weight="bold">
                  {article.title || (
                    <span className="text-gray-400">(No title)</span>
                  )}
                </Text>
                <Text size="2" color="gray">
                  {article.url}
                </Text>
              </Card>
            ))}
        </Flex>
      </Card>
    </>
  );
}
