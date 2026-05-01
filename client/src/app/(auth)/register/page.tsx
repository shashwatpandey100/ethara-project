"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const normalizedUsername = username.trim().toLowerCase();
  const usernameRegex = /^[a-z0-9_]+$/;

  const { available, loading: checkingUsername } = useUsernameAvailability(normalizedUsername);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameRegex.test(normalizedUsername)) {
      setError("Username can only contain lowercase letters, numbers, and _");
      return;
    }

    if (available === false) {
      setError("Username is already taken");
      return;
    }

    const pwResult = validatePassword(password);
    if (!pwResult.isValid) {
      setError(pwResult.errors.join(". "));
      return;
    }

    setLoading(true);

    try {
      const response = await authClient.signUp.email({
        name,
        email,
        password,
        username: normalizedUsername,
        displayUsername: name,
        callbackURL: "/verify-email",
      });

      if (response.error) {
        setError(response.error.message || "Registration failed. Please try again.");
        setLoading(false);
      } else {
        window.location.href = "/verify-email";
      }
    } catch {
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Card className="w-100 border-none shadow-none">
        <CardContent className="p-0">
          <h3 className="mb-6 text-[22px] font-medium text-[#141414]">
            Create your TaskScribe account
          </h3>

          {error && (
            <div className="mb-4 bg-gray-100 p-3 text-sm text-red-700 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pr-20"
                />
                {normalizedUsername.length >= 3 && (
                  <span
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                      checkingUsername
                        ? "text-gray-400"
                        : available === true
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {checkingUsername
                      ? "Checking..."
                      : available === true
                      ? "Available"
                      : "Taken"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Lowercase letters, numbers, and _ only</p>
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && <PasswordStrengthIndicator password={password} />}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#141414] underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
