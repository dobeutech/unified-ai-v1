import { Pinecone } from "@pinecone-database/pinecone";

const NS = process.env.PINECONE_NAMESPACE_SUMMARIES ?? "summaries";
const EMBED_MODEL =
  process.env.PINECONE_EMBED_MODEL ?? "llama-text-embed-v2";

/**
 * Best-effort: embed short summary text and upsert to Pinecone (SDK v6 API).
 * Skips silently when Pinecone env is not configured or on error (chat must not fail).
 */
export async function upsertSummaryVector(args: {
  id: string;
  text: string;
  metadata: Record<string, string>;
}): Promise<void> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;
  if (!apiKey || !indexName) return;

  try {
    const pc = new Pinecone({ apiKey });
    const embed = await pc.inference.embed(
      EMBED_MODEL,
      [args.text.slice(0, 8000)],
      { inputType: "passage", truncate: "END" },
    );
    const first = embed.data[0];
    if (
      !first ||
      first.vectorType !== "dense" ||
      !("values" in first) ||
      !first.values.length
    ) {
      return;
    }

    const index = pc.index(indexName);
    await index.namespace(NS).upsert([
      {
        id: args.id,
        values: first.values,
        metadata: args.metadata,
      },
    ]);
  } catch (e) {
    console.error("[pinecone-summary] upsert failed:", e);
  }
}

/**
 * Search Pinecone summaries namespace by text query.
 * Returns top-k matches with metadata. Skips silently when not configured.
 */
export async function searchSummaries(args: {
  query: string;
  topK?: number;
  filter?: Record<string, string>;
}): Promise<Array<{
  id: string;
  score: number;
  metadata: Record<string, string>;
}>> {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;
  if (!apiKey || !indexName) return [];

  try {
    const pc = new Pinecone({ apiKey });
    const embed = await pc.inference.embed(
      EMBED_MODEL,
      [args.query.slice(0, 8000)],
      { inputType: "query", truncate: "END" },
    );
    const first = embed.data[0];
    if (
      !first ||
      first.vectorType !== "dense" ||
      !("values" in first) ||
      !first.values.length
    ) {
      return [];
    }

    const index = pc.index(indexName);
    const results = await index.namespace(NS).query({
      vector: first.values,
      topK: args.topK ?? 5,
      filter: args.filter,
      includeMetadata: true,
    });

    return (results.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: (m.metadata ?? {}) as Record<string, string>,
    }));
  } catch (e) {
    console.error("[pinecone-summary] search failed:", e);
    return [];
  }
}
