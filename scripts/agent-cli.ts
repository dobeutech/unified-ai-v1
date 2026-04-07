import { config } from "dotenv";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { streamText } from "ai";
import { gateway } from "../lib/gateway";
import { DEFAULT_MODEL } from "../lib/constants";
import { resolveModelForTask, type TaskTag } from "../lib/model-policy";
import { buildGatewayProviderOptions } from "../lib/gateway-options";
import { getDb } from "../lib/db/client";
import { persistChatTurn } from "../lib/chat-logging";
import { runAgent } from "../lib/agent/run";

// Load .env.local first, then .env as fallback (dotenv does not overwrite)
config({ path: resolve(import.meta.dirname, "../.env.local") });
config({ path: resolve(import.meta.dirname, "../.env") });

const TASK_TAGS = new Set<TaskTag>(["chat", "planning", "codegen", "refactor"]);

function parseTaskTag(value: string): TaskTag {
  if (TASK_TAGS.has(value as TaskTag)) {
    return value as TaskTag;
  }
  console.error(`Unknown task tag "${value}", defaulting to "chat"`);
  return "chat";
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "task-tag": { type: "string", default: "chat" },
      "session-id": { type: "string", default: randomUUID() },
      model: { type: "string", default: DEFAULT_MODEL },
      channel: { type: "string", default: "cli" },
      agent: { type: "boolean", default: false },
    },
  });

  const promptText = positionals.join(" ").trim();
  if (!promptText) {
    console.error("Usage: tsx scripts/agent-cli.ts \"your prompt\" [--task-tag chat|planning|codegen|refactor] [--model <id>] [--session-id <uuid>] [--channel <name>] [--agent]");
    process.exit(1);
  }

  const taskTag = parseTaskTag(values["task-tag"]!);
  const sessionExternalId = values["session-id"]!;
  const channel = values.channel!;

  // --agent mode: use Claude Agent SDK with full agentic capabilities
  if (values.agent) {
    console.error(`[cli] agent mode | task=${taskTag} session=${sessionExternalId}`);
    const agentResult = await runAgent({
      prompt: promptText,
      taskTag,
      sessionId: sessionExternalId,
      channel,
    });
    process.stdout.write(agentResult + "\n");
    return;
  }

  // Standard mode: stream through AI Gateway
  const { modelId, reason } = resolveModelForTask(taskTag, values.model!);

  const traceId = randomUUID();
  const startedAt = Date.now();
  const db = getDb();
  const gatewayOpts = buildGatewayProviderOptions(sessionExternalId);

  console.error(`[cli] model=${modelId} task=${taskTag} session=${sessionExternalId} reason="${reason}"`);

  const result = streamText({
    model: gateway(modelId),
    ...(gatewayOpts ? { providerOptions: gatewayOpts } : {}),
    system: "You are a software engineer exploring Generative AI.",
    messages: [{ role: "user" as const, content: promptText }],
    onError: (e) => {
      console.error("[cli] stream error:", e);
    },
    onFinish: async ({ totalUsage, text }) => {
      if (!db) return;
      try {
        await persistChatTurn({
          db,
          traceId,
          sessionExternalId,
          channel,
          taskTag,
          modelId,
          routingReason: reason,
          userText: promptText,
          assistantText: text,
          usage: totalUsage,
          startedAt,
        });
        console.error("[cli] turn persisted");
      } catch (e) {
        console.error("[cli] persist failed:", e);
      }
    },
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  // Ensure newline after streamed output
  process.stdout.write("\n");
}

main().catch((err) => {
  console.error("[cli] fatal:", err);
  process.exit(1);
});
