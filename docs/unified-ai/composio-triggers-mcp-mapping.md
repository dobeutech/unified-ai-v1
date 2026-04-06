# Composio Triggers, Workbench, and MCP — mapping

This maps **product concepts** (from your strategy docs, once imported) to **what this repo and Composio MCP typically expose**.

## Composio MCP (this Cursor integration)

| Capability | How it shows up | Notes |
|------------|-----------------|-------|
| Discover tools | `COMPOSIO_SEARCH_TOOLS` | Returns slugs, plans, pitfalls, `session_id` for follow-up calls. |
| Execute tools | `COMPOSIO_MULTI_EXECUTE_TOOL` | Requires **ACTIVE** toolkit connection; schema-compliant args. |
| Large responses | `sync_response_to_workbench`, `COMPOSIO_REMOTE_WORKBENCH`, `COMPOSIO_REMOTE_BASH_TOOL` | Use when payloads are large or need scripting. |
| Schemas | `COMPOSIO_GET_TOOL_SCHEMAS` | When search returns `schemaRef` instead of inline `input_schema`. |
| Connections | `COMPOSIO_MANAGE_CONNECTIONS`, `COMPOSIO_WAIT_FOR_CONNECTIONS` | OAuth / linking apps before execute. |

## “Triggers” and scheduled automation

`COMPOSIO_SEARCH_TOOLS` queries for generic “webhooks / scheduled automations” often return **third-party** toolkit actions (e.g. various SaaS webhook APIs), not a single slug named “Composio Triggers.”

**Implication:** Product-level **Composio Triggers** (event-driven runs, schedules) are usually configured in the **Composio dashboard / Composio API**, not necessarily as a first-class MCP meta-tool. After you import your Drive doc, validate each claimed trigger type against current Composio docs.

**This repo’s angle:** durable **audit and memory** live in **Postgres** (`messages`, `usage_events`, `tool_calls`) and optional **Pinecone** summaries; Composio is the **execution and catalog** layer for integrated apps.

## Workbench

“Workbench” in Composio workflows maps to **remote execution** helpers (`REMOTE_WORKBENCH`, `REMOTE_BASH`) for processing bulk tool output—not a substitute for your own Postgres schema.

## Catalog sync (in-repo)

- `lib/composio-sync.ts`, `pnpm sync:composio`, `POST /api/admin/sync-composio` (Bearer `ADMIN_SECRET`) populate `composio_tools` for a **single source of truth** of tool metadata inside your database.

## Action item

When strategy files are in [`IMPORT_CHECKLIST.md`](./IMPORT_CHECKLIST.md), add a short “verified on &lt;date&gt;” row per trigger/workbench claim with a link to Composio’s current product documentation.
