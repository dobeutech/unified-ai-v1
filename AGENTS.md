# Agent notes — unified-ai-v1

Authoritative build and architecture details live in [`CLAUDE.md`](CLAUDE.md). Use this file for **cross-session agent behavior** and durable workspace facts.

**Where agents start:** [`docs/AGENT_NAVIGATION.md`](docs/AGENT_NAVIGATION.md) (repo map and task → files), [`docs/CODEMAPS/README.md`](docs/CODEMAPS/README.md) (API/`lib` index), [`docs/ADOPTION_PORTING.md`](docs/ADOPTION_PORTING.md) (deploy vs port into another repo).

## Durable conventions

- **Plans:** Do not edit files under `.cursor/plans/` (e.g. `*.plan.md`) unless the user explicitly asks to change the plan. Implement from the plan without modifying the plan file.
- **Secrets:** Never commit `.env.local` or paste real API keys, tokens, or connection strings into issues, docs, or chat. Treat exposed keys as requiring rotation.
- **Postgres:** `DATABASE_URL` must be a Postgres connection string (`postgresql://` or `postgres://`). Bare `https://…supabase.co` project URLs are invalid; use the Supabase **Transaction pooler** URI. `getDb()` ignores invalid URLs; `pnpm db:push` runs `scripts/validate-db-url.mjs` first.
- **AI Gateway:** Default SDK endpoint is fine when `AI_GATEWAY_BASE_URL` is unset; auth via `VERCEL_OIDC_TOKEN` (`vc env pull` / `vc dev`) or `AI_GATEWAY_API_KEY`. Optional observability: `AI_GATEWAY_TAGS`, `AI_GATEWAY_USER_FROM_SESSION`, `AI_GATEWAY_USER` (see `.env.example`).
- **Composio:** Use for **integrations and audits** (e.g. Vercel env key presence), not for runtime chat. Follow search → schemas → connections → multi-execute; carry `session_id` through meta tool calls. For **Neon + Supabase** together (list projects, schema compare, SQL on Supabase, URIs on Neon), keep both toolkits connected in Composio and follow [`docs/COMPOSIO_NEON_SUPABASE.md`](docs/COMPOSIO_NEON_SUPABASE.md). The app still uses a **single** `DATABASE_URL`; cross-DB sync is workflow/orchestration, not automatic in code.
- **Deploy surface:** This app targets **Vercel** (Next.js). Webflow `webflow library share` / Code Component deploy guides do **not** apply.
- **CI:** GitHub Actions runs `type-check`, `lint`, and `build` (see `.github/workflows/ci.yml`).

## Incremental transcript index

Transcript mtimes for continual learning are tracked in [`.cursor/hooks/state/continual-learning-index.json`](.cursor/hooks/state/continual-learning-index.json). Re-process when a transcript path is missing from the index or its file mtime is newer than `mtimeUtc` in the index.
