import { getDb } from "@/lib/db/client";
import { getOrCreateSession } from "@/lib/db/sessions";
import { toolCalls } from "@/lib/db/schema";
import { isToolCallAllowed } from "@/lib/tool-policy";

export async function logToolCall(args: {
  traceId: string;
  sessionExternalId: string;
  channel: string;
  toolName: string;
  argsRef?: string | null;
  resultRef?: string | null;
  argsDigest?: Record<string, unknown> | null;
  resultDigest?: Record<string, unknown> | null;
}): Promise<{ logged: boolean; allowed: boolean }> {
  const db = getDb();
  if (!db) return { logged: false, allowed: true };

  const allowed = isToolCallAllowed(args.toolName);
  const sessionInternalId = await getOrCreateSession(
    db,
    args.sessionExternalId,
    args.channel,
  );

  await db.insert(toolCalls).values({
    traceId: args.traceId,
    sessionId: sessionInternalId,
    toolName: args.toolName,
    argsRef: args.argsRef ?? null,
    resultRef: args.resultRef ?? null,
    argsDigest: args.argsDigest ?? null,
    resultDigest: args.resultDigest ?? null,
    allowed,
  });

  return { logged: true, allowed };
}
