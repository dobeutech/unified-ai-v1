-- Unified AI Gateway + memory schema (Postgres / Neon / Supabase)
-- Apply with: pnpm db:push (Drizzle) or run this file in your SQL console.

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"channel" text DEFAULT 'gateway' NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_external_id_unique" UNIQUE("external_id")
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"trace_id" text NOT NULL,
	"role" text NOT NULL,
	"model_id" text,
	"content_preview" text,
	"content_hash" text,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"trace_id" text NOT NULL,
	"channel" text DEFAULT 'gateway' NOT NULL,
	"model_id" text NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"latency_ms" integer,
	"estimated_cost_usd" text,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "model_routing_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"session_id" uuid,
	"task_tag" text NOT NULL,
	"selected_model_id" text NOT NULL,
	"reason" text,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tool_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" text NOT NULL,
	"session_id" uuid,
	"tool_name" text NOT NULL,
	"args_ref" text,
	"result_ref" text,
	"args_digest" jsonb,
	"result_digest" jsonb,
	"allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "composio_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text,
	"description" text,
	"toolkit_slug" text,
	"raw" jsonb,
	"synced_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "composio_tools_slug_unique" UNIQUE("slug")
);

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "model_routing_decisions" ADD CONSTRAINT "model_routing_decisions_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tool_calls" ADD CONSTRAINT "tool_calls_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "messages_session_id_idx" ON "messages" ("session_id");
CREATE INDEX IF NOT EXISTS "usage_events_trace_id_idx" ON "usage_events" ("trace_id");
CREATE INDEX IF NOT EXISTS "tool_calls_trace_id_idx" ON "tool_calls" ("trace_id");
