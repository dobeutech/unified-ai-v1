---
name: check-dashboard
description: Verify dashboard SQL queries return valid data by running them against Supabase via Composio
---

# Check Dashboard

Verify the `/dashboard` page SQL queries work against the live database. The dashboard uses raw SQL aggregations that Drizzle can't type-check at build time.

## Steps

1. **Search for Supabase tools** — Use `COMPOSIO_SEARCH_TOOLS` with use_case "run SQL query on Supabase"
2. **Run each dashboard query** via `SUPABASE_BETA_RUN_SQL_QUERY`:

### Totals (last 30 days)
```sql
SELECT count(*)::int as events,
       coalesce(sum(total_tokens), 0)::int as total_tokens
FROM usage_events
WHERE created_at >= now() - interval '30 days'
```

### By channel
```sql
SELECT channel, count(*)::int as events,
       coalesce(sum(total_tokens), 0)::int as total_tokens
FROM usage_events
WHERE created_at >= now() - interval '30 days'
GROUP BY channel
```

### By model
```sql
SELECT model_id, count(*)::int as events,
       coalesce(sum(total_tokens), 0)::int as total_tokens,
       coalesce(avg(latency_ms), 0)::int as avg_latency_ms
FROM usage_events
WHERE created_at >= now() - interval '30 days'
GROUP BY model_id
```

### Latency percentiles
```sql
SELECT percentile_cont(0.5) within group (order by latency_ms)::int as p50,
       percentile_cont(0.95) within group (order by latency_ms)::int as p95
FROM usage_events
WHERE created_at >= now() - interval '30 days'
```

### Estimated cost
```sql
SELECT coalesce(sum(estimated_cost_usd::numeric), 0)::text as total_cost_usd
FROM usage_events
WHERE created_at >= now() - interval '30 days'
```

3. **Report results** — Show each query result and flag any errors or empty results
4. **Compare** — If any query returns an error, cross-reference with `app/dashboard/page.tsx` to identify the mismatch
