"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

function App() {
  return (
    <main>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <AuthLoading>
        <p>Still loading</p>
      </AuthLoading>
    </main>
  );
}

function Content() {
  const tasks = useQuery(api.tasks.get);

  return <div>
    
    <h1>Authenticated content:</h1>
      <div className="grid gap-4">
        {tasks?.map(({ _id, text }) => (
          <div key={_id}>{text}</div>
        ))}
      </div>

  </div>;
}

export default App;

