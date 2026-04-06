# MLA long-form deliverable — scope (optional)

The original strategy request included a **&lt;25 page** overview in **MLA format** with a **Works Cited** page. That is a **writing and research** deliverable, not application code.

## When to schedule

- **After** Phase 0: canonical files are imported per [IMPORT_CHECKLIST.md](./IMPORT_CHECKLIST.md) so citations point at stable repo paths.

## Suggested outline (for a human author or doc agent)

1. Introduction — problem: fragmented AI tools and memory.
2. Hybrid metering thesis — what is technically enforceable vs aspirational.
3. Architecture — gateway, Postgres, Composio, Pinecone (diagrams from your HTML exports once added).
4. Channel-by-channel continuity — cite [CLIENT_ADAPTERS.md](../CLIENT_ADAPTERS.md).
5. Governance — RLS, `ALLOWED_TOOL_PREFIXES`, PII.
6. Roadmap — [DASHBOARD_METRICS_ROADMAP.md](./DASHBOARD_METRICS_ROADMAP.md), Composio triggers validation.
7. Works Cited — MLA 9th: repo files, vendor docs (Vercel AI Gateway, Composio, Anthropic, OpenAI), dated access for web sources.

## Effort estimate

- **Internal memo:** 3–6 pages, 1–2 sessions.
- **Full &lt;25 pages:** multi-session; requires imported primary sources and stable URLs.

## Decision

If this artifact is **not** required, close the workstream after technical implementation. If it **is** required, assign owner + deadline outside this repo’s CI scope.
