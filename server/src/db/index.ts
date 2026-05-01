import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(process.env.DATABASE_URL, {
  connect_timeout: 10,
  idle_timeout: 30,
  max_lifetime: 1800,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });
