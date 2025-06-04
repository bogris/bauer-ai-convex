"use client";

import "@radix-ui/themes/styles.css";
import { Theme, Text, TextField, Button, Spinner } from "@radix-ui/themes";
import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Message } from "./chat/Message";
import DeleteThreadButton from "./components/DeleteThread";

// Replace with your auth logic
const getUserId = () => "demo-user-123";

type MessageType = {
  _id: string;
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const userId = getUserId();
  const threads = useQuery(api.agentActions.listThreads, { userId });
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Convex actions
  const createThread = useAction(api.agentActions.createThread);
  const continueThread = useAction(api.agentActions.continueThread);
  const listMessages = useAction(api.agentActions.listMessages);

  const afterDelete = async (threadId: string) => {
    if (selectedThread === threadId) {
      setSelectedThread(null);
      setMessages([]);
    }
  };

  // Load messages when thread changes
  useEffect(() => {
    if (!selectedThread) return;
    (async () => {
      const res = await listMessages({ threadId: selectedThread });
      setMessages(
        res.page
          .filter(
            (msg) =>
              msg.message?.role === "user" || msg.message?.role === "assistant"
          )
          .map((msg) => {
            let content = "";
            if (msg.message) {
              if (typeof msg.message.content === "string") {
                content = msg.message.content;
              } else if (Array.isArray(msg.message.content)) {
                // Only extract .text from items of type 'text'
                type TextContent = { type: "text"; text: string };
                function isTextContent(c: unknown): c is TextContent {
                  return (
                    typeof c === "object" &&
                    c !== null &&
                    "type" in c &&
                    (c as { type?: unknown }).type === "text" &&
                    "text" in c &&
                    typeof (c as { text?: unknown }).text === "string"
                  );
                }
                content = msg.message.content
                  .filter(isTextContent)
                  .map((c) => c.text)
                  .join(" ");
              }
            }
            return {
              _id: msg._id,
              role: msg.message?.role as "user" | "assistant",
              content,
            };
          })
      );
    })();
    // eslint-disable-next-line
  }, [selectedThread]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    if (!selectedThread) {
      // New thread
      const res = await createThread({ prompt: input, userId });
      setSelectedThread(res.threadId);
      setMessages([
        { _id: `${Date.now()}`, role: "user", content: input },
        { _id: `${Date.now()}-ai`, role: "assistant", content: res.aiMessage },
      ]);
      // No need to reload threads, useQuery will update automatically
    } else {
      // Continue thread
      setMessages((msgs) => [
        ...msgs,
        { _id: `${Date.now()}`, role: "user", content: input },
      ]);
      const res = await continueThread({
        prompt: input,
        threadId: selectedThread,
      });
      setMessages((msgs) => [
        ...msgs,
        { _id: `${Date.now()}-ai`, role: "assistant", content: res.aiMessage },
      ]);
    }
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
                setMessages([]);
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
                    <Text as="div" size="3">
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
                <div
                  className="flex-1 overflow-y-auto p-4"
                  ref={scrollRef}
                  style={{ minHeight: 0 }}
                >
                  {messages.length === 0 && (
                    <Text color="gray">Start the conversation...</Text>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col mb-3 ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <Message role={msg.role} content={msg.content} />
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 mt-2">
                      <Spinner />
                      <Text color="gray">AI is typing...</Text>
                    </div>
                  )}
                </div>
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



