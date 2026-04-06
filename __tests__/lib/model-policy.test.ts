import { describe, it, expect } from "vitest";
import { resolveModelForTask, type TaskTag } from "@/lib/model-policy";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";

describe("resolveModelForTask", () => {
  // --- Allowlist enforcement ---

  it("falls back to DEFAULT_MODEL when requested model is not in SUPPORTED_MODELS", () => {
    const result = resolveModelForTask("chat", "unknown/model-x");
    expect(result.modelId).toBe(DEFAULT_MODEL);
    expect(result.reason).toContain("not in allowlist");
  });

  it("falls back for model with trailing whitespace (exact match required)", () => {
    const result = resolveModelForTask("chat", "openai/gpt-5-nano ");
    expect(result.modelId).toBe(DEFAULT_MODEL);
  });

  it("falls back for empty string model", () => {
    const result = resolveModelForTask("chat", "");
    expect(result.modelId).toBe(DEFAULT_MODEL);
  });

  // --- chat tag: client-selected passthrough ---

  it("chat tag returns the requested model unchanged", () => {
    const result = resolveModelForTask("chat", "anthropic/claude-haiku-4.5");
    expect(result.modelId).toBe("anthropic/claude-haiku-4.5");
    expect(result.reason).toContain("client-selected");
  });

  it("chat tag respects any supported model", () => {
    for (const model of SUPPORTED_MODELS) {
      const result = resolveModelForTask("chat", model);
      expect(result.modelId).toBe(model);
    }
  });

  // --- planning tag: prefers gpt-5-mini, then claude-haiku ---

  it("planning tag prefers gpt-5-mini", () => {
    const result = resolveModelForTask("planning", "amazon/nova-lite");
    expect(result.modelId).toBe("openai/gpt-5-mini");
  });

  it("planning tag overrides the user's model choice", () => {
    const result = resolveModelForTask("planning", "meta/llama-3.1-8b");
    expect(result.modelId).toBe("openai/gpt-5-mini");
    expect(result.modelId).not.toBe("meta/llama-3.1-8b");
  });

  // --- codegen tag: prefers gpt-5-nano, then nova-micro ---

  it("codegen tag prefers gpt-5-nano", () => {
    const result = resolveModelForTask("codegen", "anthropic/claude-haiku-4.5");
    expect(result.modelId).toBe("openai/gpt-5-nano");
  });

  // --- refactor tag: prefers claude-haiku, then gpt-5-nano ---

  it("refactor tag prefers claude-haiku", () => {
    const result = resolveModelForTask("refactor", "amazon/nova-lite");
    expect(result.modelId).toBe("anthropic/claude-haiku-4.5");
  });

  // --- Dead code / fallback path ---

  it("unknown task tag hits the final fallback return", () => {
    // Cast to TaskTag to bypass TS and test the runtime fallback at line 57
    const result = resolveModelForTask(
      "summarize" as TaskTag,
      "openai/gpt-5-nano",
    );
    expect(result.modelId).toBe("openai/gpt-5-nano");
    expect(result.reason).toBe("fallback");
  });

  // --- All task tags return a reason ---

  it("every task tag produces a non-empty reason", () => {
    const tags: TaskTag[] = ["chat", "planning", "codegen", "refactor"];
    for (const tag of tags) {
      const result = resolveModelForTask(tag, DEFAULT_MODEL);
      expect(result.reason).toBeTruthy();
      expect(typeof result.reason).toBe("string");
    }
  });

  // --- Return shape is consistent ---

  it("always returns { modelId, reason } with string values", () => {
    const result = resolveModelForTask("chat", DEFAULT_MODEL);
    expect(typeof result.modelId).toBe("string");
    expect(typeof result.reason).toBe("string");
    expect(result.modelId.length).toBeGreaterThan(0);
  });
});
