import { describe, it, expect, vi, beforeEach } from "vitest";
import { withEnv } from "../helpers";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeDbForSync() {
  const insertedValues: { table: string; vals: unknown }[] = [];

  const db = {
    insert: (table: { _: unknown } | unknown) => ({
      values: (vals: unknown) => {
        insertedValues.push({ table: String(table), vals });
        return {
          onConflictDoUpdate: () => Promise.resolve(),
          returning: () => Promise.resolve([{ id: "uuid" }]),
        };
      },
    }),
    _insertedValues: insertedValues,
  };
  return db;
}

function makeApiResponse(
  items: unknown[],
  nextCursor?: string,
) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        items,
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      }),
  };
}

describe("syncComposioToolsToDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("throws when COMPOSIO_API_KEY is not set", async () => {
    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    await expect(
      withEnv({ COMPOSIO_API_KEY: undefined }, () =>
        syncComposioToolsToDb(db as never),
      ),
    ).rejects.toThrow("COMPOSIO_API_KEY is not set");
  });

  it("upserts tools from a single page", async () => {
    mockFetch.mockResolvedValueOnce(
      makeApiResponse([
        { slug: "github_create_pr", name: "Create PR", toolkit: { slug: "github" } },
        { slug: "slack_send", name: "Send Message", toolkit: { slug: "slack" } },
      ]),
    );

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "test-key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result).toEqual({ upserted: 2, pages: 1 });
  });

  it("paginates using next_cursor", async () => {
    mockFetch
      .mockResolvedValueOnce(
        makeApiResponse(
          [{ slug: "tool_a", name: "A" }],
          "cursor-page-2",
        ),
      )
      .mockResolvedValueOnce(
        makeApiResponse([{ slug: "tool_b", name: "B" }]),
      );

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "test-key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result).toEqual({ upserted: 2, pages: 2 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("skips items without slug", async () => {
    mockFetch.mockResolvedValueOnce(
      makeApiResponse([
        { name: "No slug" },
        { slug: null, name: "Null slug" },
        { slug: 123, name: "Numeric slug" },
        { slug: "valid_slug", name: "Valid" },
      ]),
    );

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result.upserted).toBe(1);
  });

  it("filters by toolkit allowlist prefix", async () => {
    mockFetch.mockResolvedValueOnce(
      makeApiResponse([
        { slug: "github_pr", name: "PR", toolkit: { slug: "github" } },
        { slug: "slack_msg", name: "Msg", toolkit: { slug: "slack" } },
        { slug: "jira_issue", name: "Issue", toolkit: { slug: "jira" } },
      ]),
    );

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: "github,slack" },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result.upserted).toBe(2);
  });

  it("skips items without toolkit when allowlist is set", async () => {
    mockFetch.mockResolvedValueOnce(
      makeApiResponse([
        { slug: "orphan_tool", name: "Orphan" },
      ]),
    );

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: "github" },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result.upserted).toBe(0);
  });

  it("handles unknown response keys (items not in items/data/tools)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [{ slug: "a" }] }),
    });

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    // parseItems returns [] for unknown key, so 0 upserted
    expect(result.upserted).toBe(0);
    expect(result.pages).toBe(1);
  });

  it("throws on non-ok API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    await expect(
      withEnv({ COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined }, () =>
        syncComposioToolsToDb(db as never),
      ),
    ).rejects.toThrow("Composio tools sync failed: 500");
  });

  it("records sync run with error status when API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server Error"),
    });

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    try {
      await withEnv({ COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined }, () =>
        syncComposioToolsToDb(db as never),
      );
    } catch {
      // expected
    }

    // Should have recorded an error sync run
    const syncRunInsert = db._insertedValues.find(
      (v) => (v.vals as Record<string, unknown>).source === "composio",
    );
    expect(syncRunInsert).toBeDefined();
    expect((syncRunInsert!.vals as Record<string, unknown>).status).toBe("error");
  });

  it("supports data key in API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ slug: "tool_via_data", name: "Via Data" }],
        }),
    });

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result.upserted).toBe(1);
  });

  it("supports tools key in API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tools: [{ slug: "tool_via_tools", name: "Via Tools" }],
        }),
    });

    const { syncComposioToolsToDb } = await import("@/lib/composio-sync");
    const db = makeDbForSync();

    const result = await withEnv(
      { COMPOSIO_API_KEY: "key", COMPOSIO_SYNC_TOOLKIT_ALLOWLIST: undefined },
      () => syncComposioToolsToDb(db as never),
    );

    expect(result.upserted).toBe(1);
  });
});
