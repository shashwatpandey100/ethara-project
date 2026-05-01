"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/api/dashboard";
import type { DashboardStats } from "@/lib/api/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/contexts/session-context";
import { formatRelativeTime } from "@/lib/relative-time";

export default function DashboardPage() {
  const { user } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-gray-500">Failed to load dashboard.</p>
      </div>
    );
  }

  const { myTaskStats, projectCount, recentActivity, overdueTasks, recentTasks } = stats;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-[1.3rem] font-[500] text-[#141414]">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening across your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="My Tasks"
          value={myTaskStats.total}
          icon={<ListTodo size={18} className="text-purple-600" />}
          bg="bg-purple-50"
        />
        <StatCard
          label="In Progress"
          value={myTaskStats.inProgress}
          icon={<Loader2 size={18} className="text-blue-600" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="Completed"
          value={myTaskStats.done}
          icon={<CheckCircle2 size={18} className="text-green-600" />}
          bg="bg-green-50"
        />
        <StatCard
          label="Overdue"
          value={myTaskStats.overdue}
          icon={<AlertTriangle size={18} className="text-red-600" />}
          bg="bg-red-50"
          danger={myTaskStats.overdue > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-[500] text-[#141414]">My Recent Tasks</h2>
            <Link href="/dashboard/projects" className="text-xs text-gray-500 hover:underline">
              All projects →
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks assigned to you yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={task.status} />
                    <span className="truncate text-sm text-[#141414]">{task.title}</span>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-[500] text-[#141414]">Overdue Tasks</h2>
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueTasks.length}
              </Badge>
            )}
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No overdue tasks. Great work! 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle size={14} className="shrink-0 text-red-500" />
                    <span className="truncate text-sm text-[#141414]">{task.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-red-500">
                    {task.dueDate
                      ? formatRelativeTime(task.dueDate)
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-[15px] font-[500] text-[#141414]">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                <div>
                  <p className="text-sm text-[#141414]">
                    <span className="font-medium">{activity.userName}</span>{" "}
                    {activity.action} a {activity.entityType}
                    {activity.meta && typeof activity.meta === "object" && "title" in activity.meta
                      ? ` — "${(activity.meta as { title: string }).title}"`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
  danger,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${danger ? "border-red-200 bg-red-50" : "bg-white"}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <p className="text-2xl font-[600] text-[#141414]">{value}</p>
      <p className="text-[13px] text-gray-500">{label}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    todo: "bg-gray-300",
    in_progress: "bg-blue-500",
    in_review: "bg-yellow-500",
    done: "bg-green-500",
  };
  return (
    <div className={`h-2 w-2 shrink-0 rounded-full ${colors[status] ?? "bg-gray-300"}`} />
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles[priority] ?? styles.medium}`}
    >
      {priority}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
