"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  return (
    <main className="grid min-h-screen place-items-center p-24">
      <h1>Hello tasks</h1>
      <div className="grid gap-4">
        {tasks?.map(({ _id, text }) => (
          <div key={_id}>{text}</div>
        ))}
      </div>
    </main>
  );
}