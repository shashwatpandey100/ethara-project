"use client";

import { useState } from "react";
import { updateProject } from "@/lib/api/projects";
import type { ProjectDetail } from "@/lib/api/projects";
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

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetail;
  onSuccess?: () => void;
}

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [isPending, setIsPending] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });
      toast.success("Project updated!");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[560px] p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="text-[24px] font-[500] text-[#141414]">
            Project Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4 px-6 pt-2 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                className="h-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-desc">Description</Label>
              <Input
                id="project-desc"
                className="h-10"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t p-6">
            <div className="flex w-full justify-start gap-2">
              <Button size="lg" type="submit" disabled={isPending || !name.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" size="lg" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
