import { eq } from "drizzle-orm";
import type { AppDatabase } from "./client";
import { sessions } from "./schema";

export async function getOrCreateSession(
  db: AppDatabase,
  externalId: string,
  channel: string,
) {
  const existingRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.externalId, externalId))
    .limit(1);
  const existing = existingRows[0];
  if (existing) {
    await db
      .update(sessions)
      .set({ updatedAt: new Date(), channel })
      .where(eq(sessions.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(sessions)
    .values({ externalId, channel })
    .returning({ id: sessions.id });
  return row.id;
}
