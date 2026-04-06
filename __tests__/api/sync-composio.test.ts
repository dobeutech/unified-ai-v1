import { describe, it, expect, vi, beforeEach } from "vitest";
import { withEnv } from "../helpers";

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/composio-sync", () => ({
  syncComposioToolsToDb: vi.fn().mockResolvedValue({ upserted: 5, pages: 2 }),
}));

import { getDb } from "@/lib/db/client";
import { syncComposioToolsToDb } from "@/lib/composio-sync";
import { POST } from "@/app/api/admin/sync-composio/route";

function makeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/admin/sync-composio", {
    method: "POST",
    headers,
  });
}

describe("POST /api/admin/sync-composio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when ADMIN_SECRET is not configured", async () => {
    const res = await withEnv({ ADMIN_SECRET: undefined }, () =>
      POST(makeRequest("any-token")),
    );
    expect(res.status).toBe(503);
  });

  it("returns 401 when auth token is missing", async () => {
    const res = await withEnv({ ADMIN_SECRET: "secret123" }, () =>
      POST(makeRequest()),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when auth token is wrong", async () => {
    const res = await withEnv({ ADMIN_SECRET: "secret123" }, () =>
      POST(makeRequest("wrong-token")),
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when DATABASE_URL is not configured", async () => {
    vi.mocked(getDb).mockReturnValue(null);
    const res = await withEnv({ ADMIN_SECRET: "secret123" }, () =>
      POST(makeRequest("secret123")),
    );
    expect(res.status).toBe(503);
  });

  it("returns 200 with sync results on success", async () => {
    vi.mocked(getDb).mockReturnValue({} as never);
    const res = await withEnv({ ADMIN_SECRET: "secret123" }, () =>
      POST(makeRequest("secret123")),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, upserted: 5, pages: 2 });
  });

  it("returns 500 when sync throws", async () => {
    vi.mocked(getDb).mockReturnValue({} as never);
    vi.mocked(syncComposioToolsToDb).mockRejectedValueOnce(
      new Error("API down"),
    );
    const res = await withEnv({ ADMIN_SECRET: "secret123" }, () =>
      POST(makeRequest("secret123")),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("API down");
  });
});
