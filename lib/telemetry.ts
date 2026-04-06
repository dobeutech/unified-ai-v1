/**
 * Minimal client helpers for external agents (Cursor, CLI) posting tool audit rows.
 * Copy into another package or publish later as `@scope/telemetry-client`.
 */
export type ToolCallPayload = {
  trace_id: string;
  session_id: string;
  channel?: string;
  tool_name: string;
  args_ref?: string;
  result_ref?: string;
  args_digest?: Record<string, unknown>;
  result_digest?: Record<string, unknown>;
};

export async function postToolCall(
  baseUrl: string,
  payload: ToolCallPayload,
): Promise<{ ok: boolean; blocked?: boolean; error?: string }> {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${normalizedBase}/api/tool-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: "cli",
      ...payload,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    blocked?: boolean;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, error: data.error ?? res.statusText };
  }
  return { ok: true, blocked: data.blocked };
}
