"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";

export function useUsernameAvailability(username: string) {
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable(null);
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await authClient.isUsernameAvailable({ username });
        setAvailable(res?.data?.available ?? false);
      } catch {
        setAvailable(null);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(id);
  }, [username]);

  return { available, loading };
}
