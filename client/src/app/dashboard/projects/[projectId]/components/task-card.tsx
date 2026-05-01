"use client";

import { useState } from "react";
import type { Task } from "@/lib/api/tasks";
import { formatRelativeTime } from "@/lib/relative-time";
import { AlertTriangle, Calendar, GripVertical, MoreHorizontal, Trash2, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskDetailDialog } from "./task-detail-dialog";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

interface TaskCardProps {
  task: Task;
  projectId: string;
  isAdmin: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onStatusChange: (status: Task["status"]) => void;
  onDragStart: () => void;
  onRefresh: () => void;
}

export function TaskCard({
  task,
  projectId,
  isAdmin,
  isSelected,
  onToggleSelect,
  onDelete,
  onStatusChange,
  onDragStart,
  onRefresh,
}: TaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        className={`group relative rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
          isSelected ? "ring-2 ring-purple-500" : ""
        }`}
      >
        <div className="flex items-start gap-2">
          {isAdmin && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="mt-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setDetailOpen(true)}>
            <p className="text-[13px] font-medium leading-tight text-[#141414] line-clamp-2">
              {task.title}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  PRIORITY_STYLES[task.priority]
                }`}
              >
                {task.priority}
              </span>

              {task.dueDate && (
                <span
                  className={`flex items-center gap-1 text-[11px] ${
                    isOverdue ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {isOverdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
                  {formatRelativeTime(task.dueDate)}
                </span>
              )}

              {task.assigneeName && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <User size={10} />
                  {task.assigneeName}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 shrink-0 h-6 w-6"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.filter((s) => s.value !== task.status).map((s) => (
                <DropdownMenuItem key={s.value} onClick={() => onStatusChange(s.value)}>
                  Move to {s.label}
                </DropdownMenuItem>
              ))}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={onDelete}
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        taskId={task.id}
        projectId={projectId}
        isAdmin={isAdmin}
        onRefresh={onRefresh}
      />
    </>
  );
}
