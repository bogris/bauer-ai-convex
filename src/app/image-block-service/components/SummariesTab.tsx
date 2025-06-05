"use client";
import { Card, Text, Button, Flex, Progress } from "@radix-ui/themes";
import { Id } from "@/convex/_generated/dataModel";

interface Block {
  _id: Id<"blocks">;
  type: string;
  src?: string;
  aiSummary?: string;
  articleId: Id<"articles">;
}

interface SummariesTabProps {
  imageBlocks: Block[] | undefined;
  blocksWithoutSummary: Block[];
  articleIds: Id<"articles">[];
  loading: boolean;
  progress: number;
  done: boolean;
  error: string | null;
  handleEnrich: () => void;
}

export default function SummariesTab({
  imageBlocks,
  blocksWithoutSummary,
  articleIds,
  loading,
  progress,
  done,
  error,
  handleEnrich,
}: SummariesTabProps) {
  return (
    <>
      <Card style={{ width: "100%", marginBottom: 24 }}>
        <Text as="div" size="4" weight="medium" mb="2">
          Total Image Blocks: {imageBlocks ? imageBlocks.length : "..."}
        </Text>
        <Text as="div" size="4" weight="medium" mb="2">
          Blocks Without AI Summary: {blocksWithoutSummary.length}
        </Text>
        <Text as="div" size="2" color="gray" mb="2">
          Unique Articles to Enrich: {articleIds.length}
        </Text>
        <Button
          onClick={handleEnrich}
          disabled={loading || articleIds.length === 0}
          size="3"
        >
          {loading ? "Enriching..." : "Enrich All Missing Summaries"}
        </Button>
        {loading && (
          <Flex direction="column" align="center" mt="4">
            <Progress value={progress} max={100} style={{ width: 300 }} />
            <Text mt="2">{Math.round(progress)}% complete</Text>
          </Flex>
        )}
        {done && (
          <Text color="green" mt="4">
            All articles enriched!
          </Text>
        )}
        {error && (
          <Text color="red" mt="4">
            {error}
          </Text>
        )}
      </Card>
      <Card style={{ width: "100%" }}>
        <Text as="div" size="4" weight="bold" mb="2">
          Image Blocks Without AI Summary
        </Text>
        <Flex direction="column" gap="3">
          {blocksWithoutSummary.length === 0 && (
            <Text color="gray">All image blocks have AI summaries.</Text>
          )}
          {blocksWithoutSummary.map((block) => (
            <Card key={block._id} style={{ background: "#f9f9fb" }}>
              <Text size="2" color="gray" mb="1">
                Article ID: {block.articleId}
              </Text>
              {block.src && (
                <img
                  src={block.src}
                  alt={"image"}
                  style={{
                    maxWidth: 200,
                    maxHeight: 120,
                    borderRadius: 8,
                    border: "1px solid #eee",
                  }}
                />
              )}
            </Card>
          ))}
        </Flex>
      </Card>
    </>
  );
}
