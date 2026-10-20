# Skill Anatomy Reference

Field-by-field reference for the `SKILL.md` format: frontmatter, substitutions, body syntax and supporting files. For a step-by-step walkthrough, see the [Skill Creation Guide](../guides/skill-creation.md).

Sources: the [Claude Code skills docs](https://code.claude.com/docs/en/skills) and the [Agent Skills specification](https://agentskills.io/specification).

## Table of Contents

- [Standards](#standards)
- [Directory Layout](#directory-layout)
- [SKILL.md Structure](#skillmd-structure)
- [Frontmatter: Agent Skills Fields](#frontmatter-agent-skills-fields)
- [Frontmatter: Claude Code Fields](#frontmatter-claude-code-fields)
- [Fields That Don't Exist](#fields-that-dont-exist)
- [Name Rules](#name-rules)
- [Command Names](#command-names)
- [Invocation Control](#invocation-control)
- [String Substitutions](#string-substitutions)
- [Body Syntax](#body-syntax)
- [Supporting Files](#supporting-files)
- [Progressive Disclosure and Size Limits](#progressive-disclosure-and-size-limits)
- [Where Skills Live](#where-skills-live)
- [Validation](#validation)
- [Examples](#examples)
- [Resources](#resources)

---

## Standards

Skills follow the open [Agent Skills](https://agentskills.io) standard. The standard defines six frontmatter fields and the folder layout. Claude Code accepts all of them and adds its own fields and body features on top.

This repository writes skills to the standard and uses Claude Code fields where they help. The same skill folders are published to both Claude Code and GitHub Copilot, so keep in mind that other tools are only guaranteed the six standard fields.

---

## Directory Layout

```text
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── references/       # Optional: docs Claude reads when needed
├── scripts/          # Optional: code Claude runs
├── assets/           # Optional: templates, images, data used in output
└── ...               # Any other files or folders
```

Only `SKILL.md` is required. The other folder names are conventions from the standard, not rules. For example, [skill-creator](../../plugins/common/skills/skill-creator/) also has `agents/` and `eval-viewer/`.

---

## SKILL.md Structure

```markdown
---
name: skill-name
description: What the skill does. Use when ...
---

# Skill Title

Instructions for Claude.
```

- Frontmatter is YAML between `---` markers. Claude Code reads it only when the opening `---` is the first line of the file. Otherwise the whole file is treated as body text.
- If the YAML doesn't parse, the skill still loads, but with no fields set. `/name` works; automatic triggering doesn't, because there's no description to match.
- The body is Markdown with no required sections.
- Boolean fields accept `true`/`false`, `yes`/`no`, `on`/`off` and `1`/`0` (Claude Code 2.1.218+; earlier versions only `true`/`false`).

---

## Frontmatter: Agent Skills Fields

Defined by the [Agent Skills specification](https://agentskills.io/specification). These are the only fields accepted by claude.ai skill uploads, the Skills API and `package_skill.py`. Any other field makes those paths fail with `Unexpected key(s) in SKILL.md frontmatter`.

| Field | Spec | Claude Code | Constraints |
|-------|------|-------------|-------------|
| `name` | Required | Optional; defaults to the folder name | 1-64 characters; see [Name Rules](#name-rules) |
| `description` | Required | Recommended | Spec: 1-1024 characters. Say what the skill does and when to use it. |
| `license` | Optional | Accepted, not acted on | License name or bundled file, e.g. `MIT` or `Complete terms in LICENSE.txt` |
| `compatibility` | Optional | Accepted, not acted on | 1-500 characters. Environment needs, e.g. `Requires network access` |
| `metadata` | Optional | Accepted, not acted on | Map of string keys to string values, e.g. `author`, `version` |
| `allowed-tools` | Optional (experimental) | Pre-approves tools | Spec: space-separated string. Claude Code also accepts commas or a YAML list. |

`allowed-tools` in Claude Code grants permission only for the turn that invokes the skill. It doesn't restrict which tools Claude can use; your permission settings still apply to everything else. The grant ends when you send your next message.

---

## Frontmatter: Claude Code Fields

Claude Code extensions. Other tools may ignore them or reject them.

| Field | Default | Description |
|-------|---------|-------------|
| `when_to_use` | none | Extra trigger context (phrases, example requests), appended to `description` in the listing. Note the underscores. |
| `argument-hint` | none | Autocomplete hint, e.g. `"[issue-number]"`. |
| `arguments` | none | Names for positional arguments, as a space-separated string or YAML list. `arguments: [issue, branch]` makes `$issue` the first argument. |
| `disable-model-invocation` | `false` | `true`: only the user can invoke it with `/name`. The description leaves Claude's context. Also stops it being preloaded into subagents. |
| `user-invocable` | `true` | `false`: hidden from the `/` menu; only Claude invokes it. For background knowledge. |
| `disallowed-tools` | none | Tools removed while the skill is active. Clears on your next message. |
| `model` | session model | Model for the rest of the current turn. Same values as `/model`, or `inherit`. With `context: fork`, sets the subagent's model. |
| `effort` | session effort | `low`, `medium`, `high`, `xhigh` or `max`, depending on the model. |
| `context` | inline | `fork` runs the skill in a subagent. The skill body becomes the subagent's task; it doesn't see your conversation. |
| `agent` | `general-purpose` | Subagent type for `context: fork`: `Explore`, `Plan`, `general-purpose`, or a custom agent from `.claude/agents/`. |
| `background` | `true` | With `context: fork`, `false` waits for the subagent's result in the same turn (2.1.218+). |
| `hooks` | none | Hooks registered when the skill is invoked, kept for the rest of the session. Same format as hooks in settings; `once: true` removes a hook after its first successful run. See [Hooks in skills and agents](https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents). |
| `paths` | none | Glob patterns. When set, Claude loads the skill automatically only while working with matching files. |
| `shell` | `bash` | Shell for `!` commands: `bash` or `powershell`. |

Notes:

- Field names must match exactly. Claude Code ignores an unknown field without an error.
- A command file in `.claude/commands/` accepts every field except `name` and `paths`.
- The combined `description` and `when_to_use` text is cut at 1,536 characters in the skill listing.

A `hooks` example:

```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

---

## Fields That Don't Exist

Earlier versions of this page listed fields that neither Claude Code nor the standard defines. Claude Code ignores them, and claude.ai uploads reject them:

| Not a field | Use instead |
|-------------|-------------|
| `version`, `author` | `metadata: { version: "1.0", author: ATC-Net }` |
| `namespace` | Nothing. Plugin skills are namespaced by the plugin name automatically. |
| `category`, `keywords` | Put trigger words in `description` or `when_to_use`. |

---

## Name Rules

The standard's rules for `name`:

- 1-64 characters
- Lowercase letters `a-z`, digits `0-9` and hyphens only
- Doesn't start or end with a hyphen, and has no `--`
- Matches the parent folder name

Claude Code is less strict, but follow the standard so the skill works everywhere. Claude Code refuses names with control characters, zero-width or private-use characters, direction marks, unusual spaces, `<` or `>`. It also reserves `synced` and `anthropic-skills`.

---

## Command Names

Every skill a user can invoke is also a slash command:

| Skill location | Command |
|----------------|---------|
| `.claude/skills/deploy/SKILL.md` | `/deploy` (or `/<name>` if `name` is set) |
| `.claude/commands/deploy.md` | `/deploy` |
| `.claude/commands/frontend/component.md` | `/frontend:component` |
| `apps/web/.claude/skills/deploy/SKILL.md`, clashing with a root `deploy` | `/apps/web:deploy` |
| `plugins/dotnet/skills/format-params/SKILL.md` | `/dotnet:format-params` |

When names collide: enterprise beats personal, personal beats project, and a skill beats a `.claude/commands/` file with the same name. Plugin skills never collide, because they carry the plugin prefix.

---

## Invocation Control

| Frontmatter | User can invoke | Claude can invoke | In context |
|-------------|-----------------|-------------------|------------|
| (default) | Yes | Yes | Description always; body when invoked |
| `disable-model-invocation: true` | Yes | No | Nothing until invoked |
| `user-invocable: false` | No | Yes | Description always; body when invoked |

In this repository, knowledge skills such as [csharp-conventions](../../plugins/dotnet/skills/csharp-conventions/SKILL.md) and the Azure skills set `user-invocable: false`. Action skills such as [suggest-commit](../../plugins/git/skills/suggest-commit/SKILL.md) set `disable-model-invocation: true`.

---

## String Substitutions

Replaced in the body before Claude sees it:

| Variable | Value |
|----------|-------|
| `$ARGUMENTS` | Full argument string as typed. If the body has no placeholder, Claude Code appends `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` | Argument by 0-based position. Shell-style quoting: `"hello world"` is one argument. |
| `$N` | Short form of `$ARGUMENTS[N]`: `$0`, `$1`, ... |
| `$name` | Named argument from the `arguments` field |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `${CLAUDE_EFFORT}` | Current effort level |
| `${CLAUDE_SKILL_DIR}` | Folder that contains this `SKILL.md` |
| `${CLAUDE_PROJECT_DIR}` | Project root |
| `${CLAUDE_PLUGIN_ROOT}` | Plugin install folder (plugin skills only) |
| `${CLAUDE_PLUGIN_DATA}` | Plugin's persistent data folder (plugin skills only) |

- `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}` and the plugin variables are also substituted in `Bash(...)` rules in `allowed-tools`. That lets a skill pre-approve its own script: `allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/render.sh *)`.
- An indexed placeholder with no argument stays as literal text. A named one becomes empty.
- Escape a literal `$` before a digit, `ARGUMENTS` or an argument name with a backslash: `\$1.00`.

---

## Body Syntax

| Syntax | Effect | Notes |
|--------|--------|-------|
| `` !`command` `` | Runs the command before Claude sees the skill; output replaces it | Must start a line or follow whitespace. A failure aborts the whole invocation. |
| ` ```! ` fenced block | Same, for several lines | |
| `@path` | In a local skill, Claude Code attaches the named file | Mentioned in the docs only in passing; prefer links or `${CLAUDE_SKILL_DIR}` for bundled files |
| `ultrathink` | Asks for deeper reasoning when the skill runs | |
| Relative links, e.g. `[schema](references/schema.md)` | Tells Claude where a supporting file is and when to read it | Standard; works everywhere |

`!` injection, `context: fork` and the other Claude Code features don't work in claude.ai chat or the API. The `disableSkillShellExecution` setting turns `!` injection off. In skills synced from claude.ai, `!` commands and `@` references aren't run or attached in local sessions.

---

## Supporting Files

| Folder | Holds | Loaded |
|--------|-------|--------|
| `references/` | Docs, schemas, API specs, policies | Claude reads a file when the body points to it and the task needs it |
| `scripts/` | Python, PowerShell, Bash, JavaScript... | Run, usually without being read into context |
| `assets/` | Templates, images, data files used in output | Copied or read when producing output |

Rules from the standard:

- Link files from `SKILL.md` with relative paths from the skill root, and say what each one is for.
- Keep references one level deep from `SKILL.md`. Avoid chains of files that point to more files.
- Keep each reference file focused. Smaller files cost less context.
- Scripts should state their dependencies and give helpful error messages.

In this repository, scripts must run on Windows, macOS and Linux. Prefer Python or PowerShell 7 over bash-only tools.

---

## Progressive Disclosure and Size Limits

A skill loads in three stages:

| Stage | What | Size guidance |
|-------|------|---------------|
| 1. Listing | `name` and `description` (+ `when_to_use`) of every skill, every turn | About 100 tokens per skill (standard). Claude Code cuts each entry at 1,536 characters. |
| 2. Body | The whole `SKILL.md` body, when the skill is invoked | Under 5,000 tokens recommended (standard); under 500 lines (both) |
| 3. Resources | Files in `references/`, `scripts/`, `assets/`, as the task needs them | No fixed limit |

Claude Code limits that affect skill design:

- The whole listing has a budget of 1% of the model's context window. When it overflows, the descriptions of the least-used skills are dropped first. Use `/skill-doctor` to see each skill's cost and usage.
- Once invoked, the body stays in the conversation. Claude Code doesn't re-read the file on later turns.
- After compaction, Claude Code keeps the first 5,000 tokens of each invoked skill, within a total of 25,000 tokens. Put the most important instructions first.

---

## Where Skills Live

| Location | Path |
|----------|------|
| Enterprise | `.claude/skills/<name>/SKILL.md` in the managed settings folder |
| Personal | `~/.claude/skills/<name>/SKILL.md` |
| Project | `.claude/skills/<name>/SKILL.md`, also in parent folders up to the repo root |
| Nested | `<subdir>/.claude/skills/<name>/SKILL.md`, loaded once Claude works on files there |
| Plugin | `<plugin>/skills/<name>/SKILL.md` |
| Older command format | `.claude/commands/<name>.md` |

In this repository: `plugins/<plugin>/skills/<name>/SKILL.md`, with `plugin.json` at the plugin root pointing at `./skills/`. See the [Plugin Structure Reference](plugin-structure.md).

---

## Validation

| Tool | Checks |
|------|--------|
| `claude plugin validate plugins/<plugin>` | The plugin's manifest and files |
| `claude plugin validate <skills folder>` | Finds `SKILL.md` files whose frontmatter doesn't parse, e.g. `.claude/skills`, `~/.claude/skills` or `plugins/<plugin>/skills` (Claude Code 2.1.233+) |
| `skills-ref validate ./my-skill` | Frontmatter against the Agent Skills standard ([skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref)) |
| `claude --debug` | Shows YAML parse errors and refused names in the debug log |

The [skill-creator](../../plugins/common/skills/skill-creator/) skill has two scripts that check frontmatter:

- `quick_validate.py <skill folder>` accepts the standard fields and Claude Code's.
- `quick_validate.py <skill folder> --strict` accepts the standard fields only, as a claude.ai upload needs.
- `package_skill.py` builds a `.skill` file for upload, so it always checks strictly.

For testing behaviour rather than format (`claude plugin eval`, skill-creator evals, `/skill-doctor`), see [Testing a Skill](../guides/skill-creation.md#testing-a-skill).

---

## Examples

Minimal, standard-only:

```yaml
---
name: cosmosdb-indexing
description: >
  Azure Cosmos DB indexing strategy best practices: excluding unused paths,
  composite indexes for ORDER BY, spatial indexes, index types, path syntax,
  and indexing modes (consistent vs lazy).
  USE FOR: Cosmos DB indexing policy, exclude paths, composite index ...
  DO NOT USE FOR: query optimization (use cosmosdb-query-optimization) ...
---
```

From [cosmosdb-indexing](../../plugins/cosmosdb/skills/cosmosdb-indexing/SKILL.md) (description shortened here).

Background knowledge with an environment note, as in the Azure skills:

```yaml
---
name: azure-functions
description: Expert knowledge for Azure Functions development ... Use when wiring Functions to HTTP/storage/queues ...
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
```

A user-only command with arguments, from [interview](../../plugins/common/skills/interview/SKILL.md):

```yaml
---
name: interview
description: Conduct a structured interview about a feature or topic to gather requirements and produce a specification. ...
disable-model-invocation: true
argument-hint: "<topic or feature description>"
---
```

Pre-approved tools, from [playwright-cli](../../plugins/playwright/skills/playwright-cli/SKILL.md):

```yaml
---
name: playwright-cli
description: >
  Automate browser interactions, test web pages and work with Playwright tests using the playwright-cli command. ...
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)
---
```

Using more Claude Code fields (illustrative, not from this repo):

```yaml
---
name: pr-summary
description: Summarize the changes in the current pull request. Use when the user asks what a PR does.
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context

- Diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`

## Task

Summarize this pull request in five bullets or fewer.
```

---

## Resources

- [Skill Creation Guide](../guides/skill-creation.md)
- [Command Creation Guide](../guides/command-creation.md)
- [Plugin Structure Reference](plugin-structure.md)
- [Marketplace Config Reference](marketplace-config.md)
- [Claude Code skills docs](https://code.claude.com/docs/en/skills)
- [Agent Skills specification](https://agentskills.io/specification)
