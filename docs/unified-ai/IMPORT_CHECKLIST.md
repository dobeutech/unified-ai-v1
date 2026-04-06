# Import checklist — strategy files from Google Drive

Copy or export these from your Drive folder into **this directory** (`docs/unified-ai/`) so the repo is the single citeable source. The agent cannot access `G:\My Drive\...` from the workspace.

## Files to add

| Source (your Drive) | Suggested repo filename | Format |
|---------------------|-------------------------|--------|
| Strategic AI Architecture | `Strategic-AI-Architecture.html` or `.md` | HTML export or paste to MD |
| Composio triggers and Workbench pipelines… | `composio-triggers-workbench-pipeline.md` | Export DOCX → Markdown |
| unified-ai-architecture-diagram | `unified-ai-architecture-diagram.html` | As-is |
| unified-ai-orchestration-report | `unified-ai-orchestration-report.md` | As-is |
| composio-triggers-workbench-pipeline | `composio-triggers-workbench-pipeline.md` | Dedupe if same as above |
| chatgpt-composio-deep-research-report | `chatgpt-composio-deep-research-report.md` | As-is |
| composio-deep-research-report | `composio-deep-research-report.md` | As-is |
| Unified AI Gateway and Memory Architecture | `unified-ai-gateway-memory-architecture.md` | GDoc → Download as Markdown |
| # Composio triggers and Workbench pipeline | `composio-triggers-workbench-pipeline-alt.md` | If distinct from other copy |
| Infinite unified AI (audio) | `infinite-unified-ai-transcript.md` | Optional: transcribe MP3 to MD |

## Before commit

1. **Redact** API keys, internal URLs, personal emails, and tokens.
2. Prefer **UTF-8** `.md` or `.html` over binary `.docx` in git.
3. Update cross-links in [CLIENT_ADAPTERS.md](../CLIENT_ADAPTERS.md) if filenames differ from the table above.

## Status

Placeholder docs shipped in-repo: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md), [HYBRID_METERING_AND_NON_GOALS.md](./HYBRID_METERING_AND_NON_GOALS.md), [composio-triggers-mcp-mapping.md](./composio-triggers-mcp-mapping.md), [DASHBOARD_METRICS_ROADMAP.md](./DASHBOARD_METRICS_ROADMAP.md), [MLA_DELIVERABLE_SCOPE.md](./MLA_DELIVERABLE_SCOPE.md). **Imported Drive files:** add as you copy them in.
