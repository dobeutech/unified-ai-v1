# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**unified-ai-v1** — Next.js 15 (App Router) chat UI backed by the **Vercel AI Gateway** (`@ai-sdk/gateway` + `ai` SDK v5). Optional **Postgres** (Neon serverless driver) stores sessions, messages, usage telemetry, tool-call audit rows, and a cached Composio tool catalog. Optional **Pinecone** (SDK v6) stores assistant-summary embeddings. Uses **hybrid metering**: gateway usage is logged here; consumer subscriptions (ChatGPT Plus, etc.) are not debited through this app.

## Commands

```bash
pnpm i                        # Install deps (pnpm 10.6.2 enforced via packageManager)
vc dev                        # Dev server (preferred — auto-refreshes OIDC token for AI Gateway)
pnpm dev                      # Alternative (needs `vc env pull` first; token expires ~12h)
pnpm build                    # Production build
pnpm lint                     # ESLint (next/core-web-vitals + next/typescript)
pnpm type-check               # tsc --noEmit
pnpm test                     # Vitest — run all tests once
pnpm test:watch               # Vitest in watch mode
pnpm test:coverage            # Vitest with v8 coverage (lib/**/*.ts)
pnpm db:push                  # Apply Drizzle schema to DATABASE_URL
pnpm db:generate              # Generate Drizzle migration SQL
pnpm db:studio                # Drizzle Studio (browser DB explorer)
pnpm sync:composio            # Upsert Composio tools (needs DATABASE_URL + COMPOSIO_API_KEY)
pnpm sync:principles          # Upsert ~/.claude/rules/*.md into agent_principles table
pnpm cli "prompt"             # Stream through AI Gateway from terminal (any model)
pnpm cli "prompt" --agent     # Claude Agent SDK mode (Claude models, full tool access)
node scripts/bootstrap.mjs    # Interactive setup checklist
```

Run a single test file: `pnpm vitest run __tests__/lib/model-policy.test.ts`

## Architecture

### Request flow

```
Client (useChat from @ai-sdk/react)
  → POST /api/chat { messages, modelId, sessionId, channel, taskTag }
  → resolveModelForTask() may override modelId based on taskTag
  → gateway(modelId) via @ai-sdk/gateway → streamText()
  → onFinish: persistChatTurn() writes to Postgres + fire-and-forget Pinecone upsert
  → Response includes x-trace-id, x-session-id, x-model-id headers
```

### Graceful degradation

The app runs without any external services. Each integration is independently optional:

- **No `DATABASE_URL`**: `getDb()` returns `null`; chat still streams but nothing persists. Dashboard shows a "set DATABASE_URL" message.
- **No `PINECONE_API_KEY`/`PINECONE_INDEX`**: `upsertSummaryVector()` silently returns. Chat logging completes without embeddings.
- **No `COMPOSIO_API_KEY`**: Composio sync endpoints return 503. Chat is unaffected.

### Model policy (`lib/model-policy.ts`)

Clients send a `taskTag` (`chat | planning | codegen | refactor`). The policy function picks an optimal model from `SUPPORTED_MODELS` based on the tag — e.g., `planning` prefers `gpt-5-mini`, `codegen` prefers `gpt-5-nano`. If the requested model isn't in the allowlist, it falls back to `DEFAULT_MODEL`. Every routing decision is persisted to `model_routing_decisions`.

### Persistence pipeline (`lib/chat-logging.ts`)

`persistChatTurn()` runs inside `onFinish` and does four inserts in sequence: routing decision → user message → assistant message → usage event. Content is stored as a 2000-char preview + SHA-256 hash. With `STORE_FULL_MESSAGES=true` plus Supabase storage env, full transcripts are uploaded and `content_ref` is set (see `lib/supabase-storage.ts`). After inserts, a fire-and-forget Pinecone upsert sends the first 1200 chars of the assistant response as an embedding with metadata including `sessionExternalId` for session-scoped search via `POST /api/memory/search`.

### API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/chat` | POST | None | Streaming chat (main endpoint) |
| `/api/models` | GET | None | Returns `SUPPORTED_MODELS` filtered from gateway |
| `/api/memory/search` | POST | None | Pinecone summary search; body `query`, optional `sessionId`, `topK`, `filter` |
| `/api/tool-call` | POST | None | External agents log tool audit envelopes (Zod-validated) |
| `/api/agent` | POST | Bearer `ADMIN_SECRET` | Claude Agent SDK agent run (requires `ANTHROPIC_API_KEY`) |
| `/api/admin/sync-composio` | POST | Bearer `ADMIN_SECRET` | Upserts Composio tool catalog |

### Tool-call audit (`lib/tool-policy.ts` + `lib/tool-call-logger.ts`)

Two logging paths: external agents POST to `/api/tool-call` (HTTP). The Agent SDK uses `lib/tool-call-logger.ts` → `logToolCall()` which inserts directly via Drizzle (no HTTP round-trip). Both respect `ALLOWED_TOOL_PREFIXES` (comma-separated); empty = allow all. Blocked calls still get logged with `allowed = false`.

### Agent SDK (`lib/agent/`)

`lib/agent/run.ts` exports `runAgent()` — runs a Claude Agent SDK agent with built-in file/search/shell tools, optional Composio MCP, PostToolUse hook for automatic tool-call logging, and best-practices injection from the `agent_principles` table. Requires `ANTHROPIC_API_KEY`. Used by `pnpm cli --agent` and `POST /api/agent`.

`lib/agent/hooks.ts` exports `createToolCallLoggerHook()` — factory for Agent SDK `PostToolUse` hook callbacks that log tool calls to Postgres.

