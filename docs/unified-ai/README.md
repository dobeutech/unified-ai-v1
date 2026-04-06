# Unified AI architecture — documentation

## In-repo artifacts (review & implementation)

| Document | Purpose |
|----------|---------|
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | One-page goals, hybrid scope, success criteria |
| [HYBRID_METERING_AND_NON_GOALS.md](./HYBRID_METERING_AND_NON_GOALS.md) | Stakeholder alignment; what subscriptions cannot do for this app |
| [IMPORT_CHECKLIST.md](./IMPORT_CHECKLIST.md) | Copy list from Google Drive → this folder (agent cannot access `G:\`) |
| [composio-triggers-mcp-mapping.md](./composio-triggers-mcp-mapping.md) | Triggers / Workbench vs MCP capabilities |
| [DASHBOARD_METRICS_ROADMAP.md](./DASHBOARD_METRICS_ROADMAP.md) | Next metrics from `usage_events` and related tables |
| [MLA_DELIVERABLE_SCOPE.md](./MLA_DELIVERABLE_SCOPE.md) | Optional long-form MLA doc — scope and outline |
| [STACK_VERIFICATION.md](./STACK_VERIFICATION.md) | Commands to verify DB, Composio sync, build (CI / local) |
| [LINEAR_REVIEW_ISSUE.md](./LINEAR_REVIEW_ISSUE.md) | Link to parent Linear issue (DTS-1311) for plan review |

## Strategy files from Drive

Place exported HTML/Markdown here so git holds the **canonical** copies. See [IMPORT_CHECKLIST.md](./IMPORT_CHECKLIST.md).

## Relation to runtime code

Gateway chat, Composio sync, Postgres, optional Pinecone, and APIs live at the **repo root**. This directory is **human-authored** architecture and planning text.

## Citation template (MLA-style)

> Author or Org. “Title of Document.” *Unified-ai* project folder, `docs/unified-ai/<filename>`, Date of file revision. Local file.
