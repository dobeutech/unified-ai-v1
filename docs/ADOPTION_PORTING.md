# Adoption and porting

This document explains how to **run unified-ai-v1 as its own app** and how to **lift core pieces into another repository**. It complements [`CLIENT_ADAPTERS.md`](./CLIENT_ADAPTERS.md), which focuses on channel behavior and Composio.

## What this app is (and is not)

- **Is:** A Next.js UI plus HTTP APIs for **Vercel AI Gateway–metered chat**, **Postgres-backed** session and usage logging, optional **Pinecone** summary search, optional **Composio** catalog sync, and a **`POST /api/tool-call` audit sink** for external agents.
- **Is not:** A full replacement for local **Claude Code**, **Codex**, or your IDE. Those tools still perform editing and product-specific billing. This repo gives you a **shared telemetry and audit surface** when you point them (or scripts) at your deployment.

See [`CLIENT_ADAPTERS.md`](./CLIENT_ADAPTERS.md) — “Relationship to local Claude Code / Codex” for the short version.

## Mode A — Deploy or run this repository

1. Clone, install, env: follow [`README.md`](../README.md) and run `node scripts/bootstrap.mjs` for a printable checklist.
2. Set `DATABASE_URL` to a valid Postgres URI (`postgresql://` or `postgres://`); see [`unified-ai/SUPABASE_DATABASE_URL.md`](./unified-ai/SUPABASE_DATABASE_URL.md) if using Supabase pooler.
3. Gateway auth: `vc dev` / `vc env pull` for `VERCEL_OIDC_TOKEN`, or set `AI_GATEWAY_API_KEY` per [`.env.example`](../.env.example).
4. Apply schema: `pnpm db:push`.
5. Optional: `pnpm sync:composio` (or `POST /api/admin/sync-composio` with `Authorization: Bearer $ADMIN_SECRET`).
6. Point external agents at your base URL: `POST /api/tool-call` with JSON matching [`app/api/tool-call/route.ts`](../app/api/tool-call/route.ts). Optional: reuse [`lib/telemetry.ts`](../lib/telemetry.ts) `postToolCall` helper.

## Mode B — Embed in another Next.js repo

Treat the following as a **checklist to copy and adapt**, not a blind merge. Resolve path aliases (`@/*`), env names, and middleware yourself.

### API routes (App Router)

| Path | Notes |
|------|--------|
| `app/api/chat/route.ts` | Core streaming chat; depends on gateway, model policy, chat logging. |
| `app/api/models/route.ts` | Lists models from gateway filtered by `SUPPORTED_MODELS`. |
| `app/api/tool-call/route.ts` | Tool audit insert; requires Drizzle + schema. |
| `app/api/memory/search/route.ts` | Optional; omit if you do not need Pinecone. |
| `app/api/admin/sync-composio/route.ts` | Optional; Composio catalog sync. |

### Libraries

| Area | Paths |
|------|--------|
| Gateway + chat | `lib/gateway.ts`, `lib/gateway-options.ts`, `lib/chat-logging.ts`, `lib/model-policy.ts`, `lib/message-text.ts`, `lib/constants.ts` |
| Policies / hashing | `lib/tool-policy.ts`, `lib/hash.ts` |
| DB | `lib/db/client.ts`, `lib/db/url.ts`, `lib/db/schema.ts`, `lib/db/sessions.ts` |
| Optional | `lib/pinecone-summary.ts`, `lib/composio-sync.ts`, `lib/supabase-storage.ts`, `lib/pricing.ts`, `lib/display-model.ts` |
| Client helper | `lib/telemetry.ts` (for callers outside this repo) |

### UI

- `components/chat.tsx`, `components/model-selector.tsx`, and shared UI under `components/ui/` as needed.
- `lib/hooks/use-available-models.ts` for the model dropdown.
- `app/dashboard/page.tsx` if you want the usage dashboard; align queries with your schema.

### Configuration and tooling

- **`tsconfig.json`:** `@/*` → project root (or adjust imports).
- **`next.config.ts`:** `serverExternalPackages: ["@pinecone-database/pinecone"]` if you use the Pinecone SDK on the server (see [`CLAUDE.md`](../CLAUDE.md)).
- **Drizzle:** `drizzle.config.ts`, `drizzle/` SQL if you use raw migrations; run `pnpm db:push` or your host’s migration process.
- **CI:** Mirror [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (`type-check`, `lint`, `build`, tests) if you want parity.

### Caveats and merge conflicts

- **Schema:** Tables in `lib/db/schema.ts` must exist in the target database; avoid partial copies that reference missing tables.
- **Auth:** This app’s routes are unauthenticated by design; add middleware or edge auth in the host app if routes are public.
- **Env:** Reconcile variable names with the host (gateway, DB, Pinecone, Composio, `ADMIN_SECRET`, `ALLOWED_TOOL_PREFIXES`, `STORE_FULL_MESSAGES`, storage keys).
- **Dual gateway auth:** OIDC vs API key behavior must match how the host deploys (see [`CLAUDE.md`](../CLAUDE.md) “Claude Code Max vs Next.js Gateway Auth”).

For a file-level map, see [`CODEMAPS/lib-modules.md`](./CODEMAPS/lib-modules.md) and [`CODEMAPS/api-surface.md`](./CODEMAPS/api-surface.md).
