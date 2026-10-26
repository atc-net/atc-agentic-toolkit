# ATC Filetree Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot. It works on Windows, macOS and Linux.

## Overview

atc-filetree shows the files of your folder in a pane beside the chat, and lights up the files Claude works on while it works.

```text
atc-agentic-toolkit             ⎇ feature/updates ↑2
  ▸ docs
› ▾ plugins
    ▸ atc-cache-tax
    ▾ atc-filetree
      ▸ hooks
        README.md                         ? now
  README.md                        M +3 -1 5m
j: ↓ k: ↑ h: fold l: unfold o: open p: pick
s: find r: refresh
```

- **Git status.** Changed files are colored: modified yellow, new or untracked green, deleted or in conflict red, renamed blue. Each changed file shows its letter and `+added -removed` lines. A closed folder takes the color of the changes inside it, and ignored files are dimmed. The header shows the branch and how far it is ahead (`↑`) or behind (`↓`) its upstream.
- **What Claude does.** A file Claude reads is lit purple, one it writes orange, and the files of a commit it makes green, for two minutes. A closed folder with a lit file inside takes that color.
- **Follow Claude.** When Claude reads or writes a file, the tree opens the folders above it and moves the cursor to it. It doesn't open `node_modules`, `bin`, `obj`, `dist`, `build` and the like by itself.
- **The column** on the right shows each file's age (`5m`, `3d`), or its size or date.
- **Pick files for Claude.** Press `p` on a file, or on several, and they go with your next prompt. Your prompt's text isn't changed. The mod adds a short note to the prompt's context, which Claude reads alongside your message: "The person picked these files in the file tree to point you at them", then each file's path. Picked rows show `◆`, and the row above the tree lists them. The picks are used once and then cleared.
- **Open a file.** Enter, or `o`, opens the file in VS Code on Windows, and in the app your system uses for it on macOS and Linux. On macOS and Linux a file that could run when opened (`.sh`, `.py`, a `.command`, a file with no extension and the like) isn't opened; a message says so. VS Code opens every file as text, so on Windows scripts open too.

It only watches. It never blocks, changes or delays a tool call.

## Install

