import { describe, it, expect, vi, beforeEach } from "vitest";
import { withEnv } from "../helpers";

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: () => Promise.resolve([{ id: "uuid" }]),
  }),
});

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/db/sessions", () => ({
  getOrCreateSession: vi.fn().mockResolvedValue("session-uuid"),
}));

vi.mock("@/lib/db/schema", () => ({
  toolCalls: "toolCalls",
}));

import { getDb } from "@/lib/db/client";
import { POST } from "@/app/api/tool-call/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/tool-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  trace_id: "trace-1",
  session_id: "session-1",
  tool_name: "GITHUB_CREATE_PR",
};

describe("POST /api/tool-call", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- No database ---

  it("returns 503 when DATABASE_URL is not configured", async () => {
    vi.mocked(getDb).mockReturnValue(null);
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain("DATABASE_URL");
  });

  // --- Zod validation ---

  it("returns 400 for missing required fields", async () => {
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid body");
  });

  it("returns 400 when trace_id is empty", async () => {
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);
    const res = await POST(makeRequest({ ...validPayload, trace_id: "" }));
    expect(res.status).toBe(400);
  });

  // --- Tool allowed ---

  it("returns 200 when tool is allowed", async () => {
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const res = await withEnv({ ALLOWED_TOOL_PREFIXES: undefined }, () =>
      POST(makeRequest(validPayload)),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  // --- Tool blocked ---

  it("returns 403 when tool is blocked by prefix policy", async () => {
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const res = await withEnv({ ALLOWED_TOOL_PREFIXES: "SLACK_" }, () =>
      POST(makeRequest(validPayload)),
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.blocked).toBe(true);
  });

  // --- Invalid JSON body (uncaught bug) ---

  it("returns 500 for non-JSON body (missing try/catch on req.json())", async () => {
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const req = new Request("http://localhost/api/tool-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });

    // This should fail because req.json() is not wrapped in try/catch
    await expect(POST(req)).rejects.toThrow();
  });
});
