# Plugin Development Guide

How to create, test and register a plugin in the ATC Agentic Toolkit.

The toolkit has three kinds of plugin:

| Kind | Folder | Manifest | Runs in | Listed in |
|------|--------|----------|---------|-----------|
| Skill plugin | `plugins/<name>/` | `plugin.json` at the plugin root | Claude Code and GitHub Copilot | Both marketplace files |
| Hooks plugin | `.claude/plugins/hooks/` | `.claude-plugin/plugin.json` | Claude Code | `.claude-plugin/marketplace.json` only |
| Mod | `plugins/atc-<name>/` | `.claude-plugin/plugin.json` | Claude Code 2.1.287 or newer | `.claude-plugin/marketplace.json` only |

Most of this guide is about skill plugins. To build a mod, see the [Mod Creation Guide](mod-creation.md).

## Table of Contents

- [What is a Plugin?](#what-is-a-plugin)
- [Where the Manifest Lives](#where-the-manifest-lives)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Adding Commands](#adding-commands)
- [Hooks](#hooks)
- [User Configuration](#user-configuration)
- [Dependencies](#dependencies)
- [Testing Your Plugin](#testing-your-plugin)
- [Registering in Marketplace](#registering-in-marketplace)
- [Installing](#installing)
- [Distribution Strategies](#distribution-strategies)
- [Versioning](#versioning)
- [Best Practices](#best-practices)

---

## What is a Plugin?

A plugin is a folder of components that load together:

- **Skills**: `skills/<name>/SKILL.md`. Claude loads a skill when its description matches the task. You can also run it as `/<plugin>:<skill>`, for example `/dotnet:csharp-async`.
- **Agents**: `agents/<name>.md`. Subagents with their own context window and tools. Claude delegates to them, or you call one with `@agent-<plugin>:<name>`.
- **Commands**: `commands/<name>.md`. The older single-file format. Skills replace commands for new work.
- **MCP servers**: `.mcp.json` at the plugin root. They start when the plugin is enabled.
- **Hooks**: `hooks/hooks.json`. Commands that run on Claude Code events, or a mod's TypeScript module.
- **README.md**: what the plugin does and how to install it.

Every component is namespaced under the plugin name, so two plugins can each ship a skill called `review`.

---

## Where the Manifest Lives

Claude Code's standard location for a plugin manifest is `.claude-plugin/plugin.json`. The manifest is optional. Without one, Claude Code loads whatever it finds in the standard layout (`skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `.mcp.json`) and takes the plugin name from the marketplace entry.

This repository's skill plugins put `plugin.json` at the plugin root instead. That file is for GitHub Copilot. Copilot CLI looks for a manifest in this order: `.plugin/plugin.json`, `plugin.json`, `.github/plugin/plugin.json`, `.claude-plugin/plugin.json`.

Claude Code doesn't read a root `plugin.json`. To Claude Code, a skill plugin here has no manifest:

- It finds `skills/` and `.mcp.json` by their default locations.
- The plugin's entry in `.claude-plugin/marketplace.json` acts as the manifest.
- Its version is the git commit it was installed from.

You can see this for yourself. `claude --plugin-dir ./plugins/bicep plugin list` shows `bicep@inline` with `Version: unknown`.

So the rule is:

- **Skill plugins** keep `plugin.json` at the root, with fields Copilot reads: `name`, `version`, `description` and `skills`.
- **Anything that needs a Claude-only field** (`userConfig`, `dependencies`, `hooks`, `types`) uses `.claude-plugin/plugin.json`. A root `plugin.json` can't carry these, because Claude Code never reads it. Mods and the hooks plugin use `.claude-plugin/plugin.json` for this reason.

See [Plugin Structure Reference](../reference/plugin-structure.md) for every manifest field.

---

## Creating Your First Plugin

### Step 1: Create the folder

```text
plugins/my-plugin/
├── plugin.json
├── README.md
└── skills/
    └── my-skill/
        └── SKILL.md
```

Add `agents/` or `.mcp.json` only when the plugin needs them.

Name the folder in lowercase kebab-case. The folder name, the `name` in `plugin.json` and the marketplace entry `name` must all match. The `atc-` prefix is used for mods. `claude plugin validate` rejects names that start with `claude-` or `anthropic-`.

### Step 2: Write plugin.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "One sentence on what the plugin covers",
  "skills": "./skills/"
}
```

This is the same shape every skill plugin in `plugins/` uses.

### Step 3: Add skills

Each skill is a folder under `skills/` with a `SKILL.md`. The frontmatter needs at least `name` and `description`. The description decides when Claude loads the skill, so say what it does and when to use it.

```markdown
---
name: my-skill
description: Conventions for writing X. Use when creating or reviewing X files.
---

# My Skill

Instructions for Claude...
```

To scaffold a skill, run `/common:skill-creator`. For the full format, see the [Skill Creation Guide](skill-creation.md) and [Skill Anatomy Reference](../reference/skill-anatomy.md).

### Step 4: Add agents (optional)

A subagent is one Markdown file in `agents/`: frontmatter, then a free-form system prompt.

```markdown
---
name: security-reviewer
description: Reviews code changes for security issues. Use after edits to authentication or input handling.
tools: Read, Grep, Glob
model: inherit
---

You are a security reviewer. Read the changed files and report injection, authentication and secrets-handling risks.
```

- In a plugin, the subagent is named `<plugin>:<name>`, here `my-plugin:security-reviewer`.
- Test it with `@agent-my-plugin:security-reviewer <task>`, or with a plain request that matches its description.
- Plugin subagents ignore `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`. Put hooks and MCP servers at the plugin level instead.

No plugin in this repository ships an `agents/` folder yet. For every field, see the [Agent Anatomy Reference](../reference/agent-anatomy.md) and the [Agent Creation Guide](agent-creation.md).

### Step 5: Add MCP servers (optional)

Declare servers in `.mcp.json` at the plugin root. This is the `dotnet` plugin's file:

```json
{
  "mcpServers": {
    "nuget": {
      "type": "stdio",
      "command": "dnx",
      "args": ["NuGet.Mcp.Server", "--source", "https://api.nuget.org/v3/index.json", "--yes"]
    }
  }
}
```

In `/mcp` the server shows as `plugin:dotnet:nuget`. Its tools are named `mcp__plugin_dotnet_nuget__<tool>`. Use that form in permission rules and hook matchers. Use `${CLAUDE_PLUGIN_ROOT}` to point at a file inside the plugin.

### Step 6: Write the README

Keep it short: one paragraph on what the plugin does, an **Install** section, and one entry per skill, agent or MCP server. Copy the layout of an existing one, such as [plugins/bicep/README.md](../../plugins/bicep/README.md).

---

## Adding Commands

A command is a single Markdown file. `commands/deploy.md` in `my-plugin` runs as `/my-plugin:deploy`. Commands take the same frontmatter as skills.

Skills replace commands for new work. A skill also runs by name, and it can carry supporting files in its folder. Keep `commands/` for files you're moving over from `.claude/commands/`. See the [Command Creation Guide](command-creation.md).

---

## Hooks

A plugin's shell hooks go in `hooks/hooks.json`, under a top-level `"hooks"` key. The shape is the same as the `hooks` object in `settings.json`, so you can copy a settings hook across unchanged:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PLUGIN_ROOT}/scripts/format.js"]
          }
        ]
      }
    ]
  }
}
```

- Hooks register when the plugin loads. They don't wait for one of the plugin's skills to run.
- With `args`, the command runs without a shell (exec form), so paths need no quoting. Without `args`, it runs through a shell. In that case, wrap `${CLAUDE_PLUGIN_ROOT}` in double quotes.
- Hook processes get `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_PROJECT_DIR` and one `CLAUDE_PLUGIN_OPTION_<KEY>` per user configuration option.
- For events and handler types, see the [hooks reference](https://code.claude.com/docs/en/hooks).

In this repository, shell hooks live in the `hooks` plugin at `.claude/plugins/hooks/`. It plays sounds on `SessionStart`, `Stop` and `PermissionRequest`. It is listed only in the Claude marketplace.

A mod uses the same `hooks/hooks.json` file with a `modules` key, `{ "modules": ["./register.tsx"] }`, which loads a TypeScript module into Claude Code. See the [Mod Creation Guide](mod-creation.md) and [Mod Anatomy Reference](../reference/mod-anatomy.md).

---

## User Configuration

`userConfig` in `.claude-plugin/plugin.json` declares options that Claude Code asks for when the plugin is enabled. This is `atc-progress`:

```json
{
  "userConfig": {
    "autoOpen": {
      "type": "string",
      "title": "Open the agents pane",
      "description": "off: only /atc-progress opens it. agents: it also opens by itself, once per session, when the first subagent starts.",
      "default": "off",
      "options": ["off", "agents"]
    }
  }
}
```

- `type`, `title` and `description` are required. `type` is `string`, `number`, `boolean`, `directory` or `file`.
- Optional fields: `default`, `required`, `options` (a fixed list for a `string`; needs Claude Code 2.1.271+), `multiple`, `sensitive`, and `min` / `max` for numbers.
- An unknown key inside an option is an error, and the plugin doesn't load.
- Values are saved under `pluginConfigs` in the user's `settings.json`. A `sensitive` value goes to the system credential store instead. Users change values later in `/config`.
- A plugin reads a value as `${user_config.KEY}` in MCP and LSP server config, in exec-form hook `args`, and in skill and agent text. Hook processes get it as `CLAUDE_PLUGIN_OPTION_<KEY>`. A mod gets it in the `options` argument of `register`.

`userConfig` is a Claude Code field. A root `plugin.json` can't use it, so skill plugins in this repository have no options.

---

## Dependencies

`dependencies` lists plugins that must be enabled for this one to work:

```json
{
  "dependencies": ["common", "other-plugin@other-marketplace"]
}
```

Each entry is `"name"`, `"name@marketplace"`, or `{ "name": "...", "marketplace": "...", "version": "..." }`. A bare name resolves against the plugin's own marketplace. For a skill plugin, which has no Claude manifest, put the field on the plugin's entry in `.claude-plugin/marketplace.json`. No plugin in this repository uses dependencies yet. See [plugin dependencies](https://code.claude.com/docs/en/plugins/dependencies).

---

## Testing Your Plugin

### Load it for one session

Point `--plugin-dir` at the plugin folder:

```bash
claude --plugin-dir ./plugins/my-plugin
```

- The plugin loads as `my-plugin@inline` and its skills run as `/my-plugin:<skill>`.
- Use an absolute path to load it while you work in another project. Repeat the flag to load several plugins.
- After you edit a file, run `/reload-plugins`.
- To see what loaded, run `claude --plugin-dir ./plugins/my-plugin plugin details my-plugin`. It lists the skills, agents, hooks and MCP servers it found.

Point the flag at one plugin folder, not at `plugins/`. Given a folder of plugins, `--plugin-dir` loads only the children that have a `.claude-plugin/plugin.json`, so it skips skill plugins.

### Validate

| Command | What it checks |
|---------|----------------|
| `claude plugin validate plugins/my-plugin` | Skill, agent and command frontmatter, plus `.claude-plugin/plugin.json` and `hooks/hooks.json` when present |
| `claude plugin validate .` (from the repo root) | `.claude-plugin/marketplace.json` |
| `claude plugin validate .github/plugin/marketplace.json` | The Copilot marketplace file |
| `claude plugin test plugins/atc-my-mod` | Runs a mod's `*.test.ts` and `*.test.tsx` files |

Add `--strict` to turn warnings into failures in CI. A skill whose frontmatter doesn't parse still loads, but with every field dropped, so validate every plugin you change.

### Checklist

- [ ] Folder name, `plugin.json` `name` and both marketplace entries match
- [ ] Every `SKILL.md` has `name` and a `description` that says when to use it
- [ ] `claude plugin validate` passes for the plugin and both marketplace files
- [ ] Each skill runs from `--plugin-dir` and does what its description promises
- [ ] README lists every skill, agent and MCP server
- [ ] No secrets, and no paths or values that only work on your machine

### Install from your branch

`--plugin-dir` is the normal way to test. Use this route only to check the real install path, by adding the marketplace at your branch:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit#my-branch
/plugin install my-plugin@atc-agentic-toolkit
```

You can only register one marketplace per name. If you already have `atc-agentic-toolkit` added, you have to remove it first with `/plugin marketplace remove atc-agentic-toolkit`. Removing a marketplace uninstalls every plugin from it and deletes their data, options and secrets, so reinstall and reconfigure them afterwards.

---

## Registering in Marketplace

Add an entry to both marketplace files, with the same `name`, `source` and `description`:

- `.claude-plugin/marketplace.json` (Claude Code)
- `.github/plugin/marketplace.json` (GitHub Copilot)

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "One sentence on what the plugin covers"
}
```

Mods and the hooks plugin go only in `.claude-plugin/marketplace.json`. Copilot doesn't run them.

Then add a row, A–Z, to the matching table under **Available Plugins** in the [root README](../../README.md).

For every field, see the [Marketplace Config Reference](../reference/marketplace-config.md).

---

## Installing

In Claude Code 2.1.275 or newer, one command adds the marketplace and installs the plugin:

```text
/plugin install my-plugin --marketplace atc-net/atc-agentic-toolkit
```

In older versions, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install my-plugin@atc-agentic-toolkit
```

From a shell, use `claude plugin install my-plugin@atc-agentic-toolkit`.

In GitHub Copilot CLI:

```bash
copilot plugin marketplace add atc-net/atc-agentic-toolkit
copilot plugin install my-plugin@atc-agentic-toolkit
```

For VS Code, see the [root README](../../README.md).

---

## Distribution Strategies

### Public: this repository

Add the plugin here, register it in both marketplace files and open a pull request. Users install it from the `atc-agentic-toolkit` marketplace in Claude Code or Copilot.

### Private: your own marketplace

1. Fork or copy the repository for your organization.
2. Give the marketplace a new `name` in both marketplace files, because a user can't register two marketplaces with the same name.
3. Add your plugins and register them.
4. Team members run `/plugin marketplace add your-org/your-repo`. Git credentials that can clone the repository are enough for a private one.

To have a project offer the marketplace automatically, add it under `extraKnownMarketplaces` in the project's `.claude/settings.json`. See [Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces).

---

## Versioning

Use semantic versioning (`major.minor.patch`).

- **Skill plugin**: bump `version` in the root `plugin.json`, which Copilot reads. Claude Code ignores that field and versions the plugin by git commit, so each pushed commit is a new version.
- **Mod or hooks plugin**: bump `version` in `.claude-plugin/plugin.json` to release. Claude Code keeps users on the cached copy until this string changes, however many commits you push.
- **Marketplace**: both marketplace files have their own `version`. Keep them in step.

Updates aren't automatic. Auto-update is off by default for marketplaces that aren't Anthropic's, so users run `claude plugin update <name>@atc-agentic-toolkit`, or turn on auto-update in `/plugin` under **Marketplaces**.

Don't add `version` to a marketplace entry. When `plugin.json` also sets one, `plugin.json` wins and `claude plugin validate` warns.

---

## Best Practices

- Keep a plugin to one domain. Put unrelated skills in separate plugins.
- Check that an existing plugin doesn't already cover the topic.
- Make each skill description specific. A vague description loads the skill at the wrong time, or never.
- Keep `SKILL.md` lean and move detail into `references/`, which load only when needed.
- Never include secrets. Read credentials from environment variables or `userConfig` with `sensitive: true`.
- Make scripts and hooks work on Windows, macOS and Linux.
- Warn before destructive operations.

---

## Resources

- [Plugin Structure Reference](../reference/plugin-structure.md)
- [Marketplace Config Reference](../reference/marketplace-config.md)
- [Skill Creation Guide](skill-creation.md)
- [Agent Creation Guide](agent-creation.md)
- [Command Creation Guide](command-creation.md)
- [Mod Creation Guide](mod-creation.md)
- Official docs: [Create plugins](https://code.claude.com/docs/en/plugins) ·
  [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) ·
  [Plugin commands](https://code.claude.com/docs/en/plugins/cli-reference)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/atc-net/atc-agentic-toolkit/issues).
