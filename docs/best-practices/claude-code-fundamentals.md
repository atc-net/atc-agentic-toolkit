# Claude Code Fundamentals

The core concepts you need to use Claude Code well: models and context, memory, the ways to customize it, subagents, commands, and plan mode.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Context Window Management](#context-window-management)
- [Persistent Memory](#persistent-memory)
- [Customization Mechanisms](#customization-mechanisms)
- [Working with Agents](#working-with-agents)
- [Introspection & Discovery](#introspection--discovery)
- [Essential Commands](#essential-commands)
- [Best Practices](#best-practices)

---

## Core Concepts

### What is Claude Code?

Claude Code is an agentic coding tool. It runs in your terminal (and in the Desktop app, VS Code and JetBrains), reads your code, edits files, runs commands, and works through multi-step tasks with you. You can extend it with memory files, skills, subagents, hooks, MCP servers, plugins and mods.

### Models

Claude Code runs on the current Claude models. Pick one with an alias:

| Alias | Model | Use it for |
|-------|-------|------------|
| `opus` | Claude Opus 5.5 (`claude-opus-5-5`) | Complex reasoning, large changes |
| `sonnet` | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | Daily coding |
| `haiku` | Claude Haiku 5.5 (`claude-haiku-5-5`) | Simple, fast tasks |
| `fable` | Claude Fable 5.1 (`claude-fable-5-1`) | The hardest and longest-running tasks |

Two more aliases exist: `best` (Fable where you have access to it, otherwise Opus) and `opusplan` (Opus in plan mode, Sonnet for execution). Aliases can resolve to other models on some cloud providers.

All four models have a 1M-token context window by default.

Ways to set the model, highest priority first:

```text
/model sonnet                 # in a session (no argument opens a picker)
claude --model opus           # at startup
ANTHROPIC_MODEL=haiku         # environment variable
"model": "opus"               # the model field in a settings file
```

`/effort` sets the effort level (`low`, `medium`, `high`, `xhigh`, `max`, or `auto`). See [Model configuration](https://code.claude.com/docs/en/model-config).

### Three Kinds of Memory

It helps to think of Claude Code as having three layers of memory:

1. **The context window** is working memory: the current conversation, files read, and tool output. It lasts one session.
2. **Memory files** carry knowledge across sessions: `CLAUDE.md` files you write, and auto memory that Claude writes itself.
3. **Skills and plugins** are packaged knowledge. Only a short description loads at startup; the full content loads when it's needed.

---

## Context Window Management

The context window holds everything Claude knows in the session. It's 1M tokens, which is large but not free: a long, unfocused conversation costs more tokens on every request and gives Claude more noise to sift through.

### See What's in Context

```text
/context
```

`/context` shows a breakdown of context usage by category, with suggestions, and lists which CLAUDE.md and auto memory files loaded. `/context all` adds per-tool detail.

### Keep Context Focused

- **Ask for specific files.** "Read `UserService.cs` and `IUserService.cs`" beats "read the whole project".
- **Search before reading.** Let Claude grep for a symbol, then read only the files that matter.
- **Delegate large reads to a subagent.** The subagent reads in its own context window and returns a summary.
- **Compact or clear between tasks.** `/compact` summarizes the conversation; `/clear` starts a new one.

Claude Code also compacts automatically as the window fills, so a full context doesn't end your session.

For details, see [Context Management](context-management.md).

---

## Persistent Memory

Two mechanisms carry knowledge across sessions: **CLAUDE.md files**, which you write, and **auto memory**, which Claude writes. Both load at the start of every session. Claude treats them as context, not enforced rules; to enforce something, use a [hook](#6-hooks).

### CLAUDE.md Locations

| Scope | Location | Shared with |
|-------|----------|-------------|
| Managed policy | Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`; macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux/WSL: `/etc/claude-code/CLAUDE.md` | Everyone in the organization |
| User | `~/.claude/CLAUDE.md` | Only you, all projects |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | The team, through git |
| Local | `./CLAUDE.local.md` (add it to `.gitignore`) | Only you, this project |
| Rules | `.claude/rules/*.md` and `~/.claude/rules/*.md` | Depends on location |

How they load:

- Files don't override each other. Claude Code **concatenates** them, broadest first, so the more specific file is read last.
- CLAUDE.md files in your working directory and every directory above it load at launch. Files in subdirectories load when Claude works with files there.
- Rules with `paths:` frontmatter load only when Claude reads or edits a matching file.
- If a repository has an `AGENTS.md` and no `CLAUDE.md`, Claude Code reads `AGENTS.md` instead. This repository relies on that.
- `@path/to/file` inside a CLAUDE.md imports another file.

### What to Include

Write down what you would otherwise re-explain: build and test commands, conventions, project layout, "always do X" rules. Be concrete enough to verify:

```markdown
# Conventions

- Run `dotnet test` before committing
- API handlers live in `src/Api/Handlers/`
- Use file-scoped namespaces
- Ask before changing database migrations
```

Keep each file under about 200 lines. Move multi-step procedures and reference material to [skills](#3-agent-skills), and rules for one part of the codebase to path-scoped rules.

### What NOT to Include

- **Secrets or credentials.** Use environment variables.
- **Long procedures or reference docs.** Use a skill, which loads only when needed.
- **Task-specific instructions.** Put them in the prompt or a skill.

### Updating CLAUDE.md

- `/init` generates a starting CLAUDE.md from your codebase, or suggests improvements to an existing one.
- `/memory` lists your memory files and opens one in your editor.
- Ask Claude directly: "add this to CLAUDE.md".
- `/doctor prompt-audit` checks your instruction files for outdated or conflicting content.

### Auto Memory

Auto memory lets Claude keep notes for itself: your preferences, corrections you gave it, and project facts it can't derive from the code.

- Stored per repository in `~/.claude/projects/<project>/memory/`, shared across worktrees, local to your machine.
- `MEMORY.md` is an index; the first 200 lines (or 25KB) load at the start of every session. Detail goes into topic files next to it.
- On by default. Toggle it in `/memory`, or set `"autoMemoryEnabled": false` in settings.
- "Remember that the API tests need a local Redis" goes to auto memory. "Add this to CLAUDE.md" goes to CLAUDE.md.
- The files are plain markdown. Open the folder from `/memory` to read, edit or delete them.

See [How Claude remembers your project](https://code.claude.com/docs/en/memory).

---

## Customization Mechanisms

Each mechanism solves a different problem. [Extend Claude Code](https://code.claude.com/docs/en/features-overview) compares them in depth.

| Mechanism | What it does | Loads |
|-----------|--------------|-------|
| CLAUDE.md and rules | Always-on facts and conventions | Every session |
| Auto memory | Claude's own notes | Every session |
| Skills | Reusable instructions and workflows, invoked as `/name` | Description at start, body when used |
| Subagents | Isolated workers with their own context | When spawned |
| Hooks | Scripts that run on lifecycle events | Outside the context |
| Mods | Code that changes Claude Code's interface and behavior | Inside Claude Code |
| MCP servers | Tools for external systems | Tool names at start, schemas on demand |
| Output styles | Role, tone and response format | Every request |
| Settings and permissions | Configuration and tool access rules | Not in context |
| Plugins | Packaging for all of the above | Per component |

### 1. Slash Commands

Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. Existing `.claude/commands/` files keep working, but use a skill for new work, since skills can bundle supporting files.

```text
/deploy staging
```

See [Command Creation Guide](../guides/command-creation.md).

### 2. Subagents (Specialized Agents)

A subagent runs in its own context window with its own system prompt, tools and permissions, and returns only a summary to your conversation. Define your own as markdown files with `name` and `description` frontmatter in `.claude/agents/` (project) or `~/.claude/agents/` (user). Plugins can ship them in `agents/`.

See [Working with Agents](#working-with-agents) and the [Agent Creation Guide](../guides/agent-creation.md).

### 3. Agent Skills

A skill is a folder with a `SKILL.md` file: frontmatter with a `name` and a `description`, then instructions. It can bundle scripts, references and templates.

| Scope | Location |
|-------|----------|
| Project | `.claude/skills/<skill-name>/SKILL.md` |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md`, invoked as `/plugin-name:skill-name` |

Claude loads a skill automatically when your task matches its description, or you invoke it with `/skill-name`. Set `disable-model-invocation: true` for skills with side effects so they run only when you name them. `/skills` lists what's available.

See [Skill Creation Guide](../guides/skill-creation.md) and [Skills](https://code.claude.com/docs/en/skills).

### 4. Plugins

A plugin packages skills, subagents, hooks, MCP servers and output styles into one installable unit, distributed through a marketplace. In this repository, skill plugins live in `plugins/<name>/` and are listed in both `.claude-plugin/marketplace.json` (Claude Code) and `.github/plugin/marketplace.json` (GitHub Copilot).

Install one with Claude Code 2.1.275 or later:

```text
/plugin install dotnet --marketplace atc-net/atc-agentic-toolkit
```

On older versions, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install dotnet@atc-agentic-toolkit
```

See [Plugin Development Guide](../guides/plugin-development.md).

### 5. Structured Notes (CLAUDE.md)

Always-on instructions for every session. See [Persistent Memory](#persistent-memory).

### 6. Hooks

A hook runs a shell command, HTTP request, prompt or subagent when Claude Code reaches a lifecycle event such as `PreToolUse`, `PostToolUse` or `SessionStart`. Unlike an instruction in CLAUDE.md, a hook always runs, so use hooks for guardrails and automation: format after every edit, block a dangerous command.

Configure hooks under the `hooks` key in a settings file (`~/.claude/settings.json`, `.claude/settings.json` or `.claude/settings.local.json`), in a plugin's `hooks/hooks.json`, or in skill and subagent frontmatter. `/hooks` lists what's configured. This repository keeps its shell hooks in `.claude/plugins/hooks/`.

See [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide).

### 7. Mods

A mod is a plugin with JavaScript or TypeScript handlers that run inside Claude Code, so it can draw panes, add commands that run without a Claude turn, and step into tool calls. Mods need Claude Code 2.1.287 or later. See [Mod Creation Guide](../guides/mod-creation.md) and [Mod Anatomy](../reference/mod-anatomy.md).

### 8. MCP Servers

MCP servers give Claude tools for external systems: databases, issue trackers, browsers.

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Project-scoped servers live in `.mcp.json` at the project root and can be committed; local and user servers are stored in `~/.claude.json`. Plugins can ship a `.mcp.json` too. `/mcp` shows connection status and handles OAuth. See [MCP](https://code.claude.com/docs/en/mcp).

### 9. Output Styles

An output style sets Claude's role, tone and response format for the whole session. Built-in styles are Proactive, Concise, Explanatory and Learning, besides Default. Switch with `/output-style concise`, or write your own in `.claude/output-styles/` or `~/.claude/output-styles/`. See [Output styles](https://code.claude.com/docs/en/output-styles).

### 10. Settings and Permissions

Settings files, highest precedence first:

1. Managed settings (organization)
2. Command-line flags, such as `claude --settings`
3. `.claude/settings.local.json` (you, this project; not committed)
4. `.claude/settings.json` (the team, committed)
5. `~/.claude/settings.json` (you, every project)

Permissions are `allow`, `ask` and `deny` rules on tools:

```json
{
  "permissions": {
    "allow": ["Bash(dotnet test *)"],
    "deny": ["Read(./.env)"]
  }
}
```

`/config` opens the settings interface; `/config key=value` sets a value directly. `/permissions` manages tool rules. See [Settings](https://code.claude.com/docs/en/settings).

For the folder layout of all of this, see [.claude Folder Structure](../reference/claude-folder-structure.md).

---

## Working with Agents

### When to Use Specialized Agents

Use a subagent when a task would flood your conversation with output you won't need again: searching a large codebase, reading many files, running a long test suite. Its work stays in its own context; only the summary comes back.

### Built-in Subagents

| Agent | What it does |
|-------|--------------|
| **Explore** | Fast, read-only search and analysis of a codebase |
| **Plan** | Read-only research while you're in plan mode |
| **general-purpose** | Multi-step tasks that need both exploration and changes |
| **claude** | Catch-all for tasks that don't fit a specialized agent |
| **statusline-setup** | Configures the status line when you run `/statusline` |
| **claude-code-guide** | Answers questions about Claude Code itself |

### Invoking a Subagent

- **Automatically.** Claude delegates when your request matches a subagent's `description`.
- **By name.** "Use the Explore agent to find where we validate JWT tokens."
- **With an @-mention.** Type `@` and pick the agent from the list, or type `@agent-<name>`. This guarantees that agent runs.

A custom subagent is a markdown file:

```markdown
---
name: code-reviewer
description: Reviews code for quality and security. Use proactively after code changes.
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. Give specific, actionable feedback on quality,
security and maintainability.
```

To create or change one, ask Claude, or edit the files in `.claude/agents/` directly. See [Subagents](https://code.claude.com/docs/en/sub-agents).

### Agent Best Practices

- **One agent, one job.** Narrow descriptions make delegation reliable.
- **Give it what it needs.** A subagent doesn't see your conversation, only the task Claude writes for it.
- **Limit tools.** A reviewer needs `Read`, `Glob` and `Grep`, not `Edit`.
- **Review the output.** Agents recommend; you decide.

---

## Introspection & Discovery

### Ask About Capabilities

Ask Claude Code about itself. The built-in claude-code-guide agent answers questions about features, settings, hooks and MCP:

```text
How do I make a hook that runs dotnet format after every edit?

What tools do you have for analyzing this codebase?
```

Type `/` to see every command available in your version, and `/help` for help.

### Post-Task Reflection

After a task goes well, ask what made it work:

```text
What approach worked best for that refactoring?
Is there a pattern here we should turn into a skill?
```

### Convert Patterns into Reusable Components

When the same prompt or procedure keeps coming back:

1. **A repeated correction** goes into CLAUDE.md.
2. **A prompt you keep typing** becomes a skill you invoke with `/name`.
3. **A playbook you keep pasting** becomes a skill with supporting files.
4. **Something that must happen every time** becomes a hook.
5. **A setup a second repository needs** becomes a plugin.

```text
That worked well. Create a skill in .claude/skills/add-endpoint/SKILL.md that captures
the steps we used: interface, service, endpoint, tests, API docs.
```

---

## Essential Commands

A selection of built-in commands. See the [commands reference](https://code.claude.com/docs/en/commands) for the full list.

### Navigation and Context

| Command | What it does |
|---------|--------------|
| `/context` | Show context usage by category |
| `/compact [instructions]` | Summarize the conversation to free context, optionally with a focus |
| `/clear` | Start a new conversation with empty context |
| `/rewind` | Rewind the conversation and/or code to an earlier point, or summarize from a message (aliases `/checkpoint`, `/undo`) |
| `/autocompact [auto\|<tokens>]` | Set how full the context gets before auto-compact runs |

### Configuration

| Command | What it does |
|---------|--------------|
| `/config` | Open the settings interface; `/config key=value` sets a value directly |
| `/model [model]` | Switch model |
| `/effort [level]` | Set the effort level |
| `/permissions` | Manage allow, ask and deny rules |
| `/memory` | Open memory files and toggle auto memory |
| `/init` | Create or improve a CLAUDE.md |
| `/hooks` | View configured hooks |
| `/mcp` | Manage MCP servers |
| `/plugin` | Install and manage plugins |
| `/output-style [style]` | List or switch output styles |
| `/status` | Show version, model, account and connectivity |
| `/doctor` | Diagnose installation and configuration problems |

#### Configuration Best Practices

1. **Start restrictive.** Approve tool calls manually until you trust a workflow, then add `allow` rules for the safe ones.
2. **Commit the team's settings.** Put shared rules in `.claude/settings.json`; keep personal ones in `.claude/settings.local.json`.
3. **Put guardrails in `deny` rules or hooks**, not in CLAUDE.md, which Claude may not follow every time.
4. **Review periodically.** Rules that suited early work may be too broad later.

#### When to Adjust Configuration

**Loosen permissions** (`acceptEdits`, or more `allow` rules) when you're prototyping alone or running the same safe commands over and over.

**Tighten them** for production code, an unfamiliar codebase, high-risk changes, or compliance requirements.

### History and Sessions

| Command | What it does |
|---------|--------------|
| `/resume [session]` | Resume an earlier conversation, or open the session picker |
| `/rename [name]` | Name the current session |
| `/branch [name]` | Branch the conversation to try another direction |
| `/export [filename]` | Export the conversation as plain text |

From the shell, `claude --continue` resumes the most recent conversation.

### Help and Documentation

| Command | What it does |
|---------|--------------|
| `/help` | Show help and available commands |
| `/` | Type it to see and filter every command and skill |
| `/skills` | List available skills |
| `/usage` | Show session cost, plan limits and activity |

---

## Best Practices

### Incremental Evolution

Build your setup as needs come up, not all at once:

1. **Start with a short CLAUDE.md.** Run `/init` and trim the result.
2. **Notice what repeats.** Corrections, prompts, procedures.
3. **Codify it.** CLAUDE.md for facts, skills for workflows, hooks for guarantees.
4. **Refine with use.** Edit skills that keep needing manual tweaks.
5. **Share it.** Package what works as a plugin.

### Planning Modes

#### Why Use Plan Mode?

Plan mode separates research from changes. Claude reads files and runs commands to explore, then writes a plan, but doesn't edit your source until you approve. Use it for large features, unclear requirements, several possible approaches, or high-risk changes.

#### Entering Plan Mode

- Press **Shift+Tab** to cycle permission modes until you reach plan mode. Press it again to leave without approving.
- Or prefix a prompt with `/plan`, for example `/plan add role-based authorization to the API`.
- Or start in plan mode: `claude --permission-mode plan`.

#### How It Works

1. You describe the goal.
2. Claude explores the codebase read-only, often with the Plan subagent.
3. Claude presents a plan.
4. You approve it or choose to keep planning and say what to change. Press `Ctrl+G` to edit the plan in your editor.
5. On approval, Claude leaves plan mode and starts editing, in auto mode or with manual edit approval, depending on the option you pick.

```text
/plan We only have authentication today. Add Admin, Manager and User roles
with different permissions on the API endpoints.
```

#### Phased Plans

For work spanning weeks, ask for the plan in phases, each with its own deliverables and verification, and run one phase at a time:

```text
/plan Migrate authentication from our custom JWT to Microsoft Entra ID with no downtime.
Break it into phases with deliverables and a test for each phase.
```

#### Planning Mode Best Practices

1. **Give scale and constraints up front.** Users, downtime limits, deadlines.
2. **Ask for alternatives.** "Show me two approaches with trade-offs."
3. **Question the plan before approving it.** It's cheaper to change a plan than code.
4. **Skip planning for small fixes.** Plan mode pays off on complex work.

### The Experimentation Mindset

#### Try, Then Refine

A working version you refine beats a perfect design you never test. Start with the main use case, use it, and improve what real use exposes.

```text
Create a basic notification service that sends emails.

[Later, after hitting rate limits]
Add a queue so we stay under the provider's rate limit.
```

#### Undo Freely

`/rewind` restores the conversation, the code Claude edited, or both, to an earlier point. Use it to drop a failed approach and try another:

```text
/rewind
Let's try session-based auth first and add JWT later if we need it.
```

#### Git as Your Safety Net

`/rewind` only restores edits made with Claude's file editing tools. It doesn't undo files changed by shell commands (`rm`, `mv`, `cp`), most subagent edits, or changes made outside Claude Code. Commit before risky work:

```bash
git commit -m "Working version of user service"
# Experiment with Claude
git reset --hard HEAD~1   # discard if it didn't work out
```

Then `/clear` to start fresh.

### Team Consistency

1. **Commit a project CLAUDE.md and `.claude/settings.json`.**
2. **Share skills, agents and hooks through a plugin.**
3. **Review instruction files together** and remove what's stale.

See [Team Standards](team-standards.md).

### Context Hygiene

- **Check `/context`** when a session feels slow or unfocused.
- **`/compact` with a focus** before a long new task.
- **`/clear`** between unrelated tasks.
- **Delegate big reads** to a subagent.

---

## Resources

- [Claude Code documentation](https://code.claude.com/docs/en/overview)
- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Context Management](context-management.md)
- [Effective Prompts](effective-prompts.md)
- [Team Standards](team-standards.md)
