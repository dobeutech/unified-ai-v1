import { query } from "@anthropic-ai/claude-agent-sdk";
import { getPrinciples } from "@/lib/principles";
import { createToolCallLoggerHook, createToolPolicyHook } from "@/lib/agent/hooks";
import type { TaskTag } from "@/lib/model-policy";

export interface AgentRunOptions {
  prompt: string;
  taskTag: TaskTag;
  sessionId: string;
  channel: string;
  cwd?: string;
  /** Max agent turns before stopping (default 25). */
  maxTurns?: number;
  /** Override system prompt entirely (skips principles injection). */
  systemPrompt?: string;
}

/**
 * Runs a Claude Agent SDK agent with:
 *  - Best-practices principles injected from the database into the system prompt
 *  - PostToolUse hook that logs every tool call to the `tool_calls` table
 *  - Built-in tools for file ops, search, and shell access
 *  - Optional Composio MCP if COMPOSIO_API_KEY is set
 */
export async function runAgent(opts: AgentRunOptions): Promise<string> {
  const principles = opts.systemPrompt
    ? ""
    : await getPrinciples(opts.taskTag);

  const systemPrompt = opts.systemPrompt
    ?? (principles
      ? `You are an expert software engineer. Follow these principles:\n\n${principles}`
      : "You are an expert software engineer.");

  const mcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};

  if (process.env.COMPOSIO_API_KEY) {
    mcpServers.composio = {
      command: "npx",
      args: ["composio-mcp-server"],
      env: { COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY },
    };
  }

  const loggerHook = createToolCallLoggerHook(opts.sessionId, opts.channel);
  const policyHook = createToolPolicyHook();

  let result = "";

  for await (const message of query({
    prompt: opts.prompt,
    options: {
      model: "claude-opus-4-6",
      cwd: opts.cwd ?? process.cwd(),
      systemPrompt,
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      ...(Object.keys(mcpServers).length > 0 ? { mcpServers } : {}),
      hooks: {
        PreToolUse: [
          {
            matcher: ".*",
            hooks: [policyHook],
          },
        ],
        PostToolUse: [
          {
            matcher: ".*",
            hooks: [loggerHook],
          },
        ],
      },
      maxTurns: opts.maxTurns ?? 25,
    },
  })) {
    if ("result" in message) {
      result = message.result as string;
    }
  }

  return result;
}
