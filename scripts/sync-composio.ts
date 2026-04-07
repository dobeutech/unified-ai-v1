/**
 * CLI: sync Composio tool catalog into Postgres.
 * Usage: DATABASE_URL=... COMPOSIO_API_KEY=... pnpm sync:composio
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
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
  
  console.log(`[sync] Connecting to ${url.split('@')[1] || 'database'}...`);
  
  // Standard Postgres driver works with both Neon and Supabase
  const client = postgres(url, { 
    prepare: false,
    connect_timeout: 10, // 10 seconds timeout
  });
  const db = drizzle(client, { schema });
  
  console.log("[sync] DB client initialized. Fetching tools from Composio...");
  
  try {
    const { upserted, pages } = await syncComposioToolsToDb(db);
    console.log(`Synced ${upserted} tools (${pages} page(s)).`);
  } catch (err) {
    console.error("[sync] Error during sync:", err);
    process.exit(1);
  } finally {
    // Explicitly close the connection so the script exits immediately
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
