# Vercel environment parity (ops checklist)

Use this to confirm production/preview/dev env **keys** match what the app expects. Do **not** paste secret values into tickets or chat.

## Expected keys (by surface)

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres (pooler URI) |
| `VERCEL_OIDC_TOKEN` | AI Gateway auth when running on Vercel / after `vc env pull` |
| `AI_GATEWAY_API_KEY` | AI Gateway when not using OIDC (e.g. some local setups) |
| `AI_GATEWAY_BASE_URL` | Optional override; omit to use SDK default |
| `ADMIN_SECRET` | `POST /api/admin/sync-composio` |
| `COMPOSIO_API_KEY` | Composio catalog sync |
| `PINECONE_*` | Optional summary embeddings |

## Composio-assisted audit

1. Run **`COMPOSIO_SEARCH_TOOLS`** with a query like: list Vercel project environment variables for project name `unified-ai-v1` (or your linked project).
2. Use the returned Vercel tools (e.g. list projects → filter envs) to compare **which keys exist** and **targets** (Production / Preview / Development), not values.
3. Align missing keys with [`.env.example`](../../.env.example).

Re-run this after changing Vercel env or rotating secrets.

## Audit run (automated attempt)

- **Composio:** `COMPOSIO_SEARCH_TOOLS` returned `VERCEL_FILTER_PROJECT_ENVS` as primary; Vercel toolkit connection **ACTIVE** for the linked account.
- **`VERCEL_GET_PROJECTS`** (team scope `team_8K43hpr1Nzs0UsjjUCGh8OBK`, filters for `unified-ai` / `github.com/dobeutech/unified-ai-v1`) returned **no projects** — the app may live under a different team, personal scope, or not be linked to Vercel yet.
- **`VERCEL_FILTER_PROJECT_ENVS`** with `idOrName: unified-ai-v1` returned **404** (project name not found in that scope).

**Next step:** In the Vercel dashboard, copy the exact **project name or id** (`prj_…`), then re-run `VERCEL_GET_PROJECT2` / `VERCEL_FILTER_PROJECT_ENVS` with that `idOrName` and the correct `teamId` / scope.

### Audit run (2026-04-06, session `real`)

- **`COMPOSIO_SEARCH_TOOLS`**: Vercel toolkit **ACTIVE**; primary tools `VERCEL_GET_PROJECTS`, `VERCEL_GET_PROJECT2`, `VERCEL_FILTER_PROJECT_ENVS`.
- **`VERCEL_GET_PROJECTS`**: With `teamId` `team_8K43hpr1Nzs0UsjjUCGh8OBK` (filters: `repoUrl` → `github.com/dobeutech/unified-ai-v1`, `search` → `unified`, and no team) returned **`projects: []`** every time — no projects visible to this token in listed scopes. **Cannot** run `VERCEL_FILTER_PROJECT_ENVS` without a valid `idOrName`.

**Likely causes:** project under another team, Hobby personal account not exposed the same way, or project not yet linked/imported to Vercel. Confirm in [Vercel Dashboard](https://vercel.com/dashboard) → project → Settings → General (project id) and ensure the Composio Vercel connection uses the same Vercel account/team.
