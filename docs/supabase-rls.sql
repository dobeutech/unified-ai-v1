-- Optional Row Level Security for Supabase Postgres
-- Use only if you expose Postgres directly to clients (e.g. Supabase anon key).
-- For server-only access (Next.js API routes + DATABASE_URL), RLS is optional.

-- Example: service role bypasses RLS; anon/authenticated policies go here.

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE composio_tools ENABLE ROW LEVEL SECURITY;

-- Deny all by default for anon; grant via your auth model (e.g. session.external_id = auth.uid()::text).
CREATE POLICY "deny_anon_sessions" ON sessions FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_messages" ON messages FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_usage_events" ON usage_events FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_routing" ON model_routing_decisions FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_tool_calls" ON tool_calls FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_composio_tools" ON composio_tools FOR ALL TO anon USING (false);

-- Replace with real policies when you map `sessions.external_id` to Supabase user ids.
