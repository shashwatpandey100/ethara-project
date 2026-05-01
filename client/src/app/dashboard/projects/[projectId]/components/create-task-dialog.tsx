"use client";

import { useState } from "react";
import { createTask } from "@/lib/api/tasks";
import type { ProjectMember } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const UNASSIGNED_VALUE = "__unassigned__";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: ProjectMember[];
  onSuccess?: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
  onSuccess,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsPending(true);
    try {
      await createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success("Task created!");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssigneeId("");
      setDueDate("");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[560px] p-0">
        <DialogHeader className="flex flex-col gap-0 border-b p-6">
          <DialogTitle className="text-[24px] font-[500] text-[#141414]">New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate}>
          <div className="flex flex-col gap-4 px-6 pt-2 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                className="h-10"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="task-desc">
                Description <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="task-desc"
                className="h-10"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Assignee</Label>
                <Select
                  value={assigneeId || UNASSIGNED_VALUE}
                  onValueChange={(value) =>
                    setAssigneeId(value === UNASSIGNED_VALUE ? "" : value)
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="due-date">
                Due date <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="due-date"
                type="date"
                className="h-10"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t p-6">
            <div className="flex w-full justify-start gap-2">
              <Button size="lg" type="submit" disabled={isPending || !title.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
