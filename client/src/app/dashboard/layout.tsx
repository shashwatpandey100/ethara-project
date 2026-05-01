"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayoutClient from "./components/layout-client";
import { SessionProvider, useSession } from "@/contexts/session-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardAuthGate>{children}</DashboardAuthGate>
    </SessionProvider>
  );
}

function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.emailVerified) {
      router.replace("/verify-email");
    }
  }, [user, isPending, router]);

  if (isPending || !user || !user.emailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
      </div>
    );
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
