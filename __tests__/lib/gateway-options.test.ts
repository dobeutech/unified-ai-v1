import { describe, it, expect } from "vitest";
import { buildGatewayProviderOptions } from "@/lib/gateway-options";
import { withEnv } from "../helpers";

describe("buildGatewayProviderOptions", () => {
  // --- No env vars ---

  it("returns undefined when no gateway env vars are set", async () => {
    const result = await withEnv(
      {
        AI_GATEWAY_TAGS: undefined,
        AI_GATEWAY_USER: undefined,
        AI_GATEWAY_USER_FROM_SESSION: undefined,
      },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toBeUndefined();
  });

  // --- Tags ---

  it("parses comma-separated tags", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: "app:unified,channel:web", AI_GATEWAY_USER: undefined, AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toEqual({
      gateway: { tags: ["app:unified", "channel:web"] },
    });
  });

  it("trims whitespace and filters empty tags", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: "  tag1 , , tag2  ", AI_GATEWAY_USER: undefined, AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result?.gateway.tags).toEqual(["tag1", "tag2"]);
  });

  it("returns undefined for whitespace-only tags with no user", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: "   ", AI_GATEWAY_USER: undefined, AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toBeUndefined();
  });

  // --- User from session ---

  it("uses session ID as user when AI_GATEWAY_USER_FROM_SESSION=true", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: undefined, AI_GATEWAY_USER: undefined, AI_GATEWAY_USER_FROM_SESSION: "true" },
      () => buildGatewayProviderOptions("my-session-id"),
    );
    expect(result).toEqual({
      gateway: { user: "my-session-id" },
    });
  });

  it("does not use session when AI_GATEWAY_USER_FROM_SESSION is not 'true'", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: undefined, AI_GATEWAY_USER: undefined, AI_GATEWAY_USER_FROM_SESSION: "yes" },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toBeUndefined();
  });

  // --- Explicit user override ---

  it("uses AI_GATEWAY_USER when set", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: undefined, AI_GATEWAY_USER: "admin-user", AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toEqual({ gateway: { user: "admin-user" } });
  });

  it("AI_GATEWAY_USER takes precedence over session-based user", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: undefined, AI_GATEWAY_USER: "override", AI_GATEWAY_USER_FROM_SESSION: "true" },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result?.gateway.user).toBe("override");
  });

  it("whitespace-only AI_GATEWAY_USER becomes empty string, not unset (bug)", async () => {
    // BUG DOCUMENTATION: "   ".trim() → "" which is NOT nullish,
    // so ?? does not kick in. The gateway receives user: "" instead of no user.
    const result = await withEnv(
      { AI_GATEWAY_TAGS: undefined, AI_GATEWAY_USER: "   ", AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toEqual({ gateway: { user: "" } });
  });

  // --- Combined tags + user ---

  it("returns both tags and user when both are set", async () => {
    const result = await withEnv(
      { AI_GATEWAY_TAGS: "t1,t2", AI_GATEWAY_USER: "me", AI_GATEWAY_USER_FROM_SESSION: undefined },
      () => buildGatewayProviderOptions("session-123"),
    );
    expect(result).toEqual({
      gateway: { tags: ["t1", "t2"], user: "me" },
    });
  });
});
