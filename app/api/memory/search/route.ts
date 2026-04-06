import { NextResponse } from "next/server";
import { z } from "zod";
import { searchSummaries } from "@/lib/pinecone-summary";

const bodySchema = z.object({
  query: z.string().min(1).max(8000),
  topK: z.number().int().min(1).max(20).optional(),
  filter: z.record(z.string(), z.string()).optional(),
});

/**
 * Search assistant summary embeddings in Pinecone.
 * POST JSON body: { query, topK?, filter? }
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

  const results = await searchSummaries(parsed.data);
  return NextResponse.json({ results });
}
