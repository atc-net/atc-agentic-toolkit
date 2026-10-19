# ATC Replay Theater Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot. It works on Windows, macOS and Linux.

## Overview

atc-replay-theater lets you step through the file edits Claude made in its last turn, one diff at a time.

When a turn that edited files ends, a hint appears above the prompt:

```text
▶ Replay: 5 edits in 3 files   replay   x
```

Type `/atc-replay` (or click **replay** on the hint) and a pane shows one edit at a time:

```text
▶ Replay                                   step 1 of 5
 1   2   3   4   5
src/greet.js
Edit · line 6            +1  −1

  export function greetAll(names) {
-   return names.map((n) => greet(n));
+   return names.map((n) => welcome(n));
  }

[ ◀ Prev ]  [ Next ▶ ]  [ Close ]
```

- **The header** shows which step you're on. Each number in the strip is one step, and the current one is highlighted.
- **The file** is shown relative to the project folder, followed by the tool, a note (`new file`, `rewrite`, `replace all`, `by a subagent`), the line the edit starts on, and how many lines were added and removed.
- **The diff** shows each changed line with one unchanged line around it, in Claude Code's own diff colors. A run of unchanged lines that's left out shows as `⋯`.

It only watches. It never blocks, changes or delays an edit.

## Install

```text
/plugin install atc-replay-theater --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## Commands

| Command | Does |
|---------|------|
| `/atc-replay` | Opens the replay, or brings it to the front when another pane is shown over it. When it's already in front, closes it. |
| `/atc-replay close` | Closes it |
| `/atc-replay clear` | Forgets the replay and hides the hint |
| `/atc-replay help` | Lists the commands |

In the pane:

| Key | Does |
|-----|------|
| `n` | Next step |
| `p` | Previous step |
| `c` or `Esc` | Close |

Mouse clicks on the buttons work too. The **x** on the hint hides it until the next turn that edits files.

## What it records

- **Edit:** the whole lines the edit changed, read from the file as it was just before the edit. If the text can't be found there, it shows the replaced text alone.
- **Write:** the file as it was before compared with the new content. A new file shows as all added lines. A file whose old text can't be read (binary, or over 4 MB) says so, and its new lines show as added.
- **Only edits that ran.** An edit you refuse, or one that fails, isn't shown.
- **Subagents' edits** are included in the main turn's replay, marked "by a subagent".

The replay is the last main turn that edited files. A turn without edits keeps the previous replay.

## Limits

- **Line endings.** Windows `\r\n` and `\n` count as the same, so a Write that only changes line endings shows "no line changes". Tabs are drawn as two spaces.
- **Big files.** When the changed part of a file is very large (more than about 500 × 500 lines), its lines aren't matched one by one. They show as all removed, then all added. The added and removed counts are still exact.
- **Long diffs.** Up to 40 lines are kept per step. The pane shows as many as fit, then "… N more lines".
- **Long runs.** Up to 200 edits are kept per turn.
- **Kept with the conversation.** The replay is also saved in the mod's store, a JSON file under `~/.claude/plugins/store/`. It's saved under the id of the turn's last edit. Moving the conversation to the background and back, `--continue` and `--resume` all start a new session id but carry the conversation over. The mod finds the replay again by that edit's id, and a new conversation never shows another one's replay. The last 5 replays are kept, and `/atc-replay clear` removes the current one. A turn where only subagents edited files isn't saved, because none of those edits is in the main conversation to find it by.
- **Secrets stay off disk.** The saved copy has no lines from files that usually hold secrets: `.env*`, `*.pem`, `*.key`, `*.pfx`, `id_rsa`, `secrets.json`, `local.settings.json`, `.npmrc`, `.netrc`, and names containing "secret", "credential" or "password". For those it keeps only the file name and counts. In other files, any line that looks like a secret (`password=`, `apiKey:`, `token`, a connection string, a private key, a long token-like string) is replaced by a note. The replay on screen still shows every line. A replay brought back after a background move shows the saved copy, with those lines hidden.
- **Edit and Write tools only.** Changes made from the shell (`sed`, `git checkout`, a script) aren't recorded.
- **No room for a pane.** If the terminal can't place a pane, the replay is drawn above the prompt instead. Claude Code places a pane you ask for at any width, so this is rare, and it hasn't been tested live.

## Try it

Use a throwaway folder:

```bash
mkdir replay-demo && cd replay-demo
```

1. `Create greet.js with a greet(name) function and main.js that calls it`. When the turn ends, the hint shows `Replay: 2 edits in 2 files`.
2. Type `/atc-replay`. Step through with `n` and `p`; both steps say "new file".
3. `Rename greet to welcome everywhere`. The hint now counts the rename's edits. Open it: each step shows the lines that changed.
4. Press `Esc`. The pane closes and the hint comes back.

## Turn it off

`/plugin` → atc-replay-theater → Disable, or from a shell `claude plugin disable atc-replay-theater@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-replay-theater@atc-agentic-toolkit`.

## Develop

Run a local copy for one session without installing it, using the absolute path to your clone. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-replay-theater
```

Check and test:

```bash
claude plugin validate plugins/atc-replay-theater
claude plugin test plugins/atc-replay-theater
```
