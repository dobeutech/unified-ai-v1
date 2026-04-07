import { randomUUID } from "node:crypto";
import { logToolCall } from "@/lib/tool-call-logger";

export function createToolCallLoggerHook(
  sessionExternalId: string,
  channel: string,
): (input: unknown) => Promise<Record<string, unknown>> {
  return async (input: unknown) => {
    const data = input as Record<string, unknown>;
    const toolInput = data.tool_input as Record<string, unknown> | undefined;
    const toolName =
      typeof data.tool_name === "string"
        ? data.tool_name
        : typeof toolInput?.name === "string"
          ? toolInput.name
          : "unknown";

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
