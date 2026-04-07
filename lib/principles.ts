import { getDb } from "@/lib/db/client";
import { agentPrinciples } from "@/lib/db/schema";
import { eq, isNull, or } from "drizzle-orm";

export async function getPrinciples(taskTag?: string): Promise<string> {
  const db = getDb();
  if (!db) return "";

  // Fetch principles that apply to this taskTag or apply to all (null appliesTo)
  const rows = taskTag
    ? await db
        .select()
        .from(agentPrinciples)
        .where(or(eq(agentPrinciples.appliesTo, taskTag), isNull(agentPrinciples.appliesTo)))
    : await db.select().from(agentPrinciples);

  if (rows.length === 0) return "";

  return rows
    .map((r) => `## ${r.name}\n\n${r.content}`)
    .join("\n\n---\n\n");
}
