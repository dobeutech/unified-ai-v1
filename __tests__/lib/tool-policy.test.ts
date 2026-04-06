import { describe, it, expect } from "vitest";
import { isToolCallAllowed } from "@/lib/tool-policy";
import { withEnv } from "../helpers";

describe("isToolCallAllowed", () => {
  // --- No env var / empty ---

  it("allows any tool when ALLOWED_TOOL_PREFIXES is unset", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: undefined }, () => {
      expect(isToolCallAllowed("ANYTHING_GOES")).toBe(true);
    });
  });

  it("allows any tool when ALLOWED_TOOL_PREFIXES is empty string", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "" }, () => {
      expect(isToolCallAllowed("ANYTHING_GOES")).toBe(true);
    });
  });

  it("allows any tool when ALLOWED_TOOL_PREFIXES is only commas and spaces", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: " , , " }, () => {
      expect(isToolCallAllowed("ANYTHING_GOES")).toBe(true);
    });
  });

  // --- Prefix matching ---

  it("allows tool matching a prefix", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_" }, () => {
      expect(isToolCallAllowed("GITHUB_CREATE_PR")).toBe(true);
    });
  });

  it("blocks tool not matching any prefix", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_" }, () => {
      expect(isToolCallAllowed("SLACK_SEND_MESSAGE")).toBe(false);
    });
  });

  it("supports multiple comma-separated prefixes", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_,SLACK_" }, () => {
      expect(isToolCallAllowed("GITHUB_CREATE_PR")).toBe(true);
      expect(isToolCallAllowed("SLACK_SEND_MESSAGE")).toBe(true);
      expect(isToolCallAllowed("JIRA_CREATE_ISSUE")).toBe(false);
    });
  });

  // --- Case sensitivity ---

  it("is case-sensitive: lowercase prefix does not match uppercase tool", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "github_" }, () => {
      expect(isToolCallAllowed("GITHUB_CREATE_PR")).toBe(false);
    });
  });

  // --- Edge cases ---

  it("prefix is substring: any tool starting with prefix passes", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_" }, () => {
      expect(isToolCallAllowed("GITHUB_CREATE_PR_MALICIOUS")).toBe(true);
    });
  });

  it("blocks empty tool name when prefixes are set", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_" }, () => {
      expect(isToolCallAllowed("")).toBe(false);
    });
  });

  it("exact match: tool name equals the prefix", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: "GITHUB_" }, () => {
      expect(isToolCallAllowed("GITHUB_")).toBe(true);
    });
  });

  it("handles whitespace in prefix values", async () => {
    await withEnv({ ALLOWED_TOOL_PREFIXES: " GITHUB_ , SLACK_ " }, () => {
      expect(isToolCallAllowed("GITHUB_CREATE_PR")).toBe(true);
      expect(isToolCallAllowed("SLACK_SEND")).toBe(true);
    });
  });
});
