# Skill Creation Guide

How to write a skill for Claude Code, from first idea to a tested skill in a plugin. For every frontmatter field and limit, see the [Skill Anatomy Reference](../reference/skill-anatomy.md).

## Table of Contents

- [What a Skill Is](#what-a-skill-is)
- [When to Create a Skill](#when-to-create-a-skill)
- [Where to Put It](#where-to-put-it)
- [Step 1: Collect Real Examples](#step-1-collect-real-examples)
- [Step 2: Create the Folder](#step-2-create-the-folder)
- [Step 3: Write the Description](#step-3-write-the-description)
- [Step 4: Choose Who Invokes It](#step-4-choose-who-invokes-it)
- [Step 5: Write the Body](#step-5-write-the-body)
- [Step 6: Move Detail into Supporting Files](#step-6-move-detail-into-supporting-files)
- [Testing a Skill](#testing-a-skill)
- [Adding a Skill to This Repository](#adding-a-skill-to-this-repository)
- [Examples to Copy](#examples-to-copy)
- [Next Steps](#next-steps)

---

## What a Skill Is

A skill is a folder with a `SKILL.md` file: YAML frontmatter that says what it's for, and Markdown instructions Claude follows. Claude sees every skill's name and description, and loads the full instructions only when a task calls for it, or when you type `/skill-name`.

Skills follow the open [Agent Skills](https://agentskills.io) standard, so the same folder can work in other tools. Claude Code adds extra fields and features on top.

Custom slash commands are skills too. If you want something you trigger yourself with arguments, read the [Command Creation Guide](command-creation.md).

---

## When to Create a Skill

Create a skill when:

- You keep pasting the same instructions, checklist or procedure into chat.
- A section of `CLAUDE.md` or `AGENTS.md` has grown into a procedure rather than a fact. A skill's body costs almost nothing until it's used; `CLAUDE.md` is loaded every session.
- Claude needs domain knowledge it doesn't have: your conventions, a schema, an internal API.
- A task needs a script that should run the same way every time.

Use something else when:

- **A rule must hold every time**, such as "never edit generated files". Use a [hook](https://code.claude.com/docs/en/hooks-guide). Claude can stop following a skill; a hook always runs.
- **You want to change Claude Code itself**, such as a status line, a panel or a toast. That's a mod: see the [Mod Creation Guide](mod-creation.md).
- **The task needs its own context and tools**. Use a subagent: see the [Agent Creation Guide](agent-creation.md).

---

## Where to Put It

| Scope | Path |
|-------|------|
| Just you, all projects | `~/.claude/skills/<name>/SKILL.md` |
| One repository (commit it) | `.claude/skills/<name>/SKILL.md` |
| Shared through a plugin | `<plugin>/skills/<name>/SKILL.md` |

In this repository, skills live in plugins: `plugins/<plugin>/skills/<name>/SKILL.md`. Plugin skills run as `/<plugin>:<name>`, for example `/common:excalidraw`.

While drafting, a project or personal skill is quickest to try: Claude Code picks up edits to `.claude/skills/` and `~/.claude/skills/` without a restart. Move it into a plugin when it works.

---

## Step 1: Collect Real Examples

Before writing anything, write down three to five things a user would actually type that should trigger the skill, and one or two that shouldn't. For a migrations skill:

- Should trigger: "add a migration for the new Orders table", "why did my EF migration drop a column?"
- Shouldn't trigger: "write a SQL query for monthly totals"

Then do one of those tasks with Claude without a skill, and note what you had to explain or correct. That list is what the skill must contain. Anything Claude already does well doesn't need to be in it.

---

## Step 2: Create the Folder

The folder name is the skill name: lowercase letters, digits and hyphens, at most 64 characters. Set `name` to the same value; the standard requires it to match.

```text
plugins/dotnet/skills/ef-migrations/
└── SKILL.md
```

Start with only `SKILL.md`. Add `references/` or `scripts/` later if the skill needs them.

The [skill-creator](../../plugins/common/skills/skill-creator/SKILL.md) skill in the `common` plugin can do this step and the next ones with you. Ask Claude to "create a skill for EF Core migrations", or run `/common:skill-creator`.

---

## Step 3: Write the Description

The description decides whether Claude uses the skill. Claude reads it next to every other skill's description and picks the ones that fit the task.

```yaml
---
name: ef-migrations
description: Create, review and troubleshoot Entity Framework Core migrations. Use when the user adds or changes entities, asks for a migration, or a migration fails or drops data unexpectedly.
---
```

Guidelines:

- Say what it does, then when to use it ("Use when ...").
- Put the main use case first. Claude Code cuts each listing entry at 1,536 characters, and drops descriptions of rarely used skills when there are too many. The standard allows at most 1,024 characters, so stay under that.
- Use the words users actually type: product names, file extensions, error codes.
- Say what it's not for when a neighbouring skill could be confused with it. Many skills here use a `USE FOR:` / `DO NOT USE FOR:` pattern, as in [cosmosdb-indexing](../../plugins/cosmosdb/skills/cosmosdb-indexing/SKILL.md).
- Avoid vague text like "Helps with databases".

If you need more trigger text, Claude Code also reads a `when_to_use` field, but other tools don't.

---

## Step 4: Choose Who Invokes It

| You want | Set | Example here |
|----------|-----|--------------|
| Claude uses it when relevant, and users can type `/name` | Nothing (default) | [excalidraw](../../plugins/common/skills/excalidraw/SKILL.md) |
| Background knowledge Claude applies; not a command | `user-invocable: false` | [csharp-conventions](../../plugins/dotnet/skills/csharp-conventions/SKILL.md) |
| Only the user starts it, because it has side effects | `disable-model-invocation: true` | [suggest-commit](../../plugins/git/skills/suggest-commit/SKILL.md) |

Other options, all Claude Code only:

- `allowed-tools` pre-approves tools for the turn the skill runs in, so Claude doesn't ask for each `git` call.
- `paths` loads the skill automatically only when Claude works on matching files, e.g. `"**/*.csproj"`.
- `context: fork` with `agent: Explore` runs the skill in a subagent that doesn't see the conversation. Use it only when the skill is a complete task, not a set of guidelines.
- `model` and `effort` override the model and effort for the skill's turn.

See [Frontmatter: Claude Code Fields](../reference/skill-anatomy.md#frontmatter-claude-code-fields) for the full list.

---

## Step 5: Write the Body

The body is the prompt Claude follows. It stays in the conversation after the skill loads, and Claude Code doesn't re-read the file later. So:

- **Be brief.** Every line is a recurring token cost. State what to do; skip background Claude already knows.
- **Put the most important rules first.** After compaction, Claude Code keeps only the first 5,000 tokens of each skill.
- **Write standing instructions.** "Run the tests after every edit" keeps working on later turns; "Run the tests" may be read as a one-time step.
- **Use numbered steps for procedures,** and give an example of the expected output.
- **Explain the reason for a rule that isn't obvious.** Claude applies a rule better when it knows what it protects against.

```markdown
# EF Core Migrations

## Rules

- Never edit a migration that has been applied to a shared database. Add a new one.
- Name migrations by intent: `AddOrdersTable`, `RenameCustomerEmail`.

## Create a migration

1. Find the `DbContext` and its startup project.
2. Run `dotnet ef migrations add <Name> --project <data> --startup-project <api>`.
3. Read the generated `Up()` and `Down()`. Flag any `DropColumn` or `DropTable` to the user before continuing.

## When a migration fails

See [references/troubleshooting.md](references/troubleshooting.md).
```

Keep `SKILL.md` under 500 lines. If it grows past that, move detail out (next step).

---

## Step 6: Move Detail into Supporting Files

Supporting files are how a skill stays cheap: Claude reads them only when the task needs them. This is progressive disclosure.

| Folder | Put here | Example in this repo |
|--------|----------|----------------------|
| `references/` | Long docs, schemas, API notes, per-topic guidance | [excalidraw/references](../../plugins/common/skills/excalidraw/references/) |
| `scripts/` | Code that must behave the same every time | [excalidraw/scripts](../../plugins/common/skills/excalidraw/scripts/) |
| `assets/` | Templates and files used in the output | [dataverse-connect/assets](../../plugins/dataverse/skills/dataverse-connect/assets/) |

Link each file from `SKILL.md` and say when to read it:

```markdown
- Before choosing colours, read [references/color-palette.md](references/color-palette.md).
- To render a PNG, run `python ${CLAUDE_SKILL_DIR}/scripts/render_excalidraw.py <file>`.
```

- Keep links one level deep. Don't make reference files point to further reference files.
- Don't repeat content: a fact lives in `SKILL.md` or in a reference, not both.
- Use `${CLAUDE_SKILL_DIR}` in commands so the path works wherever the skill is installed.
- Scripts must run on Windows, macOS and Linux. Use Python or PowerShell 7 rather than bash-only tools, and list dependencies (e.g. a `requirements.txt`).

---

## Testing a Skill

Seeing a skill trigger only tells you Claude found it. Test two things separately: does it trigger on the right prompts, and is the result better than without it?

### Try it by hand

1. Start a fresh session, so leftover context from writing the skill doesn't hide gaps.
2. Ask "What skills are available?" and check yours is listed.
3. Type each "should trigger" prompt from step 1 and check Claude loads the skill. Type the "shouldn't trigger" prompts and check it doesn't.
4. Invoke it directly with `/name` (or `/<plugin>:<name>`).
5. Run the same prompts with the skill turned off and compare. For a project or personal skill, set it to `"off"` in `skillOverrides` in your settings. That setting doesn't apply to plugin skills; use `claude plugin eval` for those (below).

If it doesn't trigger, make the description more specific to how users phrase the task. If it triggers too often, narrow the description or set `disable-model-invocation: true`.

### Measure it

- **skill-creator.** The [skill-creator](../../plugins/common/skills/skill-creator/SKILL.md) skill in this repo runs test prompts with and without the skill, grades the results, benchmarks them, and can tune the description. It stores cases in `evals/evals.json` inside the skill folder.
- **`claude plugin eval`.** For skills in a plugin (Claude Code 2.1.269+). From the plugin folder, `claude plugin eval init` drafts eval cases with you, and `claude plugin eval .` runs each case with and without the plugin and reports the difference. A `tool_used: Skill` grader checks the skill was chosen. Runs use your plan or API usage. See [Test plugins with evals](https://code.claude.com/docs/en/plugin-evals). Its case format isn't the same as skill-creator's.
- **`/skill-doctor`.** Shows each skill's context cost and how often it's used, so you can spot skills that never trigger (Claude Code 2.1.252+).

### Check the format

- `claude plugin validate plugins/<plugin>/skills` finds `SKILL.md` files whose frontmatter doesn't parse (Claude Code 2.1.233+).
- `python plugins/common/skills/skill-creator/scripts/quick_validate.py <skill folder>...` checks the name, the description and that every field is one Claude Code knows. Give it `plugins/*/skills/*/` to check every skill in the repository; the [common plugin's README](../../plugins/common/README.md#skill-creator) has the PowerShell form.
- `claude --debug` shows YAML errors and refused names. A skill with broken YAML still loads, but with no description, so it never triggers on its own.

---

## Adding a Skill to This Repository

1. Create `plugins/<plugin>/skills/<name>/SKILL.md`, with `name` matching the folder.
2. Write the description and body as above. Use `user-invocable: false` for knowledge skills and `disable-model-invocation: true` for skills with side effects, as the existing skills do.
3. Add the skill to the plugin's `README.md` under `## Skills`.
4. Run `claude plugin validate plugins/<plugin>` and `claude plugin validate plugins/<plugin>/skills`.
5. Test it as described above.

You don't need to touch the marketplace files to add a skill to an existing plugin: `plugin.json` already points at `./skills/`. A new plugin must be added to both `.claude-plugin/marketplace.json` and `.github/plugin/marketplace.json`; see the [Plugin Development Guide](plugin-development.md).

---

## Examples to Copy

| Skill | Why look at it |
|-------|----------------|
| [skill-creator](../../plugins/common/skills/skill-creator/SKILL.md) | A large skill with `references/`, `scripts/`, `agents/` and `assets/` |
| [excalidraw](../../plugins/common/skills/excalidraw/SKILL.md) | A trigger-rich description, focused references and a render script |
| [cosmosdb-indexing](../../plugins/cosmosdb/skills/cosmosdb-indexing/SKILL.md) | A short skill with `USE FOR` / `DO NOT USE FOR` |
| [csharp-conventions](../../plugins/dotnet/skills/csharp-conventions/SKILL.md) | Background knowledge with `user-invocable: false` |
| [fix-trailing-newlines](../../plugins/dotnet/skills/fix-trailing-newlines/SKILL.md) | A task skill that runs a bundled script |
| [interview](../../plugins/common/skills/interview/SKILL.md) | A user-only skill with arguments |

---

## Next Steps

- [Skill Anatomy Reference](../reference/skill-anatomy.md) for every field, substitution and limit
- [Command Creation Guide](command-creation.md) for skills you invoke with arguments
- [Plugin Development Guide](plugin-development.md) to package skills in a plugin
- [Claude Code Fundamentals](../best-practices/claude-code-fundamentals.md) for context management
- [Skills in the Claude Code docs](https://code.claude.com/docs/en/skills) and [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
