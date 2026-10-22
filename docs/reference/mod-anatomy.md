# Mod Anatomy Reference

The files, fields, events and limits of a Claude Code mod. For a step-by-step introduction, see the [Mod Creation Guide](../guides/mod-creation.md).

> [!IMPORTANT]
> Mods require **Claude Code 2.1.287 or newer**. The API is early access and changes between releases. The authority for your build is the `claude-code.d.ts` that Claude Code writes beside a mod it loads from a folder you're editing, in `.claude-plugin/types/claude-code/index.d.ts`. This page was checked against Claude Code 2.1.303.

## Table of Contents

- [Folder layout](#folder-layout)
- [plugin.json](#pluginjson)
- [hooks/hooks.json](#hookshooksjson)
- [The hooks module](#the-hooks-module)
- [Hooks](#hooks)
- [Events](#events)
- [The `$` engine interface](#the--engine-interface)
- [Drawing](#drawing)
- [State and store](#state-and-store)
- [Limits](#limits)
- [Testing kit](#testing-kit)
- [Commands and environment](#commands-and-environment)

## Folder layout

```text
plugins/atc-<name>/
├── .claude-plugin/
│   ├── plugin.json         # required
│   └── types/              # written by Claude Code when it loads the folder; not committed
├── hooks/
│   ├── hooks.json          # required: names the module
│   ├── register.ts(x)      # required: exports register(on, options)
│   ├── *.ts                # optional helpers, imported by register
│   └── *.test.ts(x)        # tests for claude plugin test
├── types/
│   └── index.d.ts          # optional: the $.state contract
└── README.md
```

## plugin.json

The manifest is `.claude-plugin/plugin.json`, at its standard location (a skill plugin in this repository keeps a `plugin.json` at its root instead).

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Kebab-case. It's the mod's id in `/plugin`, in `$.state` refs and in `pluginConfigs`. This repository uses `atc-<name>`. |
| `version` | yes | Semver, for example `0.1.0` |
| `description` | yes | One sentence. In this repository it ends with "Requires Claude Code 2.1.287+." |
| `author` | recommended | `{ "name": "atc-net" }`. `validate` warns when it's missing. |
| `homepage`, `repository` | no | URLs |
| `keywords` | no | Strings, for example `["mod", "safety"]` |
| `types` | when the mod uses `$.state` | `"./types/index.d.ts"`, the [state contract](#state-and-store) |
| `userConfig` | no | Settings asked for at install and shown in `/config` (below) |
| `dependencies` | no | Other plugins whose `$` contract this mod uses. Their types are laid into `.claude-plugin/types/<plugin>/`. |

### userConfig

Each key is one setting. The module receives the values as `options` in `register(on, options)`, with defaults filled in.

```json
"userConfig": {
  "autoOpen": {
    "type": "string",
    "title": "Open the agents pane",
    "description": "off: only /atc-progress opens it. agents: it also opens by itself when the first subagent starts.",
    "default": "off",
    "options": ["off", "agents"]
  }
}
```

- **Validation:** values are checked against `type` before the module loads. A required field with no value stops the load, naming the field.
- **Pickers:** a `string` field with `options` is a picker in `/config`. A stored value outside the options counts as unset, so the default applies.
- **Where values live:** in `settings.json` under `pluginConfigs[<name>].options`, with sensitive values in secure storage. A `--plugin-dir` mod is keyed by its `<name>`, or `<name>@inline`.
- **Changing a value** in `/config` reloads the module with the new options.

## hooks/hooks.json

```json
{ "modules": ["./register.tsx"] }
```

- **One module,** with a path relative to `hooks.json`.
- **The same file holds shell hooks:** a plugin's `hooks.json` can also hold Claude Code's ordinary shell hooks (`"hooks": { "PostToolUse": [...] }`). `modules` is what makes it a mod.

## The hooks module

- **Extensions:** `.ts`, `.tsx`, `.jsx`, `.js`, `.mjs`, `.cjs`, `.mts` or `.cts`. A file with any other name isn't loaded. Every file is an ES module, whatever its extension.
- **`.ts` or `.tsx`:** use `.tsx` only for files that contain JSX.
- **Imports:** import the plugin's other files with static `import` declarations. A module that uses `import()` doesn't load.
- **The `claude-code` package:** import types from `'claude-code'`. The only values it gives you at run time are the state helpers (`atom`, `read`, `update`, `derive`, `memberOf`).
- **The sandbox:** the module runs in a sandbox of its own, with no Node and no DOM. Everything outside it goes through `$`.
- **JSX:** compiles through the `h` factory to plain data trees.
- **Hot reload:** saving a file in a hot-reloaded folder runs `register` again in a fresh sandbox. Module variables and timers are dropped; `$.state` and `$.store` are kept.

```ts
import type { Register } from 'claude-code'

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => next(e))
}
```

## Hooks

```ts
on(event, matcher?, hook).catch?(handler)
```

| Part | Meaning |
|------|---------|
| `event` | An event name, for example `'tool.call'` |
| `matcher` | An object narrowing which inputs reach the hook: `{ tool: 'Bash' }`, `{ tool: ['Edit', 'Write'] }`, `{ component: 'Pane', requestId: 'my-pane' }`, `{ command: 'my-command' }`. Write one-of lists inline, or they won't type. |
| `hook` | `async ($, e, next) => result` |
| `.catch` | `($, e, next) => result`, which answers in the hook's place when it throws, returns a wrong shape or runs out of time |

Inside a hook:

| Expression | Meaning |
|------------|---------|
| `return next(e)` | Pass the event on unchanged |
| `return next({ ...e, field })` | Pass on a changed copy, within what the event allows |
| `return { deny: 'why' }` (or another answer) | Answer without running what's beneath |
| `const r = await next(e); …; return r` | Act after the rest has run |
| `next.called` | In `.catch`: whether the hook had called `next` |
| `next.signal` | Aborts when the dispatch is abandoned (interrupt, timeout) |

**Fail-open and fail-closed.** A hook that fails is skipped, and the chain goes on without it. A guard therefore needs `.catch(($, e, next) => next.called ? next(e) : { deny: '…' })`: it refuses when the hook failed before calling `next`, and replays the result when it failed after. A watcher uses `.catch(($, e, next) => next(e))`.

**Streaming events.** `turn.step` and `process.spawn` take an async generator: `async function* ($, e, next) { const r = yield* next(e); …; return r }`.

**One hook runs per frame.** A hook doesn't see calls its own `$` calls raise. For example, a mod's `tool.call` hook isn't run for the `AskUserQuestion` call that its own `$.ui.ask` makes.

## Events

The events this build defines, grouped. The mods in this repository use the ones in **bold**.

| Group | Events |
|-------|--------|
| Tools | **`tool.call`**, `tool.check`, `tool.describe` |
| Session | **`session.start`**, `session.end`, `session.append`, `session.receive`, `session.send`, `session.compact`, `session.attach`, `session.detach`, `session.measure` |
| Turns | `turn.start`, **`turn.step`**, **`turn.complete`** |
| Prompt | `prompt.submit`, `prompt.fill`, `prompt.suggest`, `prompt.edit`, `prompt.autocomplete`, `prompt.section`, `prompt.context`, `prompt.compose`, `prompt.attachment`, `prompt.mention` |
| Interface | **`ui.render`**, **`ui.close`**, `ui.press`, `ui.input`, `ui.select`, `ui.focus`, `ui.scroll`, `ui.message`, `ui.fault` |
| Commands and settings | **`command.run`**, `command.describe`, `config.set`, `config.describe` |
| Agents | **`agent.spawn`**, `agent.offer` |
| Other | `skill.prompt`, `attribution.text`, `plugin.register`, `engine.create`, `telemetry.log`, `telemetry.mark` |
| Shell-hook events | `classic.<Event>`, for example `classic.Stop`, with the input a shell hook receives |

Notes on the common ones:

- **`tool.call`** runs before a tool. `next(e)` runs it and resolves to `{ result, isError? }`, or `{ deny }` if something beneath refused it. `e.agentId` is set inside a subagent, and `e.tool_use_id` names the call.
- **`tool.check`** runs when Claude Code decides whether a call may run, after `tool.call`. Answering `allow` there skips the person's own permission prompt, so a safety mod shouldn't hook it.
- **`session.start`** fires once the session is ready, and is awaited before the first prompt. Register commands and start timers there.
- **`turn.complete`** fires when a turn ends. `e.agentId` is set for a subagent's turn, and absent for the main one.

## The `$` engine interface

| Namespace | Used for |
|-----------|----------|
| `$.ui` | `render`, `resolve`, `open`, `close`, `panes`, `ask`, `toast`, `log`, `status`, `notify`, `copy`, `selection`, `invalidate` |
| `$.state` | Session state the interface draws from (see [State and store](#state-and-store)) |
| `$.store` | The mod's own JSON file, kept across sessions: `get`, `set`, `delete`, `keys` |
| `$.fs` | `read`, `write`, `list`, `stat`, `exists` (reads and writes up to 4 MiB) |
| `$.process` | `run(argv, { cwd, timeoutMs })` runs a program by argv, with no shell; `spawn` streams |
| `$.session` | `id`, `cwd`, `root`, `messages`, `turns`, `usage`, `model`, `repo`, `version`, `append` |
| `$.clock` | `now`, `sleep`, `every`, `after` |
| `$.command` | `register`, `list` |
| `$.tool` | `call`, `register`, `list` |
| `$.agent` | `spawn`, `register`, `list` |
| `$.model` | `complete`, `fork`, `classify`: model calls on the session's own client |
| `$.prompt` | `submit`, `fill`, `read` |
| `$.env` | `get` |
| `$.http`, `$.settings`, `$.config`, `$.mcp`, `$.audio`, `$.plugin`, `$.telemetry` | See the type definitions |

Every `$` call goes through the hook chain too. Other plugins can see and change it, and a test can answer it.

## Drawing

A `ui.render` hook gets one component instance:

| Field | Meaning |
|-------|---------|
| `e.component` | `AbovePrompt`, `Pane`, `AskUserQuestion`, `UserMessage`, `AssistantMessage`, `ToolUse`, `ToolResult`, `ToolGroup`, `ToolProgress`, `CommandOutput`, `Spinner`, `TurnDuration`, `InfoNotice`, `SessionMode`, `PromptHint` |
| `e.surface` | `terminal`, `desktop`, `mobile` or `vscode` |
| `e.requestId` | Which instance: a pane's id, a tool row's `tool_use_id`, a message id |
| `e.props` | The component's data. A band has `hasSurvey`, `isWorking`, `maxRows` and `bodyColumns`. A pane has `title`, `isFocused`, `bodyColumns`, `placement` (`dock` or `inline`) and `scroll.bodyRows`. |

A hook can answer in three ways:
- return a tree built from `$.ui.resolve(e)`;
- return `next({ ...e, props })` to change what the engine draws;
- return `next(e)` to leave it as it is.

A tree that doesn't validate isn't drawn. The engine draws its own instead, and the debug log says why.

Elements per surface:

| Element | terminal | desktop | vscode | mobile |
|---------|:-:|:-:|:-:|:-:|
| `Box`, `Text`, `Button`, `Link`, `Code`, `Markdown` | ✓ | ✓ | ✓ | ✓ |
| `Input`, `Select` | ✓ | ✓ | ✓ | |
| `Client` | ✓ | ✓ | | |
| `Svg` | | ✓ | ✓ | ✓ |
| `Raster`, `Image` | ✓ | | | |

**`Button`**

| Prop | What it does |
|------|--------------|
| `key`, `label` | Required where the label changes |
| `hotkey` | One digit or lowercase letter. It works only while the band or pane holds the keyboard. |
| `plain` | Drawn without brackets |
| `variant="primary"` | Marks the main action |
| `role="dismiss"` | Marks the close control |
| `autoFocus` | Takes the focus when drawn |
| `onPress` | Runs on press. Write state here, never while drawing. |

**`Text`**

| Prop | What it does |
|------|--------------|
| `color`, `backgroundColor` | A color name, or a theme key such as `claude`, `success`, `error`, `warning`, `diffAdded` or `diffRemoved` |
| `bold`, `dimColor`, `inverse` | Styling |
| `wrap` | For example `truncate-end` or `truncate-start` |

**Panes**

| Call or option | What it does |
|----------------|--------------|
| `$.ui.open({ id, title })` | Opens the pane. It resolves to `{ isPlaced }`. |
| `focus`, `closeOnEscape` | Take the keyboard; Esc closes the pane |
| `rows` | Height when placed inline |
| `columns` | Width when docked |
| `$.ui.panes()` | Each pane's `isShown` (in front) and `isFocused` |
| `ui.close` event | Raised when a pane closes, with `e.id` and `e.origin.kind` (`plugin`, `person` or `unload`) |

## State and store

**`$.state`** holds values for the session, kept by the host. It survives a hot reload.

- **Declare** each value in `types/index.d.ts`, and name that file in `plugin.json` under `types`. Write the keys inline in `PluginState`, and export at least one type from the file:

  ```ts
  export type Step = { file: string; added: number }

  declare module 'claude-code' {
    interface PluginState {
      'atc-example': {
        steps: Step[]
        isOpen: boolean
      }
    }
  }
  ```

- **Use** the helpers from `'claude-code'`:
  - `const steps = atom({ plugin: 'atc-example', key: 'steps' } as const, [])`;
  - `await read($, steps)`;
  - `await update($, steps, old => [...old, step])`, which retries on a version clash.
- **Drawing:** reading state while drawing subscribes the drawing, so a later write redraws it. A render hook can't write state.
- **Writing:** only the owner writes its values.

**`$.store`** is the mod's own JSON file at `~/.claude/plugins/store/<plugin>_<source>-<hash>.json`, kept across sessions and reloads. Values must be JSON, up to 4 MiB in all.

**Sessions change under a conversation.** Moving a conversation to the background and back, `--continue` and `--resume` start a new process with a new session id, and empty `$.state`. Key stored data by something the conversation carries, such as a `tool_use_id` from `$.session.messages()`.

## Limits

| Limit | Value |
|-------|-------|
| A hook's own time per dispatch | 10 s (`HookBudget.ms`). Waits in `next(e)` and `$` calls don't count; `$.clock` waits do. |
| A `.catch` handler's time | 1 s |
| `$.ui.toast`, `$.ui.log`, `$.ui.status` text | First 2,000 characters on the terminal, 10,000 on a remote surface |
| Text drawn by one tree | First 100,000 characters |
| `$.fs` read or write | 4 MiB |
| `$.store` | 4 MiB of JSON in all |
| A command's `description` or `argumentHint`, a pane's `title` | 4,096 characters |
| `$.ui.ask` | 2–4 options, a `header` of up to 12 characters. Rejects when dismissed and under `claude -p`. A mod can't add option previews. |

## Testing kit

Tests are `*.test.ts` or `*.test.tsx` files, run by `claude plugin test <folder>`.

```ts
import { expect, mock, test } from 'claude-code/testing'

const BAND_PROPS = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as never

test('what it does', async ($, on) => {
  on('session.cwd', async () => ({ value: '/repo' }))          // answer a $ call the mod makes
  on('tool.call', async () => ({ result: 'ok' }) as never)     // stand in for the tool
  await $.tool.call({ tool: 'Read', file_path: '/repo/a.ts' } as never)
  const band = await $.ui.mount({ plugin: 'atc-example', surface: 'terminal', component: 'AbovePrompt', props: BAND_PROPS })
  expect((await band.find({ type: 'Text', text: /^Replay/ }))?.text).toBe('Replay: 1 edit in 1 file')
  await band.unmount()
})
```

**The engine side**
- A test's `on` hooks sit beneath the mod and stand in for Claude Code. An answer to a `$` call is `{ value }`.
- Nothing sits beneath them, except the kit's own `$.state` and `session.append`. A `$` call the test doesn't answer fails, saying so.
- Each event can be registered once per test. A second registration is an error.

**Raising events**
- `$.tool.call`, `$.command.run`, `$.turn.complete`, `$.session.start` and the others raise the event through the mod.
- `$.ui.ask` arrives as an `AskUserQuestion` tool call. Answer it with `{ result: { questions, answers: { [question]: label } } }`.

**Drawings**
- `$.ui.mount({ plugin, surface, component, props })` draws a band or pane through the mod.
- On what it drew, use `find`, `findAll`, `press({ key })` and `input`.

**Settings, time and types**
- `test(name, { options }, body)` gives the mod `userConfig` values.
- `mock.clock(on, { now })` fixes the time. Waits then need `advance`.
- Type-check with `tsc -p <mod folder>`.

## Commands and environment

| Command or setting | Does |
|--------------------|------|
| `claude plugin validate <folder>` | Reads the manifest, contract and module as Claude Code will. It lists hooks, `$` calls, state reads and writes, gating hooks with or without `.catch`, and every error. On a marketplace folder it also checks `marketplace.json`. |
| `claude plugin test <folder>` | Runs the tests |
| `claude --plugin-dir <folder>` | Loads the mod from disk for one session, hot-reloading on save. Repeat it for several. |
| `CLAUDE_CODE_PLUGIN_DIRS` | The same folders where no flag can be given (desktop app, SDK): absolute paths separated by the platform's path-list separator, from the environment or `env` in `~/.claude/settings.json` |
| `pluginConfigs` in settings | `userConfig` values for a `--plugin-dir` mod |
| `claude --debug`, `--debug-file <path>` | Logs skipped hooks, refused drawings and rewrites, and `$.ui.log(text, { to: 'debug' })` lines |
| `/plugin install <mod> --marketplace <owner>/<repo>` | Installs a mod in one step (Claude Code 2.1.275+). A mod made only of hooks is active straight away. |
| `/reload-plugins` | Re-reads installed plugins |
| `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` | Obsolete: mods are on by default since 2.1.287, and the flag is ignored |
