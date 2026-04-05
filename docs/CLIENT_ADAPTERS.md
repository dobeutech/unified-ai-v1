# Client adapters (Cursor, Claude Code, web IDEs)

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
