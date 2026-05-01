"use client";

import { useState } from "react";
import { bulkDeleteTasks } from "@/lib/api/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface BulkDeleteDialogProps {
  taskIds: string[];
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkDeleteDialog({
  taskIds,
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: BulkDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isPending, setIsPending] = useState(false);

  const count = taskIds.length;
  const expectedText = `I want to delete ${count} task${count === 1 ? "" : "s"}`;
  const isValid = confirmText === expectedText;

  const handleDelete = async () => {
    if (!isValid) return;

    setIsPending(true);
    try {
      const result = await bulkDeleteTasks(projectId, taskIds);
      const { succeeded, failed } = result.data;

      if (succeeded > 0) {
        toast.success(`${succeeded} task${succeeded === 1 ? "" : "s"} deleted!`);
      }
      if (failed > 0) {
        toast.error(`${failed} task${failed === 1 ? "" : "s"} failed to delete`);
      }

      onOpenChange(false);
      setConfirmText("");
      onSuccess?.();
    } catch (error) {
      toast.error("An error occurred while deleting tasks");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[600px] p-0">
        <DialogHeader className="flex flex-col gap-0 border-b p-6">
          <DialogTitle className="text-[24px] font-[500] text-[#141414]">
            Delete {count} Task{count === 1 ? "" : "s"}
          </DialogTitle>
          <p className="mt-3 text-[14px] text-gray-600">
            This will permanently delete{" "}
            <span className="font-semibold text-purple-700">
              {count} task{count === 1 ? "" : "s"}
            </span>
            . This action cannot be undone.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 pt-2 pb-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="confirm-text">
              Type the following to confirm:{" "}
              <span className="font-mono text-red-600">{expectedText}</span>
            </Label>
            <Input
              id="confirm-text"
              className="h-10"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedText}
            />
          </div>
        </div>

        <DialogFooter className="border-t p-6">
          <div className="flex w-full justify-start gap-2">
            <Button
              size="lg"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending || !isValid}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete {count} Task{count === 1 ? "" : "s"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setConfirmText("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
