import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";

export type TaskTag = "chat" | "planning" | "codegen" | "refactor";

/**
 * Picks a model from the allowlist using a lightweight task tag.
 * Falls back to `requestedModelId` when it is already allowed.
 */
export function resolveModelForTask(
  taskTag: TaskTag,
  requestedModelId: string,
): { modelId: string; reason: string } {
  if (!SUPPORTED_MODELS.includes(requestedModelId)) {
    return {
      modelId: DEFAULT_MODEL,
      reason: "requested model not in allowlist; using default",
    };
  }

  if (taskTag === "chat") {
    return { modelId: requestedModelId, reason: "chat: client-selected model" };
  }

  if (taskTag === "planning") {
    const prefer =
      SUPPORTED_MODELS.find((id) => id.includes("gpt-5-mini")) ??
      SUPPORTED_MODELS.find((id) => id.includes("claude-haiku")) ??
      requestedModelId;
    return {
      modelId: prefer,
      reason: "planning: prefer stronger mini-tier when available",
    };
  }

  if (taskTag === "codegen") {
    const prefer =
      SUPPORTED_MODELS.find((id) => id.includes("gpt-5-nano")) ??
      SUPPORTED_MODELS.find((id) => id.includes("nova-micro")) ??
      requestedModelId;
    return {
      modelId: prefer,
      reason: "codegen: prefer fast small model when available",
    };
  }

  if (taskTag === "refactor") {
    const prefer =
      SUPPORTED_MODELS.find((id) => id.includes("claude-haiku")) ??
      SUPPORTED_MODELS.find((id) => id.includes("gpt-5-nano")) ??
      requestedModelId;
    return {
      modelId: prefer,
      reason: "refactor: prefer haiku/nano when available",
    };
  }

  return { modelId: requestedModelId, reason: "fallback" };
}
