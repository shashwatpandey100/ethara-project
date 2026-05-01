import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// In Vercel serverless each invocation is isolated — use max:1 so we don't
// exhaust Supabase's connection limit with pooled idle connections.
const isServerless = process.env.VERCEL === "1";

const client = postgres(process.env.DATABASE_URL, {
  max: isServerless ? 1 : 10,
  connect_timeout: 15,
  idle_timeout: isServerless ? 0 : 30,
  max_lifetime: isServerless ? 0 : 1800,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });
