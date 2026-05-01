"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProjects } from "@/lib/api/projects";
import type { Project } from "@/lib/api/projects";
import { CreateProjectDialog } from "./components/create-project-dialog";
import { ProjectsTable } from "./components/projects-table";
import { SearchBar } from "./components/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

function ProjectsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<{
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/projects?${params.toString()}`);
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const result = await getProjects({ page, limit: 9, search, sort });
      setProjects(result.data);
      setMeta(result.meta);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search, sort]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.4rem] font-[500]">My Projects</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <SearchBar defaultValue={search} />
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="h-10 shrink-0"
        >
          <Plus size={15} />
          New Project
        </Button>
        {meta && meta.totalPages > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              disabled={!meta.hasPrevPage}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="min-w-[3rem] text-center text-sm text-gray-500">
              {page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              disabled={!meta.hasNextPage}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3.5">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-200/70" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-gray-200/70" />
                <Skeleton className="h-3 w-1/2 bg-gray-200/70" />
              </div>
              <Skeleton className="h-6 w-20 bg-gray-200/70" />
              <Skeleton className="h-6 w-16 bg-gray-200/70" />
              <Skeleton className="h-7 w-7 bg-gray-200/70" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg bg-gray-100 px-12 py-64 text-center">
          <h3 className="text-lg font-[600]">No projects found</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {search ? "Try a different search term." : "Get started by creating your first project."}
          </p>
          {!search && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              New Project
            </Button>
          )}
        </div>
      ) : (
        <ProjectsTable projects={projects} onRefresh={fetchProjects} />
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageInner />
    </Suspense>
  );
}
