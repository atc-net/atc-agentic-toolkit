# ATC Progress Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot.

## Overview

atc-progress adds two things to Claude Code:

- **A plan bar above the prompt.** It shows the implementation plan you're working on: its goal, a progress bar, the current phase, and how many tasks are done out of the total. It reads `plan/*.md` files in the format the [`common:create-implementation-plan`](../common/skills/create-implementation-plan/SKILL.md) skill writes. The bar updates as soon as Claude (or a subagent) writes or edits the plan file, and is checked again at the end of every turn. The skill needs no changes.
- **A subagents pane** (`/atc-progress`). It lists every subagent that is running or has finished, each with its type, task, model, effort, context fill, tokens, estimated cost and elapsed time. While subagents run and no plan is active, a small "N subagents running" row shows above the prompt instead.

```text
● Add a demo feature…   ███████████░░░░░░░░░░░   Phase 2/3   Tasks 3/7   43%   continue   agents 2 running   x
```

## Install

```text
/plugin install atc-progress --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## How the plan bar finds a plan

The bar follows the newest plan by itself until you choose one. After that, the plan you chose stays.

### Following (the default)

- When a session starts, it reads `<cwd>/plan/*.md` and picks the newest plan whose front matter says `status: 'In progress'`. If there is none, it picks the newest `Planned` one.
- Any `Write` or `Edit` to a `plan/*.md` file makes that plan the active one and redraws the bar.
- At the end of every turn, the newest file in `plan/` takes over the bar if it was changed after the active plan and is `In progress` or `Planned`. That catches plans written by the shell or by hand, too.

### Pinned (after you choose a plan)

- Picking a plan in `/atc-progress plans`, or using `/atc-progress plan <path>`, `/atc-progress continue [path]` or the `continue` button, **pins** that plan. The bar shows `pinned`.
- A pinned plan stays on the bar until you pick another one. The rules above don't move it, though it still updates as its tasks are ticked.
- If Claude writes a different plan file meanwhile, a toast names it (once per file) and the bar stays where it is.
- `/atc-progress plan` with no path unpins, and the bar goes back to following. A new session always starts unpinned.

### Reading a plan

- Phases are `### Implementation Phase N` headings with a `Status:` line. Tasks are `| TASK-… |` table rows, and a ✅ in the `Completed` column marks a task done. The column is found from the table header, so a `|` inside a description (a pipeline in a code span, say) doesn't throw the count off.
- The current phase is the first one marked `In progress`. If none is, it's the first one not marked `Complete`.
- When every task is ticked, or the plan's status is `Completed`, the bar turns green with a ✓.

## Commands

| Command | What it does |
|---------|--------------|
| `/atc-progress` | Show or hide the subagents pane. When another pane is in front of it, this brings it forward. |
| `/atc-progress open` / `close` | Open (or bring forward) / close the pane |
| `/atc-progress plans` | List every plan under `plan/` (in progress first, then planned, then the rest) in a picker. Press a number, or use Tab/arrows and Enter, to pin one to the bar. Claude is told which plan you picked. Esc closes |
| `/atc-progress plan <path>` | Pin a specific plan file to the bar. Claude also gets a note saying which plan the bar now tracks, so "continue the plan" means that one |
| `/atc-progress plan` | Unpin, rescan `plan/*.md`, and follow the newest plan in progress again |
| `/atc-progress continue [path]` | Put a ready-made "continue this plan" prompt in the input box: pick up at the first phase that isn't Complete, run each phase's verification, tick tasks with ✅. Press Enter to send it, or edit it first. Pins the plan; with a path, it switches the bar to that plan first |
| `/atc-progress hide` / `show` | Hide / show the plan bar (`x` on the bar hides it too) |
| `/atc-progress help` | List these commands |

The `continue` button on the bar does the same as `/atc-progress continue`. It shows only while Claude is idle and the plan isn't finished. The `agents` button toggles the pane.

### Switching between plans

```text
/atc-progress plans                              # pick a plan from the list (or: /atc-progress plan plan/feature-billing-2.md)
/atc-progress continue                           # prompt box: "Continue implementing plan/feature-billing-2.md …" → Enter
```

Or in one step: `/atc-progress continue plan/feature-billing-2.md`.

## Settings

The install asks for these. Change them later in `/config`, where each one is a row under atc-progress.

| Option | Values | Default | Meaning |
|--------|--------|---------|---------|
| `autoOpen` | `off`, `agents` | `off` | `agents` opens the subagents pane by itself, once per session, when the first subagent starts. With `off`, open it yourself with `/atc-progress` or the `agents` button |

The pane docks beside the transcript in the fullscreen terminal layout (`/tui fullscreen`) once the terminal is at least 110 columns wide. Otherwise it opens inline above the prompt.

## Try it

Use a scratch project for this, because the steps below create `plan/` files and write code.

1. **Plan bar:**
   - `Use /common:create-implementation-plan to plan adding a health-check endpoint`: the bar appears as soon as the plan file is written.
   - `/atc-progress continue` (or the `continue` button), then Enter: Claude works through the plan and the bar moves with every ✅.
2. **Several plans:** ask for a second plan, then run `/atc-progress plans` and pick the first one. It shows `pinned` and stays on the bar, even when Claude writes to the other plan.
3. **Subagents pane:** `Use 3 Explore agents in parallel to describe the files in this project`, then run `/atc-progress` (or press the `agents` button). Each agent shows as `●` while it runs and `✓` when it's done, with live tokens and estimated cost.

## Turn it off

`/plugin` → atc-progress → Disable, or from a shell `claude plugin disable atc-progress@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-progress@atc-agentic-toolkit`.

## Cost estimate

Cost is a rough estimate based on token counts and list prices (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1, as of 2026-10). Cache writes are priced at the one-hour rate. It isn't a bill, and on a subscription nothing extra is charged.

## Develop

Run a local copy for one session without installing it. Use the absolute path to your clone, so it works from any project, and repeat the flag to load several mods. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-progress
```

For a mod loaded this way, set options in `~/.claude/settings.json`:

```json
{ "pluginConfigs": { "atc-progress": { "options": { "autoOpen": "agents" } } } }
```

Check and test:

```bash
claude plugin validate plugins/atc-progress
claude plugin test plugins/atc-progress
```
