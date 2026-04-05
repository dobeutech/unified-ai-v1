import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type AppDatabase = NeonHttpDatabase<typeof schema>;

let cached: AppDatabase | null | undefined;

/**
 * Returns a Drizzle client when `DATABASE_URL` is set (Neon, Supabase Postgres, or any Postgres URL).
 * Returns null in local/demo mode so the app still builds and runs without a database.
 */
export function getDb(): AppDatabase | null {
  if (cached !== undefined) {
    return cached;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = null;
    return null;
  }
  const sql = neon(url);
  cached = drizzle(sql, { schema });
  return cached;
}
