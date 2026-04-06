import { describe, it, expect } from "vitest";
import { isValidPostgresConnectionString } from "@/lib/db/url";

describe("isValidPostgresConnectionString", () => {
  // --- Valid URLs ---

  it("accepts postgres:// URL", () => {
    expect(isValidPostgresConnectionString("postgres://user:pass@host/db")).toBe(true);
  });

  it("accepts postgresql:// URL", () => {
    expect(isValidPostgresConnectionString("postgresql://user:pass@host/db")).toBe(true);
  });

  it("accepts POSTGRES:// (case-insensitive)", () => {
    expect(isValidPostgresConnectionString("POSTGRES://user:pass@host/db")).toBe(true);
  });

  it("accepts POSTGRESQL:// (case-insensitive)", () => {
    expect(isValidPostgresConnectionString("POSTGRESQL://user:pass@host/db")).toBe(true);
  });

  it("accepts URL with query params", () => {
    expect(
      isValidPostgresConnectionString(
        "postgresql://user:pass@host/db?sslmode=require&pgbouncer=true",
      ),
    ).toBe(true);
  });

  it("accepts postgres:// with nothing after (prefix-only validation)", () => {
    expect(isValidPostgresConnectionString("postgres://")).toBe(true);
  });

  it("accepts URL with leading whitespace (trimmed)", () => {
    expect(isValidPostgresConnectionString("  postgres://user@host/db")).toBe(true);
  });

  // --- Invalid URLs ---

  it("rejects https:// Supabase project URL", () => {
    expect(isValidPostgresConnectionString("https://db.supabase.co")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPostgresConnectionString("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isValidPostgresConnectionString("   ")).toBe(false);
  });

  it("rejects mysql://", () => {
    expect(isValidPostgresConnectionString("mysql://user@host/db")).toBe(false);
  });

  it("rejects plain text", () => {
    expect(isValidPostgresConnectionString("not-a-url")).toBe(false);
  });

  it("rejects URL where postgres is not the scheme", () => {
    expect(isValidPostgresConnectionString("http://postgres://host")).toBe(false);
  });
});
