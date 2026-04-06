import { NextResponse } from "next/server";
import { z } from "zod";
import { searchSummaries } from "@/lib/pinecone-summary";

const bodySchema = z.object({
  query: z.string().min(1).max(8000),
  topK: z.number().int().min(1).max(20).optional(),
  filter: z.record(z.string(), z.string()).optional(),
  /** When set, restricts matches to summaries logged under this client session id. */
  sessionId: z.string().min(1).max(256).optional(),
});

/**
 * Search assistant summary embeddings in Pinecone.
 * POST JSON body: { query, topK?, filter?, sessionId? }
 */
export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { query, topK, filter, sessionId } = parsed.data;
  const mergedFilter: Record<string, string> = { ...(filter ?? {}) };
  if (sessionId) mergedFilter.sessionExternalId = sessionId;

  const results = await searchSummaries({
    query,
    topK,
    filter: Object.keys(mergedFilter).length ? mergedFilter : undefined,
  });
  return NextResponse.json({ results });
}
