import { afterEach, describe, expect, it } from "vitest";
import { buildGatewayProviderOptions } from "./gateway-options";

const keys = [
  "AI_GATEWAY_TAGS",
  "AI_GATEWAY_USER",
  "AI_GATEWAY_USER_FROM_SESSION",
] as const;
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of keys) {
    const v = saved[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
    delete saved[k];
  }
});

function stash(k: (typeof keys)[number]) {
  if (!(k in saved)) saved[k] = process.env[k];
}

describe("buildGatewayProviderOptions", () => {
  it("returns undefined when no gateway env is set", () => {
    for (const k of keys) {
      stash(k);
      delete process.env[k];
    }
    expect(buildGatewayProviderOptions("sess-1")).toBeUndefined();
  });

  it("parses comma-separated tags", () => {
    for (const k of keys) {
      stash(k);
      delete process.env[k];
    }
    process.env.AI_GATEWAY_TAGS = "a, b , ";
    expect(buildGatewayProviderOptions("s")).toEqual({
      gateway: { tags: ["a", "b"] },
    });
  });

  it("uses AI_GATEWAY_USER over session when both set", () => {
    for (const k of keys) {
      stash(k);
      delete process.env[k];
    }
    process.env.AI_GATEWAY_USER = "fixed";
    process.env.AI_GATEWAY_USER_FROM_SESSION = "true";
    expect(buildGatewayProviderOptions("sess")).toEqual({
      gateway: { user: "fixed" },
    });
  });

  it("uses session id as user when only FROM_SESSION is true", () => {
    for (const k of keys) {
      stash(k);
      delete process.env[k];
    }
    process.env.AI_GATEWAY_USER_FROM_SESSION = "true";
    expect(buildGatewayProviderOptions("abc")).toEqual({
      gateway: { user: "abc" },
    });
  });
});