```text
/plugin install atc-filetree --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## Where it shows

In a fullscreen terminal (`/tui fullscreen`) 110 columns or wider, the tree docks beside the conversation as a sidebar. Otherwise it opens above the prompt.

The tree takes keys only while it has the keyboard: `/atc-filetree` gives it the keyboard when the prompt is empty, and **ctrl+x tab** gives it back later. **Esc** returns the keys to the prompt and leaves the tree open.

## Commands

| Command | Does |
|---------|------|
| `/atc-filetree` | Opens the tree, or brings it to the front when another pane is shown over it. When it's already in front, closes it. |
| `/atc-filetree <path>` | Shows another folder, relative to the session's folder or absolute. `/atc-filetree .` goes back to the session's folder. |
| `/atc-filetree refresh` | Reads the folders and the git status again |
| `/atc-filetree unpick` | Drops every picked file |
| `/atc-filetree close` | Closes it |
| `/atc-filetree help` | Lists the commands and keys |

In the tree:

| Key | Does |
|-----|------|
| `j` / `k`, or the arrows | Down / up. The other keys act on the row that's lit, however you got there: keys, Tab or a click. |
| `l` | Opens a folder, or steps into an open one |
| `h` | Closes a folder, or goes up to the folder above |
| `Enter` | Opens or closes a folder; opens a file (in VS Code on Windows) |
| `o` | Same as Enter |
| `p` | Picks the file for your next prompt, or unpicks it. Pick as many as you like. |
| `s` | Find: type part of a name or path. Enter goes to the first match, or a click goes to any match. Enter in an empty field closes the search. |
| `r` | Reads everything again |

A click on a row, or on a key in the bottom row, works too. The tree reads the folders and git status again after each turn and after Claude edits files or runs a command, so `r` is rarely needed.

## Settings

Set in `/config`, or under `pluginConfigs` in your settings:

| Setting | Values | Default |
|---------|--------|---------|
| `activity` | `on`: light up the files Claude reads, writes and commits. `off`: no marks. | `on` |
| `follow` | `on`: open the folders of each file Claude reads or writes and move the cursor to it. `off`: the tree stays where you put it. | `on` |
| `openAtStart` | `on`: open the tree when a session starts, beside the chat in a fullscreen terminal and above the prompt otherwise. It waits until the terminal is 144 columns wide, because a pane nobody asked for doesn't take room from a narrow screen. `off`: open it with `/atc-filetree`. | `off` |
| `column` | `age`, `size`, `date` or `none` | `age` |
| `glyphs` | `plain`: arrows on folders, which every terminal draws. `nerd`: file and folder icons, which need a [Nerd Font](https://www.nerdfonts.com/). | `plain` |

## Limits

- **Git.** Git status needs `git` on your `PATH`. Outside a repository, the tree shows without colors and the header shows no branch. Status and line counts are against `HEAD`; a repository with no commits yet shows status without counts.
- **Big folders.** Up to 1000 entries are shown per folder. Search looks through up to 20,000 files: git's list of tracked and untracked files in a repository, or up to 5000 files outside one (hidden and generated folders skipped).
- **What counts as Claude's.** Reads and writes are the Read, Edit, Write and NotebookEdit tools. A file changed from the shell isn't lit, but the tree and its git status show the change after the command. A commit is a shell command with `git commit` that moved `HEAD`.
- **Opening files.** On Windows, a program that Claude Code starts gets a hidden window. Most apps keep it hidden: Explorer, the "How do you want to open this?" picker, classic apps. So the mod opens files in VS Code, which always shows itself. It needs VS Code's `code` command on the `PATH` (the installer adds it), and runs VS Code's command-line script the way `code.cmd` does. Without VS Code, it says so and opens nothing. On macOS and Linux a file opens in its default app with `open` or `xdg-open`. No shell is involved anywhere, and folders are never opened in a file manager.
- **Picked files are pointers.** Claude gets the paths, not the contents, and reads a file if it needs to. Up to 20 files can be picked at once. Slash commands don't take the picks, and a prompt another mod holds back keeps them for the next one.
- **The tree remembers.** A reload of the mod keeps the folder, the open folders and the cursor. A new session starts again at the session's folder.

## Try it

In a clone of any git repository, on a throwaway branch (`git switch -c try-filetree`), in a fullscreen terminal 110 columns or wider:

1. `/atc-filetree`. The tree opens beside the chat with the branch in its header. Changed files are colored, with `+N -N` counts.
2. With the tree holding the keys, press `j` a few times, then `l` on a folder to open it and `h` to close it again.
3. Ask `Use the Read tool to read README.md and summarize it`. The transcript shows `Read(README.md)`, and the tree moves to `README.md` and lights it purple. A file Claude reads with `cat` or a search isn't lit.
4. Ask `Add a line at the end of the README saying hello`. It lights orange and shows `M +1 -0`.
5. Press `s`, type part of a file name, and press Enter. The tree opens the folders and moves to it.
6. Press `p` on two files, then type `what do these files have in common?` at the prompt. Claude answers about the files you picked, and the pick row goes away.
7. Press `o` on a file. On Windows it opens in VS Code; on macOS and Linux, in its app.
8. Ask `Commit the README change`. The README lights green.

Afterwards, go back with `git switch -` and remove the test branch with `git branch -D try-filetree`.

## Turn it off

`/plugin` → atc-filetree → Disable, or from a shell `claude plugin disable atc-filetree@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-filetree@atc-agentic-toolkit`.

## Develop

Run a local copy for one session without installing it, using the absolute path to your clone. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-filetree
```

Check and test:

```bash
claude plugin validate plugins/atc-filetree
claude plugin test plugins/atc-filetree
```
