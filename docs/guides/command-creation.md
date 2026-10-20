# Command Creation Guide

How to write your own slash commands for Claude Code, and how they relate to skills.

## Table of Contents

- [Commands Are Skills](#commands-are-skills)
- [When to Write a Command](#when-to-write-a-command)
- [Where Command Files Live](#where-command-files-live)
- [Write Your First Command](#write-your-first-command)
- [Frontmatter for Commands](#frontmatter-for-commands)
- [Arguments](#arguments)
- [Inject Live Context with `!`](#inject-live-context-with-)
- [Reference Files](#reference-files)
- [Examples in This Repository](#examples-in-this-repository)
- [Testing Commands](#testing-commands)
- [Checklist](#checklist)
- [Next Steps](#next-steps)

---

## Commands Are Skills

Custom commands have merged into skills. These two files both create `/deploy` and behave the same way:

```text
.claude/commands/deploy.md
.claude/skills/deploy/SKILL.md
```

Every skill you can invoke is a slash command. What makes a skill feel like a "command" is how it's invoked: you type `/name`, and Claude doesn't load it on its own.

`.claude/commands/*.md` files still work, but prefer a skill directory for new work. A skill directory can hold supporting files (scripts, reference docs), and a skill accepts every frontmatter field. A command file accepts the same fields except `name` and `paths`. If a skill and a command file share a name, the skill wins.

Built-in commands such as `/help`, `/compact` and `/model` are part of Claude Code. You can't edit them, and this guide doesn't cover them. See the [commands reference](https://code.claude.com/docs/en/commands).

---

## When to Write a Command

Write a command (a skill you invoke yourself) when:

- The workflow has side effects and you want to decide when it runs: committing, deploying, posting a message, rewriting many files.
- You run the same prompt often and want to type `/name` instead of pasting it.
- The prompt needs inputs you supply each time, like an issue number or a file name.

Let Claude invoke it instead (a normal skill) when the content is knowledge Claude should apply whenever it's relevant, such as coding conventions. See the [Skill Creation Guide](skill-creation.md).

---

## Where Command Files Live

| Location | Path | Invoke as |
|----------|------|-----------|
| Project | `.claude/skills/<name>/SKILL.md` | `/<name>` |
| Project, older format | `.claude/commands/<name>.md` | `/<name>` |
| Project, older format, in a subfolder | `.claude/commands/frontend/component.md` | `/frontend:component` |
| Personal (all your projects) | `~/.claude/skills/<name>/SKILL.md` | `/<name>` |
| Plugin | `plugins/<plugin>/skills/<name>/SKILL.md` | `/<plugin>:<name>` |

Commit `.claude/skills/` to share project commands with your team.

In this repository, commands ship inside skill plugins. After you install a plugin, its skills run with the plugin prefix. For example:

```text
/plugin install dotnet --marketplace atc-net/atc-agentic-toolkit
/dotnet:format-params
```

The one-step install needs Claude Code 2.1.275 or newer. On older versions, run `/plugin marketplace add atc-net/atc-agentic-toolkit` and then `/plugin install dotnet@atc-agentic-toolkit`.

A plugin can also have a `commands/` folder of flat Markdown files. Claude Code still loads it, but its docs recommend `skills/` for new plugins, and no plugin in this repository uses `commands/`.

---

## Write Your First Command

This command fixes a GitHub issue by number. Save it as `.claude/skills/fix-issue/SKILL.md`:

```markdown
---
description: Fix a GitHub issue by number, following this repo's coding standards
disable-model-invocation: true
argument-hint: "[issue-number]"
---

Fix GitHub issue $ARGUMENTS.

1. Read the issue with `gh issue view $ARGUMENTS`.
2. Find the code involved and make the smallest change that fixes it.
3. Add or update tests that cover the fix.
4. Run the tests and report the result.
```

Then run it:

```text
/fix-issue 123
```

Claude receives the body with `$ARGUMENTS` replaced by `123`. The folder name gives the command its name. `disable-model-invocation: true` means only you can start it.

Keep the body short and direct. Once a command runs, its text stays in the conversation and costs tokens on every later turn.

---

## Frontmatter for Commands

All fields are optional. These are the ones most useful for commands. The [Skill Anatomy Reference](../reference/skill-anatomy.md) lists every field.

| Field | Use |
|-------|-----|
| `description` | What the command does. Shown in the `/` menu. If you leave it out, Claude Code uses the first line of the body. |
| `argument-hint` | Hint shown during autocomplete, e.g. `"[issue-number]"` or `"[filename] [format]"`. |
| `arguments` | Names for positional arguments, e.g. `arguments: [issue, branch]`, so the body can use `$issue` and `$branch`. |
| `disable-model-invocation` | `true` stops Claude from running the command on its own. Use it for anything with side effects. |
| `allowed-tools` | Tools Claude can use without asking during the turn that runs the command, e.g. `Bash(git add *) Bash(git commit *)`. |
| `model` | Model to use for the rest of that turn, e.g. `haiku` for a cheap formatting task. |
| `effort` | Effort level for the command: `low`, `medium`, `high`, `xhigh` or `max`. |
| `context` / `agent` | `context: fork` runs the command in a subagent of type `agent` (e.g. `Explore`). The subagent doesn't see your conversation. |
| `shell` | Shell for `!` commands: `bash` (default) or `powershell`. |

Field names must match exactly. Claude Code ignores an unknown field without an error, so a typo fails silently.

---

## Arguments

Text after the command name becomes its arguments.

| Placeholder | Expands to |
|-------------|------------|
| `$ARGUMENTS` | The full argument string as typed |
| `$ARGUMENTS[0]`, `$ARGUMENTS[1]`, ... | One argument by position, starting at 0 |
| `$0`, `$1`, ... | Short form of `$ARGUMENTS[N]` |
| `$name` | A named argument declared in the `arguments` field |

Arguments split on spaces, with shell-style quoting:

```markdown
---
description: Migrate a component from one language to another
argument-hint: "[component] [from] [to]"
disable-model-invocation: true
---

Migrate the $0 component from $1 to $2. Preserve all existing behaviour and tests.
```

```text
/migrate-component SearchBar JavaScript TypeScript
/migrate-component "Search Bar" JavaScript TypeScript
```

Rules worth knowing:

- If you pass arguments but the body has no placeholder, Claude Code appends `ARGUMENTS: <your input>` to the end, so Claude still sees them.
- An indexed placeholder with no matching argument (`$2` when you passed one) stays as literal text. A named placeholder with no matching argument becomes an empty string.
- To write a literal `$1.00` in the body, escape it: `\$1.00`.

Other substitutions work in commands too, such as `${CLAUDE_SKILL_DIR}` (the skill's folder) and `${CLAUDE_PROJECT_DIR}` (the project root). See [String Substitutions](../reference/skill-anatomy.md#string-substitutions).

---

## Inject Live Context with `!`

`` !`command` `` runs a shell command before Claude sees the command text and puts the output in its place. Claude gets real data, not an instruction to go and fetch it.

```markdown
---
description: Suggest a commit message for the staged changes
disable-model-invocation: true
allowed-tools: Bash(git diff *) Bash(git log *)
---

## Staged changes

!`git diff --cached --stat`

!`git diff --cached`

## Recent commits

!`git log --oneline -10`

## Task

Suggest a conventional commit message for the staged changes above, matching the style of the recent commits.
```

For several commands, use a fenced block opened with ` ```! `:

````markdown
```!
dotnet --version
git status --short
```
````

How it behaves:

- The `!` must be at the start of a line or follow whitespace.
- If any command fails (non-zero exit), the whole command is aborted and Claude sees nothing. Append `|| true` to a command that can legitimately exit non-zero.
- Injected commands don't prompt for permission. Outside auto mode, a command that your permission rules don't allow aborts the run, so list it in `allowed-tools`.
- On Windows without Git Bash, the commands run through PowerShell. Setting `shell: bash` there makes the command fail. Commands like `git` and `dotnet` work in both shells, so prefer them to bash-only tools.
- The `disableSkillShellExecution` setting turns this off. Each command is then replaced with `[shell command execution disabled by policy]`.

---

## Reference Files

To point a command at files that ship with it, put them in the skill folder and link to them with a relative path, or use `${CLAUDE_SKILL_DIR}` in a command:

```markdown
Follow the rules in [references/style.md](references/style.md).

Run `python ${CLAUDE_SKILL_DIR}/scripts/check.py` and fix what it reports.
```

The Claude Code docs also mention that, in a local skill, Claude Code attaches files named by `@path` references in the body. They don't describe this in more detail, so test it before you rely on it. A link or `${CLAUDE_SKILL_DIR}` path is the documented way to reach bundled files.

---

## Examples in This Repository

| Skill | What it shows |
|-------|---------------|
| [interview](../../plugins/common/skills/interview/SKILL.md) | `disable-model-invocation`, `argument-hint` and `$ARGUMENTS` in one command |
| [suggest-commit](../../plugins/git/skills/suggest-commit/SKILL.md) | A user-only command that runs git and prints a suggestion |
| [suggest-pr](../../plugins/git/skills/suggest-pr/SKILL.md) | The same pattern for pull request descriptions |
| [format-params](../../plugins/dotnet/skills/format-params/SKILL.md) | A user-only command that rewrites files across a project |
| [fix-trailing-newlines](../../plugins/dotnet/skills/fix-trailing-newlines/SKILL.md) | A skill with a bundled script in `scripts/` |

---

## Testing Commands

1. Type `/` and check that the command shows up with its description and argument hint. If it's missing, check the folder name for odd characters and run `claude --debug`.
2. Run it with typical arguments, with none, and with a quoted multi-word argument.
3. Check that `disable-model-invocation: true` holds: ask for the task in plain words and confirm Claude doesn't start the command on its own.
4. Check the frontmatter parses: `claude plugin validate .claude/skills` for project commands, or `claude plugin validate plugins/<plugin>/skills` for a plugin in this repo (Claude Code 2.1.233+). If the YAML is broken, the command still runs but without its frontmatter.

Claude Code picks up edits to `.claude/skills/` and `~/.claude/skills/` during a session. For a plugin you're developing, run `/reload-plugins` after a change.

---

## Checklist

- [ ] Lives in `.claude/skills/<name>/SKILL.md` (or a plugin's `skills/`), not a new `.claude/commands/` file
- [ ] Folder name is lowercase with hyphens and says what the command does
- [ ] `description` and `argument-hint` are set
- [ ] `disable-model-invocation: true` if it has side effects
- [ ] `allowed-tools` lists every `!` command and tool it needs, and nothing more
- [ ] Every argument placeholder is filled by the examples you tested
- [ ] `!` commands work in both bash and PowerShell, or `shell` is set

---

## Next Steps

- [Skill Creation Guide](skill-creation.md) for skills Claude invokes on its own
- [Skill Anatomy Reference](../reference/skill-anatomy.md) for every frontmatter field
- [Plugin Development Guide](plugin-development.md) to package commands in a plugin
- [Plugin Structure Reference](../reference/plugin-structure.md#commands) for the `commands/` folder in plugins
- [Skills in the Claude Code docs](https://code.claude.com/docs/en/skills)
