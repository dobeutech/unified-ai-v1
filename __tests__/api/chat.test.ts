import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies before importing the route
vi.mock("@/lib/gateway", () => ({
  gateway: vi.fn().mockReturnValue({ modelId: "mock" }),
}));

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn().mockReturnValue([]),
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: () =>
      new Response("stream", {
        status: 200,
        headers: new Headers(),
      }),
  }),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/chat-logging", () => ({
  persistChatTurn: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pinecone-summary", () => ({
  searchSummaries: vi.fn().mockResolvedValue([]),
}));

import { POST } from "@/app/api/chat/route";

function makeRequest(body: unknown, options?: { invalidJson?: boolean }) {
  if (options?.invalidJson) {
    return new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
  }
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Invalid JSON ---

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(makeRequest(null, { invalidJson: true }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  // --- Zod validation ---

  it("returns 400 when messages is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request body");
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await POST(makeRequest({ messages: "not an array" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when sessionId is not a valid UUID", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hi" }],
        sessionId: "not-a-uuid",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when channel exceeds 50 chars", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hi" }],
        channel: "x".repeat(51),
      }),
    );
    expect(res.status).toBe(400);
  });

  // --- Valid request ---

  it("returns 200 with trace headers for valid request", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hello" }],
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-trace-id")).toBeTruthy();
    expect(res.headers.get("x-session-id")).toBeTruthy();
    expect(res.headers.get("x-model-id")).toBeTruthy();
  });

  // --- taskTag handling ---

  it("treats unknown taskTag as chat", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hi" }],
        taskTag: "destroy",
      }),
    );
    expect(res.status).toBe(200);
    // The model should be the default model (chat passthrough)
    expect(res.headers.get("x-model-id")).toBe("openai/gpt-5-nano");
  });

  // --- Model enforcement ---

  it("returns model-id header matching a supported model", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hi" }],
        modelId: "anthropic/claude-haiku-4.5",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-model-id")).toBe("anthropic/claude-haiku-4.5");
  });

  it("falls back to default model for unsupported modelId", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ id: "1", role: "user", content: "hi" }],
        modelId: "unknown/model",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-model-id")).toBe("openai/gpt-5-nano");
  });
});
