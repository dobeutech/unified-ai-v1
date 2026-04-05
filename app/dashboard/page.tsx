import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { usageEvents } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getDb();

  if (!db) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Usage dashboard</h1>
        <p className="text-muted-foreground">
          Set <code className="text-sm bg-muted px-1 rounded">DATABASE_URL</code>{" "}
          to enable aggregation. Run{" "}
          <code className="text-sm bg-muted px-1 rounded">pnpm db:push</code> to
          apply the schema.
        </p>
        <Link href="/" className="text-primary underline mt-6 inline-block">
          Back to chat
        </Link>
      </div>
    );
  }

  const byChannel = await db
    .select({
      channel: usageEvents.channel,
      events: sql<number>`count(*)::int`,
      totalTokens: sql<number>`coalesce(sum(${usageEvents.totalTokens}), 0)::int`,
    })
    .from(usageEvents)
    .groupBy(usageEvents.channel);

  const totals = await db
    .select({
      events: sql<number>`count(*)::int`,
      totalTokens: sql<number>`coalesce(sum(${usageEvents.totalTokens}), 0)::int`,
    })
    .from(usageEvents);

  const t = totals[0];

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Usage dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Hybrid metering: gateway and external channels log into the same
        Postgres. Subscription-native hosts are separate rows when you post{" "}
        <code className="bg-muted px-1 rounded">channel</code>.
      </p>

      <section className="mb-10 rounded-xl border p-6">
        <h2 className="font-medium mb-4">Totals</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Events</dt>
            <dd className="text-xl font-mono">{t?.events ?? 0}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tokens (sum)</dt>
            <dd className="text-xl font-mono">{t?.totalTokens ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="font-medium mb-4">By channel</h2>
        {byChannel.length === 0 ? (
          <p className="text-muted-foreground text-sm">No usage rows yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Events</th>
                <th className="py-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {byChannel.map((row) => (
                <tr key={row.channel} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono">{row.channel}</td>
                  <td className="py-2 pr-4">{row.events}</td>
                  <td className="py-2">{row.totalTokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Link href="/" className="text-primary underline mt-8 inline-block">
        Back to chat
      </Link>
    </div>
  );
}
