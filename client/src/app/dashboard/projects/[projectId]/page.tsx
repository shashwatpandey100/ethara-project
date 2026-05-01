"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/api/projects";
import { getTasks } from "@/lib/api/tasks";
import type { ProjectDetail } from "@/lib/api/projects";
import type { Task } from "@/lib/api/tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Plus, Mic, Users, Settings, BarChart3 } from "lucide-react";
import { CreateTaskDialog } from "./components/create-task-dialog";
import { TasksBoard } from "./components/tasks-board";
import { MembersPanel } from "./components/members-panel";
import { StandupsPanel } from "./components/standups-panel";
import { ProjectSettingsDialog } from "./components/project-settings-dialog";
import { DigestDialog } from "./components/digest-dialog";
import { InviteDialog } from "./components/invite-dialog";
import { useSession } from "@/contexts/session-context";

type Tab = "tasks" | "standups" | "members";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectRes, tasksRes] = await Promise.all([
        getProject(projectId),
        getTasks(projectId),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      router.push("/dashboard/projects");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = project?.userRole === "admin";

  if (isLoading) return <ProjectSkeleton />;
  if (!project) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.3rem] font-[500] text-[#141414]">{project.name}</h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-gray-500">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                  <Users size={14} />
                  Invite
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDigestOpen(true)}>
                  <BarChart3 size={14} />
                  AI Digest
                </Button>
                <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
                  <Plus size={14} />
                  Add Task
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)}>
                  <Settings size={14} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {(["tasks", "standups", "members"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-[#141414] text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "tasks" && (
          <TasksBoard
            tasks={tasks}
            projectId={projectId}
            isAdmin={isAdmin}
            members={project.members}
            onRefresh={fetchData}
          />
        )}
        {activeTab === "standups" && (
          <StandupsPanel
            projectId={projectId}
            isAdmin={isAdmin}
            onTasksCreated={fetchData}
          />
        )}
        {activeTab === "members" && (
          <MembersPanel
            project={project}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ""}
            onRefresh={fetchData}
          />
        )}
      </div>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={projectId}
        members={project.members}
        onSuccess={fetchData}
      />
      <ProjectSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        project={project}
        onSuccess={fetchData}
      />
      <DigestDialog
        open={digestOpen}
        onOpenChange={setDigestOpen}
        projectId={projectId}
      />
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={projectId}
      />
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-18 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
