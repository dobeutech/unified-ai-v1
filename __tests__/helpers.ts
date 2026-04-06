import { afterEach } from "vitest";

/**
 * Run a function with temporary env var overrides, then restore originals.
 * Works with both sync and async functions.
 */
export async function withEnv<T>(
  overrides: Record<string, string | undefined>,
  fn: () => T | Promise<T>,
): Promise<T> {
  const originals: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    originals[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }
  try {
    return await fn();
  } finally {
    for (const key of Object.keys(originals)) {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    }
  }
}

/**
 * Creates a mock Drizzle-like database object for testing.
 * Each method returns a chainable builder that ultimately resolves.
 */
export function createMockDb(overrides: {
  insertReturn?: unknown;
  selectReturn?: unknown[];
  updateReturn?: unknown;
} = {}) {
  const insertValues: unknown[] = [];

  const mockInsert = (table: unknown) => {
    const chain = {
      values: (vals: unknown) => {
        insertValues.push(vals);
        return {
          returning: (cols: unknown) =>
            Promise.resolve(overrides.insertReturn ?? [{ id: "mock-uuid" }]),
          onConflictDoUpdate: (opts: unknown) => Promise.resolve(),
        };
      },
    };
    return chain;
  };

  const mockSelect = () => ({
    from: (table: unknown) => ({
      where: (cond: unknown) => ({
        limit: (n: number) =>
          Promise.resolve(overrides.selectReturn ?? []),
      }),
    }),
  });

  const mockUpdate = (table: unknown) => ({
    set: (vals: unknown) => ({
      where: (cond: unknown) => Promise.resolve(overrides.updateReturn),
    }),
  });

  return {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    _insertedValues: insertValues,
  };
}
