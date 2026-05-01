"use client";

import { validatePassword } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

/**
 * Real-time password strength indicator.
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const passed = requirements.filter((r) => r.test(password)).length;
  const total = requirements.length;
  const percentage = (passed / total) * 100;

  const barColor =
    percentage <= 40 ? "bg-red-500" : percentage <= 80 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className={`text-xs ${req.test(password) ? "text-green-600" : "text-gray-400"}`}>
            {req.test(password) ? "✓" : "○"} {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
