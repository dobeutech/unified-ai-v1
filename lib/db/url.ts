/**
 * True when `DATABASE_URL` is a Postgres connection string (pooler or direct).
 * Rejects bare `https://…supabase.co` project URLs and other non-Postgres values.
 */
export function isValidPostgresConnectionString(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  return /^postgres(ql)?:\/\//i.test(t);
}
