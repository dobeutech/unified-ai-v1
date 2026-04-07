# API surface

Next.js App Router handlers under [`app/api/`](../../app/api/). All routes are **unauthenticated** unless noted; protect at the edge or add auth if you expose them publicly.

| Route | Method | Auth | Purpose | Primary `lib` / notes |
|-------|--------|------|---------|------------------------|
| `/api/chat` | POST | None | Streaming chat; `streamText` via AI Gateway | `gateway`, `gateway-options`, `model-policy`, `chat-logging`, `message-text`, optional `pinecone-summary` (when `ENABLE_MEMORY_CONTEXT=true`) |
| `/api/models` | GET | None | Lists gateway models intersected with `SUPPORTED_MODELS` | `gateway`, `constants` |
| `/api/tool-call` | POST | None | Inserts tool audit rows; requires DB | `db/client`, `db/sessions`, `db/schema`, `tool-policy` |
| `/api/memory/search` | POST | None | Pinecone summary search | `pinecone-summary` |
| `/api/admin/sync-composio` | POST | Bearer `ADMIN_SECRET` | Upserts Composio tool catalog into Postgres | `composio-sync`, `db/client` |

Graceful degradation: chat can work without DB/Pinecone depending on code paths; `tool-call` and `sync-composio` return **503** when `DATABASE_URL` is missing or invalid. `sync-composio` returns **503** if `ADMIN_SECRET` is unset and **401** if the bearer token does not match.
