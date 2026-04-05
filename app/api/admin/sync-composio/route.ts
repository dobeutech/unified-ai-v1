import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { syncComposioToolsToDb } from "@/lib/composio-sync";

/**
 * Upsert Composio tool catalog into Postgres. Protect with ADMIN_SECRET header.
 */
export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 503 },
    );
  }

  try {
    const { upserted, pages } = await syncComposioToolsToDb(db);
    return NextResponse.json({ ok: true, upserted, pages });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
