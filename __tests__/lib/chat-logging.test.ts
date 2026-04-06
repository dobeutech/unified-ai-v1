import { describe, it, expect, vi, beforeEach } from "vitest";
import { persistChatTurn } from "@/lib/chat-logging";
import { createMockDb } from "../helpers";

// Mock all external dependencies
vi.mock("@/lib/db/sessions", () => ({
  getOrCreateSession: vi.fn().mockResolvedValue("mock-session-uuid"),
}));

vi.mock("@/lib/pinecone-summary", () => ({
  upsertSummaryVector: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase-storage", () => ({
  uploadChatTranscript: vi.fn().mockResolvedValue(null),
}));

import { getOrCreateSession } from "@/lib/db/sessions";
import { upsertSummaryVector } from "@/lib/pinecone-summary";
import { uploadChatTranscript } from "@/lib/supabase-storage";

function makeArgs(overrides: Partial<Parameters<typeof persistChatTurn>[0]> = {}) {
  const db = createMockDb();
  return {
    args: {
      db: db as unknown as Parameters<typeof persistChatTurn>[0]["db"],
      traceId: "trace-1",
      sessionExternalId: "ext-session-1",
      channel: "gateway",
      taskTag: "chat" as const,
      modelId: "openai/gpt-5-nano",
      routingReason: "chat: client-selected model",
      userText: "Hello, world",
      assistantText: "Hi there!",
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      startedAt: Date.now() - 500,
      ...overrides,
    },
    db,
  };
}

