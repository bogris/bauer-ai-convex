"use client";

import { useState, useMemo } from "react";
import { Theme, Text, Flex, Tabs } from "@radix-ui/themes";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import SummariesTab from "./components/SummariesTab";
import EmbeddingsTab from "./components/EmbeddingsTab";

interface Block {
  _id: Id<"blocks">;
  type: string;
  src?: string;
  aiSummary?: string;
  articleId: Id<"articles">;
}

interface Article {
  _id: Id<"articles">;
  title?: string;
  url: string;
}

export default function ImageBlockServicePage() {
  // --- Image Block Summary Tab ---
  const imageBlocks = useQuery(api.blocks.listImageBlocks) as
    | Block[]
    | undefined;
  const blocksWithoutSummary = useMemo(
    () => (imageBlocks ? imageBlocks.filter((b) => !b.aiSummary) : []),
    [imageBlocks]
  );
  const articleIds = useMemo(() => {
    const set = new Set<Id<"articles">>();
    blocksWithoutSummary.forEach((b) => set.add(b.articleId));
    return Array.from(set);
  }, [blocksWithoutSummary]);
  const enrichImageBlocks = useAction(api.blocks.enrichImageBlocks);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnrich = async () => {
    setLoading(true);
    setProgress(0);
    setDone(false);
    setError(null);
    for (let i = 0; i < articleIds.length; i++) {
      try {
        await enrichImageBlocks({ articleId: articleIds[i], override: false });
        setProgress(((i + 1) / articleIds.length) * 100);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Error enriching image blocks"
        );
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setDone(true);
  };

  // --- Embeddings Tab ---
  const articles = useQuery(api.importArticles.listAllArticles) as
    | Article[]
    | undefined;
  const generateEmbeddings = useAction(
    api.blocks.generateEmbeddingsForArticleBlocks
  );
  const [embeddingsProgress, setEmbeddingsProgress] = useState(0);
  const [embeddingsLoading, setEmbeddingsLoading] = useState(false);
  const [embeddingsDone, setEmbeddingsDone] = useState(false);
  const [embeddingsError, setEmbeddingsError] = useState<string | null>(null);

  const handleGenerateEmbeddings = async () => {
    if (!articles) return;
    setEmbeddingsLoading(true);
    setEmbeddingsProgress(0);
    setEmbeddingsDone(false);
    setEmbeddingsError(null);
    for (let i = 0; i < articles.length; i++) {
      try {
        await generateEmbeddings({ articleId: articles[i]._id });
        setEmbeddingsProgress(((i + 1) / articles.length) * 100);
      } catch (e: unknown) {
        setEmbeddingsError(
          e instanceof Error ? e.message : "Error generating embeddings"
        );
        setEmbeddingsLoading(false);
        return;
      }
    }
    setEmbeddingsLoading(false);
    setEmbeddingsDone(true);
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
        <Tabs.Root defaultValue="summaries" style={{ width: "100%" }}>
          <Tabs.List>
            <Tabs.Trigger value="summaries">Summaries</Tabs.Trigger>
            <Tabs.Trigger value="embeddings">Embeddings</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="summaries">
            <SummariesTab
              imageBlocks={imageBlocks}
              blocksWithoutSummary={blocksWithoutSummary}
              articleIds={articleIds}
              loading={loading}
              progress={progress}
              done={done}
              error={error}
              handleEnrich={handleEnrich}
            />
          </Tabs.Content>
          <Tabs.Content value="embeddings">
            <EmbeddingsTab
              articles={articles}
              embeddingsLoading={embeddingsLoading}
              embeddingsProgress={embeddingsProgress}
              embeddingsDone={embeddingsDone}
              embeddingsError={embeddingsError}
              handleGenerateEmbeddings={handleGenerateEmbeddings}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Theme>
  );
}
