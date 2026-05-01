import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [usernameClient(), emailOTPClient()],
  sessionOptions: {
    refetchInterval: 300,
    refetchOnWindowFocus: true,
  },
});
