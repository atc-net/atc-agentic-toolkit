# Repository Instructions

This repository contains skill plugins and Claude Code mods under `plugins/`. Each subdirectory
in `plugins/` is an independent plugin (e.g., `plugins/azure`, `plugins/dotnet`).

## Plugin Structure

Each skill plugin contains:
- `plugin.json` - Plugin metadata
- `skills/` - Individual skill implementations, each with a `SKILL.md`
- `.mcp.json` - Optional MCP server configuration
- `agents/` - Optional agent definitions

Register a skill plugin in both `.claude-plugin/marketplace.json` and `.github/plugin/marketplace.json`,
and add a row, A–Z, to the Skill plugins table under the README's Available Plugins.

## Mods

A plugin named `atc-<name>` with no `skills/` is a Claude Code mod: TypeScript that changes
Claude Code itself while it runs (a band above the prompt, a pane, a slash command, a check on
tool calls). Mods require Claude Code 2.1.287 or newer and don't run in GitHub Copilot.

Each mod contains:
- `.claude-plugin/plugin.json` - Plugin metadata, with optional `userConfig` options and `types`
- `hooks/hooks.json` - `{ "modules": ["./register.tsx"] }`
- `hooks/register.ts` or `hooks/register.tsx` - Exports `register(on, options)`; use `.tsx` only when the file has JSX
- `hooks/*.test.ts(x)` - Tests, run with `claude plugin test plugins/<mod>`
- `types/index.d.ts` - Optional `$.state` contract
- `README.md` - Starts with the 2.1.287 requirement; `--plugin-dir` belongs only in its Develop section

Rules for mods:
- Register a mod only in `.claude-plugin/marketplace.json`, never in the Copilot marketplace.
- In the README, add the mod A–Z to the table in the 🧩 Mods section.
- Mods must work on Windows, macOS and Linux: use the `$` APIs (`$.fs`, `$.process.run` with an
  argv array), never a shell or bash-only tools, and handle both `/` and `\` in paths.
- A hook that guards something fails closed (`.catch(... => ({ deny }))`); one that only watches
  always passes the call on with `next(e)`.
- Check each mod with `claude plugin validate plugins/<mod>` and `claude plugin test plugins/<mod>`.

## Hooks

Claude Code specific hooks live in `.claude/plugins/hooks/`.
