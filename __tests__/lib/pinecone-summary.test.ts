import { describe, it, expect, vi, beforeEach } from "vitest";
import { withEnv } from "../helpers";

// Mock the Pinecone SDK
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn().mockResolvedValue({ matches: [] });
const mockNamespace = vi.fn().mockReturnValue({ upsert: mockUpsert, query: mockQuery });
const mockIndex = vi.fn().mockReturnValue({ namespace: mockNamespace });
const mockEmbed = vi.fn().mockResolvedValue({
  data: [{ vectorType: "dense", values: [0.1, 0.2, 0.3] }],
});

vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: class MockPinecone {
    inference = { embed: mockEmbed };
    index = mockIndex;
  },
}));

describe("upsertSummaryVector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("silently returns when PINECONE_API_KEY is not set", async () => {
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: undefined, PINECONE_INDEX: "test-index" },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  it("silently returns when PINECONE_INDEX is not set", async () => {
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: undefined },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  it("embeds text and upserts to Pinecone on success", async () => {
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () =>
        upsertSummaryVector({
          id: "trace-1",
          text: "summary text",
          metadata: { channel: "gateway" },
        }),
    );

    expect(mockEmbed).toHaveBeenCalledWith(
      expect.any(String),
      ["summary text"],
      expect.objectContaining({ inputType: "passage" }),
    );
    expect(mockUpsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "trace-1",
        values: [0.1, 0.2, 0.3],
        metadata: { channel: "gateway" },
      }),
    ]);
  });

  it("slices text to 8000 chars before embedding", async () => {
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    const longText = "x".repeat(10_000);
    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () => upsertSummaryVector({ id: "1", text: longText, metadata: {} }),
    );

    const embeddedText = mockEmbed.mock.calls[0][1][0];
    expect(embeddedText).toHaveLength(8000);
  });

  it("silently returns when embedding returns empty data", async () => {
    mockEmbed.mockResolvedValueOnce({ data: [] });
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("silently returns when embedding vectorType is not dense", async () => {
    mockEmbed.mockResolvedValueOnce({
      data: [{ vectorType: "sparse", values: [1] }],
    });
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("silently returns when embedding has empty values array", async () => {
    mockEmbed.mockResolvedValueOnce({
      data: [{ vectorType: "dense", values: [] }],
    });
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("catches and logs errors without throwing", async () => {
    mockEmbed.mockRejectedValueOnce(new Error("Pinecone down"));
    const { upsertSummaryVector } = await import("@/lib/pinecone-summary");

    // Should not throw
    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "my-index" },
      () => upsertSummaryVector({ id: "1", text: "hello", metadata: {} }),
    );
  });
});

describe("searchSummaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbed.mockResolvedValue({
      data: [{ vectorType: "dense", values: [0.1, 0.2, 0.3] }],
    });
  });

  it("returns empty array when PINECONE_API_KEY is not set", async () => {
    const { searchSummaries } = await import("@/lib/pinecone-summary");
    const result = await withEnv(
      { PINECONE_API_KEY: undefined, PINECONE_INDEX: "idx" },
      () => searchSummaries({ query: "test" }),
    );
    expect(result).toEqual([]);
  });

  it("returns empty array when PINECONE_INDEX is not set", async () => {
    const { searchSummaries } = await import("@/lib/pinecone-summary");
    const result = await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: undefined },
      () => searchSummaries({ query: "test" }),
    );
    expect(result).toEqual([]);
  });

  it("queries Pinecone with default topK of 5", async () => {
    mockQuery.mockResolvedValueOnce({ matches: [] });
    const { searchSummaries } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "idx" },
      () => searchSummaries({ query: "test" }),
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 5, includeMetadata: true }),
    );
  });

  it("passes custom topK and filter", async () => {
    mockQuery.mockResolvedValueOnce({ matches: [] });
    const { searchSummaries } = await import("@/lib/pinecone-summary");

    await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "idx" },
      () =>
        searchSummaries({
          query: "test",
          topK: 10,
          filter: { channel: "cli" },
        }),
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 10,
        filter: { channel: "cli" },
      }),
    );
  });

  it("maps matches to { id, score, metadata }", async () => {
    mockQuery.mockResolvedValueOnce({
      matches: [
        { id: "m1", score: 0.95, metadata: { channel: "gateway" } },
        { id: "m2", score: undefined, metadata: undefined },
      ],
    });
    const { searchSummaries } = await import("@/lib/pinecone-summary");

    const results = await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "idx" },
      () => searchSummaries({ query: "test" }),
    );

    expect(results).toEqual([
      { id: "m1", score: 0.95, metadata: { channel: "gateway" } },
      { id: "m2", score: 0, metadata: {} },
    ]);
  });

  it("returns empty array on error without throwing", async () => {
    mockEmbed.mockRejectedValueOnce(new Error("Pinecone unreachable"));
    const { searchSummaries } = await import("@/lib/pinecone-summary");

    const results = await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "idx" },
      () => searchSummaries({ query: "test" }),
    );
    expect(results).toEqual([]);
  });

  it("returns empty array when embedding returns non-dense vector", async () => {
    mockEmbed.mockResolvedValueOnce({
      data: [{ vectorType: "sparse", indices: [0], values: [1] }],
    });
    const { searchSummaries } = await import("@/lib/pinecone-summary");

    const results = await withEnv(
      { PINECONE_API_KEY: "key", PINECONE_INDEX: "idx" },
      () => searchSummaries({ query: "test" }),
    );
    expect(results).toEqual([]);
  });
});
