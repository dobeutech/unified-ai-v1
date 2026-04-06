import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { estimateCostUsd, modelPricingNote } from "@/lib/pricing";
import { withEnv } from "../helpers";

describe("estimateCostUsd", () => {
  // --- Happy path ---

  it("calculates cost with default rates", () => {
    // 1M input tokens at $0.15 + 1M output tokens at $0.60 = $0.75
    const result = estimateCostUsd("any-model", 1_000_000, 1_000_000);
    expect(result).toBe("0.750000");
  });

  it("calculates cost for small token counts", () => {
    // 100 input at $0.15/M + 200 output at $0.60/M
    const result = estimateCostUsd("any-model", 100, 200);
    expect(result).not.toBeNull();
    const val = parseFloat(result!);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(0.001);
  });

  // --- Null/undefined token handling ---

  it("returns null when both tokens are undefined", () => {
    const result = estimateCostUsd("any-model", undefined, undefined);
    expect(result).toBeNull();
  });

  it("returns null when both tokens are 0", () => {
    const result = estimateCostUsd("any-model", 0, 0);
    expect(result).toBeNull();
  });

  it("returns non-null when only promptTokens is provided", () => {
    const result = estimateCostUsd("any-model", 1000, undefined);
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeGreaterThan(0);
  });

  it("returns non-null when only completionTokens is provided", () => {
    const result = estimateCostUsd("any-model", undefined, 1000);
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeGreaterThan(0);
  });

  it("returns non-null when promptTokens > 0 but completionTokens is 0", () => {
    // This is the asymmetric-zero case: usd > 0 so it should NOT return null
    const result = estimateCostUsd("any-model", 1000, 0);
    expect(result).not.toBeNull();
  });

  // --- Env var overrides ---

  it("uses custom rates from env vars", async () => {
    const result = await withEnv(
      {
        COST_INPUT_PER_M_TOKENS_USD: "1.0",
        COST_OUTPUT_PER_M_TOKENS_USD: "2.0",
      },
      () => estimateCostUsd("any-model", 1_000_000, 1_000_000),
    );
    expect(result).toBe("3.000000");
  });

  it("returns null when env rate is non-numeric string", async () => {
    const result = await withEnv(
      { COST_INPUT_PER_M_TOKENS_USD: "abc" },
      () => estimateCostUsd("any-model", 1000, 1000),
    );
    expect(result).toBeNull();
  });

  it("treats empty string env var as rate 0 — silently zeroes all costs (bug)", async () => {
    // BUG DOCUMENTATION: Number("") === 0, isFinite(0) === true
    // So empty string env vars silently zero out costs instead of falling back to defaults.
    // With 1M tokens the cost computes to $0.00 but is NOT null because tokens > 0.
    const result = await withEnv(
      {
        COST_INPUT_PER_M_TOKENS_USD: "",
        COST_OUTPUT_PER_M_TOKENS_USD: "",
      },
      () => estimateCostUsd("any-model", 1_000_000, 1_000_000),
    );
    expect(result).toBe("0.000000"); // cost is zero but non-null — data looks valid but wrong
  });

  // --- Negative tokens ---

  it("does not guard against negative token counts", () => {
    const result = estimateCostUsd("any-model", -1000, 1000);
    expect(result).not.toBeNull();
    // Negative input cost + positive output cost
    const val = parseFloat(result!);
    // Just document the behavior: negative tokens produce potentially negative costs
    expect(typeof val).toBe("number");
  });

  // --- Fixed decimal precision ---

  it("always returns 6 decimal places", () => {
    const result = estimateCostUsd("any-model", 1, 1);
    expect(result).toMatch(/^\d+\.\d{6}$/);
  });

  // --- modelId is unused ---

  it("produces the same cost regardless of modelId", () => {
    const a = estimateCostUsd("openai/gpt-5-nano", 1000, 1000);
    const b = estimateCostUsd("anthropic/claude-haiku-4.5", 1000, 1000);
    expect(a).toBe(b);
  });
});

describe("modelPricingNote", () => {
  it("includes the model ID in the note", () => {
    const note = modelPricingNote("openai/gpt-5-nano");
    expect(note).toContain("openai/gpt-5-nano");
  });
});
