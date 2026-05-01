"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string | null;
  displayUsername?: string | null;
};

interface SessionContextType {
  user: User | null;
  session: Session | null;
  isPending: boolean;
  error: unknown;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending, error } = authClient.useSession();

  return (
    <SessionContext.Provider
      value={{
        user: (data?.user as User) ?? null,
        session: (data?.session as Session) ?? null,
        isPending,
        error,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
