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
  Dialog,
} from "@radix-ui/themes";
import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrashIcon } from "@radix-ui/react-icons";
import { Message } from "./Message";

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
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Convex actions
  const createThread = useAction(api.agentActions.createThread);
  const continueThread = useAction(api.agentActions.continueThread);
  const listThreads = useAction(api.agentActions.listThreads);
  const listMessages = useAction(api.agentActions.listMessages);
  const deleteThread = useAction(api.agentActions.deleteThread);

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
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          minHeight: 0,
          height: "100vh",
        }}
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
                <div
                  key={thread._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Select.Item
                    value={thread._id}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    {thread.title || thread._id}
                  </Select.Item>
                  <Dialog.Root
                    open={dialogOpen === thread._id}
                    onOpenChange={(open) =>
                      setDialogOpen(open ? thread._id : null)
                    }
                  >
                    <Dialog.Trigger>
                      <Button
                        variant="ghost"
                        color="red"
                        size="1"
                        style={{ marginLeft: 4 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialogOpen(thread._id);
                        }}
                        aria-label="Delete thread"
                      >
                        <TrashIcon />
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Content maxWidth="350px">
                      <Dialog.Title>Delete thread?</Dialog.Title>
                      <Dialog.Description size="2" mb="4">
                        Are you sure you want to delete this thread? This action
                        cannot be undone.
                      </Dialog.Description>
                      <Flex gap="3" justify="end">
                        <Dialog.Close>
                          <Button
                            variant="soft"
                            color="gray"
                            disabled={deleting}
                          >
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button
                          color="red"
                          loading={deleting}
                          onClick={async () => {
                            setDeleting(true);
                            await deleteThread({ threadId: thread._id });
                            const res = await listThreads({ userId });
                            setThreads(res.page);
                            if (selectedThread === thread._id) {
                              setSelectedThread(null);
                              setMessages([]);
                            }
                            setDeleting(false);
                            setDialogOpen(null);
                          }}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </div>
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
        <Flex
          direction="column"
          style={{
            flex: "1 1 0",
            width: "100%",
            maxWidth: 800,
            marginBottom: 24,
            minHeight: 0,
          }}
        >
          <Card
            style={{
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              padding: 0,
            }}
          >
            <ScrollArea
              type="always"
              scrollbars="vertical"
              style={{ flex: "1 1 0", minHeight: 0 }}
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
                    <Message role={msg.role} content={msg.content} />
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
        </Flex>
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
          Powered by{" "}
          <a
            href="https://xoxo-labs.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            xoxo-labs
          </a>
          .
        </Text>
      </Flex>
    </Theme>
  );
}
