/** @format */

import { Card, Text } from "@radix-ui/themes";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
// @ts-expect-error: No types for react-syntax-highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

export type MessageProps = {
  role: "user" | "assistant";
  content: string;
};

export function Message({ role, content }: MessageProps) {
  return (
    <Card
      style={{
        background: role === "user" ? "#e0e7ff" : "#f1f5f9",
        maxWidth: "80%",
        alignSelf: role === "user" ? "flex-end" : "flex-start",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      }}
    >
      <Text size="3" color={role === "user" ? "indigo" : "gray"}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
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
          {content}
        </ReactMarkdown>
      </Text>
    </Card>
  );
}
