import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gateway", () => ({
  gateway: {
    getAvailableModels: vi.fn(),
  },
}));

import { gateway } from "@/lib/gateway";
import { GET } from "@/app/api/models/route";

describe("GET /api/models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only supported models from the gateway", async () => {
    vi.mocked(gateway.getAvailableModels).mockResolvedValueOnce({
      models: [
        { id: "openai/gpt-5-nano", name: "GPT-5 Nano" },
        { id: "openai/gpt-5-mini", name: "GPT-5 Mini" },
        { id: "unknown/model", name: "Unknown" },
      ],
    } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.models).toHaveLength(2);
    expect(json.models.map((m: { id: string }) => m.id)).toEqual([
      "openai/gpt-5-nano",
      "openai/gpt-5-mini",
    ]);
  });

  it("returns empty array when gateway returns no supported models", async () => {
    vi.mocked(gateway.getAvailableModels).mockResolvedValueOnce({
      models: [{ id: "unsupported/xyz", name: "XYZ" }],
    } as never);

    const res = await GET();
    const json = await res.json();
    expect(json.models).toEqual([]);
  });

  it("throws when gateway is unreachable (no try/catch in route)", async () => {
    vi.mocked(gateway.getAvailableModels).mockRejectedValueOnce(
      new Error("Gateway unreachable"),
    );

    await expect(GET()).rejects.toThrow("Gateway unreachable");
  });
});
