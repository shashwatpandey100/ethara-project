"use client";

import { useState } from "react";
import { createProject } from "@/lib/api/projects";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Project created!");
      onOpenChange(false);
      setName("");
      setDescription("");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[560px] p-0">
        <DialogHeader className="flex flex-col gap-0 border-b p-6">
          <DialogTitle className="text-[24px] font-[500] text-[#141414]">
            New Project
          </DialogTitle>
          <p className="mt-1 text-[14px] text-gray-500">
            Create a new project and invite your team.
          </p>
        </DialogHeader>

        <form onSubmit={handleCreate}>
          <div className="flex flex-col gap-4 px-6 pt-2 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                className="h-10"
                placeholder="My Awesome Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-desc">
                Description <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="project-desc"
                className="h-10"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="border-t p-6">
            <div className="flex w-full justify-start gap-2">
              <Button size="lg" type="submit" disabled={isPending || !name.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
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
