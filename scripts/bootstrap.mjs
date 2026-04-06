#!/usr/bin/env node
/**
 * First-time setup checklist for unified-ai-v1.
 * Run: node scripts/bootstrap.mjs
 */
console.log(`
unified-ai-v1 — bootstrap checklist
===================================

1. Install:        pnpm i   (or npm install)
2. Link Vercel:    vc link
3. Dev (OIDC):     vc dev
4. Env:            copy .env.example → .env.local; set DATABASE_URL (postgres:// pooler). Gateway: vc dev / vc env pull (OIDC) or AI_GATEWAY_API_KEY; AI_GATEWAY_BASE_URL optional
5. DB schema:      pnpm db:push
6. Composio sync:  COMPOSIO_API_KEY=... pnpm sync:composio
   (or POST /api/admin/sync-composio with Authorization: Bearer $ADMIN_SECRET)
7. Optional vector: set PINECONE_* for summary upserts
8. Cursor MCP:     see docs/CLIENT_ADAPTERS.md

Repo: https://github.com/dobeutech/unified-ai-v1
`);
