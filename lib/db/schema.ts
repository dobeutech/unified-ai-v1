import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Client-visible session id (UUID string from browser or CLI). */
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id").notNull().unique(),
  channel: text("channel").notNull().default("gateway"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  traceId: text("trace_id").notNull(),
  role: text("role").notNull(),
  modelId: text("model_id"),
  contentPreview: text("content_preview"),
  contentHash: text("content_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usageEvents = pgTable("usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  traceId: text("trace_id").notNull(),
  channel: text("channel").notNull().default("gateway"),
  modelId: text("model_id").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  latencyMs: integer("latency_ms"),
  estimatedCostUsd: text("estimated_cost_usd"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const modelRoutingDecisions = pgTable("model_routing_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  traceId: text("trace_id").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  taskTag: text("task_tag").notNull(),
  selectedModelId: text("selected_model_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const toolCalls = pgTable("tool_calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  traceId: text("trace_id").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "set null",
  }),
  toolName: text("tool_name").notNull(),
  argsRef: text("args_ref"),
  resultRef: text("result_ref"),
  argsDigest: jsonb("args_digest"),
  resultDigest: jsonb("result_digest"),
  allowed: boolean("allowed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Cached Composio tool metadata (from GET /api/v3/tools). */
export const composioTools = pgTable("composio_tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name"),
  description: text("description"),
  toolkitSlug: text("toolkit_slug"),
  raw: jsonb("raw"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
