import { afterEach, describe, expect, it } from "vitest";
import { isToolCallAllowed } from "./tool-policy";

const original = process.env.ALLOWED_TOOL_PREFIXES;

afterEach(() => {
  if (original === undefined) {
    delete process.env.ALLOWED_TOOL_PREFIXES;
  } else {
    process.env.ALLOWED_TOOL_PREFIXES = original;
  }
});

describe("isToolCallAllowed", () => {
  it("allows any tool when env is unset", () => {
    delete process.env.ALLOWED_TOOL_PREFIXES;
    expect(isToolCallAllowed("ANYTHING")).toBe(true);
  });

  it("allows any tool when env is whitespace only", () => {
    process.env.ALLOWED_TOOL_PREFIXES = "  \t  ";
    expect(isToolCallAllowed("FOO")).toBe(true);
  });

  it("allows when tool name starts with one of the comma-separated prefixes", () => {
    process.env.ALLOWED_TOOL_PREFIXES = "GITHUB_, SLACK_";
    expect(isToolCallAllowed("GITHUB_CREATE_ISSUE")).toBe(true);
    expect(isToolCallAllowed("SLACK_POST")).toBe(true);
    expect(isToolCallAllowed("NOTION_CREATE")).toBe(false);
  });

  it("treats empty segments as no restriction (allow all)", () => {
    process.env.ALLOWED_TOOL_PREFIXES = ",,  ,";
    expect(isToolCallAllowed("X")).toBe(true);
  });
});
