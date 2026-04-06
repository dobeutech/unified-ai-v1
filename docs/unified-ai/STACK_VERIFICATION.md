# Stack verification log

Run these on your machine or CI after configuring [`.env.local`](../../.env.local) from [`.env.example`](../../.env.example).

## `ADMIN_SECRET` vs Composio

- **`COMPOSIO_API_KEY`** — issued in the [Composio dashboard](https://platform.composio.dev/) for REST/MCP access to Composio’s backend.
- **`ADMIN_SECRET`** — **you** define this string. It is **not** returned by any Composio API. The app compares `Authorization: Bearer <ADMIN_SECRET>` on [`POST /api/admin/sync-composio`](../../app/api/admin/sync-composio/route.ts). Generate a long random value (e.g. `openssl rand -hex 32`) and store it only in env / your secret manager.

[`drizzle.config.ts`](../../drizzle.config.ts) loads `.env.local` and `.env` so `npm run db:push` picks up `DATABASE_URL` locally.

## Static checks (no secrets)

| Command | Status (repo maintainer run) |
|---------|------------------------------|
| `npm run type-check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |

## Database (`DATABASE_URL`)

| Command | When unconfigured |
|---------|-------------------|
| `npm run db:push` | Fails: `Please provide required params for Postgres driver: url: ''` |
| `npm run sync:composio` | Fails: `DATABASE_URL is required` |

**Action:** Set `DATABASE_URL` to a **`postgresql://` or `postgres://`** URI (Supabase **Transaction pooler** in Project Settings → Database). A bare `https://…supabase.co` project URL is **not** a valid Postgres connection string and will hang or fail.

**`PINECONE_INDEX`:** use the **index name** (e.g. `my-index`), not the `https://….pinecone.io` host — see [`lib/pinecone-summary.ts`](../../lib/pinecone-summary.ts) (`pc.index(indexName)`).

## Composio catalog sync

Requires **`DATABASE_URL`** + **`COMPOSIO_API_KEY`**. Then:

```bash
npm run sync:composio
```

Or call `POST /api/admin/sync-composio` with header `Authorization: Bearer <ADMIN_SECRET>` on a deployed instance.

## AI Gateway

Local: `vc dev` (per [CLAUDE.md](../../CLAUDE.md)) or `vc env pull` before `npm run dev`. `AI_GATEWAY_BASE_URL` must be set for chat routes to reach the gateway.

## Pinecone (optional)

If `PINECONE_API_KEY` and `PINECONE_INDEX` are unset, summary upserts no-op safely (see [`lib/pinecone-summary.ts`](../../lib/pinecone-summary.ts) behavior in code).

## Record your verification

Replace this section with dates and environment names when you confirm staging/production.