### Best-practices persistence (`lib/principles.ts`)

`getPrinciples(taskTag?)` queries the `agent_principles` table and returns combined markdown. When `taskTag` is provided, filters to matching rows plus universal principles (`appliesTo IS NULL`). Sync from `~/.claude/rules/*.md` via `pnpm sync:principles`. Principles are injected into the system prompt for both Agent SDK runs and can be used by any model.

### Database (Drizzle + Neon)

Schema in `lib/db/schema.ts`. Tables: `sessions`, `messages`, `usage_events`, `model_routing_decisions`, `tool_calls`, `composio_tools`, `sync_runs`, `agent_principles`. The DB client (`lib/db/client.ts`) uses `@neondatabase/serverless` (HTTP driver, not WebSocket). Invalid `DATABASE_URL` values (e.g. bare `https://…supabase.co`) are ignored with a warning — use a `postgresql://` pooler URI (`docs/unified-ai/SUPABASE_DATABASE_URL.md`). `drizzle.config.ts` loads `.env.local` then `.env`. Raw SQL alternative: `drizzle/0000_init.sql`.

### AI Gateway observability (optional)

`POST /api/chat` passes `providerOptions.gateway` when env is set: `AI_GATEWAY_TAGS` (comma-separated), `AI_GATEWAY_USER_FROM_SESSION=true`, and/or `AI_GATEWAY_USER`. This attributes usage in the Vercel AI Gateway dashboard without changing routing.

### Client (`components/chat.tsx`)

Uses `useChat` from `@ai-sdk/react`. Session ID is stored in `localStorage` (`unified_ai_gateway_session`). Model selection updates URL query params. Markdown rendering via `streamdown`. The `requestBody` callback attaches `modelId`, `sessionId`, `channel`, and `taskTag` to every request.

### Constants (`lib/constants.ts`)

`DEFAULT_MODEL` and `SUPPORTED_MODELS` are the single source of truth for model routing. Model policy, the `/api/models` endpoint, and the client model selector all derive from this list.

### Path aliases

`@/*` maps to project root (configured in `tsconfig.json`).

### Testing

Vitest (node environment). Tests live in `__tests__/` mirroring the source tree (`__tests__/lib/`, `__tests__/api/`). Coverage targets `lib/**/*.ts` (excludes schema, display-model, utils). Test helpers in `__tests__/helpers.ts` provide:

- `withEnv(overrides, fn)` — temporarily sets env vars for a test, restores after (handles async)
- `createMockDb(overrides?)` — returns a chainable mock Drizzle db for insert/select/update without a real database

## Claude Code Max vs Next.js Gateway Auth

These are **parallel** configurations, not one env block:

| Surface | Auth mechanism | Where configured |
|---------|---------------|-----------------|
| **Claude Code (terminal)** | Vercel AI Gateway proxy for Claude Max subscription. Set `ANTHROPIC_BASE_URL=https://ai-gateway.vercel.sh` + `ANTHROPIC_CUSTOM_HEADERS` with gateway API key in shell env. Login with Anthropic subscription via `claude /login`. | Shell environment (not this repo's `.env.local`) |
| **This Next.js app** | Vercel OIDC (`VERCEL_OIDC_TOKEN` from `vc env pull` / `vc dev`) or `AI_GATEWAY_API_KEY`; optional `AI_GATEWAY_BASE_URL` override. When unset, `@ai-sdk/gateway` uses its **default** gateway endpoint — do not invent JWKS URLs. | `.env.local` |

See [Vercel AI Gateway docs](https://vercel.com/docs/ai-gateway) for setup details.

## Environment

See `.env.example` for all variables. Key groups:

- **Gateway**: optional `AI_GATEWAY_BASE_URL`; default SDK endpoint + `VERCEL_OIDC_TOKEN` (`vc env pull` / `vc dev`) or `AI_GATEWAY_API_KEY`. Optional tags/user: `AI_GATEWAY_TAGS`, `AI_GATEWAY_USER_FROM_SESSION`, `AI_GATEWAY_USER`
- **Database**: `DATABASE_URL` (Neon/Supabase Postgres pooler URL)
- **Composio**: `COMPOSIO_API_KEY`, optional `COMPOSIO_API_BASE`
- **Pinecone**: `PINECONE_API_KEY`, `PINECONE_INDEX`, optional `PINECONE_NAMESPACE_SUMMARIES`, `PINECONE_EMBED_MODEL`
- **Cost estimates**: `COST_INPUT_PER_M_TOKENS_USD`, `COST_OUTPUT_PER_M_TOKENS_USD` (defaults: 0.15/0.6)
- **Admin**: `ADMIN_SECRET` (for sync-composio endpoint)
- **Tool policy**: `ALLOWED_TOOL_PREFIXES` (comma-separated, empty = allow all)
- **Agent SDK**: `ANTHROPIC_API_KEY` (required for `pnpm cli --agent` and `POST /api/agent`)

**Pinecone caveat**: Package pinned to `@pinecone-database/pinecone@^6.1.2` (v7.1.0 tarball was broken on npm). `next.config.ts` lists it in `serverExternalPackages`.

## Key docs

- `docs/architecture-one-pager.md` — Channels, retention, session IDs
- `docs/CLIENT_ADAPTERS.md` — Cursor / CLI integration patterns
- `docs/unified-ai/` — Roadmap docs (dashboard metrics, hybrid metering, import checklist)

## Repository

Primary remote: `https://github.com/dobeutech/unified-ai-v1.git`

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
