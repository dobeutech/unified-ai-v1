import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { isValidPostgresConnectionString } from "./url";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

let cached: AppDatabase | null | undefined;
let warnedInvalidUrl = false;

/**
 * Returns a Drizzle client when `DATABASE_URL` is set (Neon, Supabase Postgres, or any Postgres URL).
 * Returns null in local/demo mode so the app still builds and runs without a database.
 * Invalid values (e.g. bare `https://…supabase.co`) are treated as unset with a one-time warning.
 */
export function getDb(): AppDatabase | null {
  if (cached !== undefined) {
    return cached;
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    cached = null;
    return null;
  }
  if (!isValidPostgresConnectionString(url)) {
    if (!warnedInvalidUrl) {
      warnedInvalidUrl = true;
      console.warn(
        "[db] DATABASE_URL must start with postgres:// or postgresql:// (use Supabase Transaction pooler). See docs/unified-ai/SUPABASE_DATABASE_URL.md",
      );
    }
    cached = null;
    return null;
  }
  // Standard Postgres driver works with both Neon and Supabase
  // We disable prepared statements (prepare: false) to stay compatible with pgBouncer/Transaction mode.
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}
