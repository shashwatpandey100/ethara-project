"use client";

import { useEffect, useState } from "react";
import { getTask, updateTask, addComment } from "@/lib/api/tasks";
import type { Task, TaskComment } from "@/lib/api/tasks";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/relative-time";
import { toast } from "sonner";
import { Calendar, Loader2, Send, User } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  projectId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  taskId,
  projectId,
  isAdmin,
  onRefresh,
}: TaskDetailDialogProps) {
  const [task, setTask] = useState<(Task & { comments: TaskComment[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getTask(projectId, taskId)
      .then((res) => setTask(res.data))
      .catch(() => toast.error("Failed to load task"))
      .finally(() => setIsLoading(false));
  }, [open, projectId, taskId]);

  const handleStatusChange = async (status: string) => {
    if (!task) return;
    try {
      await updateTask(projectId, taskId, { status });
      setTask((prev) => (prev ? { ...prev, status: status as Task["status"] } : prev));
      onRefresh();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addComment(projectId, taskId, comment);
      setTask((prev) => (prev ? { ...prev, comments: [...prev.comments, res.data] } : prev));
      setComment("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[580px] p-0">
        {isLoading || !task ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <DialogHeader className="flex flex-col gap-0 border-b p-6">
              <DialogTitle className="text-[24px] font-[500] text-[#141414]">
                {task.title}
              </DialogTitle>
              {task.description && (
                <p className="mt-1 text-[14px] text-gray-600">{task.description}</p>
              )}
            </DialogHeader>

            {/* ── Body ── */}
            <div className="flex flex-col gap-5 px-6 pt-4 pb-4">
              {/* Meta row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-gray-400 uppercase tracking-wider">Priority</Label>
                  <span
                    className={`w-fit rounded px-2 py-0.5 text-xs font-semibold uppercase ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-gray-400 uppercase tracking-wider">Status</Label>
                  {isAdmin ? (
                    <Select value={task.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-8 w-40 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-gray-700">{STATUS_LABELS[task.status]}</span>
                  )}
                </div>

                {/* Assignee */}
                {task.assigneeName && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-gray-400 uppercase tracking-wider">Assignee</Label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                        {task.assigneeName[0]?.toUpperCase()}
                      </div>
                      {task.assigneeName}
                    </div>
                  </div>
                )}

                {/* Due date */}
                {task.dueDate && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-gray-400 uppercase tracking-wider">Due date</Label>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700" suppressHydrationWarning>
                      <Calendar size={13} className="text-gray-400" />
                      {formatRelativeTime(task.dueDate)}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">
                  Comments ({task.comments.length})
                </p>

                {task.comments.length === 0 ? (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                ) : (
                  <div className="flex max-h-52 flex-col gap-3 overflow-y-auto">
                    {task.comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                          {c.userName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700">
                            {c.userName}{" "}
                            <span className="font-normal text-gray-400" suppressHydrationWarning>
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="h-9 flex-1"
                  />
                  <Button
                    size="icon"
                    type="submit"
                    className="h-9 w-9"
                    disabled={submittingComment || !comment.trim()}
                  >
                    {submittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* ── Footer ── */}
            <DialogFooter className="border-t p-6">
              <div className="flex w-full justify-start gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
