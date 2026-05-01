import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { sendOtpEmail } from "./emails/sendOtpEmail.js";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { validatePassword } from "../utils/passwordValidation.js";

const _clientOrigins = ["*"];
const _isProduction = env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: _clientOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: _isProduction ? "none" : "lax",
      secure: _isProduction,
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail({ email, otp, type });
      },
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  hooks: {
    before: async (ctx: any): Promise<Response | void> => {
      const path = ctx.path;
      if (path === "/sign-up/email" || path === "/email-otp/reset-password") {
        const body = ctx.body as Record<string, unknown> | undefined;
        const password = body?.password as string | undefined;

        if (!password) return;

        const result = validatePassword(password);
        if (!result.isValid) {
          return new Response(
            JSON.stringify({
              error: {
                message: result.errors.join(". "),
                code: "WEAK_PASSWORD",
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    },
    after: async (ctx: any) => {
      if (
        ctx.path === "/email-otp/reset-password" &&
        ctx.response?.status === 200
      ) {
        const body = ctx.body as Record<string, unknown> | undefined;
        const email = body?.email as string | undefined;

        if (email) {
          try {
            const userRecord = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.email, email))
              .limit(1);

            if (userRecord.length > 0) {
              await db
                .delete(schema.session)
                .where(eq(schema.session.userId, userRecord[0].id));
            }
          } catch (error) {
            console.error("Failed to invalidate sessions after password reset:", error);
          }
        }
      }

      return { response: ctx.response, headers: null };
    },
  },
});
