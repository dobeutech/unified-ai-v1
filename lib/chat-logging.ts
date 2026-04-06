import type { LanguageModelUsage } from "ai";
import type { AppDatabase } from "@/lib/db/client";
import {
  messages,
  modelRoutingDecisions,
  usageEvents,
} from "@/lib/db/schema";
import { getOrCreateSession } from "@/lib/db/sessions";
import { sha256Hex } from "@/lib/hash";
import { estimateCostUsd } from "@/lib/pricing";
import { upsertSummaryVector } from "@/lib/pinecone-summary";
import { uploadChatTranscript } from "@/lib/supabase-storage";
import type { TaskTag } from "@/lib/model-policy";

function previewText(text: string, max = 2000): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export async function persistChatTurn(args: {
  db: AppDatabase;
  traceId: string;
  sessionExternalId: string;
  channel: string;
  taskTag: TaskTag;
  modelId: string;
  routingReason: string;
  /** Last user message text (best-effort). */
  userText: string;
  assistantText: string;
  usage: LanguageModelUsage | undefined;
  startedAt: number;
}): Promise<void> {
  const sessionInternalId = await getOrCreateSession(
    args.db,
    args.sessionExternalId,
    args.channel,
  );

  const storeFullMessages = process.env.STORE_FULL_MESSAGES === "true";
  let contentRef: string | null = null;

  if (storeFullMessages && (args.userText || args.assistantText)) {
    contentRef = await uploadChatTranscript({
      traceId: args.traceId,
      sessionExternalId: args.sessionExternalId,
      channel: args.channel,
      modelId: args.modelId,
      userText: args.userText,
      assistantText: args.assistantText,
      timestamp: new Date().toISOString(),
    });
  }

  await args.db.insert(modelRoutingDecisions).values({
    traceId: args.traceId,
    sessionId: sessionInternalId,
    taskTag: args.taskTag,
    selectedModelId: args.modelId,
    reason: args.routingReason,
  });

  if (args.userText) {
    await args.db.insert(messages).values({
      sessionId: sessionInternalId,
      traceId: args.traceId,
      role: "user",
      modelId: args.modelId,
      contentPreview: previewText(args.userText),
      contentHash: sha256Hex(args.userText),
    });
  }

  if (args.assistantText) {
    await args.db.insert(messages).values({
      sessionId: sessionInternalId,
      traceId: args.traceId,
      role: "assistant",
      modelId: args.modelId,
      contentPreview: previewText(args.assistantText),
      contentHash: sha256Hex(args.assistantText),
      contentRef,
    });
  }

  const latencyMs = Math.max(0, Math.round(Date.now() - args.startedAt));
  const promptTokens = args.usage?.inputTokens;
  const completionTokens = args.usage?.outputTokens;
  const totalTokens = args.usage?.totalTokens;

  await args.db.insert(usageEvents).values({
    sessionId: sessionInternalId,
    traceId: args.traceId,
    channel: args.channel,
    modelId: args.modelId,
    promptTokens: promptTokens ?? null,
    completionTokens: completionTokens ?? null,
    totalTokens: totalTokens ?? null,
    latencyMs,
    estimatedCostUsd: estimateCostUsd(
      args.modelId,
      promptTokens,
      completionTokens,
    ),
  });

  const summary = args.assistantText.trim().slice(0, 1200);
  if (summary) {
    void upsertSummaryVector({
      id: args.traceId,
      text: summary,
      metadata: {
        modelId: args.modelId,
        channel: args.channel,
        taskTag: args.taskTag,
        sessionExternalId: args.sessionExternalId,
      },
    });
  }
}
