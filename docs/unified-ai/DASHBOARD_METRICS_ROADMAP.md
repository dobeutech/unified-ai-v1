# Dashboard metrics roadmap

Current UI: [`app/dashboard/page.tsx`](../../app/dashboard/page.tsx) — aggregates `usage_events` by **channel** with **event count** and **sum(total_tokens)**.

## Schema fields available today (`usage_events`)

| Column | Use in dashboard |
|--------|------------------|
| `channel` | Already grouped — extend with filters (date range, model). |
| `model_id` | **Next:** breakdown table “by model” (tokens, events, avg latency). |
| `prompt_tokens` / `completion_tokens` | **Next:** stacked or split columns; aligns with [`lib/chat-logging.ts`](../../lib/chat-logging.ts) (`inputTokens` / `outputTokens`). |
| `total_tokens` | Shown as sum — keep as primary KPI. |
| `latency_ms` | **Next:** p50/p95 per channel or model (SQL `percentile_cont` or app-side). |
| `estimated_cost_usd` | **Next:** sum and “last 7 days” when [`lib/pricing.ts`](../../lib/pricing.ts) + env `COST_*_PER_M_TOKENS_USD` from [`.env.example`](../../.env.example) are set. |
| `created_at` | **Next:** time-series chart or “last N days” slice. |

## Related tables (future panels)

| Table | Suggested panel |
|-------|-----------------|
| `model_routing_decisions` | Count of overrides by `task_tag` vs `selected_model_id` (routing policy effectiveness). |
| `tool_calls` | Volume by `tool_name` prefix; flag `allowed = false` rate. |
| `composio_tools` | Catalog size, `synced_at` freshness. |
| `sessions` | Active sessions by `channel` (rough engagement). |

## Environment variables (cost estimates)

From [`.env.example`](../../.env.example):

- `COST_INPUT_PER_M_TOKENS_USD`
- `COST_OUTPUT_PER_M_TOKENS_USD`

Per-model overrides can be added in code if pricing varies by `model_id`.

## Implementation order (suggested)

1. Date filter default **last 30 days** on all queries (avoid unbounded table scans).
2. **By model** table + optional **estimated cost** totals.
3. **Latency** percentiles for gateway channel only (cleanest signal).
4. Optional: export CSV for finance / chargeback modeling.

## Non-goals for this dashboard

- Do not imply **subscription** usage from ChatGPT/Cursor is included unless you add a **separate** ingest pipeline and label it clearly (e.g. `channel: chatgpt_export`).
