"use client";

import { useState } from "react";
import { generateInviteLink } from "@/lib/api/projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InviteDialog({ open, onOpenChange, projectId }: InviteDialogProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateInviteLink(projectId);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      setInviteUrl(`${appUrl}/join/${res.data.code}`);
    } catch {
      toast.error("Failed to generate invite link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[520px] p-0">
        <DialogHeader className="border-b p-6">
          <DialogTitle className="flex items-center gap-2 text-[22px] font-[500] text-[#141414]">
            <Link2 size={20} />
            Invite Team Members
          </DialogTitle>
          <p className="mt-1 text-[13px] text-gray-500">
            Generate a link and share it with your team. Anyone with the link can join as a Member.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {!inviteUrl ? (
            <Button onClick={generate} disabled={isGenerating} className="w-full">
              {isGenerating ? "Generating..." : "Generate Invite Link"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-sm" />
                <Button variant="outline" onClick={copy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                This link can be used by anyone to join this project as a Member.
              </p>
              <Button variant="outline" size="sm" onClick={generate} disabled={isGenerating}>
                Generate New Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
