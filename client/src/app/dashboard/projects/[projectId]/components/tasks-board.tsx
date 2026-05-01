"use client";

import { useState } from "react";
import type { Task } from "@/lib/api/tasks";
import type { ProjectMember } from "@/lib/api/projects";
import { updateTask, deleteTask, bulkDeleteTasks } from "@/lib/api/tasks";
import { toast } from "sonner";
import { TaskCard } from "./task-card";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "bg-gray-100" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { key: "in_review", label: "In Review", color: "bg-yellow-50" },
  { key: "done", label: "Done", color: "bg-green-50" },
];

interface TasksBoardProps {
  tasks: Task[];
  projectId: string;
  isAdmin: boolean;
  members: ProjectMember[];
  onRefresh: () => void;
}

export function TasksBoard({ tasks, projectId, isAdmin, members, onRefresh }: TasksBoardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    try {
      await updateTask(projectId, taskId, { status });
      onRefresh();
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(projectId, taskId);
      toast.success("Task deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleDragStart = (taskId: string) => setDragging(taskId);
  const handleDrop = (status: Task["status"]) => {
    if (dragging) {
      handleStatusChange(dragging, status);
      setDragging(null);
    }
  };

  const selectedArray = Array.from(selectedIds);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {selectedArray.length > 0 && isAdmin && (
        <div className="flex items-center gap-3 border-b bg-gray-50 px-6 py-2">
          <span className="text-sm text-gray-600">
            {selectedArray.length} task{selectedArray.length !== 1 ? "s" : ""} selected
          </span>
          <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 size={14} />
            Delete Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-auto p-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex w-1/4 min-h-full flex-col" onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(col.key)}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.key === "todo" ? "bg-gray-400" : col.key === "in_progress" ? "bg-blue-500" : col.key === "in_review" ? "bg-yellow-500" : "bg-green-500"}`} />
                  <span className="text-[13px] font-semibold text-gray-700">{col.label}</span>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{colTasks.length}</span>
              </div>

              <div className={`min-h-24 rounded-xl ${col.color} space-y-3 p-3`}>
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} projectId={projectId} isAdmin={isAdmin} isSelected={selectedIds.has(task.id)} onToggleSelect={() => toggleSelect(task.id)} onDelete={() => handleDelete(task.id)} onStatusChange={(status) => handleStatusChange(task.id, status)} onDragStart={() => handleDragStart(task.id)} onRefresh={onRefresh} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BulkDeleteDialog
        taskIds={selectedArray}
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onSuccess={() => {
          setSelectedIds(new Set());
          onRefresh();
        }}
        projectId={projectId}
      />
    </div>
  );
}
