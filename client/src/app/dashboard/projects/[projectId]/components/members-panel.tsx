"use client";

import { useState } from "react";
import type { ProjectDetail, ProjectMember } from "@/lib/api/projects";
import { removeMember, updateMemberRole } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, User, UserMinus, Crown } from "lucide-react";
import { toast } from "sonner";

interface MembersPanelProps {
  project: ProjectDetail;
  isAdmin: boolean;
  currentUserId: string;
  onRefresh: () => void;
}

export function MembersPanel({ project, isAdmin, currentUserId, onRefresh }: MembersPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the project?")) return;
    setLoadingId(memberId);
    try {
      await removeMember(project.id, memberId);
      toast.success("Member removed");
      onRefresh();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, role: "admin" | "member") => {
    setLoadingId(memberId);
    try {
      await updateMemberRole(project.id, memberId, role);
      toast.success(`Role updated to ${role}`);
      onRefresh();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-[15px] font-[500] text-[#141414]">
        Team Members ({project.members.length})
      </h2>

      <div className="space-y-2">
        {/* Creator */}
        <MemberRow
          userId={project.createdBy}
          role="admin"
          isCreator={true}
          isCurrentUser={project.createdBy === currentUserId}
          canManage={false}
          isLoading={false}
          onRemove={() => {}}
          onRoleChange={() => {}}
        />

        {/* Other members */}
        {project.members
          .filter((m) => m.userId !== project.createdBy)
          .map((member) => (
            <MemberRow
              key={member.id}
              userId={member.userId}
              role={member.role}
              isCreator={false}
              isCurrentUser={member.userId === currentUserId}
              canManage={isAdmin && project.createdBy === currentUserId}
              isLoading={loadingId === member.userId}
              onRemove={() => handleRemove(member.userId)}
              onRoleChange={(role) => handleRoleChange(member.userId, role)}
            />
          ))}
      </div>
    </div>
  );
}

function MemberRow({
  userId,
  role,
  isCreator,
  isCurrentUser,
  canManage,
  isLoading,
  onRemove,
  onRoleChange,
}: {
  userId: string;
  role: string;
  isCreator: boolean;
  isCurrentUser: boolean;
  canManage: boolean;
  isLoading: boolean;
  onRemove: () => void;
  onRoleChange: (role: "admin" | "member") => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          <User size={16} className="text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#141414]">
            {userId}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-gray-400">(you)</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            {isCreator && <Crown size={11} className="text-yellow-500" />}
            <span className="text-xs text-gray-400 capitalize">{role}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {role === "admin" && !isCreator && (
          <Badge variant="secondary" className="text-xs">Admin</Badge>
        )}
        {canManage && !isCreator && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" disabled={isLoading}>
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {role !== "admin" && (
                <DropdownMenuItem onClick={() => onRoleChange("admin")}>
                  <Shield size={14} />
                  Make Admin
                </DropdownMenuItem>
              )}
              {role !== "member" && (
                <DropdownMenuItem onClick={() => onRoleChange("member")}>
                  <User size={14} />
                  Make Member
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={onRemove}
              >
                <UserMinus size={14} />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
