# CLI MCP — Composio-only configuration

This guide documents how to configure each CLI AI tool to use **only Composio** as the MCP server, removing other MCP integrations to minimize context burn and maintain a single tool-call plane.

## Important: Backup first

Before removing any MCP entries, back up your configuration files.

### Windows (PowerShell)
```powershell
# Claude Code
Copy-Item "$HOME\.claude\settings.json" "$HOME\.claude\settings.json.bak"
Copy-Item "$HOME\.claude.json" "$HOME\.claude.json.bak"

# Cursor (if applicable)
Copy-Item "$HOME\.cursor\mcp.json" "$HOME\.cursor\mcp.json.bak"
```

### macOS / Linux (bash)
```bash
# Claude Code
cp ~/.claude/settings.json ~/.claude/settings.json.bak
cp ~/.claude.json ~/.claude.json.bak

# Cursor
cp ~/.cursor/mcp.json ~/.cursor/mcp.json.bak
```

## Claude Code

Configuration files: `~/.claude/settings.json`, `~/.claude.json`, project `.mcp.json`

### Before (multiple MCP servers)
```json
{
  "mcpServers": {
    "composio": { "command": "npx", "args": ["-y", "composio-core", "mcp"] },
    "some-other-mcp": { "command": "..." },
    "another-mcp": { "command": "..." }
  }
}
```

### After (Composio only)
```json
{
  "mcpServers": {
    "composio": { "command": "npx", "args": ["-y", "composio-core", "mcp"] }
  }
}
```

## Cursor

Configuration file: `.cursor/mcp.json` (project-level) or `~/.cursor/mcp.json` (global)

### Before
```json
{
  "mcpServers": {
    "composio": { "command": "npx", "args": ["-y", "composio-core", "mcp"] },
    "filesystem": { "command": "..." }
  }
}
```

### After
```json
{
  "mcpServers": {
    "composio": { "command": "npx", "args": ["-y", "composio-core", "mcp"] }
  }
}
```

## Gemini CLI

Configuration: `settings.json` or extensions registry per Gemini CLI docs.

Disable or uninstall non-Composio MCP extensions. Keep only the Composio MCP server definition.

## OpenAI Codex CLI

Configuration varies by OS. Locate the Codex config directory and apply the same pattern: keep only the Composio MCP entry.

## Verification

After updating configuration:
1. Restart the CLI tool
2. Run a test command that invokes Composio (e.g., search for tools)
3. Confirm no errors from removed MCP servers
4. Check that Composio tool discovery works

## Rollback

Restore from backup:
```bash
cp ~/.claude/settings.json.bak ~/.claude/settings.json
```
