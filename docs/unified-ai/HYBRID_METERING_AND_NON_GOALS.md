# Hybrid metering and non-goals

Use this document to **align stakeholders** on what this repository does and does not promise.

## Definitions

- **Gateway metering:** Inference invoked through **this app** via Vercel AI Gateway (or equivalent) with **API/OIDC/BYOK** billing as configured. Token counts and optional USD estimates land in `usage_events` ([schema](../../lib/db/schema.ts)).
- **Subscription-native usage:** Usage inside **ChatGPT**, **Claude** (web/app), **Cursor**, **Gemini CLI**, **Replit**, **Bolt**, etc., billed by those products. There is **no** standard API to debit “ChatGPT Plus” or “Claude Max” from arbitrary server-side code you deploy.

## Non-goals (explicit)

1. **Replacing API spend with consumer subscriptions** for programmatic routes through this Next.js app.
2. **Guaranteeing** that every tool call on every host goes through Composio without **client-side** hooks you maintain.
3. **Automatic** ingestion of all third-party chat history without export scripts or manual steps ([architecture one-pager](../architecture-one-pager.md) — `chatgpt` channel).
4. **Merged financial truth** across subscriptions + API in one ledger; at best: **API/gateway** in Postgres + **parallel** subscription signals (exports, estimates, vendor dashboards).

## In scope (hybrid model)

- **Strong:** Postgres audit trail for gateway chat, routing decisions, tool calls (when posted), Composio catalog sync.
- **Optional:** Pinecone vectors for assistant summaries (bounded text, namespace per [architecture one-pager](../architecture-one-pager.md)).
- **Policy:** Model routing by `taskTag` in [`lib/model-policy.ts`](../../lib/model-policy.ts); extend only with models on your allowlist ([`lib/constants.ts`](../../lib/constants.ts)).

## Communication snippet (for PMs / leadership)

> We operate a **hybrid control plane**: our app meters gateway usage and stores structured logs. Consumer subscriptions remain **separate commercial relationships**; we do not treat them as interchangeable API credits. Continuity across tools is achieved through **shared session IDs**, **optional tool-call logging**, and **documented adapters**—not through billing unification.
