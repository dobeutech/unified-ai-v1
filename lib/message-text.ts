import type { UIMessage } from "ai";

export function getLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = m.parts ?? [];
    const texts: string[] = [];
    for (const p of parts) {
      if (p.type === "text" && "text" in p && typeof p.text === "string") {
        texts.push(p.text);
      }
    }
    if (texts.length) return texts.join("\n");
  }
  return "";
}
