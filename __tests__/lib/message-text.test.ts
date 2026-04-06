import { describe, it, expect } from "vitest";
import { getLastUserText } from "@/lib/message-text";
import type { UIMessage } from "ai";

function makeMessage(
  role: "user" | "assistant" | "system",
  texts: string[],
): UIMessage {
  return {
    id: `msg-${Math.random()}`,
    role,
    parts: texts.map((text) => ({ type: "text" as const, text })),
  } as UIMessage;
}

function makeMessageNoParts(role: "user" | "assistant" | "system"): UIMessage {
  return {
    id: `msg-${Math.random()}`,
    role,
  } as UIMessage;
}

describe("getLastUserText", () => {
  // --- Normal cases ---

  it("returns text from the last user message", () => {
    const messages = [
      makeMessage("user", ["hello"]),
      makeMessage("assistant", ["hi"]),
      makeMessage("user", ["goodbye"]),
    ];
    expect(getLastUserText(messages)).toBe("goodbye");
  });

  it("returns text from the only user message", () => {
    const messages = [makeMessage("user", ["hello"])];
    expect(getLastUserText(messages)).toBe("hello");
  });

  // --- Multi-part messages ---

  it("joins multiple text parts with newline", () => {
    const messages = [makeMessage("user", ["part1", "part2"])];
    expect(getLastUserText(messages)).toBe("part1\npart2");
  });

  // --- No user messages ---

  it("returns empty string when no user messages exist", () => {
    const messages = [makeMessage("assistant", ["hi"])];
    expect(getLastUserText(messages)).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(getLastUserText([])).toBe("");
  });

  // --- Missing parts ---

  it("skips user message with no parts and returns empty string", () => {
    const messages = [makeMessageNoParts("user")];
    expect(getLastUserText(messages)).toBe("");
  });

  it("skips user with no parts but finds earlier user with parts", () => {
    const messages = [
      makeMessage("user", ["hello"]),
      makeMessageNoParts("user"),
    ];
    // The last user message has no parts (empty texts), so it skips to the earlier one
    expect(getLastUserText(messages)).toBe("hello");
  });

  // --- Parts with missing text property ---

  it("handles parts with type text but no text property", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text" } as unknown as UIMessage["parts"][number]],
      } as UIMessage,
    ];
    // p.type === "text" but no "text" in p or typeof p.text !== "string"
    // So texts array is empty, this user message is skipped
    expect(getLastUserText(messages)).toBe("");
  });

  // --- Non-text parts mixed with text parts ---

  it("ignores non-text parts", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [
          { type: "image", image: "data:..." } as unknown as UIMessage["parts"][number],
          { type: "text", text: "actual text" } as unknown as UIMessage["parts"][number],
        ],
      } as UIMessage,
    ];
    expect(getLastUserText(messages)).toBe("actual text");
  });

  // --- Return type consistency ---

  it("always returns a string, never null or undefined", () => {
    const result = getLastUserText([]);
    expect(typeof result).toBe("string");
  });
});
