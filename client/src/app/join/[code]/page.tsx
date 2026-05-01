"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInviteInfo, joinViaInvite } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Users } from "lucide-react";
import { toast } from "sonner";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await getInviteInfo(code);
        setProject(res.data);
      } catch {
        setError("This invite link is invalid or has expired.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, [code]);

  const handleJoin = async () => {
    if (!project) return;
    setIsJoining(true);
    try {
      const res = await joinViaInvite(code);
      toast.success(`Joined ${project.name}!`);
      router.push(`/dashboard/projects/${res.data.projectId}`);
    } catch {
      toast.error("Failed to join project");
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-96 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-gray-600">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f4f1]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50">
          <FolderKanban size={28} className="text-purple-600" />
        </div>

        <h1 className="mt-4 text-[22px] font-[500] text-[#141414]">
          You&apos;ve been invited!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Join <strong>{project?.name}</strong> on TaskScribe
        </p>

        {project?.description && (
          <p className="mt-3 text-sm text-gray-500">{project.description}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <Users size={14} />
          <span>{project?.memberCount} member{(project?.memberCount ?? 0) !== 1 ? "s" : ""}</span>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleJoin} disabled={isJoining} className="flex-1">
            {isJoining ? "Joining..." : "Join Project"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
