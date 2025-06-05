"use client";

import "@radix-ui/themes/styles.css";
import {
  Theme,
  Text,
  TextField,
  Button,
  IconButton,
  Select,
  Heading,
} from "@radix-ui/themes";
import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DeleteThreadButton from "./components/DeleteThread";
import ThreadView from "./components/ThreadView";
import { optimisticallySendMessage } from "@convex-dev/agent/react";
import { PlusIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import { useThreadsState } from "./components/use-threads-state";

const modelNames = z.enum(["gpt-4.1-mini", "gpt-4.1", "gpt-4o"]);
type ModelName = z.infer<typeof modelNames>;

const modelNamesLabels: Record<ModelName, string> = {
  "gpt-4.1-mini": "mini GPT",
  "gpt-4.1": "... GPT",
  "gpt-4o": "GPT-4o",
};

const ModelSelect = (props: {
  onChange: (modelName: ModelName) => void;
  value: ModelName;
}) => {
  return (
    <Select.Root value={props.value} onValueChange={props.onChange}>
      <Select.Trigger variant="ghost" />
      <Select.Content>
        {modelNames.options.map((modelName) => (
          <Select.Item value={modelName} key={modelName}>
            {modelNamesLabels[modelName]}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export default function HomePage() {
  const threads = useQuery(api.agentActions.listThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const convex = useConvex();
  const { showThreadsPanel } = useThreadsState();
  const [modelName, setModelName] = useState<ModelName>("gpt-4.1-mini");
  const afterDelete = async (threadId: string) => {
    if (selectedThread === threadId) {
      setSelectedThread(null);
    }
  };

  const sendMessage = useMutation(
    api.agentActions.sendMessageToThreadFromUser
  ).withOptimisticUpdate((store) => {
    optimisticallySendMessage(api.agentActions.listMessagesForUserThread)(
      store,
      {
        threadId: selectedThread!,
        prompt: input,
      }
    );
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    let resolvedThreadId = selectedThread;
    if (!resolvedThreadId) {
      const { threadId } = await convex.action(api.agentActions.createThread, {
        prompt: input,
      });
      resolvedThreadId = threadId;
      setSelectedThread(threadId);
    }

    sendMessage({
      message: input,
      threadId: resolvedThreadId,
      modelName,
    });

    setInput("");
    setLoading(false);
  };

  return (
    <Theme>
      <div className="w-full h-[calc(100dvh-3rem)] flex bg-gray-50 overflow-x-hidden">
        {/* Left Sidebar */}
        {showThreadsPanel && (
          <div className="w-80 border-r border-gray-200 p-4 flex flex-col">
            <div className="flex items-center  mb-3 gap-4 ml-3 mr-1">
              <Heading size="3">Threads</Heading>
              <div className="grow"></div>
              <ModelSelect value={modelName} onChange={setModelName} />
              <IconButton
                onClick={() => {
                  setSelectedThread(null);
                  // setMessages([]);
                }}
                variant="surface"
                size="2"
              >
                <PlusIcon />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!threads && (
                <Text className="p-4 text-gray-400">Loading threads...</Text>
              )}
              {threads && threads.page.length === 0 && (
                <Text className="p-4 text-gray-400">No threads yet.</Text>
              )}
              {threads &&
                threads.page.map((thread) => (
                  <div
                    key={thread._id}
                    onClick={() => setSelectedThread(thread._id)}
                    className={`p-3 gap-2 mb-2 rounded cursor-pointer flex items-center justify-between transition-colors ${
                      selectedThread === thread._id
                        ? "bg-blue-50 border border-blue-400 "
                        : "hover:bg-gray-100 border border-transparent"
                    }`}
                  >
                    <div
                      className="truncate flex-1 min-w-0"
                      title={thread.title || thread._id}
                    >
                      <Text as="div" size="2">
                        {thread.title || (
                          <span className="text-gray-400 ">(No title)</span>
                        )}
                      </Text>
                    </div>
                    <DeleteThreadButton
                      threadId={thread._id}
                      afterDelete={() => afterDelete(thread._id)}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col p-2 md:p-6 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col min-h-0 rounded-lg  border-gray-300 border">
                {selectedThread ? (
                  <ThreadView threadId={selectedThread} />
                ) : (
                  <Text color="gray" className="p-4">
                    Select a thread to start a conversation
                  </Text>
                )}
              </div>
            </div>
            <form
              onSubmit={handleSend}
              className="mt-2 md:mt-4 flex gap-2 md:gap-3 w-full max-w-full"
            >
              <TextField.Root
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-w-0"
                size={{ initial: "2", md: "3" }}
                disabled={loading}
              />
              <Button
                type="submit"
                size={{ initial: "2", md: "3" }}
                disabled={loading || !input.trim()}
                className="max-w-[40vw] sm:max-w-[200px] truncate"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Theme>
  );
}



