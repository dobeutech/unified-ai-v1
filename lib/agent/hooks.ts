import { randomUUID } from "node:crypto";
import type { HookCallback } from "@anthropic-ai/claude-agent-sdk";
import { logToolCall } from "@/lib/tool-call-logger";
import { isToolCallAllowed } from "@/lib/tool-policy";

/**
 * Creates a PostToolUse hook that logs every tool call to the database.
 * Extracts tool name and args from the Agent SDK hook input,
 * then delegates to the shared `logToolCall()` function.
 */
export function createToolCallLoggerHook(
  sessionExternalId: string,
  channel: string,
): HookCallback {
  return async (input: unknown) => {
    const data = input as Record<string, unknown>;
    const toolInput = data.tool_input as Record<string, unknown> | undefined;

    const toolName =
      typeof data.tool_name === "string"
        ? data.tool_name
        : typeof toolInput?.name === "string"
          ? (toolInput.name as string)
          : "unknown";

    // Truncate large string values for the digest
    const argsDigest = toolInput
      ? Object.fromEntries(
          Object.entries(toolInput)
            .filter(([k]) => k !== "name")
            .map(([k, v]) => [
              k,
              typeof v === "string" && v.length > 500
                ? v.slice(0, 500) + "\u2026"
                : v,
            ]),
        )
      : null;

    await logToolCall({
      traceId: randomUUID(),
      sessionExternalId,
      channel,
      toolName,
      argsDigest,
    });

    return {};
  };
}

/**
 * Creates a PreToolUse hook that blocks tools not in ALLOWED_TOOL_PREFIXES.
 * Returns `{ decision: "block", reason: "..." }` for disallowed tools,
 * preventing execution before it happens (unlike PostToolUse which only logs).
 */
export function createToolPolicyHook(): HookCallback {
  return async (input: unknown) => {
    const data = input as Record<string, unknown>;
    const toolName =
      typeof data.tool_name === "string" ? data.tool_name : "unknown";

    if (!isToolCallAllowed(toolName)) {
      return {
        decision: "block",
        reason: `Tool "${toolName}" is not allowed by ALLOWED_TOOL_PREFIXES`,
      };
    }

    return {};
  };
}
