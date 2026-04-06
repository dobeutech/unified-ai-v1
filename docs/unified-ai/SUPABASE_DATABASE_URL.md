# Supabase `DATABASE_URL` for this app

The Neon serverless driver expects a **Postgres** connection string. It must start with `postgres://` or `postgresql://`.

## Wrong

- The project URL from the Supabase dashboard (`https://xxxx.supabase.co`) is **not** a database connection string.
- Pasting only the host or an `https://` URL will fail `npm run db:push`, hang, or produce `[db] DATABASE_URL must start with postgres://` at runtime.

## Right (Transaction pooler)

1. Supabase project → **Project Settings** → **Database**.
2. Under **Connection string**, choose **Transaction pooler** (or **Session mode** if your plan requires it).
3. Copy the URI that looks like:

   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

4. Put it in `.env.local` as `DATABASE_URL=...` (no quotes unless your password has special characters that require URL-encoding).

Then run:

```bash
pnpm db:push
pnpm sync:composio
```

Confirm tables including `sync_runs` and `composio_tools` exist (Drizzle Studio: `pnpm db:studio`).
