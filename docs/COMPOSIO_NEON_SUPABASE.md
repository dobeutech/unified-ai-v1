# Composio: Neon + Supabase for storage workflows

Use this when an agent should treat **Neon Postgres** and **Supabase** (Postgres + Storage API) as two Composio-connected backends—e.g. audits, cross-checks, or migration-style work—while this app continues to use a **single** `DATABASE_URL` at runtime.

## Prerequisites (Composio)

1. In [Composio](https://app.composio.dev), open **Connections** and ensure both toolkits are **Active**:
   - **neon** — OAuth or API key with access to your Neon org/projects.
   - **supabase** — PAT or OAuth with at least **Projects.Read**; SQL/migrations need appropriate write scopes.

2. **Neon org API keys:** Some Neon endpoints return `not allowed for organization API keys` for certain user-info calls. Listing projects (`NEON_RETRIEVE_PROJECTS_LIST`) still works for many setups; if a tool fails, reconnect Neon using a **personal** API key or the OAuth flow Composio recommends.

## Verify both are reachable

Workflow (carry `session_id` from `COMPOSIO_SEARCH_TOOLS` through meta calls):

1. `COMPOSIO_SEARCH_TOOLS` — queries such as “list Neon projects” and “list Supabase projects”.
2. `COMPOSIO_MULTI_EXECUTE_TOOL` — parallel, independent calls:
   - `NEON_RETRIEVE_PROJECTS_LIST` (e.g. `{ "limit": 10 }`)
   - `SUPABASE_LIST_ALL_PROJECTS` (`{}`)

Both should return `successful: true`. If either toolkit shows no active connection, use `COMPOSIO_MANAGE_CONNECTIONS` for `["neon"]` or `["supabase"]`, share the auth link, then `COMPOSIO_WAIT_FOR_CONNECTIONS`.

## How this maps to the repo

| Concern | Mechanism |
|--------|-----------|
| **App runtime DB** | One `DATABASE_URL` (`postgresql://` / `postgres://`). Point it at **either** Supabase Transaction pooler **or** Neon—see [`unified-ai/SUPABASE_DATABASE_URL.md`](./unified-ai/SUPABASE_DATABASE_URL.md). |
| **Full transcript files** | Optional Supabase Storage via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (not Composio). |
| **Composio tool catalog in DB** | `pnpm sync:composio` uses whatever `DATABASE_URL` points to. |

There is **no** built-in automatic sync between two live databases in application code. “Sync between two” in Composio means **you** orchestrate steps (schema export → migration/SQL on the other side, then data movement if needed).

## Suggested sync / compare patterns (Composio)

**Schema (Neon → Supabase or review only)**

- `NEON_GET_BRANCHES_FOR_PROJECT` → `NEON_FETCH_DATABASE_FOR_BRANCH` → `NEON_GET_BRANCH_ROLES_FOR_PROJECT` (as needed).
- `NEON_GET_PROJECT_CONNECTION_URI` with `pooled: true` when you need a URI for external tools.
- `NEON_GET_SCHEMA_FOR_PROJECT_BRANCH` or `NEON_GET_PROJECT_BRANCH_SCHEMA_COMPARISON` for DDL / diffs.
- On Supabase: `SUPABASE_LIST_TABLES`, `SUPABASE_GET_TABLE_SCHEMAS`, `SUPABASE_APPLY_A_MIGRATION`, or `SUPABASE_BETA_RUN_SQL_QUERY` (mind timeouts on large DDL).

**Data**

- Composio does not replace `pg_dump` / `COPY` / ETL for bulk moves. Use connection URIs from Neon/Supabase dashboards or Composio’s Neon URI tool, then run migration scripts locally or in a sandbox—not in request-path app code.

**Row verification (Supabase)**

- After `pnpm db:push` / `pnpm sync:composio`, use `SUPABASE_BETA_RUN_SQL_QUERY` with `project_ref` and read-only `SELECT`s (see [`.claude/skills/sync-and-verify/SKILL.md`](../.claude/skills/sync-and-verify/SKILL.md)).

**Row verification (Neon)**

- Prefer direct SQL against the Neon connection string from the Neon console or `NEON_GET_PROJECT_CONNECTION_URI`; Composio’s Neon toolkit is oriented to project/branch/URI management rather than ad-hoc SQL in all environments.

## Security

Do not paste connection strings, PATs, or API keys into issues, plans, or chat. Rotate anything that has been exposed.
