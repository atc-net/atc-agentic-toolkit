# ATC Reflect Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot. It works on Windows, macOS and Linux.

## Overview

atc-reflect turns the corrections you give Claude into rules in `CLAUDE.md`, so you don't have to give them again.

When a prompt corrects Claude, for example `no, use pnpm not npm` or `don't add comments`, a short check by Haiku turns it into a one-line rule. After the turn, the rule waits above the prompt:

```text
◆ Rule Use pnpm, not npm.  (1 of 2)
  save to CLAUDE.md   save to ~/.claude/CLAUDE.md   edit   skip
```

- **save to CLAUDE.md** adds the rule to the project's `CLAUDE.md`, in the session's folder.
- **save to ~/.claude/CLAUDE.md** adds it to your own `CLAUDE.md`, which every project reads.
- **edit** puts `remember: <rule>` in the prompt box. Change the text and press Enter, and your version takes the rule's place. Until you send it, the rule keeps waiting.
- **skip** drops the rule, and it isn't suggested again. You can still keep it later with `remember:`.

The button for where the rule fits best comes first: a rule about this code base (its tools, commands, files) suggests the project, and a rule about how you like to work (tone, language) suggests your own file.

Rules are saved as bullets at the end of a `## Learned rules` section. The section is added at the end of the file the first time, and a rule that's already in the file as a bullet isn't added twice. The file's line endings are kept. Claude reads `CLAUDE.md` when a session starts, so when you save a rule the mod also tells Claude about it in the current conversation.

### remember:

Type `remember: <rule>` to keep a rule straight away, with no model call:

```text
remember: run dotnet format before committing
```

The prompt doesn't go to Claude, and Claude Code says "Prompt dropped by a hook: atc-reflect kept the rule". The rule waits above the prompt for you to save it. Claude Code puts a dropped prompt back in the prompt box, so the mod clears the box again, but only while it still holds just that text. A `remember:` that wasn't kept, for example one over 200 characters, stays in the box for you to fix.

## Install

```text
/plugin install atc-reflect --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## Commands

| Command | Does |
|---------|------|
| `/atc-reflect` | Lists the rules waiting in this folder |
| `/atc-reflect pause` | Stops looking for rules in your prompts for this session. `remember:` still works. |
| `/atc-reflect resume` | Starts again |
| `/atc-reflect clear` | Drops the rules waiting in this folder |
| `/atc-reflect help` | Lists the commands |

## Settings

Set in `/config`, or under `pluginConfigs` in your settings:

| Setting | Values | Default |
|---------|--------|---------|
| `detect` | `auto`: prompts that look like a correction are checked by Haiku. `remember-only`: only `remember:` prompts are kept, and nothing is sent to a model. | `auto` |

## What it sends, and what it keeps

- **Only prompts you typed**, in the terminal or through Remote Control. Slash commands, messages from other sessions, background tasks and other plugins are never read.
- **Only prompts that look like a correction** are sent to Haiku. That means 8 to 500 characters with a word like *no*, *don't*, *never*, *always*, *instead*, *prefer*, *should*, *remember* or *from now on* (Danish *ikke*, *aldrig*, *altid*, *husk*, *i stedet* too). Short replies like `ok` or `thanks` aren't sent.
- **Never anything that looks like a secret.** A prompt with `password=`, `token:`, an API key, a private key or a long token-like string is never sent or saved.
- **One small call per correction.** The check runs after your prompt has gone to Claude, so it never delays a turn. It costs a few hundred Haiku tokens. Haiku must say it's at least 70% sure, and the rule must be one line of at most 200 characters.
- **Waiting rules are kept in the mod's store**, a JSON file under `~/.claude/plugins/store/`, until you save, edit or skip them. Each rule belongs to the folder it was found in, so it only shows up in sessions in that folder, and it's still there after a restart. Up to 30 waiting rules are kept, and up to 200 skipped ones, so they aren't suggested again.
- **Your own CLAUDE.md** is `CLAUDE_CONFIG_DIR/CLAUDE.md` when that's set, otherwise `.claude/CLAUDE.md` in your home folder.

## Limits

- **The project CLAUDE.md is the session's folder.** If you started Claude in a subfolder, the rule goes to that subfolder's `CLAUDE.md`.
- **A file it can't read is left alone.** If a `CLAUDE.md` exists but can't be read, the rule isn't saved and keeps waiting.
- **One rule at a time.** The band shows the oldest waiting rule, with a count when there are more.
- **Haiku decides.** It can miss a correction, or find a rule in a one-off request. Nothing is saved until you choose to, and `edit` lets you fix the wording.
- **Pause lasts for the session.** A new session, or moving a conversation to the background and back, starts looking again.

## Try it

Use a throwaway folder:

```bash
mkdir reflect-demo && cd reflect-demo
```

1. `Create a package.json for a small Node project and install express`. Wait for the turn to end.
2. `no, use pnpm instead of npm`. When the turn ends, the band shows a rule like `Use pnpm instead of npm.`
3. Click **save to CLAUDE.md**. `CLAUDE.md` in the folder now has a `## Learned rules` section with the rule.
4. Type `remember: answer in Danish`. Nothing goes to Claude, and the band shows the rule. Click **save to ~/.claude/CLAUDE.md**, or **skip** to keep your own file unchanged.
5. Type `/atc-reflect`. It lists what's still waiting.

## Turn it off

`/plugin` → atc-reflect → Disable, or from a shell `claude plugin disable atc-reflect@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-reflect@atc-agentic-toolkit`.

## Develop

Run a local copy for one session without installing it, using the absolute path to your clone. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-reflect
```

Check and test:

```bash
claude plugin validate plugins/atc-reflect
claude plugin test plugins/atc-reflect
```
