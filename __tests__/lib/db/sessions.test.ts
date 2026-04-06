import { describe, it, expect, vi } from "vitest";

// We test getOrCreateSession by mocking the db object it receives.
// The actual Drizzle query builder is complex, so we mock the chain.

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

describe("getOrCreateSession", () => {
  function createSessionMockDb(existingSession: { id: string } | null) {
    const selectReturn = existingSession ? [existingSession] : [];
    const updatedSets: unknown[] = [];
    const insertedValues: unknown[] = [];

    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(selectReturn),
          }),
        }),
      }),
      update: () => ({
        set: (vals: unknown) => {
          updatedSets.push(vals);
          return {
            where: () => Promise.resolve(),
          };
        },
      }),
      insert: () => ({
        values: (vals: unknown) => {
          insertedValues.push(vals);
          return {
            returning: () =>
              Promise.resolve([{ id: "new-session-uuid" }]),
          };
        },
      }),
      _updatedSets: updatedSets,
      _insertedValues: insertedValues,
    };
    return db;
  }

  it("returns existing session id and updates timestamp", async () => {
    const db = createSessionMockDb({ id: "existing-uuid" });
    const { getOrCreateSession } = await import("@/lib/db/sessions");

    const result = await getOrCreateSession(db as never, "ext-id", "gateway");
    expect(result).toBe("existing-uuid");
    expect(db._updatedSets).toHaveLength(1);
    expect(db._insertedValues).toHaveLength(0);
  });

  it("creates new session when none exists", async () => {
    const db = createSessionMockDb(null);
    const { getOrCreateSession } = await import("@/lib/db/sessions");

    const result = await getOrCreateSession(db as never, "ext-id", "cli");
    expect(result).toBe("new-session-uuid");
    expect(db._insertedValues).toHaveLength(1);
    expect(db._updatedSets).toHaveLength(0);
  });

  it("always updates channel on existing session (even if unchanged)", async () => {
    const db = createSessionMockDb({ id: "existing-uuid" });
    const { getOrCreateSession } = await import("@/lib/db/sessions");

    await getOrCreateSession(db as never, "ext-id", "gateway");
    const updateSet = db._updatedSets[0] as Record<string, unknown>;
    expect(updateSet).toHaveProperty("channel", "gateway");
    expect(updateSet).toHaveProperty("updatedAt");
  });
});
