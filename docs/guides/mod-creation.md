# Mod Creation Guide

How to build a Claude Code mod: what one is, how Claude Code runs it, and how to write, test and share one. It's built from the mods in this repository and the lessons they taught.

> [!IMPORTANT]
> Mods require **Claude Code 2.1.287 or newer**, where they are on by default. The old `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` flag is no longer needed and is ignored. Mods don't run in GitHub Copilot.

For every file, field and limit, see the [Mod Anatomy Reference](../reference/mod-anatomy.md).

## Table of Contents

- [What a mod is](#what-a-mod-is)
- [How Claude Code runs a mod](#how-claude-code-runs-a-mod)
- [Build your first mod](#build-your-first-mod)
- [Building blocks](#building-blocks)
- [Rules that keep a mod safe](#rules-that-keep-a-mod-safe)
- [Testing](#testing)
- [Debugging](#debugging)
- [Sharing a mod](#sharing-a-mod)
- [Walk-through: atc-progress](#walk-through-atc-progress)
- [The mods in this repository](#the-mods-in-this-repository)

## What a mod is

A mod is a plugin that changes Claude Code itself while it runs. It's TypeScript (or JavaScript) that hooks into Claude Code's own events: tool calls, prompts, turns, and what the interface draws.

With a mod you can:

- draw a row above the prompt, a side pane, or a toast;
- add slash commands;
- watch, change or refuse tool calls and prompts;
- ask the person a question in Claude Code's own dialog;
- keep state for the session, and data across sessions.

How it compares with the other ways to extend Claude Code:

| You want to… | Use |
|--------------|-----|
| Teach Claude how to do a task | A [skill](skill-creation.md) |
| Give a task to a specialist with its own context | A [subagent](agent-creation.md) |
| Run a shell command on an event (format after edit, notify on stop) | A shell hook in `hooks/hooks.json` or settings |
| Give Claude new tools that talk to a service | An MCP server |
| Change what Claude Code shows, or decide in code what may run | A mod |

## How Claude Code runs a mod

There's no build step. Claude Code reads the `.ts` or `.tsx` file itself, strips the types, and runs the module in a sandbox of its own:

- **No Node and no DOM.** There's no `fs`, `child_process`, `fetch` or `window`. Everything outside the module is reached through `$`, the engine interface: `$.fs`, `$.process.run`, `$.ui`, `$.state`, `$.store`, `$.session` and more.
- **One entry point.** `hooks/hooks.json` names one module, and that module exports `register(on, options)`. Claude Code calls it when the mod loads, and the mod calls `on(event, matcher?, hook)` for each event it wants.
- **Every hook is `($, e, next)`.** `e` is the event's input. `next(e)` passes the event on to the other plugins and then Claude Code's own behaviour, and resolves to the result. A hook can pass the event on unchanged, pass on a changed copy (`next({ ...e, ... })`), or answer by itself without calling `next`.
- **JSX is data, not React.** In a `.tsx` file, JSX compiles to plain data trees through an `h` factory. Claude Code draws the tree on each surface (terminal, desktop app, VS Code, mobile) with that surface's elements, which `$.ui.resolve(e)` hands you. Use `.tsx` only for files that contain JSX, and `.ts` for the rest.
- **Types come with Claude Code.** The whole API is declared in a `claude-code.d.ts` that Claude Code writes beside a mod it loads from a folder you're editing, in `.claude-plugin/types/` with a `tsconfig.json`. Your editor and `tsc` pick it up with no setup. That file is the authority: the API moves between releases.

## Build your first mod

This mod counts the session's tool calls in a row above the prompt, and `/my-counter` resets the count. It passes `claude plugin validate` and `claude plugin test`.

### 1. Create the files

```text
my-counter/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   ├── hooks.json
│   ├── register.tsx
│   └── register.test.tsx
└── types/
    └── index.d.ts
```

`.claude-plugin/plugin.json`:

```json
{
  "name": "my-counter",
  "version": "0.1.0",
  "author": { "name": "you" },
  "description": "Counts this session's tool calls above the prompt; /my-counter resets it",
  "types": "./types/index.d.ts"
}
```

`hooks/hooks.json`:

```json
{ "modules": ["./register.tsx"] }
```

`types/index.d.ts` declares the state the mod keeps. Claude Code only lets a mod write values its contract names:

```ts
/** Tool calls since the session started or the counter was reset. */
export type CallCount = number

declare module 'claude-code' {
  interface PluginState {
    'my-counter': {
      calls: CallCount
    }
  }
}
```

### 2. Write the hooks

`hooks/register.tsx`:

```tsx
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const calls = atom({ plugin: 'my-counter', key: 'calls' } as const, 0)

export const register: Register = on => {
  // Commands are registered once the session is ready.
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'my-counter', description: 'Reset the tool-call counter' })
    return started
  })

  on('command.run', { command: 'my-counter' }, async $ => {
    await update($, calls, () => 0)
    return { text: 'Counter reset.' }
  })

  // Watches every tool call: it always passes the call on, then counts it.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    await update($, calls, n => n + 1)
    return result
  }).catch(($, e, next) => next(e)) // a watcher never blocks a call, even when it fails

  // A row above the prompt. Other mods' rows are drawn beneath it, the engine's placeholder isn't.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const count = await read($, calls)
    if (count === 0 || e.props.hasSurvey) return next(e)
    const below = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text dimColor>{count} tool calls this session</Text>
        {below.type === 'engine' ? null : below}
      </Box>
    )
  })
}
```

What each part does:

- **`atom`** names a value in `$.state`. `update` writes it and `read` reads it.
- **Redraws are automatic.** Reading state while drawing subscribes the drawing, so each `update` redraws the band. Nothing calls a redraw.
- **The band shares its space.** It draws other mods' rows beneath its own, so it doesn't hide atc-progress's bar.

### 3. Run it

```bash
claude --plugin-dir /absolute/path/to/my-counter
```

Ask Claude to read a few files. The count appears above the prompt. Save a file in the folder and the mod reloads in the running session.

### 4. Check and test it

```bash
claude plugin validate my-counter
claude plugin test my-counter
```

`validate` reads the manifest and the module the way Claude Code will. It lists every event the mod hooks, every `$` call it makes, and anything Claude Code would refuse. `test` runs the `*.test.ts(x)` files; see [Testing](#testing).

## Building blocks

### A slash command

Register it in `session.start`, then answer it in `command.run`. Return `{ text }` to show a line in the transcript, which Claude reads too. Add `context: [...]` for notes only Claude reads.

```ts
on('command.run', { command: 'my-command' }, async ($, e) => {
  const [verb = ''] = e.args.trim().split(/\s+/)
  return { text: verb === 'help' ? HELP : 'Done.' }
})
```

### A band above the prompt

Hook `ui.render` with `{ component: 'AbovePrompt' }`:

- **Pass through when there's nothing to show,** or when a survey is up (`e.props.hasSurvey`).
- **Size the tree to `e.props.bodyColumns`.**
- **Draw what `next(e)` returned beneath your row,** unless it's the engine's placeholder (`type: 'engine'`). That way two mods share the band.

### A pane

Open it with `$.ui.open({ id, title })`, then draw it with `ui.render` on `{ component: 'Pane', requestId: id }`:

- **Height:** `e.props.scroll.bodyRows` says how tall it is.
- **Keyboard:** `focus: true, closeOnEscape: true` makes it take the keys and close on Esc.
- **Checking it's in front:** to tell whether it's on screen, check `$.ui.panes()` for `isShown`. A pane can be open but behind another pane's tab.
- **Width:** Claude Code places a pane the person asked for at any width. One a mod opens by itself waits until the terminal is wide enough.

### Buttons

`<Button key="next" label="Next" hotkey="n" onPress={...} />`. A `hotkey` only works while its band or pane holds the keyboard, and in a band that's rarely the case. So give a band button a label and no hotkey, and offer a slash command as well.

### Checking a tool call

Hook `tool.call`, with a matcher to narrow it: `{ tool: ['Bash', 'PowerShell'] }`. The one-of list must be written inline, or it won't type. Then either:

- call `next(e)` to let it run, and read the result it resolves to;
- or return `{ deny: 'why' }` to refuse it. Claude reads the reason, so write it for Claude.

### Asking the person

`await $.ui.ask(question, { header, options: ['Cancel', 'Proceed'] })` opens Claude Code's own question dialog:

- **The answer:** it resolves to the chosen label, or to the text the person typed instead.
- **Dismissed or headless:** it rejects when the dialog is dismissed, and in a headless `claude -p` run.
- **The wait is free:** the time it waits doesn't count against the hook's budget.
- **Details go in the question:** the question text keeps its line breaks, so put the details there. Claude Code doesn't let a mod add a preview box to the options.

### State, and data that outlives the session

- **`$.state`** holds values for the session that the interface draws from. It survives a hot reload; module variables don't. A render hook only reads it. Write from a handler, a command or another event.
- **`$.store`** is the mod's own JSON file under `~/.claude/plugins/store/`, kept across sessions.
- **A conversation can change sessions.** Moving it to the background and back, `--continue` and `--resume` all start a **new session id** with empty `$.state`. To find your data again, key it by something the conversation carries, such as a tool call's `tool_use_id` read from `$.session.messages()`, not by `$.session.id()`.
- **Keep secrets off disk.** Don't write file contents to the store if they could hold secrets.

### Showing a message

| Call | Shows |
|------|-------|
| `$.ui.toast(text, { timeoutMs })` | A small box at the top right for a few seconds |
| `$.ui.log(text)` | One dim row in the transcript, which Claude doesn't read. Claude Code puts the plugin's name in front, and a newline doesn't start a new row. |
| `$.ui.status(text)` | A status line under the prompt until replaced |
| `$.ui.notify(text)` | A native notification, by the person's own notification setting |

### Work that runs on its own

A hook only lives for its dispatch. Start longer work from `session.start` with `$.clock.every(ms, fn)` or `$.clock.after(ms, fn)`. Timers stop when the module reloads.

## Rules that keep a mod safe

1. **A guard fails closed.** A hook that fails is skipped, and the chain goes on without it. For a hook that refuses things, that would let everything through. So give every guard a `.catch` that refuses:

   ```ts
   on('tool.call', { tool: 'Bash' }, async ($, e, next) => { /* … */ })
     .catch(($, e, next) => (next.called ? next(e) : { deny: 'The check failed, so this did not run.' }))
   ```

2. **A watcher never blocks.** A hook that only records or draws calls `next(e)`, and its `.catch` passes the call on: `.catch(($, e, next) => next(e))`.
3. **Only add checks; never loosen them.** Don't answer `tool.check` with `allow` to skip Claude Code's own permission prompt. After your check passes, the person's permission rules and mode still apply.
4. **When in doubt, ask.** If you can't measure or know something, treat it as risky, not safe.
5. **Cross-platform.** Mods run on Windows, macOS and Linux:
   - use `$.fs` and `$.process.run(['git', ...])` with an argv array, never a shell or bash-only tools (`find`, `du`, `sleep`);
   - handle both `/` and `\` in paths, and compare Windows paths without case;
   - treat `\r\n` and `\n` as the same;
   - watch both the Bash and the PowerShell tool when you check shell commands.
6. **Mind the budget.** Each hook has 10 seconds of its own time per dispatch. Time spent waiting in `next(e)` or a `$` call doesn't count; a `$.clock` wait does.

## Testing

`claude plugin test <folder>` runs the mod's `*.test.ts` and `*.test.tsx` files against Claude Code's own engine:

- **The engine is yours to play.** A test's `on` registers hooks that sit *beneath* your mod, standing in for Claude Code. Answer what your mod calls, for example `on('fs.read', async () => ({ value: 'text' }))`.
- **Raise events from the test:** `$.tool.call(...)`, `$.command.run(...)`, `$.turn.complete(...)`, `$.session.start(...)`.
- **Test drawings with `$.ui.mount`:** mount a band or pane with `$.ui.mount({ plugin, surface, component, props })`. Then `find`, `findAll` and `press({ key })` on what it drew. Loop over `['terminal', 'desktop'] as const`, so the mod doesn't depend on one surface.
- **The dialog arrives as a tool call:** `$.ui.ask` reaches the test as an `AskUserQuestion` tool call, which the test answers with `{ result: { questions, answers: { [question]: label } } }`.
- **One hook per event per test:** registering the same event twice in one test is an error. Build a small `session()` helper that registers the engine side once.

Type-check too: `tsc -p <mod folder>` uses the `tsconfig.json` Claude Code lays beside a mod it loads from a folder.

## Debugging

- **`claude --debug`, or `--debug-file <path>`,** logs every skipped hook with the reason. It also logs every result Claude Code refused, such as `a rewrite may relabel the questions but not change question 1's previews`. Use `$.ui.log(text, { to: 'debug' })` for your own debug lines.
- **While a folder is hot-reloaded,** the transcript shows a dim line once when a hook is skipped or a drawing is refused.
- **`console.log` goes nowhere** inside the sandbox.

## Sharing a mod

In this repository:

1. Put the mod in `plugins/atc-<name>/`, with a README that starts with the 2.1.287 requirement. `--plugin-dir` belongs only in its Develop section.
2. Add an entry to `.claude-plugin/marketplace.json` only. GitHub Copilot doesn't load mods, so they stay out of `.github/plugin/marketplace.json`.
3. Add a row to the table in the root README's Mods section.
4. Run `claude plugin validate .` for the marketplace.

People then install it with one line:

```text
/plugin install atc-<name> --marketplace atc-net/atc-agentic-toolkit
```

A mod made only of hooks is active straight away. Settings declared in `userConfig` are asked for at install, and change later in `/config`.

## Walk-through: atc-progress

[atc-progress](../../plugins/atc-progress/) is the most complete mod here. Its pieces:

| File | What it does |
|------|--------------|
| `hooks/plan.ts` | Pure functions: parses `plan/*.md` implementation plans (goal, phases, ticked tasks). No `$`, so it's easy to test. |
| `hooks/cost.ts` | Pure functions: a rough token cost estimate per model |
| `hooks/register.tsx` | The hooks |
| `types/index.d.ts` | The `$.state` contract: the active plan, the plan list, the subagent runs |
| `hooks/*.test.ts(x)` | Parser tests, plus engine tests that mount the band and the pane on two surfaces |

Its hooks:

- `session.start` registers `/atc-progress`, finds the newest plan in progress, and starts a 1-second timer that runs only while subagents run.
- `tool.call` waits for an Edit or Write to finish, and re-reads a plan file it touched.
- `agent.spawn`, `turn.step` and `turn.complete` track each subagent's model, tokens, context use and time.
- `ui.render` on `AbovePrompt` draws the plan bar, keeping other mods' rows beneath it. On its `Pane` it draws the subagents list and the plan picker.
- `command.run` answers `/atc-progress` and its options.

The pattern to copy: **pure logic in `.ts` files with plain tests, `$` only in `register.tsx`, and state in `$.state`**.

## The mods in this repository

| Mod | Shows |
|-----|-------|
| [atc-blast-radius](../../plugins/atc-blast-radius/) | Guarding tool calls: detects risky shell commands, measures what they'd delete with `$.fs` and git, and asks with `$.ui.ask`. Fails closed. |
| [atc-progress](../../plugins/atc-progress/) | A band, a pane, a command with options, `userConfig`, timers, subagent tracking |
| [atc-replay-theater](../../plugins/atc-replay-theater/) | Recording tool calls without changing them, a stepping pane with hotkeys, `$.store` keyed by the conversation, keeping secrets off disk |

## Further reading

- [Mod Anatomy Reference](../reference/mod-anatomy.md)
- [Plugin Development Guide](plugin-development.md)
- [Plugin Structure Reference](../reference/plugin-structure.md)
- [Claude Code plugins documentation](https://code.claude.com/docs/en/plugins)
