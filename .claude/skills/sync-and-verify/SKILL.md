---
name: sync-and-verify
description: Push Drizzle schema to Supabase and sync Composio catalog, then verify row counts via Composio SQL queries
---

# Sync and Verify

Run the full database and Composio sync workflow with verification.

## Steps

1. **Apply schema** — Run `pnpm db:push` to push Drizzle schema changes to Supabase Postgres
2. **Sync Composio catalog** — Run `pnpm sync:composio` to refresh the `composio_tools` table
3. **Verify via Composio (Supabase)** — Use `COMPOSIO_SEARCH_TOOLS` to find `SUPABASE_BETA_RUN_SQL_QUERY`, then execute (with the correct `project_ref` for the project your `DATABASE_URL` targets):
   - `SELECT count(*) as tool_count FROM composio_tools`
   - `SELECT source, status, tools_upserted, pages_processed, completed_at FROM sync_runs ORDER BY completed_at DESC LIMIT 3`
   - `SELECT channel, count(*) as events FROM usage_events GROUP BY channel`
4. **Optional — Neon also connected in Composio** — If `DATABASE_URL` points at **Neon** (or you want a cross-check), use `NEON_RETRIEVE_PROJECTS_LIST` and `NEON_GET_PROJECT_CONNECTION_URI` to confirm project access; run SQL against Neon with the returned URI via local `psql` or a script (Composio Neon tools are project/URI-oriented, not generic SQL). For both providers active at once, see [`docs/COMPOSIO_NEON_SUPABASE.md`](../../docs/COMPOSIO_NEON_SUPABASE.md).
5. **Report results** — Show table counts and latest sync run status

## Error handling

- If `db:push` fails, check `DATABASE_URL` in `.env.local` — must be a `postgresql://` Transaction pooler URI
- If `sync:composio` fails, check `COMPOSIO_API_KEY` in `.env.local`
- If SQL queries fail, the schema may not have been applied — rerun `pnpm db:push`
