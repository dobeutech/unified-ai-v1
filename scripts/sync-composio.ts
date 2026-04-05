/**
 * CLI: sync Composio tool catalog into Postgres.
 * Usage: DATABASE_URL=... COMPOSIO_API_KEY=... pnpm sync:composio
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { syncComposioToolsToDb } from "../lib/composio-sync";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const sql = neon(url);
  const db = drizzle(sql, { schema });
  const { upserted, pages } = await syncComposioToolsToDb(db);
  console.log(`Synced ${upserted} tools (${pages} page(s)).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
