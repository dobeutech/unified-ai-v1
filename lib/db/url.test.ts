import { describe, expect, it } from "vitest";
import { isValidPostgresConnectionString } from "./url";

describe("isValidPostgresConnectionString", () => {
  it("rejects empty and whitespace", () => {
    expect(isValidPostgresConnectionString("")).toBe(false);
    expect(isValidPostgresConnectionString("   ")).toBe(false);
  });

  it("accepts postgres:// and postgresql://", () => {
    expect(isValidPostgresConnectionString("postgres://u:p@host/db")).toBe(true);
    expect(isValidPostgresConnectionString("postgresql://u:p@host/db")).toBe(true);
    expect(isValidPostgresConnectionString("POSTGRESQL://x")).toBe(true);
  });

  it("rejects https project URLs", () => {
    expect(isValidPostgresConnectionString("https://foo.supabase.co")).toBe(false);
  });
});
