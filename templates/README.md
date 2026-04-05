# Template / monorepo follow-up

This folder documents how to extract a **generator** later (`create-unified-ai`).

Suggested layout:

- `apps/web` — Next.js gateway (this repo as starting point)
- `packages/telemetry-client` — thin fetch wrapper for `/api/tool-call` + types
- `packages/db` — shared Drizzle schema (optional)

For now, shared helpers live under [`lib/`](../lib/); see [`lib/hash.ts`](../lib/hash.ts), [`lib/model-policy.ts`](../lib/model-policy.ts), and [`lib/pricing.ts`](../lib/pricing.ts).

Publishing to npm is optional; prefer a **GitHub template repository** + `pnpm bootstrap` for your other projects.
