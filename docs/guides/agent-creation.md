# Agent Creation Guide

How to write a Claude Code subagent, test it, and ship it in one of this repository's plugins.
Every frontmatter field is covered in the [Agent Anatomy Reference](../reference/agent-anatomy.md).
This guide doesn't repeat that table.

Source of truth: the official [subagents docs](https://code.claude.com/docs/en/sub-agents).

## Table of Contents

- [What a Subagent Is](#what-a-subagent-is)
- [Subagent or Skill?](#subagent-or-skill)
- [Create a Subagent](#create-a-subagent)
- [Write a Description That Routes](#write-a-description-that-routes)
- [Write the System Prompt](#write-the-system-prompt)
- [Limit Tools and Pick a Model](#limit-tools-and-pick-a-model)
- [Test It](#test-it)
- [Ship It in a Plugin](#ship-it-in-a-plugin)
- [Checklist](#checklist)
- [Resources](#resources)

---

## What a Subagent Is

A subagent is a separate assistant that the main Claude session hands a task to. It has:

- its own context window, so its file reads, search results and logs stay out of your conversation
- its own system prompt (the body of its Markdown file)
- its own tool access and, optionally, its own model and effort level

The subagent does the work and returns one result to the main session. That is the point of a
subagent: it keeps verbose, self-contained work out of the main context.

A subagent starts fresh. It gets its system prompt, the message Claude sends when delegating, your
CLAUDE.md files and the git status. It does not see the conversation so far. Write the system prompt
so the subagent can do its job from the delegation message alone.

Claude Code also ships built-in subagents (for example `Explore`, `Plan` and `general-purpose`).
You don't need to recreate those.

---

## Subagent or Skill?

| Use a subagent when | Use a skill when |
|---|---|
| The work produces a lot of output you only need a summary of (searching, reviewing, running tests) | The main session should follow a workflow or conventions directly |
| The task needs a narrower tool set than the main session (for example read-only) | You want to bundle scripts, references or templates |
| The task benefits from a different model or effort level | The user should be able to run it as a `/command` |
| Several independent tasks can run in parallel | The guidance should shape the main conversation's own answers |

The two combine well. A subagent can preload skills with its `skills` field, and a skill can tell
Claude to delegate parts of its workflow to a subagent. For skills, see the
[Skill Creation Guide](skill-creation.md).

---

## Create a Subagent

A subagent is one Markdown file: YAML frontmatter, then the system prompt.

```markdown
---
name: code-reviewer
description: Reviews code changes for correctness, security and readability. Use proactively after code is written or modified.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer. You never edit files.

When invoked:
1. Run `git diff` to see the changes.
2. Read the changed files and enough surrounding code to judge them.
3. Check correctness, error handling, security, naming and test coverage.

Report findings grouped as Critical, Warning and Suggestion. For each finding, give the file,
the line and a concrete fix. If you find nothing worth changing, say so in one line.
```

Two ways to create it:

- **Ask Claude.** Describe the subagent and where to save it, for example: "Create a project
  subagent in `.claude/agents/` that reviews diffs read-only." Claude writes the file.
- **Write the file yourself** in one of these folders:

| Folder | Available in |
|---|---|
| `.claude/agents/` | This project (check it into git to share with the team) |
| `~/.claude/agents/` | All your projects |
| `plugins/<plugin>/agents/` | Every project where the plugin is enabled |

If two subagents share a name, the higher-priority location wins. The reference lists the
[full precedence order](../reference/agent-anatomy.md#locations-and-precedence).

Claude Code watches `.claude/agents/` and `~/.claude/agents/`, so an added or edited file is used on
the next delegation, with no restart. Restart only when you created the folder itself during the
session, or when the folder sits in a directory added with `--add-dir`.

The `/agents` command no longer opens an editor. It reminds you to ask Claude or to edit the
folders directly.

---

## Write a Description That Routes

Claude decides when to delegate by matching your request against each subagent's `description`.
The description is routing logic, not a bio.

- Say what the subagent does and when to use it.
- Name the trigger: "after code is written or modified", "when a test fails", "for SQL questions".
- Add "use proactively" if Claude should delegate without being asked.
- Make it specific enough to pick this subagent over the others you have.
- Keep it short. Claude Code warns at startup when all subagent descriptions together pass about
  15,000 tokens. Put detail in the system prompt, not the description.

```yaml
# Too vague: never wins a routing decision
description: Helps with databases

# Routes well
description: Runs read-only SQL against the reporting database to answer data questions. Use proactively when the user asks about counts, trends or totals.
```

---

## Write the System Prompt

The body is the subagent's whole system prompt. It does not get the Claude Code system prompt.
Write it like a brief to a capable colleague who just walked in:

1. **Role and limits.** "You are a read-only code reviewer. You never edit files." Second person is
   fine and is what the official examples use.
2. **Steps.** What to do first, what to check, when to stop.
3. **Output.** The shape of the result the main session gets back: headings, a list, a verdict,
   file and line references. The main session only sees this output, so make it complete and
   compact.
4. **Edge cases.** What to do when there is nothing to report, when input is missing, or when the
   task is out of scope.

Keep one job per subagent. A "full-stack expert" with a long list of capabilities routes badly and
gives Claude no reason to delegate. Long persona sections (capabilities, knowledge base, behavioural
traits) are optional. Include them only when they change what the subagent does.

---

## Limit Tools and Pick a Model

**Tools.** Without `tools`, a subagent inherits every tool available to subagents, including MCP
tools. Grant the minimum:

| Job | Suggested tools |
|---|---|
| Review or research | `Read, Grep, Glob` (add `Bash` for `git diff` or test runs) |
| Fix bugs | `Read, Edit, Bash, Grep, Glob` |
| Everything except one risky tool | omit `tools`, set `disallowedTools: Write` |

To block specific shell commands rather than all of Bash, use a `permissions.deny` rule in
settings. A `disallowedTools` entry such as `Bash(git push *)` removes the whole Bash tool.

**Model.** Use `inherit` to follow the main session's model. Pick an alias (`haiku`, `sonnet`,
`opus`, `fable`) or a full id such as `claude-haiku-5-5` when the task clearly calls for one: a fast,
cheap model for searching and summarising, a stronger one for review and design. The reference
explains [what happens when you omit `model`](../reference/agent-anatomy.md#model-resolution).

**Effort.** Set `effort` (`low` to `max`) if the subagent should think more or less than the session.

---

## Test It

1. Save the file in `.claude/agents/` of a test project.
2. Run it explicitly. Type `@`, pick the subagent, or type `@agent-code-reviewer` followed by the
   task. An @-mention guarantees that subagent runs. You can also ask in plain words: "Use the
   code-reviewer subagent on my last change."
3. Test routing. Send a few realistic requests without naming the subagent, such as "I just
   refactored the parser, can you check it?", and see whether Claude delegates. If it doesn't,
   sharpen the description.
4. Check the result. The main session gets only the subagent's final output. If that output is
   vague or too long, fix the Output section of the prompt.
5. If the file doesn't show up, run `claude --debug` and check the
   [rules for skipped files](../reference/agent-anatomy.md#files-claude-code-skips).

To run a whole session as the subagent (its prompt, tools and model on the main thread), start
Claude Code with `claude --agent code-reviewer`.

---

## Ship It in a Plugin

1. Move the file to `plugins/<plugin>/agents/<name>.md`. Subfolders are allowed and become part of
   the name.
2. Plugin subagents are namespaced. In a plugin called `dotnet`, `agents/code-reviewer.md` is
   invoked as `@agent-dotnet:code-reviewer`. Mention the plugin name in the plugin's README.
3. Don't rely on hooks or MCP servers in the frontmatter. Plugins ignore those fields and a few
   others for security ([details](../reference/agent-anatomy.md#plugin-subagents)). Ship hooks in the
   plugin's `hooks/hooks.json` and MCP servers in its `.mcp.json` instead.
4. Validate: `claude plugin validate ./plugins/<plugin>`.
5. Test it in a session with the plugin loaded, for example `claude --plugin-dir ./plugins/<plugin>`,
   or install it from the marketplace:
   `/plugin install <plugin> --marketplace atc-net/atc-agentic-toolkit` (Claude Code 2.1.275+), or
   `/plugin marketplace add atc-net/atc-agentic-toolkit` then `/plugin install <plugin>@atc-agentic-toolkit`.

None of this repository's plugins ships an `agents/` folder yet. The `agents/*.md` files under
`plugins/common/skills/skill-creator/` are instruction files that the skill reads before it starts
a subagent. They have no frontmatter and Claude Code does not load them as subagents.

If you want to change Claude Code's interface or react to subagent events with code (for example a
live subagent pane), that is a mod, not a subagent. See the [Mod Creation Guide](mod-creation.md).

---

## Checklist

- [ ] One job per subagent.
- [ ] `description` says what and when, and is short enough to route well.
- [ ] System prompt covers role, steps, output shape and edge cases.
- [ ] `tools` is the smallest set that works.
- [ ] `model` is `inherit` or a deliberate choice.
- [ ] Tested with an `@agent-` mention and with a plain request.
- [ ] For plugins: no reliance on `hooks`, `mcpServers`, `permissionMode` or `initialPrompt`, and
      `claude plugin validate` passes.

---

## Resources

- [Agent Anatomy Reference](../reference/agent-anatomy.md): every frontmatter field, locations, naming
- [Plugin Development Guide](plugin-development.md)
- [Plugin Structure Reference](../reference/plugin-structure.md)
- [Skill Creation Guide](skill-creation.md)
- [Mod Creation Guide](mod-creation.md)
- [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code plugin components: agents](https://code.claude.com/docs/en/plugins/components#agents)
