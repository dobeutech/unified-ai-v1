import type { AppDatabase } from "@/lib/db/client";
import { composioTools } from "@/lib/db/schema";

const COMPOSIO_BASE = process.env.COMPOSIO_API_BASE ?? "https://backend.composio.dev";

type ComposioToolItem = {
  slug?: string;
  name?: string;
  description?: string;
  toolkit?: { slug?: string };
  [key: string]: unknown;
};

function parseItems(payload: unknown): ComposioToolItem[] {
  if (!payload || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items as ComposioToolItem[];
  if (Array.isArray(o.data)) return o.data as ComposioToolItem[];
  if (Array.isArray(o.tools)) return o.tools as ComposioToolItem[];
  return [];
}

/**
 * Paginates Composio GET /api/v3/tools and upserts into `composio_tools`.
 */
export async function syncComposioToolsToDb(db: AppDatabase): Promise<{
  upserted: number;
  pages: number;
}> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY is not set");
  }

  let cursor: string | undefined;
  let pages = 0;
  let upserted = 0;

  for (;;) {
    const url = new URL(`${COMPOSIO_BASE}/api/v3/tools`);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Composio tools sync failed: ${res.status} ${t.slice(0, 500)}`);
    }

    const json = (await res.json()) as Record<string, unknown>;
    pages += 1;
    const items = parseItems(json);

    for (const item of items) {
      const slug = item.slug;
      if (!slug || typeof slug !== "string") continue;
      const toolkitSlug =
        typeof item.toolkit === "object" &&
        item.toolkit &&
        "slug" in item.toolkit &&
        typeof (item.toolkit as { slug?: string }).slug === "string"
          ? (item.toolkit as { slug: string }).slug
          : null;

      await db
        .insert(composioTools)
        .values({
          slug,
          name: typeof item.name === "string" ? item.name : null,
          description:
            typeof item.description === "string" ? item.description : null,
          toolkitSlug,
          raw: item as object,
          syncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: composioTools.slug,
          set: {
            name: typeof item.name === "string" ? item.name : null,
            description:
              typeof item.description === "string" ? item.description : null,
            toolkitSlug,
            raw: item as object,
            syncedAt: new Date(),
          },
        });
      upserted += 1;
    }

    const nextRaw =
      json.next_cursor ??
      json.nextCursor ??
      (typeof json.pagination === "object" &&
      json.pagination &&
      "next" in json.pagination
        ? (json.pagination as { next?: string }).next
        : undefined);
    const next = typeof nextRaw === "string" && nextRaw ? nextRaw : undefined;
    if (!next || items.length === 0) break;
    cursor = next;
  }

  return { upserted, pages };
}
