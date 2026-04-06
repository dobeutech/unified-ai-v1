import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadChatTranscript } from "@/lib/supabase-storage";
import { withEnv } from "../helpers";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const samplePayload = {
  traceId: "trace-1",
  sessionExternalId: "session-1",
  channel: "gateway",
  modelId: "openai/gpt-5-nano",
  userText: "hello",
  assistantText: "hi",
  timestamp: "2024-01-01T00:00:00Z",
};

describe("uploadChatTranscript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Missing env vars ---

  it("returns null when SUPABASE_URL is not set", async () => {
    const result = await withEnv(
      { SUPABASE_URL: undefined, SUPABASE_SERVICE_ROLE_KEY: "key" },
      () => uploadChatTranscript(samplePayload),
    );
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null when SUPABASE_SERVICE_ROLE_KEY is not set", async () => {
    const result = await withEnv(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: undefined },
      () => uploadChatTranscript(samplePayload),
    );
    expect(result).toBeNull();
  });

  // --- Successful upload ---

  it("returns the storage path on successful upload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await withEnv(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret" },
      () => uploadChatTranscript(samplePayload),
    );

    expect(result).toBe("gateway/session-1/trace-1.json");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("chat-transcripts");
    expect(opts.method).toBe("POST");
    expect(opts.headers["x-upsert"]).toBe("true");
  });

  // --- Failed upload ---

  it("returns null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve("Forbidden"),
    });

    const result = await withEnv(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret" },
      () => uploadChatTranscript(samplePayload),
    );
    expect(result).toBeNull();
  });

  // --- Network error ---

  it("returns null on fetch throw (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await withEnv(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret" },
      () => uploadChatTranscript(samplePayload),
    );
    expect(result).toBeNull();
  });

  // --- Path construction with special chars ---

  it("constructs path from channel/session/trace", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await withEnv(
      { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret" },
      () =>
        uploadChatTranscript({
          ...samplePayload,
          channel: "cli",
          sessionExternalId: "sess-abc",
          traceId: "trace-xyz",
        }),
    );
    expect(result).toBe("cli/sess-abc/trace-xyz.json");
  });
});
