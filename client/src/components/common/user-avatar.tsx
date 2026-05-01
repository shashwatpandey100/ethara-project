"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/contexts/session-context";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

export function UserAvatar({ showName = false }: { showName?: boolean }) {
  const { user, isPending } = useSession();

  if (isPending || !user) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />;
  }

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-100 transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#141414] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {showName && (
            <span className="text-[13px] font-medium text-[#141414] truncate max-w-[120px]">
              {user.name}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings size={14} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={async () => {
            await authClient.signOut();
            window.location.href = "/login";
          }}
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
