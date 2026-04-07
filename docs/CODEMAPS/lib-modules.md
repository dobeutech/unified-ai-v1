# `lib` modules

One-line orientation for each TypeScript file under [`lib/`](../../lib/). For DB table definitions, see `lib/db/schema.ts` and [`CLAUDE.md`](../../CLAUDE.md).

| File | Responsibility |
|------|----------------|
| [`constants.ts`](../../lib/constants.ts) | `DEFAULT_MODEL`, `SUPPORTED_MODELS` — single source for model allowlist. |
| [`gateway.ts`](../../lib/gateway.ts) | AI Gateway client used by API routes and streaming. |
| [`gateway-options.ts`](../../lib/gateway-options.ts) | Builds optional `providerOptions.gateway` (tags, user) from env. |
| [`model-policy.ts`](../../lib/model-policy.ts) | Resolves model id from `taskTag` (`chat`, `planning`, `codegen`, `refactor`). |
| [`chat-logging.ts`](../../lib/chat-logging.ts) | `persistChatTurn`: routing row, messages, usage event; preview + hash; optional full blob upload. |
| [`message-text.ts`](../../lib/message-text.ts) | Extracts user text from UI message shapes for logging. |
| [`tool-policy.ts`](../../lib/tool-policy.ts) | `ALLOWED_TOOL_PREFIXES` gating for `/api/tool-call`. |
| [`telemetry.ts`](../../lib/telemetry.ts) | `postToolCall` helper for external agents calling `POST /api/tool-call` (copy-friendly for other packages). |
| [`pricing.ts`](../../lib/pricing.ts) | Cost estimate helpers for usage events. |
| [`hash.ts`](../../lib/hash.ts) | Content hashing for previews / digests. |
| [`display-model.ts`](../../lib/display-model.ts) | Human-friendly model labels for UI. |
| [`utils.ts`](../../lib/utils.ts) | `cn` and small shared utilities (used by components). |
| [`pinecone-summary.ts`](../../lib/pinecone-summary.ts) | Upsert/search assistant summary vectors; no-ops if Pinecone env missing. |
| [`composio-sync.ts`](../../lib/composio-sync.ts) | Fetches Composio catalog and upserts `composio_tools` rows. |
| [`supabase-storage.ts`](../../lib/supabase-storage.ts) | Optional full transcript upload when `STORE_FULL_MESSAGES` and storage env set. |
| [`db/client.ts`](../../lib/db/client.ts) | `getDb()` — Neon serverless Drizzle client or `null` if URL invalid/absent. |
| [`db/url.ts`](../../lib/db/url.ts) | URL validation / normalization for Postgres. |
| [`db/schema.ts`](../../lib/db/schema.ts) | Drizzle table definitions. |
| [`db/sessions.ts`](../../lib/db/sessions.ts) | `getOrCreateSession` and related session helpers. |
| [`hooks/use-available-models.ts`](../../lib/hooks/use-available-models.ts) | Client hook to load `/api/models` for the selector. |
