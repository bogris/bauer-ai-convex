/* eslint-disable import/no-anonymous-default-export */
import { env } from "@/env";

export default {
  providers: [
    {
      domain: env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ]
};