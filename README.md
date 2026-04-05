# unified-ai-v1

Next.js chat app using the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) and [AI SDK](https://sdk.vercel.ai), with **Postgres** (Neon/Supabase) for unified session + usage logging, **Composio** tool-catalog sync, optional **Pinecone** summaries, and a small **usage dashboard**.

**Repository:** [github.com/dobeutech/unified-ai-v1](https://github.com/dobeutech/unified-ai-v1)

## Quick start

1. Clone and install: `git clone https://github.com/dobeutech/unified-ai-v1.git && cd unified-ai-v1 && pnpm i` (or `npm install`)
2. Copy [`.env.example`](./.env.example) to `.env.local` and set at least `AI_GATEWAY_BASE_URL` and optionally `DATABASE_URL`
3. Apply DB schema: `pnpm db:push` (requires `DATABASE_URL`)
4. Run: `vc dev` (recommended) or `pnpm dev` after `vc env pull`
5. Open [http://localhost:3000](http://localhost:3000) — usage stats at `/dashboard`

Run `node scripts/bootstrap.mjs` for a printable checklist.

## Docs

- [docs/architecture-one-pager.md](./docs/architecture-one-pager.md) — channels, sessions, retention
- [docs/CLIENT_ADAPTERS.md](./docs/CLIENT_ADAPTERS.md) — Cursor, Claude Code, Composio
- [docs/unified-ai/README.md](./docs/unified-ai/README.md) — place strategic reports from your drive here

## API routes

| Route | Purpose |
|--------|---------|
| `POST /api/chat` | Chat stream; body: `messages`, `modelId`, `sessionId`, `channel`, `taskTag` |
| `POST /api/tool-call` | Log tool executions from external clients |
| `POST /api/admin/sync-composio` | `Authorization: Bearer $ADMIN_SECRET` — refresh `composio_tools` |

## License

See [LICENSE](./LICENSE).
