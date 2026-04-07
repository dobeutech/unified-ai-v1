import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { runAgent } from "@/lib/agent/run";
import type { TaskTag } from "@/lib/model-policy";

export const maxDuration = 300;

const TASK_TAGS = new Set<TaskTag>(["chat", "planning", "codegen", "refactor"]);

const bodySchema = z.object({
  prompt: z.string().min(1).max(10000),
  taskTag: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  channel: z.string().max(50).optional(),
  maxTurns: z.number().int().min(1).max(100).optional(),
});

/**
 * POST /api/agent — run a Claude Agent SDK agent with full tool access.
 * Requires Bearer ADMIN_SECRET + ANTHROPIC_API_KEY in env.
 */
export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    prompt,
    taskTag: rawTaskTag,
    sessionId = randomUUID(),
    channel = "api-agent",
    maxTurns,
  } = parsed.data;

  const taskTag: TaskTag =
    typeof rawTaskTag === "string" && TASK_TAGS.has(rawTaskTag as TaskTag)
      ? (rawTaskTag as TaskTag)
      : "chat";

  try {
    const result = await runAgent({
      prompt,
      taskTag,
      sessionId,
      channel,
      maxTurns,
    });

    return NextResponse.json({
      ok: true,
      sessionId,
      taskTag,
      result,
    });
  } catch (e) {
    console.error("[api/agent] agent run failed:", e);
    return NextResponse.json(
      { error: "Agent execution failed" },
      { status: 500 },
    );
  }
}
