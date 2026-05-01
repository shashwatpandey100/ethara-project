"use client";

import { useState } from "react";
import { getProjectDigest } from "@/lib/api/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DigestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function DigestDialog({ open, onOpenChange, projectId }: DigestDialogProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await getProjectDigest(projectId);
      setDigest(res.data.digest);
    } catch {
      toast.error("Failed to generate digest");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (val: boolean) => {
    onOpenChange(val);
    if (val && !digest) generate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="min-w-[640px] max-h-[80vh] overflow-y-auto p-0">
        <DialogHeader className="border-b p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-[22px] font-[500] text-[#141414]">
              <Sparkles size={20} className="text-purple-600" />
              AI Project Digest
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={generate} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Regenerate
            </Button>
          </div>
          <p className="mt-1 text-[13px] text-gray-500">
            AI-generated summary of your project&apos;s current status.
          </p>
        </DialogHeader>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : digest ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:text-sm"
              dangerouslySetInnerHTML={{ __html: digest }}
            />
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Sparkles size={32} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No digest available yet.</p>
              <Button className="mt-4" onClick={generate}>Generate Digest</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
