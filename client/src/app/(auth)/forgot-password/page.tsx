"use client";

import * as React from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOtpCooldown } from "@/hooks/use-otp-cooldown";

export default function ForgotPasswordPage() {
  const [step, setStep] = React.useState<"email" | "reset">("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const cooldown = useOtpCooldown(60);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
      setStep("reset");
      cooldown.start();
    } catch {
      setError("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.emailOtp.resetPassword({ email, otp, password: newPassword });
      if (res.error) {
        setError(res.error.message || "Failed to reset password");
      } else {
        setSuccess("Password reset successfully. You can now sign in.");
      }
    } catch {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Card className="w-100 border-none shadow-none">
        <CardContent className="p-0">
          <h3 className="mb-6 text-[22px] font-medium text-[#141414]">Reset your password</h3>

          {error && <div className="mb-4 bg-gray-100 p-3 text-sm text-red-700 rounded-lg">{error}</div>}
          {success && (
            <div className="mb-4 space-y-2">
              <div className="bg-green-50 p-3 text-sm text-green-700">{success}</div>
              <Link href="/login" className="text-sm text-[#141414] underline">
                Go to sign in →
              </Link>
            </div>
          )}

          {!success && step === "email" && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset code"}
              </Button>
            </form>
          )}

          {!success && step === "reset" && (
            <form onSubmit={resetPassword} className="space-y-4">
              <p className="text-sm text-gray-500">
                A 6-digit code was sent to <strong>{email}</strong>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </Button>
              <button
                type="button"
                disabled={cooldown.isActive}
                onClick={() => {
                  authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
                  cooldown.start();
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {cooldown.isActive ? `Resend in ${cooldown.remaining}s` : "Resend code"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="text-[#141414] underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
