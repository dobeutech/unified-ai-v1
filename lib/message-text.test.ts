import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { getLastUserText } from "./message-text";

function userMessage(parts: UIMessage["parts"]): UIMessage {
  return { id: "u1", role: "user", parts: parts ?? [] };
}

describe("getLastUserText", () => {
  it("returns empty string for empty messages", () => {
    expect(getLastUserText([])).toBe("");
  });

  it("skips assistant and uses last user with text parts", () => {
    const messages: UIMessage[] = [
      userMessage([{ type: "text", text: "first" }]),
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "reply" }] },
      userMessage([{ type: "text", text: "line1" }, { type: "text", text: "line2" }]),
    ];
    expect(getLastUserText(messages)).toBe("line1\nline2");
  });

  it("ignores user messages with no text parts", () => {
    const messages: UIMessage[] = [
      userMessage([]),
      userMessage([{ type: "text", text: "visible" }]),
    ];
    expect(getLastUserText(messages)).toBe("visible");
  });

  it("returns empty when no user text exists", () => {
    const messages: UIMessage[] = [
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "only assistant" }] },
    ];
    expect(getLastUserText(messages)).toBe("");
  });
});
