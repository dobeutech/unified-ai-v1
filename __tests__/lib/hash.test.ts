import { describe, it, expect } from "vitest";
import { sha256Hex } from "@/lib/hash";

describe("sha256Hex", () => {
  it("produces a deterministic 64-char hex string", () => {
    const hash = sha256Hex("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex("hello")).toBe(hash);
  });

  it("matches known SHA-256 for 'hello'", () => {
    expect(sha256Hex("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("produces valid hash for empty string", () => {
    const hash = sha256Hex("");
    expect(hash).toHaveLength(64);
    expect(hash).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("handles unicode content", () => {
    const hash = sha256Hex("Hello, 世界! 🌍");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("different inputs produce different hashes", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });
});
