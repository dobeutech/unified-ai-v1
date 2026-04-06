import { afterEach, describe, expect, it } from "vitest";
import { estimateCostUsd, modelPricingNote } from "./pricing";

const inKey = "COST_INPUT_PER_M_TOKENS_USD";
const outKey = "COST_OUTPUT_PER_M_TOKENS_USD";
const saved: Record<string, string | undefined> = {};

function saveEnv(key: string) {
  saved[key] = process.env[key];
}

function restoreEnv(key: string) {
  const v = saved[key];
  if (v === undefined) delete process.env[key];
  else process.env[key] = v;
}

afterEach(() => {
  restoreEnv(inKey);
  restoreEnv(outKey);
});

describe("estimateCostUsd", () => {
  it("returns null when both token counts are zero", () => {
    saveEnv(inKey);
    saveEnv(outKey);
    delete process.env[inKey];
    delete process.env[outKey];
    expect(estimateCostUsd("openai/gpt-5-nano", 0, 0)).toBeNull();
    expect(estimateCostUsd("openai/gpt-5-nano", undefined, undefined)).toBeNull();
  });

  it("uses default rates when env unset", () => {
    saveEnv(inKey);
    saveEnv(outKey);
    delete process.env[inKey];
    delete process.env[outKey];
    // 1M in @ 0.15 + 0 out = 0.15
    expect(estimateCostUsd("m", 1_000_000, 0)).toBe("0.150000");
    // 0 in + 1M out @ 0.6 = 0.6
    expect(estimateCostUsd("m", 0, 1_000_000)).toBe("0.600000");
  });

  it("returns null when env rates are not finite", () => {
    saveEnv(inKey);
    saveEnv(outKey);
    process.env[inKey] = "nan";
    process.env[outKey] = "1";
    expect(estimateCostUsd("m", 100, 100)).toBeNull();
  });
});

describe("modelPricingNote", () => {
  it("includes model id and env hint", () => {
    expect(modelPricingNote("openai/gpt-5-mini")).toContain("openai/gpt-5-mini");
    expect(modelPricingNote("x")).toContain("COST_");
  });
});
