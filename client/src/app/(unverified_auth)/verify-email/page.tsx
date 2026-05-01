"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { useOtpCooldown } from "@/hooks/use-otp-cooldown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sendingInitialOtp, setSendingInitialOtp] = React.useState(true);

  const cooldown = useOtpCooldown(60);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await authClient.getSession();
        if (res?.data?.user) {
          const user = res.data.user;
          if (user.emailVerified) {
            router.push("/dashboard");
            return;
          }
          if (user.email) {
            const userEmail = user.email;
            setEmail(userEmail);
            try {
              await authClient.emailOtp.sendVerificationOtp({
                email: userEmail,
                type: "email-verification",
              });
              cooldown.start();
            } catch {
              setError("Failed to send verification code. Please try resending.");
            } finally {
              setSendingInitialOtp(false);
            }
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    })();
  }, [router]);

  const resendOtp = async () => {
    if (!email || cooldown.isActive) return;
    setLoading(true);
    setError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      cooldown.start();
    } catch {
      setError("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authClient.emailOtp.verifyEmail({ email, otp });
      if (response.error) {
        setError(response.error.message || "Invalid or expired code");
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Invalid or expired code");
      setLoading(false);
    }
  };

  if (sendingInitialOtp) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Card className="w-100 border-none shadow-none">
        <CardContent className="p-0">
          <h3 className="mb-2 text-[22px] font-medium text-[#141414]">Verify your email</h3>
          <p className="mb-6 text-sm text-gray-500">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          {error && <div className="mb-4 bg-gray-100 p-3 text-sm text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={verifyOtp} className="space-y-4">
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
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading || !otp}>
              {loading ? "Verifying..." : "Verify email"}
            </Button>
          </form>

          <button
            type="button"
            onClick={resendOtp}
            disabled={cooldown.isActive || loading}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {cooldown.isActive ? `Resend in ${cooldown.remaining}s` : "Resend code"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
