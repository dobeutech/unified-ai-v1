# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**unified-ai-v1** — Next.js app using the Vercel AI Gateway (AI SDK) with optional **Postgres** (Neon/Supabase) for sessions, messages, usage telemetry, tool-call audit rows, and a cached **Composio** tool catalog. Optional **Pinecone** (SDK v6) stores assistant-summary embeddings. Uses **hybrid metering**: gateway usage is logged here; consumer subscriptions (ChatGPT Plus, etc.) are not debited through this app.

## Commands

```bash
pnpm i              # Install dependencies (pnpm 10.6.2 enforced via packageManager field)
npm install         # Alternative
vc dev              # Run dev server (preferred — auto-refreshes OIDC token)
pnpm dev            # Alternative (requires `vc env pull` first; token expires every 12h)
pnpm build          # Production build
pnpm lint           # ESLint
pnpm type-check     # TypeScript check
pnpm db:push        # Apply Drizzle schema to DATABASE_URL
pnpm sync:composio  # Upsert Composio tools (needs DATABASE_URL + COMPOSIO_API_KEY)
node scripts/bootstrap.mjs   # Setup checklist
```

## Architecture

### AI Gateway flow

```
Client (useChat) → POST /api/chat { messages, modelId, sessionId, channel, taskTag }
                → model policy (lib/model-policy.ts) may override modelId by taskTag
                → gateway(modelId) via @ai-sdk/gateway
                → stream; onFinish → Postgres (+ optional Pinecone summary)
```

### Memory & telemetry

- `lib/db/schema.ts` — Drizzle tables: `sessions`, `messages`, `usage_events`, `model_routing_decisions`, `tool_calls`, `composio_tools`.
- `app/api/tool-call` — External agents POST tool audit envelopes.
- `app/api/admin/sync-composio` — Bearer `ADMIN_SECRET`; syncs Composio catalog.
- `/dashboard` — Usage by channel (requires `DATABASE_URL`).

### Key files

- `lib/gateway.ts` — Gateway provider singleton.
- `lib/constants.ts` — `SUPPORTED_MODELS` allowlist.
- `app/api/chat/route.ts` — Streaming chat + persistence.
- `components/chat.tsx` — Persists `sessionId` in `localStorage`; links to `/dashboard`.
- `docs/CLIENT_ADAPTERS.md` — Cursor / CLI integration notes.
- `docs/architecture-one-pager.md` — Channels, retention, session IDs.
- `drizzle/0000_init.sql` — Raw SQL alternative to `db:push`.

## Environment

See `.env.example`: `AI_GATEWAY_BASE_URL`, `DATABASE_URL`, `COMPOSIO_API_KEY`, `ADMIN_SECRET`, `PINECONE_*`, `ALLOWED_TOOL_PREFIXES`, cost estimate vars.

**Pinecone:** package is pinned to `@pinecone-database/pinecone@^6.1.2` (v7.1.0 tarball was missing files in npm). `next.config.ts` sets `serverExternalPackages` for the client.

## Repository

Primary remote: `https://github.com/dobeutech/unified-ai-v1.git`
