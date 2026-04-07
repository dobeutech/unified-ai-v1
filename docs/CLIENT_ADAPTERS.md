# Client adapters — channel matrix

How each **surface** relates to this app’s **telemetry** (`usage_events`, `messages`, `tool_calls`) and **Composio**.

## Relationship to local Claude Code / Codex

This Next.js app does **not** replace your editor or terminal tools. **Claude Code**, **Codex**, and similar CLIs remain where you edit code and where vendor billing rules apply. This repository is the **unified chat + gateway metering + Postgres audit** surface: browser chat hits `POST /api/chat`; optional `curl` or helpers can `POST /api/tool-call` so tool executions land in the same database with a shared `session_id` when you want correlation. For running the stack as-is versus copying routes into another repo, see [ADOPTION_PORTING.md](./ADOPTION_PORTING.md).

## Summary matrix

| Channel / surface | Chat / inference logged by this app? | Tool calls → Composio? | Tool audit → `POST /api/tool-call`? | Typical `channel` string |
| ----------------- | ------------------------------------ | ---------------------- | ------------------------------------ | ------------------------ |
| **This Next.js UI** (`/api/chat`) | Yes — gateway stream + `onFinish` | Only if you add tools to the chat route (not default) | N/A for gateway-only chat | `gateway` (default) |
| **Cursor** | No — unless you proxy chat through this app | Yes — Composio MCP in Cursor | **Optional** — hook or script posts Composio/native tool names | `cursor` |
| **Claude Code (CLI)** | No — Anthropic bills per their product rules | Yes — if MCP/Composio wired in that environment | **Recommended** — `curl` with `channel: "cli"` | `cli` |
| **Gemini CLI** | No | Via Gemini MCP/extensions you enable | **Optional** — same pattern as Cursor if you add a hook | `cli` or `gemini-cli` |
| **ChatGPT (web/plus)** | No stable API for custom gateway debit | Only inside ChatGPT’s own connectors | **Manual** — export → ingest script | `chatgpt` (after ingest) |
| **Bolt / Replit** | No — host-specific | If you configure Composio there | **Optional** — HTTP to your deployed `/api/tool-call` | `bolt`, `replit`, etc. |

**Legend**

- **Logged by this app:** rows appear in Postgres when traffic hits [`app/api/chat/route.ts`](../app/api/chat/route.ts) or you run an ingest job that writes `messages` / `usage_events`.
- **Composio:** tool discovery/execution through Composio’s product; catalog mirrored via [`pnpm sync:composio`](../package.json) / `POST /api/admin/sync-composio`.
- **`POST /api/tool-call`:** see [`app/api/tool-call/route.ts`](../app/api/tool-call/route.ts); governed by `ALLOWED_TOOL_PREFIXES` in [`.env.example`](../.env.example).

---

## Cursor

1. **Composio MCP** — Add your Composio MCP server in Cursor settings (same as Claude Code / other hosts). Use `COMPOSIO_SEARCH_TOOLS` workflow before executing tools.
2. **Memory / logging** — POST tool executions to this app’s `/api/tool-call` with JSON:
   ```json
   {
     "trace_id": "uuid",
     "session_id": "same uuid as your editor session",
     "channel": "cursor",
     "tool_name": "GITHUB_CREATE_ISSUE",
     "args_ref": "optional-uri-or-blob-id",
     "result_ref": "optional-uri-or-blob-id"
   }
   ```
3. **Optional** — Custom MCP that calls your deployed `/api/*` routes for retrieval (not included in-repo).

## Claude Code (terminal)

- Anthropic bills **API vs subscription** based on product rules; set `ANTHROPIC_API_KEY` only when you intend API metering.
- Log Composio (or other) tool calls with `curl` to `/api/tool-call` using `channel: "cli"`.
- To correlate with gateway chat, reuse the same `session_id` string in the browser and CLI.

## Gemini CLI

- Configure Composio or other MCP per [Gemini CLI extensions](https://geminicli.com/extensions/); this app does not auto-capture Gemini usage.
- For a unified audit trail, POST selected tool calls to `/api/tool-call` with a dedicated channel (e.g. `gemini-cli`) and the same `session_id` convention as other CLIs.

## ChatGPT / Bolt / Replit

- No stable programmatic “subscription pool” for custom gateways. Continuity = **shared Postgres memory** + **exported transcripts** ingested via a small script you maintain, or manual paste into your app.

## Web IDE export / ingest

1. Export conversation (Markdown/JSON) from the host.
2. Strip secrets; map to `messages` rows or a staging table.
3. Embed summaries to Pinecone using the same `trace_id` / `session` scheme if needed.

## Environment summary

See [.env.example](../.env.example) for `DATABASE_URL`, `COMPOSIO_API_KEY`, `PINECONE_*`, `ADMIN_SECRET`, `ALLOWED_TOOL_PREFIXES`.

## Supabase RLS

If exposing Postgres to browsers, apply [supabase-rls.sql](./supabase-rls.sql) and replace deny-all policies with your auth mapping.

## Further reading

- [docs/architecture-one-pager.md](./architecture-one-pager.md) — channels, retention, session IDs.
- [docs/unified-ai/DASHBOARD_METRICS_ROADMAP.md](./unified-ai/DASHBOARD_METRICS_ROADMAP.md) — how channels appear on `/dashboard`.
