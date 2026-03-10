# Repository Instructions

This repository contains skill plugins under `plugins/`. Each subdirectory
in `plugins/` is an independent plugin (e.g., `plugins/azure`, `plugins/dotnet`).

## Plugin Structure

Each plugin contains:
- `plugin.json` - Plugin metadata
- `skills/` - Individual skill implementations, each with a `SKILL.md`
- `.mcp.json` - Optional MCP server configuration
- `agents/` - Optional agent definitions

## Hooks

Claude Code specific hooks live in `.claude/plugins/hooks/`.
