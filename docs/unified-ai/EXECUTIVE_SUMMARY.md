# Executive summary — unified AI control plane

**Audience:** internal / engineering  
**Stack:** Next.js app, Vercel AI Gateway, Postgres (Neon/Supabase), optional Pinecone, Composio (catalog + MCP tools).

## Goals

- **Single metered path** for chat in this app: model selection by `taskTag`, token usage logged to Postgres, optional cost estimates and Pinecone summaries.
- **One tool-integration plane** via Composio (catalog mirrored in `composio_tools`; executions via Composio MCP where configured).
- **Cross-client continuity** where **you** control the client: same `session_id`, `POST /api/tool-call` for tool audit rows, shared DB for messages/usage.

## Non-goals (hybrid reality)

- **Consumer subscriptions** (ChatGPT Plus, Claude Max, Cursor Pro, Replit, Bolt, etc.) are **not** a unified programmatic billing pool for this **custom** gateway. They apply to each vendor’s product under their terms; ChatGPT Plus ≠ OpenAI API quota.
- **Mandatory** routing of every native IDE/chat tool through Composio is **not** enforceable without vendor APIs; use adapters and voluntary logging.

## What “success” looks like

- Production `DATABASE_URL`, working `/api/chat` + `/dashboard`, Composio sync populated, `ALLOWED_TOOL_PREFIXES` aligned with governance.
- External channels appear as **distinct** `channel` values in `usage_events` and tool logs when adapters post data.
- Strategy PDFs/Markdown from Drive live under `docs/unified-ai/` for review and citations.

See [HYBRID_METERING_AND_NON_GOALS.md](./HYBRID_METERING_AND_NON_GOALS.md) for the full non-goals list and stakeholder alignment text.
