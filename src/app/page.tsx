"use client";

import "@radix-ui/themes/styles.css";
import { Theme, Text, TextField, Button } from "@radix-ui/themes";
import { useState } from "react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DeleteThreadButton from "./components/DeleteThread";
import ThreadView from "./components/ThreadView";
import { optimisticallySendMessage } from "@convex-dev/agent/react";

export default function HomePage() {
  const threads = useQuery(api.agentActions.listThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const convex = useConvex();

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
    });

    setInput("");
    setLoading(false);
  };

  return (
    <Theme>
      <div className="w-full h-[calc(100vh-3rem)] flex bg-gray-50">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-lg">Threads</span>
            <Button
              onClick={() => {
                setSelectedThread(null);
                // setMessages([]);
              }}
              variant="surface"
              size="2"
            >
              + New Chat
            </Button>
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
        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col p-6 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col min-h-0 rounded-lg  border-gray-300 border">
                {selectedThread ? (
                  <ThreadView threadId={selectedThread} />
                ) : (
                  <Text color="gray" className="m-4">
                    Select a thread to start a conversation
                  </Text>
                )}
              </div>
            </div>
            <form onSubmit={handleSend} className="mt-4 flex gap-3">
              <TextField.Root
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                size="3"
                disabled={loading}
              />
              <Button
                type="submit"
                size="3"
                disabled={loading || !input.trim()}
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



