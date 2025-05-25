/** @format */

"use client";

import "@radix-ui/themes/styles.css";
import {
  Theme,
  Card,
  Flex,
  Text,
  TextField,
  Button,
  Spinner,
  ScrollArea,
  Select,
} from "@radix-ui/themes";
import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Replace with your auth logic
const getUserId = () => "demo-user-123";

type Message = {
  _id: string;
  role: "user" | "assistant";
  content: string;
};

type Thread = {
  _id: string;
  title?: string;
};

export default function ChatPage() {
  const userId = getUserId();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convex actions
  const createThread = useAction(api.agentActions.createThread);
  const continueThread = useAction(api.agentActions.continueThread);
  const listThreads = useAction(api.agentActions.listThreads);
  const listMessages = useAction(api.agentActions.listMessages);

  // Load threads on mount
  useEffect(() => {
    (async () => {
      const res = await listThreads({ userId });
      setThreads(res.page);
      if (res.page.length > 0) setSelectedThread(res.page[0]._id);
    })();
    // eslint-disable-next-line
  }, []);

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
      // Optionally reload threads
      const threadsRes = await listThreads({ userId });
      setThreads(threadsRes.page);
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
      <Flex
        direction="column"
        align="center"
        style={{ maxWidth: 600, margin: "2rem auto", padding: 24 }}
      >
        <Text as="div" size="6" weight="bold" mb="4">
          AI Chat
        </Text>
        <Flex gap="3" mb="4" width="100%">
          <Select.Root
            value={selectedThread ?? ""}
            onValueChange={(val) => setSelectedThread(val)}
          >
            <Select.Trigger placeholder="Select a thread" />
            <Select.Content>
              {threads.map((thread) => (
                <Select.Item key={thread._id} value={thread._id}>
                  {thread.title || thread._id}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Button
            onClick={() => {
              setSelectedThread(null);
              setMessages([]);
            }}
            variant="surface"
          >
            + New Chat
          </Button>
        </Flex>
        <Card
          style={{
            width: "100%",
            minHeight: 400,
            maxHeight: 500,
            marginBottom: 24,
            padding: 0,
          }}
        >
          <ScrollArea
            type="always"
            scrollbars="vertical"
            style={{ height: 400 }}
          >
            <div ref={scrollRef} style={{ padding: 16 }}>
              {messages.length === 0 && (
                <Text color="gray">Start the conversation...</Text>
              )}
              {messages.map((msg, i) => (
                <Flex
                  key={i}
                  direction="column"
                  align={msg.role === "user" ? "end" : "start"}
                  mb="3"
                >
                  <Card
                    style={{
                      background: msg.role === "user" ? "#e0e7ff" : "#f1f5f9",
                      maxWidth: "80%",
                      alignSelf:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Text
                      size="3"
                      color={msg.role === "user" ? "indigo" : "gray"}
                    >
                      {msg.content}
                    </Text>
                  </Card>
                </Flex>
              ))}
              {loading && (
                <Flex align="center" gap="2" mt="2">
                  <Spinner />
                  <Text color="gray">AI is typing...</Text>
                </Flex>
              )}
            </div>
          </ScrollArea>
        </Card>
        <form onSubmit={handleSend} style={{ width: "100%" }}>
          <Flex gap="3">
            <TextField.Root
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1 }}
              size="3"
              disabled={loading}
            />
            <Button type="submit" size="3" disabled={loading || !input.trim()}>
              Send
            </Button>
          </Flex>
        </form>
        <Text color="gray" mt="4" size="2">
          Powered by Convex Agent.{" "}
          <a
            href="https://www.convex.dev/components/agent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        </Text>
      </Flex>
    </Theme>
  );
}
