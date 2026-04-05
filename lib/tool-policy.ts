/**
 * Optional guardrail: set ALLOWED_TOOL_PREFIXES to a comma-separated list
 * (e.g. "GITHUB_,SLACK_"). Empty / unset = allow any tool name for logging.
 */
export function isToolCallAllowed(toolName: string): boolean {
  const raw = process.env.ALLOWED_TOOL_PREFIXES?.trim();
  if (!raw) return true;
  const prefixes = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (prefixes.length === 0) return true;
  return prefixes.some((p) => toolName.startsWith(p));
}
