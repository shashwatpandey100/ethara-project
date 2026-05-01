import { resend } from "../resend.js";
import { env } from "../../config/env.js";

type SendOtpEmailArgs = {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

function otpEmailTemplate({ otp, type }: { otp: string; type: string }): string {
  const titleMap: Record<string, string> = {
    "sign-in": "Your sign-in code",
    "email-verification": "Verify your email address",
    "forget-password": "Reset your password",
    "change-email": "Confirm your email change",
  };
  const title = titleMap[type] ?? "Your verification code";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; font-weight: 600; color: #141414; margin: 0 0 8px;">TaskScribe</h1>
    <p style="color: #666; font-size: 14px; margin: 0 0 32px;">AI-Powered Team Task Manager</p>
    <h2 style="font-size: 18px; font-weight: 500; color: #141414; margin: 0 0 16px;">${title}</h2>
    <p style="color: #444; font-size: 14px; margin: 0 0 24px;">Use the code below. It expires in 5 minutes.</p>
    <div style="background: #f5f4f1; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #141414; font-family: monospace;">${otp}</span>
    </div>
    <p style="color: #888; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
}

export async function sendOtpEmail({ email, otp, type }: SendOtpEmailArgs): Promise<void> {
  const subjectMap: Record<SendOtpEmailArgs["type"], string> = {
    "sign-in": "Your sign-in code",
    "email-verification": "Verify your email",
    "forget-password": "Reset your password",
    "change-email": "Confirm your email change",
  };

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: subjectMap[type],
      html: otpEmailTemplate({ otp, type }),
    });
    console.log(`✅ OTP email sent to ${email} for ${type}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    throw error;
  }
}
