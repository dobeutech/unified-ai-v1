# Unified AI architecture — source documents

Place your canonical strategy files here so the repo stays the **single place** for citations, reviews, and diffs.

## How to sync from Google Drive

1. On your machine, copy (or export) these files into this folder:
   - `Strategic AI Architecture.html`
   - `Composio triggers and Workbench pipelines for durable agent memory.docx` (export to `.md` or `.pdf` if you prefer git-friendly text)
   - `unified-ai-architecture-diagram.html`
   - `unified-ai-orchestration-report.md`
   - `composio-triggers-workbench-pipeline.md`
   - `chatgpt-composio-deep-research-report.md`
   - `Unified AI Gateway and Memory Architecture` (Google Doc → **File → Download → Markdown** or PDF)
   - `# Composio triggers and Workbench pipeline.md`

2. **Do not commit secrets.** If any export contains API keys or internal URLs, redact before committing.

3. After files are present, update in-text references in [`docs/CLIENT_ADAPTERS.md`](../CLIENT_ADAPTERS.md) or project docs to point at the exact filenames you added.

## Citation template (MLA-style)

> Author or Org. “Title of Document.” *Unified-ai* project folder, `docs/unified-ai/<filename>`, Date of file revision. Local file.

## Relation to this codebase

Runtime behavior (gateway chat logging, Composio tool catalog sync, Postgres + optional Pinecone) is implemented in the app root. This directory is for **human-authored architecture reports** only.
