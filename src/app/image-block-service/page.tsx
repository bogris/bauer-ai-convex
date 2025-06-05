"use client";

import { useState, useMemo } from "react";
import { Theme, Text, Button, Card, Progress, Flex } from "@radix-ui/themes";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Block {
  _id: Id<"blocks">;
  type: string;
  src?: string;
  aiSummary?: string;
  articleId: Id<"articles">;
}

export default function ImageBlockServicePage() {
  // Load all image blocks
  const imageBlocks = useQuery(api.blocks.listImageBlocks) as
    | Block[]
    | undefined;

  // Compute blocks without aiSummary
  const blocksWithoutSummary = useMemo(
    () => (imageBlocks ? imageBlocks.filter((b) => !b.aiSummary) : []),
    [imageBlocks]
  );

  // Get unique article IDs from blocks without aiSummary
  const articleIds = useMemo(() => {
    const set = new Set<Id<"articles">>();
    blocksWithoutSummary.forEach((b) => set.add(b.articleId));
    return Array.from(set);
  }, [blocksWithoutSummary]);

  // Action to enrich image blocks for an article
  const enrichImageBlocks = useAction(api.blocks.enrichImageBlocks);

  // Progress state
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler to enrich all articles with missing summaries
  const handleEnrich = async () => {
    setLoading(true);
    setProgress(0);
    setDone(false);
    setError(null);
    for (let i = 0; i < articleIds.length; i++) {
      try {
        await enrichImageBlocks({ articleId: articleIds[i], override: false });
        setProgress(((i + 1) / articleIds.length) * 100);
      } catch (e: any) {
        setError(e.message || "Error enriching image blocks");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setDone(true);
  };

  return (
    <Theme>
      <Flex
        direction="column"
        align="center"
        style={{ maxWidth: 700, margin: "2rem auto", padding: 24 }}
      >
        <Text as="div" size="6" weight="bold" mb="4">
          Image Block Service
        </Text>
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
      </Flex>
    </Theme>
  );
}
