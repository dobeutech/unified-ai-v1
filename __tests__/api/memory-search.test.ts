import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/pinecone-summary", () => ({
  searchSummaries: vi.fn().mockResolvedValue([]),
}));

import { searchSummaries } from "@/lib/pinecone-summary";
import { POST } from "@/app/api/memory/search/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/memory/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/memory/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Zod validation ---

  it("returns 400 when query is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when query is empty string", async () => {
    const res = await POST(makeRequest({ query: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when query exceeds 8000 chars", async () => {
    const res = await POST(makeRequest({ query: "x".repeat(8001) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when topK is 0", async () => {
    const res = await POST(makeRequest({ query: "test", topK: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when topK exceeds 20", async () => {
    const res = await POST(makeRequest({ query: "test", topK: 21 }));
    expect(res.status).toBe(400);
  });

  // --- Valid request ---

  it("returns 200 with results for valid query", async () => {
    vi.mocked(searchSummaries).mockResolvedValueOnce([
      { id: "r1", score: 0.9, metadata: { channel: "gateway" } },
    ]);
    const res = await POST(makeRequest({ query: "test query" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toHaveLength(1);
  });

  // --- sessionId filter merging ---

  it("merges sessionId into filter as sessionExternalId", async () => {
    await POST(makeRequest({ query: "test", sessionId: "sess-1" }));

    expect(searchSummaries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          sessionExternalId: "sess-1",
        }),
      }),
    );
  });

  it("sessionId overwrites filter.sessionExternalId", async () => {
    await POST(
      makeRequest({
        query: "test",
        filter: { sessionExternalId: "old" },
        sessionId: "new",
      }),
    );

    const call = vi.mocked(searchSummaries).mock.calls[0][0];
    expect(call.filter?.sessionExternalId).toBe("new");
  });

  it("passes topK to searchSummaries", async () => {
    await POST(makeRequest({ query: "test", topK: 10 }));
    expect(searchSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 10 }),
    );
  });

  // --- Invalid JSON body (uncaught bug) ---

  it("throws on non-JSON body (missing try/catch on req.json())", async () => {
    const req = new Request("http://localhost/api/memory/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    await expect(POST(req)).rejects.toThrow();
  });
});
