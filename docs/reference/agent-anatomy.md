# Agent Anatomy Reference

Field-by-field reference for Claude Code subagent files. For how to design, write and test one, see
the [Agent Creation Guide](../guides/agent-creation.md).

Source of truth: the official [subagents docs](https://code.claude.com/docs/en/sub-agents) and
[plugin components: agents](https://code.claude.com/docs/en/plugins/components#agents). Version
notes below are the minimum Claude Code version the docs give for a field.

## Table of Contents

- [File Format](#file-format)
- [Locations and Precedence](#locations-and-precedence)
- [Names and Namespacing](#names-and-namespacing)
- [Frontmatter Fields](#frontmatter-fields)
- [Model Resolution](#model-resolution)
- [Tool Rules](#tool-rules)
- [Permission Mode Rules](#permission-mode-rules)
- [Memory Scopes](#memory-scopes)
- [Frontmatter Hooks](#frontmatter-hooks)
- [Plugin Subagents](#plugin-subagents)
- [Files Claude Code Skips](#files-claude-code-skips)
- [Related CLI Flags, Settings and Environment Variables](#related-cli-flags-settings-and-environment-variables)
- [Validation Checklist](#validation-checklist)
- [Resources](#resources)

---

## File Format

A subagent is one Markdown file:

1. **YAML frontmatter** between `---` lines. The opening `---` must be the first line of the file.
2. **Body**: the subagent's system prompt. The subagent receives this prompt plus basic environment
   details, not the Claude Code system prompt.

```markdown
---
name: test-runner
description: Runs the test suite and reports failures with likely causes. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: haiku
maxTurns: 20
color: green
---

You run tests and report results. You never edit files.

1. Find the test command (package.json, *.sln, Makefile).
2. Run it.
3. For each failure, report the test name, the error and the most likely cause in one line.
```

---

## Locations and Precedence

| Priority | Location | Scope |
|---|---|---|
| 1 (highest) | `.claude/agents/` in the managed settings directory | Organization (set by admins) |
| 2 | `--agents` CLI flag (JSON) | Current session only, not saved |
| 3 | `.claude/agents/` | Current project |
| 4 | `~/.claude/agents/` | All your projects |
| 5 (lowest) | A plugin's `agents/` folder | Projects where the plugin is enabled |

When two subagents have the same name, the higher-priority one wins. Folders are scanned
recursively, so subfolders are allowed.

Claude Code watches `.claude/agents/` and `~/.claude/agents/` and picks up added or edited files
within seconds. A restart is still needed when the folder didn't exist at session start, for
`.claude/agents/` inside a directory added with `--add-dir` or `/add-dir`, and in sessions started
with `--disable-slash-commands`.

In this repository, plugin subagents go in `plugins/<plugin>/agents/<name>.md`. No plugin here ships
one yet.

---

## Names and Namespacing

- **Identity comes from `name`**, not the file name. The file name doesn't have to match.
- **Rules**: at most 256 characters; must not start with `-`; must not contain `:` (reserved for
  plugin-scoped names). Lowercase with hyphens, such as `code-reviewer`, is the convention.
- **Plugin subagents** are named `<plugin>:<name>`. Subfolders add segments:
  `agents/review/security.md` in plugin `my-plugin` loads as `my-plugin:review:security`.
  A frontmatter `name` replaces only the file-name part (`name: audit` gives
  `my-plugin:review:audit`). A file listed in the manifest `agents` key loads without subfolder
  segments. In a plugin, a file with no `name` is named after the file.
- **Invocation**: `@agent-<name>`, or `@agent-<plugin>:<name>` for a plugin subagent. Hooks receive
  the name as `agent_type`.

---

## Frontmatter Fields

Only `name` and `description` are required. Field names are camelCase and must match exactly.
Claude Code ignores a field it doesn't recognize without reporting an error; run `claude --debug`
and search the debug log for `does not recognize or apply` to find one.

| Field | Required | Values | What it does |
|---|---|---|---|
| `name` | Yes | String, max 256 chars, no `:` | Unique identifier. See [Names and Namespacing](#names-and-namespacing). |
| `description` | Yes | String | When Claude should delegate to this subagent. Include "use proactively" to encourage automatic delegation. |
| `tools` | No | Comma-separated string (`Read, Grep, Bash`) or YAML list | Allowlist. If omitted, inherits every tool available to subagents. If no entry resolves to a tool, the subagent usually fails to launch. See [Tool Rules](#tool-rules). |
| `disallowedTools` | No | Same format as `tools` | Denylist, removed from the inherited or listed tools. An entry with a specifier, such as `Bash(git push *)`, removes the whole tool. |
| `model` | No | `sonnet`, `opus`, `haiku`, `fable`, a full id such as `claude-opus-5-5`, or `inherit` | Model for this subagent. `inherit` uses the main conversation's model. See [Model Resolution](#model-resolution). |
| `effort` | No | `low`, `medium`, `high`, `xhigh`, `max` (available levels depend on the model) | Effort level while the subagent runs. Overrides the session's level, not `CLAUDE_CODE_EFFORT_LEVEL`. A per-invocation effort from Claude overrides this field (v2.1.292+). |
| `permissionMode` | No | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`; `manual` is an alias for `default` | Permission mode for the subagent. See [Permission Mode Rules](#permission-mode-rules). Ignored in plugins. |
| `maxTurns` | No | Integer | Maximum agentic turns. At the limit the output is returned marked as partial (v2.1.246+) and Claude can resume the subagent. |
| `autoCompactWindow` | No | Integer from `100000` to `1000000` | Lowers the auto-compact window for this subagent (v2.1.296+). |
| `skills` | No | List of skill names | Preloads the full content of each skill at startup (first 32 distinct names). Skills with `disable-model-invocation: true` can't be preloaded. The subagent can still invoke other skills through the Skill tool unless `Skill` is removed from its tools. |
| `mcpServers` | No | Server names (`"slack"`) or inline server configs keyed by name | MCP servers for this subagent. Ignored in plugins. |
| `hooks` | No | Same shape as `hooks` in settings | Lifecycle hooks that run only while this subagent is active. See [Frontmatter Hooks](#frontmatter-hooks). Ignored in plugins. |
| `memory` | No | `user`, `project`, `local` | Gives the subagent a persistent memory folder. See [Memory Scopes](#memory-scopes). |
| `background` | No | `true` | Keeps the subagent in the background even when Claude asks to wait for it. Subagents spawned from the main conversation already start in the background by default. |
| `isolation` | No | `worktree` | Runs the subagent in a temporary git worktree, branched by default from your default branch. The worktree is removed if the subagent makes no changes. |
| `omitClaudeMd` | No | `true` | Starts without the user, project and local CLAUDE.md files (managed policy files still load). Ignored when the agent runs as the main session agent (v2.1.271+). |
| `color` | No | `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` | Display color in the task list and transcript. |
| `initialPrompt` | No | String | Auto-submitted as the first user turn when the agent runs as the main session agent (`--agent` or the `agent` setting). Commands and skills in it are processed. Ignored in plugins. |
| `experimental` | No | Map; only `cacheTtl: 5m` or `cacheTtl: 1h` is documented | Prompt cache lifetime for this subagent's requests (v2.1.248+). |

---

## Model Resolution

Claude Code picks a subagent's model in this order:

1. The `model` Claude passes for that one invocation
2. The `model` frontmatter field (`inherit` means the main conversation's model)
3. The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, set to an alias or model id
4. The main conversation's model

Current model ids: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`.
Aliases point to the recommended version for your provider and change over time. Use a full id to
pin a version.

---

## Tool Rules

**Allowlist and denylist together.** `disallowedTools` is applied first, then `tools` is resolved
against what remains. A tool in both lists is removed.

**MCP entries:**

| Goal | Field | Entry |
|---|---|---|
| All tools from one server | `tools` | `mcp__github__*` |
| Withhold one server's tools | `disallowedTools` | `mcp__github` or `mcp__github__*` |
| Withhold every MCP tool | `disallowedTools` | `mcp__*` |

**Spawning subagents.** A subagent can spawn its own subagents up to three layers below the main
conversation (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` changes this; `1` turns nesting off). At the
limit the `Agent` tool is withheld. `tools: Agent(worker, researcher)` restricts which types can be
spawned, but only for an agent running as the main thread with `claude --agent`; inside a subagent
definition the list in parentheses is ignored.

**Always removed**, even when listed: `AskUserQuestion`, `EndConversation`, `EnterPlanMode`,
`ScheduleWakeup`, `WaitForMcpServers`, `Workflow`; `ExitPlanMode` unless `permissionMode` is `plan`;
`Agent` at the depth limit.

**Background subagents** (the default) keep every MCP tool but only these built-in tools: `Read`,
`Grep`, `Glob`, `LSP`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`,
`WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`,
`TaskStop`, `SendMessage`, `Artifact` (plus `Agent` and `ExitPlanMode` under the rules above). The
same definition can therefore get different tools in the foreground and the background.

---

## Permission Mode Rules

- Main conversation in `bypassPermissions`, `acceptEdits` or auto mode: the subagent runs in that
  same mode and `permissionMode` is ignored.
- Main conversation in `default`, `dontAsk` or `plan`: the subagent uses its `permissionMode`.
- Foreground subagents pass permission prompts through to you. Background subagents surface them in
  the main session, naming the subagent that asks.

---

## Memory Scopes

| Scope | Folder | Use when |
|---|---|---|
| `user` | `~/.claude/agent-memory/<name>/` | Learnings apply across all projects |
| `project` | `.claude/agent-memory/<name>/` | Project-specific and shared through git (the docs' recommended default) |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, not checked in |

With memory on, the subagent gets instructions for using the folder, the first 200 lines or 25KB of
its `MEMORY.md`, and `Read`, `Write` and `Edit`. The field does nothing when auto memory is off.

---

## Frontmatter Hooks

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
```

- Hooks run only while that subagent is active. A `Stop` hook becomes `SubagentStop`.
- Hooks in a project subagent run only after you accept the workspace trust dialog for the folder
  that contains the agent file. Until then the subagent runs without them.
- To react to any subagent from settings, use the `SubagentStart` and `SubagentStop` events, which
  match on the agent name.

---

## Plugin Subagents

| | Fields |
|---|---|
| Supported | `name`, `description`, `model`, `effort`, `maxTurns`, `autoCompactWindow`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `omitClaudeMd`, `isolation`, `color`, `experimental.cacheTtl` |
| Ignored | `permissionMode`, `hooks`, `mcpServers`, `initialPrompt` |

- Put hooks in the plugin's `hooks/hooks.json` and MCP servers in its `.mcp.json`; they apply
  whenever the plugin is enabled. To use the ignored fields, copy the file into `.claude/agents/` or
  `~/.claude/agents/`.
- A plugin agent whose frontmatter doesn't parse still loads with every field ignored, named after
  the file. `claude plugin validate <plugin-dir>` finds these files.
- The manifest `agents` key takes `.md` file paths (not folders) and replaces the default `agents/`
  scan.
- A plugin can run one of its agents as the main thread by setting `agent` in a `settings.json` at
  the plugin root. A user's own `agent` setting overrides it.

Code that changes Claude Code's own interface (for example a live subagent pane) belongs in a mod.
See the [Mod Anatomy Reference](mod-anatomy.md).

---

## Files Claude Code Skips

A file in a managed, project or user `agents` folder is skipped without a message in the session
when:

- there is no `name`, or no `description`
- `name` starts with `-`, contains `:`, or is longer than 256 characters
- the opening `---` isn't the first line
- the YAML doesn't parse

Run `claude --debug` to see why a file was skipped.

---

## Related CLI Flags, Settings and Environment Variables

| Name | Kind | Effect |
|---|---|---|
| `--agents '<json>'` | CLI flag | Defines session-only subagents. Each key is a name; `prompt` is the body; accepts the frontmatter fields except `color` and `experimental`. |
| `--agent <name>` | CLI flag | Runs the whole session as that agent. Overrides the `agent` setting. |
| `agent` | Setting | Default main-thread agent for a project (`.claude/settings.json`). |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Env var | Default subagent model (step 3 of [Model Resolution](#model-resolution)). |
| `CLAUDE_CODE_EFFORT_LEVEL` | Env var | Overrides every `effort` value. |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` | Env var | Nesting depth (default 3). |
| `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | Env var | Concurrent subagents per session (default 20, v2.1.217+). |
| `permissions.deny: ["Agent(Explore)"]` | Setting | Stops Claude from using one subagent type; denying `Agent` stops all delegation. |

`/agents` prints a reminder to ask Claude or to edit `.claude/agents/` and `~/.claude/agents/`
directly. Only versions 2.1.197 and earlier open an interactive manager.

---

## Validation Checklist

- [ ] Frontmatter starts on line 1 and parses as YAML.
- [ ] `name` and `description` are present; `name` has no `:` and doesn't start with `-`.
- [ ] Field names are spelled exactly (camelCase); misspelled fields are silently ignored.
- [ ] `model` is an alias, a full id or `inherit`, or omitted.
- [ ] `tools` resolves to at least one tool.
- [ ] Plugin agents don't depend on `hooks`, `mcpServers`, `permissionMode` or `initialPrompt`.
- [ ] `claude plugin validate ./plugins/<plugin>` passes.

---

## Resources

- [Agent Creation Guide](../guides/agent-creation.md)
- [Plugin Structure Reference](plugin-structure.md)
- [Plugin Development Guide](../guides/plugin-development.md)
- [Mod Anatomy Reference](mod-anatomy.md)
- [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code plugin components: agents](https://code.claude.com/docs/en/plugins/components#agents)
