/** @format */

import { Card, Text } from "@radix-ui/themes";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
// @ts-expect-error: No types for react-syntax-highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { MessageDoc } from "@convex-dev/agent";
import { cn } from "@/lib/utils";

// Bouncing dots loading indicator
function BouncingDots(props: { className?: string }) {
  return (
    <div className={cn("flex gap-1.5 items-center h-6", props.className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full bg-blue-300 animate-bounce"
          style={{ animation: `bounce 1s ${i * 0.2}s infinite both` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(1); opacity: 0.7; }
          40% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const GenericToolCallContent = () => {
  return (
    <Text as="span" color="gray" size="2" className="flex items-center gap-2">
      <span>🔍</span>
      <span>Searching documentation...</span>
    </Text>
  );
};
export function Message({ messageDoc }: { messageDoc: MessageDoc }) {
  const { message, status } = messageDoc;

  const possibleToolCalls = getToolCallsNames(messageDoc);
  const isToolCall = possibleToolCalls && possibleToolCalls.length > 0;

  if (messageDoc.message?.role === "tool") return null; //looks lieke a tool response
  return (
    <>
      <Card
        style={{
          background: message?.role === "user" ? "#e0e7ff" : "#f1f5f9",
          maxWidth: "80%",
          alignSelf: message?.role === "user" ? "flex-end" : "flex-start",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      >
        {isToolCall && <GenericToolCallContent />}
        {!isToolCall && (
          <Text size="2" color={message?.role === "user" ? "indigo" : "gray"}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                a({ href, children, ...props }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                      {...props}
                    >
                      <Text as="span" color="blue">
                        {children}
                      </Text>
                    </a>
                  );
                },
              }}
            >
              {messageDoc.text}
            </ReactMarkdown>
          </Text>
        )}
      </Card>
      {status === "pending" && <BouncingDots className="m-2" />}
    </>
  );
}

const getToolCallsNames = (messageDoc: MessageDoc) => {
  if (!messageDoc.message) return null;
  if (Array.isArray(messageDoc.message.content)) {
    const toolCalls = messageDoc.message.content.filter(
      (item) => item.type === "tool-call"
    );
    if (toolCalls.length === 0) return null;
    return toolCalls.map((call) => call.toolName);
  }
  return null;
};