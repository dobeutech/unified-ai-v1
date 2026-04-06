#!/usr/bin/env node
/**
 * Ensures DATABASE_URL is a Postgres URI before drizzle-kit push.
 * Loads the same env files as drizzle.config.ts.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "DATABASE_URL is required for db:push. Copy .env.example to .env.local and set a pooler URI (postgresql://…).",
  );
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    "DATABASE_URL must start with postgres:// or postgresql:// (Supabase Transaction pooler).\n" +
      "See docs/unified-ai/SUPABASE_DATABASE_URL.md",
  );
  process.exit(1);
}
