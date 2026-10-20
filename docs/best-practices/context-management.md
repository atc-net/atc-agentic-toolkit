# Context Management

How to keep Claude Code's context window focused: what fills it, how to watch it, and the commands that compact, clear or rewind it.

## Table of Contents

- [Understanding Context](#understanding-context)
- [Monitoring Context](#monitoring-context)
- [Context Optimization Strategies](#context-optimization-strategies)
- [Progressive Disclosure](#progressive-disclosure)
- [When to Reset Context](#when-to-reset-context)
- [Advanced Techniques](#advanced-techniques)

---

## Understanding Context

### What is Context?

The **context window** is everything Claude knows in the current session:

- **Startup content.** The system prompt, your CLAUDE.md files (or AGENTS.md), auto memory, skill descriptions, and MCP tool names. All of this loads before you type anything.
- **Conversation messages.** Your prompts and Claude's responses.
- **File contents.** Every file Claude reads, plus any path-scoped rules and nested CLAUDE.md files that load alongside them.
- **Tool output.** Results from shell commands, searches and hooks.

### Context Size Limits

Claude Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 all have a **1M-token** context window by default. Claude Code compacts automatically at about 967K tokens on these models. You can change that point with `/autocompact` (see [Advanced Techniques](#advanced-techniques)).

A token is roughly four characters of English text. Treat that as a rough guide only. `/context` gives you the real numbers.

### Why Context Management Matters

A 1M window means you rarely run out, but size still matters:

- **Quality.** Old, unrelated conversation is noise. Claude has more to sift through, and an outdated decision from an hour ago can steer it wrong.
- **Cost and speed.** The whole context is sent with every request, so a bloated conversation costs more tokens on every turn.
- **Compaction loses detail.** When the window fills, a summary replaces the conversation. You choose what survives only if you compact yourself.

---

## Monitoring Context

### The `/context` Command

```text
/context
```

`/context` shows current usage as a colored grid, broken down by category, with optimization suggestions for context-heavy tools, memory bloat and capacity warnings. It also lists the CLAUDE.md and auto memory files that loaded, under **Memory files**. Use `/context all` for more detail, including tokens per MCP tool.

Other useful views:

- `/memory` opens the CLAUDE.md and auto memory files that load each session.
- `/skill-doctor` shows what each skill costs in context and how often it's used.
- `/mcp` shows MCP server status, so you can disconnect servers you aren't using.

### Regular Context Checks

Check `/context` at natural transition points: after a long exploration, before starting implementation, and when you switch to a different feature.

### Warning Signs

The context probably needs attention if:

- Claude repeats an approach you already rejected.
- It follows an earlier decision you have since changed.
- Responses drift from the current task toward something you discussed earlier.
- `/context` shows a large share taken by old tool output or files you no longer need.

---

## Context Optimization Strategies

### Strategy 1: Targeted File Reading

**Too broad:**

```text
Read all files in the src/ directory
```

**Targeted:**

```text
Read UserService.cs and its interface IUserService.cs
```

You can also ask for part of a file:

```text
Read the first 100 lines of UserService.cs to understand its structure
```

### Strategy 2: Compact with a Focus

There's no command to drop one file from context. Instead, compact the conversation and tell Claude what to keep:

```text
/compact focus on the auth bug fix and the files we changed
```

The summary keeps what you choose, instead of what the automatic pass guesses is important. Run it before a long new task.

### Strategy 3: Summarize Part of the Conversation

`/rewind` can summarize part of the conversation instead of all of it. Run `/rewind`, pick a message, and choose **Summarize from here** or **Summarize up to here**. Use it to condense a long debugging detour while keeping the rest intact.

### Strategy 4: Progressive File Loading

Load files as you need them, not up front.

**Front-loading:**

```text
Read all controller, service and model files so you understand the system
```

**Progressive:**

```text
Start with UserController. We'll look at related files as they become relevant.
```

### Strategy 5: Use Specialized Agents

A subagent runs in its own context window. It reads files and runs searches there, and only its final summary comes back to your conversation.

```text
Use the Explore agent to find every place we validate JWT tokens.
Report the file paths and a one-line summary of each.
```

What a subagent sees:

- Its own system prompt and the task Claude writes for it. It doesn't see your conversation.
- CLAUDE.md and a git status snapshot. The built-in Explore and Plan agents start without either.
- Not your auto memory. A subagent can keep its own if its definition sets `memory`.

The exception is a **fork** (`/subtask <task>`), which inherits your full conversation and works in the background.

Use subagents for side tasks whose output you won't need again: codebase searches, long test runs, reading many files to answer one question. See [Subagents](https://code.claude.com/docs/en/sub-agents).

### Strategy 6: Grep Before Reading

**Reading blindly:**

```text
Read all files that might contain validation logic
```

**Search, then read:**

```text
Search for "ValidationException" and list the files that throw it.
Then read only the validator for users.
```

---

## Progressive Disclosure

### The Three-Level Loading Strategy

1. **Overview.** "List the public methods in UserService.cs."
2. **Section.** "Show me just the CreateUser method."
3. **Full content.** "Now read the whole file; we're going to change it."

### Applying Progressive Disclosure

```text
# Overview
List the files in src/ grouped by directory.

# Structure
For each controller in src/Controllers/, list the public endpoints.

# Deep dive
Read UserController.cs; we'll work on it.

# Related files
Which service does UserController use? Read that one.
```

### Skills Use Progressive Disclosure Automatically

Claude Code loads skills in stages:

- **At startup:** only each skill's name and description.
- **When the skill is used:** the full `SKILL.md` body.
- **As needed:** the skill's supporting files, which Claude reads when the instructions point to them.

A skill with `disable-model-invocation: true` costs nothing until you invoke it, because even its description stays out of context.

MCP servers work the same way: tool names load at startup, and full tool schemas load on demand.

---

## When to Reset Context

### Using `/compact`

```text
/compact [instructions]
```

Summarizes the conversation so far and continues the same session. Claude Code also does this automatically as the window fills.

What survives compaction:

| Content | After compaction |
|---------|------------------|
| System prompt and output style | Still apply |
| Project-root CLAUDE.md and rules without `paths:` | Re-injected from disk |
| Auto memory | Re-injected from disk |
| Skill descriptions | Rebuilt and re-injected (Claude Code 2.1.304+) |
| A plan written in plan mode | Re-injected from disk |
| Rules with `paths:` and nested CLAUDE.md files | Reloaded on demand when Claude touches a matching file |
| Files Claude read or edited | Up to five re-read, most recently modified first |
| Invoked skill bodies | Re-injected, capped at 5,000 tokens per skill and 25,000 in total |
| Everything else in the conversation | Replaced by the summary |

Two consequences:

- An instruction that must survive compaction belongs in the project-root CLAUDE.md, not in chat or a path-scoped rule.
- Put the most important instructions near the top of a `SKILL.md`, because a long skill is truncated from the end.

### Using `/rewind`

```text
/rewind
```

Goes back to an earlier point in the conversation, the code Claude edited, or both. Aliases: `/checkpoint`, `/undo`.

**Use when:**

- You want to try a different approach.
- A recent change broke something.
- A failed attempt cluttered the conversation.

`/rewind` restores only edits made with Claude's file editing tools. Files changed by shell commands (`rm`, `mv`, `cp`), most subagent edits, and changes made outside Claude Code aren't tracked, so commit before risky work. Checkpoints don't replace git.

### Using `/clear`

```text
/clear
```

Starts a new conversation with empty context. CLAUDE.md and auto memory load again, as at any session start. The previous conversation isn't deleted: `/resume` brings it back. Pass a name (`/clear auth-spike`) to label it in the `/resume` picker.

**Use when:**

- You're switching to unrelated work.
- The conversation is full of a finished task.
- Claude keeps returning to an approach you've abandoned.

### Strategic Reset Points

**Good times to compact or clear:**

- Between features.
- After a self-contained task is done.
- Before a long debugging session.
- After a long exploration, once you've chosen an approach.

```text
# After exploring and agreeing on a design
/compact keep the agreed design for role-based authorization and the list of files to change

# Then implement in the same session
Implement step 1 of the design.
```

---

## Advanced Techniques

### Technique 1: Set the Auto-Compact Point

`/autocompact` sets how full the context window gets before automatic compaction runs:

```text
/autocompact 500k
/autocompact auto
```

`auto` returns to the default for your model. `claude --autocompact 500k` sets it for one session. Compacting earlier keeps each request smaller; compacting later keeps more detail. See [Model configuration](https://code.claude.com/docs/en/model-config).

### Technique 2: Write Durable Notes to Files

Knowledge that should outlive the session doesn't belong in the conversation:

- **Project facts and conventions** go in CLAUDE.md: "add this to CLAUDE.md".
- **Preferences and corrections** go in auto memory: "remember that the API tests need a local Redis". Claude saves them to `~/.claude/projects/<project>/memory/`, and the first 200 lines (or 25KB) of `MEMORY.md` load each session.
- **Progress on a multi-session task** goes in a plan or notes file in the repository, which a fresh session can read.

```text
Write our current status to docs/plans/auth-migration.md: what's done,
what's next, and the key files. Then I'll /clear and continue from that file.
```

### Technique 3: Two-Session Workflow

Split research and implementation:

1. **Research session.** Explore, compare options, and write the chosen design to a file. Plan mode (Shift+Tab) suits this.
2. **Implementation session.** `/clear`, or start a new session, and point Claude at the design file.

### Technique 4: Use Plan Mode for Exploration

In plan mode, Claude researches read-only and often delegates that research to the Plan subagent, so much of the exploration stays out of your context. The approved plan is saved to disk and survives compaction. Enter it with Shift+Tab or `/plan <task>`.

### Technique 5: Context-Aware Skill Design

When you write skills:

- Keep `SKILL.md` focused, with the most important instructions first.
- Move detailed reference material into separate files the skill points to.
- Write a precise `description`, since it loads into every session.
- Use `disable-model-invocation: true` for skills you only run by hand.

```markdown
## Database Schema

For the full schema, see references/schema.md.

Key tables:
- Users (id, email, password_hash)
- Orders (id, user_id, total, status)
```

Not:

```markdown
## Database Schema

[The entire 50-table schema pasted here]
```

### Technique 6: Keep Startup Context Lean

Everything that loads at startup is paid for on every request:

- Keep each CLAUDE.md under about 200 lines. Move rules for one area into `.claude/rules/` with `paths:` frontmatter.
- Turn off skills and MCP servers you don't use (`/skills`, `/mcp`, `/skill-doctor`).
- Run `/doctor prompt-audit` to find stale or conflicting instructions.

---

## Best Practices Summary

### Do

- **Check `/context`** at transition points.
- **Load progressively.** Overview first, details when needed.
- **Search before reading.**
- **`/compact` with a focus** before a long new task.
- **`/clear` between unrelated tasks.**
- **Delegate large reads** to a subagent.
- **Write durable knowledge to files**: CLAUDE.md, auto memory, or a plan file.

### Don't

- **Don't front-load** with "read everything".
- **Don't rely on chat for rules** that must survive compaction.
- **Don't keep a finished task's conversation** around for the next one.
- **Don't fear resets.** `/rewind`, `/compact` and `/clear` are cheap, and `/resume` brings back a cleared conversation.

---

## Context Management Checklist

**Before starting a session:**

- [ ] Know which files and areas you'll need.
- [ ] Decide whether to start in plan mode.

**During a session:**

- [ ] Search before reading files.
- [ ] Send searches and long-output tasks to a subagent.
- [ ] Check `/context` when switching phases.

**When the conversation gets long or unfocused:**

- [ ] `/compact` with instructions about what to keep.
- [ ] Or `/rewind` and summarize part of the conversation.
- [ ] Or, if the task is done, write notes to a file and `/clear`.

**After completing a feature:**

- [ ] Put lasting conventions in CLAUDE.md.
- [ ] `/clear` before the next feature.

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md) - Models, memory and customization
- [Effective Prompts](effective-prompts.md) - Providing context efficiently
- [Skill Creation Guide](../guides/skill-creation.md) - Progressive disclosure in skills
- [Explore the context window](https://code.claude.com/docs/en/context-window) - Official interactive walkthrough
- [How Claude remembers your project](https://code.claude.com/docs/en/memory) - CLAUDE.md and auto memory
