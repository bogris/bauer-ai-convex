"use client";

import { api } from "@/convex/_generated/api";
import { useThreadMessages } from "@convex-dev/agent/react";
import { Message } from "../chat/Message";
import { useRef, useEffect } from "react";
import { Text } from "@radix-ui/themes";

export default function ThreadView(props: { threadId: string }) {
  const { threadId } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useThreadMessages(
    api.agentActions.listMessagesForUserThread,
    { threadId },
    { initialNumItems: 10, stream: true }
  );

  useEffect(() => {
    console.log(`MESSAGES`, messages.status, messages.results);
  }, [messages.results]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto p-2 md:p-4"
      ref={scrollRef}
      style={{ minHeight: 0 }}
    >
      {messages.results.length === 0 && (
        <Text color="gray">Start the conversation...</Text>
      )}
      {messages.results.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col mb-3 ${msg.message?.role === "user" ? "items-end" : "items-start"}`}
        >
          <Message messageDoc={msg} />
        </div>
      ))}
      {/* {isLoading && (
        <div className="flex items-center gap-2 mt-2">
          <Spinner />
          <Text color="gray">AI is typing...</Text>
        </div>
      )} */}
    </div>
  );
}
