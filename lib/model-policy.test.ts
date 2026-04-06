import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "./constants";
import { resolveModelForTask } from "./model-policy";

describe("resolveModelForTask", () => {
  const allowed = SUPPORTED_MODELS[0];

  it("uses default when requested model is not in allowlist", () => {
    const r = resolveModelForTask("chat", "vendor/unknown-model");
    expect(r.modelId).toBe(DEFAULT_MODEL);
    expect(r.reason).toContain("allowlist");
  });

  it("returns client model for chat when allowed", () => {
    const r = resolveModelForTask("chat", allowed);
    expect(r.modelId).toBe(allowed);
    expect(r.reason).toContain("chat");
  });

  it("prefers gpt-5-mini for planning when present", () => {
    const r = resolveModelForTask("planning", allowed);
    expect(r.modelId).toBe("openai/gpt-5-mini");
  });

  it("prefers gpt-5-nano for codegen when present", () => {
    const r = resolveModelForTask("codegen", allowed);
    expect(r.modelId).toBe("openai/gpt-5-nano");
  });

  it("prefers claude-haiku for refactor when present", () => {
    const r = resolveModelForTask("refactor", allowed);
    expect(r.modelId).toBe("anthropic/claude-haiku-4.5");
  });
});
