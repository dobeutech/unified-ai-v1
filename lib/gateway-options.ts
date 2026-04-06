/**
 * Optional Vercel AI Gateway observability fields (`providerOptions.gateway`).
 * Off by default; set env to enable without changing model behavior.
 *
 * - `AI_GATEWAY_TAGS` — comma-separated tags (e.g. `app:unified-ai,channel:gateway`)
 * - `AI_GATEWAY_USER_FROM_SESSION=true` — set gateway `user` to the client `sessionId`
 * - `AI_GATEWAY_USER` — fixed `user` string (overrides session when both set)
 */
export function buildGatewayProviderOptions(sessionExternalId: string): {
  gateway: { tags?: string[]; user?: string };
} | undefined {
  const tagsEnv = process.env.AI_GATEWAY_TAGS?.trim();
  const tags = tagsEnv
    ? tagsEnv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const userOverride = process.env.AI_GATEWAY_USER?.trim();
  const userFromSession = process.env.AI_GATEWAY_USER_FROM_SESSION === "true";

  const user = userOverride ?? (userFromSession ? sessionExternalId : undefined);

  if (tags.length === 0 && user === undefined) {
    return undefined;
  }

  const gateway: { tags?: string[]; user?: string } = {};
  if (tags.length > 0) gateway.tags = tags;
  if (user !== undefined) gateway.user = user;

  return { gateway };
}
