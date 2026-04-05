import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { getOrCreateSession } from "@/lib/db/sessions";
import { toolCalls } from "@/lib/db/schema";
import { isToolCallAllowed } from "@/lib/tool-policy";

const bodySchema = z.object({
  trace_id: z.string().min(1),
  session_id: z.string().min(1),
  channel: z.string().default("cli"),
  tool_name: z.string().min(1),
  args_ref: z.string().optional(),
  result_ref: z.string().optional(),
  args_digest: z.record(z.string(), z.any()).optional(),
  result_digest: z.record(z.string(), z.any()).optional(),
});

/**
 * Log a Composio (or other) tool invocation from CLIs / external agents.
 * POST JSON body matching `bodySchema`. Requires DATABASE_URL.
 */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 503 },
    );
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const b = parsed.data;
  const allowed = isToolCallAllowed(b.tool_name);
  const sessionInternalId = await getOrCreateSession(
    db,
    b.session_id,
    b.channel,
  );

  await db.insert(toolCalls).values({
    traceId: b.trace_id,
    sessionId: sessionInternalId,
    toolName: b.tool_name,
    argsRef: b.args_ref ?? null,
    resultRef: b.result_ref ?? null,
    argsDigest: b.args_digest ?? null,
    resultDigest: b.result_digest ?? null,
    allowed,
  });

  if (!allowed) {
    return NextResponse.json(
      { ok: false, blocked: true, reason: "tool not allowed by ALLOWED_TOOL_PREFIXES" },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
