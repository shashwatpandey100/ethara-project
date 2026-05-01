"use client";

import { useState } from "react";
import type { Project } from "@/lib/api/projects";
import { deleteProject } from "@/lib/api/projects";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/relative-time";
import { Ellipsis, FolderKanban, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProjectsTableProps {
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectsTable({ projects, onRefresh }: ProjectsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-separate" style={{ borderSpacing: "0 2px" }}>
        <thead className="sr-only">
          <tr>
            <th />
            <th />
            <th />
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              className="group cursor-pointer"
            >
              {/* Icon */}
              <td className="w-[1%] rounded-l-xl bg-white py-3 pl-4 align-middle group-hover:bg-gray-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <FolderKanban size={15} className="text-gray-500" />
                </div>
              </td>

              {/* Name + description */}
              <td className="px-4 py-3 align-middle bg-white group-hover:bg-gray-100">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#141414]">
                    {project.name}
                  </div>
                  {project.description && (
                    <div className="truncate text-xs text-gray-500">{project.description}</div>
                  )}
                </div>
              </td>

              {/* Tasks */}
              <td className="px-4 py-3 align-middle whitespace-nowrap bg-white group-hover:bg-gray-100">
                <span className="rounded-md bg-gray-900 px-2 py-1 text-[12px] font-medium text-white">
                  {project.taskCount} {project.taskCount === 1 ? "Task" : "Tasks"}
                </span>
              </td>

              {/* Members */}
              <td className="px-4 py-3 align-middle whitespace-nowrap text-xs text-gray-500 bg-white group-hover:bg-gray-100">
                {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
              </td>

              {/* Created */}
              <td
                className="px-4 py-3 align-middle whitespace-nowrap text-xs text-gray-500 bg-white group-hover:bg-gray-100"
                suppressHydrationWarning
              >
                {formatRelativeTime(project.createdAt)}
              </td>

              {/* Actions */}
              <td
                className="rounded-r-xl px-4 py-3 text-right align-middle whitespace-nowrap bg-white group-hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 w-7">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    >
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-700 hover:bg-red-800! hover:text-white!"
                      disabled={deletingId === project.id}
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
