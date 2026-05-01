"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

function SearchBarInner({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
      <Input
        name="search"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 px-12 shadow-none"
      />
    </div>
  );
}

export function SearchBar({ defaultValue }: { defaultValue: string }) {
  return (
    <Suspense fallback={<div className="relative flex-1"><div className="h-10 rounded-md border bg-gray-50" /></div>}>
      <SearchBarInner defaultValue={defaultValue} />
    </Suspense>
  );
}
