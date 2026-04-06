import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { randomUUID } from "node:crypto";
import { DEFAULT_MODEL, SUPPORTED_MODELS } from "@/lib/constants";
import { buildGatewayProviderOptions } from "@/lib/gateway-options";
import { gateway } from "@/lib/gateway";
import { getDb } from "@/lib/db/client";
import { persistChatTurn } from "@/lib/chat-logging";
import { getLastUserText } from "@/lib/message-text";
import {
  resolveModelForTask,
  type TaskTag,
} from "@/lib/model-policy";

export const maxDuration = 60;

const TASK_TAGS = new Set<TaskTag>(["chat", "planning", "codegen", "refactor"]);

function parseTaskTag(value: unknown): TaskTag {
  if (typeof value === "string" && TASK_TAGS.has(value as TaskTag)) {
    return value as TaskTag;
  }
  return "chat";
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    modelId: requestedModelId = DEFAULT_MODEL,
    sessionId: sessionExternalId = randomUUID(),
    channel = "gateway",
    taskTag: rawTaskTag,
  }: {
    messages: UIMessage[];
    modelId?: string;
    sessionId?: string;
    channel?: string;
    taskTag?: string;
  } = body;

  const taskTag = parseTaskTag(rawTaskTag);
  const { modelId, reason } = resolveModelForTask(
    taskTag,
    requestedModelId,
  );

  if (!SUPPORTED_MODELS.includes(modelId)) {
    return new Response(
      JSON.stringify({ error: `Model ${modelId} is not supported` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const traceId = randomUUID();
  const startedAt = Date.now();
  const userText = getLastUserText(messages);
  const db = getDb();

  const gatewayOpts = buildGatewayProviderOptions(sessionExternalId);

  const result = streamText({
    model: gateway(modelId),
    ...(gatewayOpts ? { providerOptions: gatewayOpts } : {}),
    system: "You are a software engineer exploring Generative AI.",
    messages: convertToModelMessages(messages),
    onError: (e) => {
      console.error("Error while streaming.", e);
    },
    onFinish: async ({ totalUsage, text }) => {
      if (!db) return;
      try {
        await persistChatTurn({
          db,
          traceId,
          sessionExternalId,
          channel: typeof channel === "string" ? channel : "gateway",
          taskTag,
          modelId,
          routingReason: reason,
          userText,
          assistantText: text,
          usage: totalUsage,
          startedAt,
        });
      } catch (e) {
        console.error("[chat] persist failed:", e);
      }
    },
  });

  const response = result.toUIMessageStreamResponse();
  response.headers.set("x-trace-id", traceId);
  response.headers.set("x-session-id", sessionExternalId);
  response.headers.set("x-model-id", modelId);
  return response;
}