describe("persistChatTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STORE_FULL_MESSAGES;
  });

  // --- Happy path ---

  it("inserts routing decision, user message, assistant message, and usage event", async () => {
    const { args, db } = makeArgs();
    await persistChatTurn(args);

    // getOrCreateSession called once
    expect(getOrCreateSession).toHaveBeenCalledWith(
      args.db,
      "ext-session-1",
      "gateway",
    );

    // 4 inserts: routing decision + user msg + assistant msg + usage event
    expect(db._insertedValues).toHaveLength(4);
  });

  it("includes content preview and hash in message inserts", async () => {
    const { args, db } = makeArgs();
    await persistChatTurn(args);

    // User message (second insert)
    const userInsert = db._insertedValues[1] as Record<string, unknown>;
    expect(userInsert.contentPreview).toBe("Hello, world");
    expect(typeof userInsert.contentHash).toBe("string");
    expect((userInsert.contentHash as string).length).toBe(64);
  });

  // --- Empty text handling ---

  it("skips user message insert when userText is empty", async () => {
    const { args, db } = makeArgs({ userText: "" });
    await persistChatTurn(args);

    // 3 inserts: routing decision + assistant msg + usage event (no user msg)
    expect(db._insertedValues).toHaveLength(3);
  });

  it("skips assistant message insert when assistantText is empty", async () => {
    const { args, db } = makeArgs({ assistantText: "" });
    await persistChatTurn(args);

    // 3 inserts: routing decision + user msg + usage event (no assistant msg)
    expect(db._insertedValues).toHaveLength(3);
  });

  it("skips both message inserts when both texts are empty", async () => {
    const { args, db } = makeArgs({ userText: "", assistantText: "" });
    await persistChatTurn(args);

    // 2 inserts: routing decision + usage event only
    expect(db._insertedValues).toHaveLength(2);
  });

  // --- Pinecone upsert ---

  it("calls upsertSummaryVector for non-empty assistant text", async () => {
    const { args } = makeArgs();
    await persistChatTurn(args);

    expect(upsertSummaryVector).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "trace-1",
        text: "Hi there!",
        metadata: expect.objectContaining({
          modelId: "openai/gpt-5-nano",
          channel: "gateway",
          taskTag: "chat",
          sessionExternalId: "ext-session-1",
        }),
      }),
    );
  });

  it("skips Pinecone upsert when assistantText is empty", async () => {
    const { args } = makeArgs({ assistantText: "" });
    await persistChatTurn(args);
    expect(upsertSummaryVector).not.toHaveBeenCalled();
  });

  it("skips Pinecone upsert when assistantText is whitespace-only", async () => {
    const { args } = makeArgs({ assistantText: "   " });
    await persistChatTurn(args);
    expect(upsertSummaryVector).not.toHaveBeenCalled();
  });

  // --- Pinecone truncation ---

  it("truncates summary to 1200 chars for Pinecone", async () => {
    const longText = "x".repeat(2000);
    const { args } = makeArgs({ assistantText: longText });
    await persistChatTurn(args);

    const call = vi.mocked(upsertSummaryVector).mock.calls[0][0];
    expect(call.text).toHaveLength(1200);
  });

  // --- Preview text truncation ---

  it("truncates content preview at 2000 chars", async () => {
    const longText = "y".repeat(2500);
    const { args, db } = makeArgs({ userText: longText });
    await persistChatTurn(args);

    const userInsert = db._insertedValues[1] as Record<string, unknown>;
    const preview = userInsert.contentPreview as string;
    // 2000 chars + "…" = 2001 total
    expect(preview.length).toBe(2001);
    expect(preview.endsWith("…")).toBe(true);
  });

  it("does not truncate content at exactly 2000 chars", async () => {
    const text = "z".repeat(2000);
    const { args, db } = makeArgs({ userText: text });
    await persistChatTurn(args);

    const userInsert = db._insertedValues[1] as Record<string, unknown>;
    expect((userInsert.contentPreview as string).length).toBe(2000);
  });

  // --- Usage / cost ---

  it("handles undefined usage gracefully", async () => {
    const { args, db } = makeArgs({ usage: undefined });
    await persistChatTurn(args);

    // Usage event is the last insert
    const usageInsert = db._insertedValues[db._insertedValues.length - 1] as Record<string, unknown>;
    expect(usageInsert.promptTokens).toBeNull();
    expect(usageInsert.completionTokens).toBeNull();
    expect(usageInsert.totalTokens).toBeNull();
    expect(usageInsert.estimatedCostUsd).toBeNull();
  });

  // --- Latency ---

  it("clamps negative latency to 0 (future startedAt / clock skew)", async () => {
    const { args, db } = makeArgs({ startedAt: Date.now() + 10_000 });
    await persistChatTurn(args);

    const usageInsert = db._insertedValues[db._insertedValues.length - 1] as Record<string, unknown>;
    expect(usageInsert.latencyMs).toBe(0);
  });

  // --- STORE_FULL_MESSAGES ---

  it("does not call uploadChatTranscript when STORE_FULL_MESSAGES is not set", async () => {
    const { args } = makeArgs();
    await persistChatTurn(args);
    expect(uploadChatTranscript).not.toHaveBeenCalled();
  });

  it("calls uploadChatTranscript when STORE_FULL_MESSAGES=true", async () => {
    process.env.STORE_FULL_MESSAGES = "true";
    const { args } = makeArgs();
    await persistChatTurn(args);
    expect(uploadChatTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: "trace-1",
        userText: "Hello, world",
        assistantText: "Hi there!",
      }),
    );
  });

  it("does not call uploadChatTranscript when both texts are empty even with STORE_FULL_MESSAGES", async () => {
    process.env.STORE_FULL_MESSAGES = "true";
    const { args } = makeArgs({ userText: "", assistantText: "" });
    await persistChatTurn(args);
    expect(uploadChatTranscript).not.toHaveBeenCalled();
  });

  // --- Error propagation ---

  it("propagates error when getOrCreateSession fails", async () => {
    vi.mocked(getOrCreateSession).mockRejectedValueOnce(new Error("DB down"));
    const { args } = makeArgs();
    await expect(persistChatTurn(args)).rejects.toThrow("DB down");
  });
});
