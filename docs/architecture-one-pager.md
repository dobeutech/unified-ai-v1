# System design (one-pager)

## Channels

| Channel    | Role |
|-----------|------|
| `gateway` | This Next.js app calling Vercel AI Gateway (metered / BYOK). |
| `cursor`  | Cursor IDE via MCP + optional POST `/api/tool-call`. |
| `cli`     | Claude Code / other CLIs logging tool calls. |
| `chatgpt` | Manual export + ingest (no unified subscription API). |

## Data classification

- **Prod logs:** message previews, hashes, token counts, tool names — treat as sensitive; encrypt in transit; restrict DB access.
- **PII:** avoid storing secrets in `args_digest` / `result_digest`; prefer opaque refs.

## Retention

- Define TTL per table in your org policy; this repo does not auto-purge.
- For “training datasets,” use a separate opt-in store with redaction jobs.

## Session ID

- Browser: `localStorage` key `unified_ai_gateway_session` (UUID).
- External clients: generate UUID v4 and send on each request as `sessionId` or `session_id`.

## Pinecone namespaces

- `summaries` (default): assistant summary vectors per `trace_id`.

## Composio

- Single tool plane for integrations; catalog mirrored in `composio_tools` after sync.
- Least privilege: enable only needed toolkits in Composio dashboard.
