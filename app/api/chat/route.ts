import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { randomUUID } from "node:crypto";
import { z } from "zod";
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
import { searchSummaries } from "@/lib/pinecone-summary";

export const maxDuration = 60;

const bodySchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    }).passthrough()).optional(),
    content: z.string().optional(),
  }).passthrough()),
  modelId: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  channel: z.string().max(50).optional(),
  taskTag: z.string().optional(),
});

const TASK_TAGS = new Set<TaskTag>(["chat", "planning", "codegen", "refactor"]);
const ENABLE_MEMORY = process.env.ENABLE_MEMORY_CONTEXT === "true";

function parseTaskTag(value: unknown): TaskTag {
  if (typeof value === "string" && TASK_TAGS.has(value as TaskTag)) {
    return value as TaskTag;
  }
  return "chat";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request body", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const {
    messages: rawMessages,
    modelId: requestedModelId = DEFAULT_MODEL,
    sessionId: sessionExternalId = randomUUID(),
    channel = "gateway",
    taskTag: rawTaskTag,
  } = parsed.data;
  const messages = rawMessages as UIMessage[];

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

  let memoryContext = "";
  if (ENABLE_MEMORY && userText) {
    try {
      const memories = await searchSummaries({
        query: userText,
        topK: 3,
        filter: { channel: typeof channel === "string" ? channel : "gateway" },
      });
      if (memories.length > 0) {
        memoryContext = "\n\nRelevant context from previous conversations:\n" +
          memories.map((m) => `- ${m.metadata.taskTag || "chat"}: (score ${m.score.toFixed(2)}) ${m.id}`).join("\n");
      }
    } catch (e) {
      console.error("[chat] memory retrieval failed:", e);
    }
  }

  const result = streamText({
    model: gateway(modelId),
    ...(gatewayOpts ? { providerOptions: gatewayOpts } : {}),
    system: "You are a software engineer exploring Generative AI." + memoryContext,
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
