import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/db/schema";

const { agentPrinciples } = schema;
import { isValidPostgresConnectionString } from "../lib/db/url";
import { sha256Hex } from "../lib/hash";

const CATEGORY_MAP: Record<string, string> = {
  security: "security",
  testing: "testing",
  "coding-style": "style",
  patterns: "style",
  "git-workflow": "workflow",
  performance: "performance",
};

const APPLIES_TO_MAP: Record<string, string | null> = {
  "coding-style": "codegen",
  patterns: "codegen",
  performance: "codegen",
  security: null,
  testing: null,
};

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  if (!isValidPostgresConnectionString(url)) {
    console.error(
      "[sync-principles] DATABASE_URL must start with postgres:// or postgresql:// (use Supabase Transaction pooler). See docs/unified-ai/SUPABASE_DATABASE_URL.md",
    );
    process.exit(1);
  }

  const rulesDir = process.argv[2]
    ? resolve(process.argv[2])
    : join(homedir(), ".claude", "rules");

  const client = postgres(url, { prepare: false, connect_timeout: 10 });
  const db = drizzle(client, { schema });

  try {
  const files = readdirSync(rulesDir).filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.log("No .md files found in", rulesDir);
    return;
  }

  let synced = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const name = slugToName(slug);
    const content = readFileSync(join(rulesDir, file), "utf-8");
    const contentHash = sha256Hex(content);
    const category = CATEGORY_MAP[slug] ?? "general";
    const appliesTo = slug in APPLIES_TO_MAP ? APPLIES_TO_MAP[slug] : null;

    await db
      .insert(agentPrinciples)
      .values({
        slug,
        name,
        category,
        content,
        contentHash,
        appliesTo,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: agentPrinciples.slug,
        set: {
          name,
          category,
          content,
          contentHash,
          appliesTo,
          syncedAt: new Date(),
        },
      });

    synced++;
    console.log(`  synced: ${file}`);
  }

  console.log(`\nDone — ${synced} principle(s) synced from ${rulesDir}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("sync-principles failed:", err);
  process.exit(1);
});
