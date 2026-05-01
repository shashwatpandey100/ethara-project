"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSession } from "@/contexts/session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, LogOut, Shield, User, KeyRound } from "lucide-react";

/* ── Section wrapper ── */
function Section({
  icon,
  title,
  description,
  children,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white ${danger ? "border-red-100" : ""}`}>
      <div className="flex items-start gap-4 p-6">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#141414]">{title}</p>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Separator />
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Row: label + read-only value ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-[#141414] flex-1 truncate">{value || "—"}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useSession();

  /* ── Profile edit ── */
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim() || name === user?.name) return;
    setSavingProfile(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Password change ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password — check your current password");
    } finally {
      setSavingPassword(false);
    }
  };

  /* ── Sign out ── */
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = "/login";
    } catch {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto space-y-6 p-8">
        <div>
          <h1 className="text-[1.4rem] font-[500] text-[#141414]">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your account and preferences</p>
        </div>

        {/* ── Profile ── */}
        <Section
          icon={<User size={17} />}
          title="Profile"
          description="Your public identity on TaskScribe"
        >
          <div className="space-y-0 divide-y">
            <InfoRow label="Email" value={user?.email ?? ""} />
            <InfoRow label="Username" value={user?.username ?? user?.displayUsername ?? ""} />
            <InfoRow label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""} />
          </div>

          <div className="mt-5 flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 max-w-sm"
                placeholder="Your name"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || !name.trim() || name === user?.name}
              size="sm"
            >
              {savingProfile && <Loader2 size={13} className="animate-spin" />}
              Save
            </Button>
          </div>
        </Section>

        {/* ── Security ── */}
        <Section
          icon={<KeyRound size={17} />}
          title="Password"
          description="Change your account password. You'll stay signed in on this device."
        >
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-pw">Current password</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9"
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-pw">New password</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="mt-1"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPassword && <Loader2 size={13} className="animate-spin" />}
              Change password
            </Button>
          </form>
        </Section>

        {/* ── Session / Sign out ── */}
        <Section
          icon={<Shield size={17} />}
          title="Session"
          description="Manage your active session on this device"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#141414]">Current session</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Signed in as <span className="font-medium text-gray-700">{user?.email}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              className="shrink-0"
            >
              {signingOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
              Sign out
            </Button>
          </div>
        </Section>

        {/* ── Danger zone ── */}
        <Section
          icon={<LogOut size={17} />}
          title="Danger zone"
          description="Irreversible actions for your account"
          danger
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#141414]">Sign out everywhere</p>
              <p className="mt-0.5 text-sm text-gray-500">
                Revokes all active sessions across every device.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={async () => {
                try {
                  await authClient.signOut();
                  window.location.href = "/login";
                } catch {
                  toast.error("Failed to sign out");
                }
              }}
            >
              Sign out everywhere
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
