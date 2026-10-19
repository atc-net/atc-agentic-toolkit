# ATC Blast Radius Plugin

> [!IMPORTANT]
> This is a Claude Code **mod**. It requires **Claude Code 2.1.287 or newer** and doesn't run in GitHub Copilot. It works on Windows, macOS and Linux, with both the Bash and the PowerShell tool.

## Overview

atc-blast-radius stops a risky shell command before it runs and shows you what it would delete or throw away. You then choose **Cancel** or **Proceed**.

```text
 ☐ Blast radius

rm -rf build would delete 1,204 files in 38 folders (38.2 MB), 12 of them tracked by git.
  build\app.dll
  build\app.pdb
  build\obj\app.deps.json
  … and 1,201 more
Run it?

❯ 1. Cancel
  2. Proceed
```

- **Cancel** refuses the command. Claude is told you said no and what the command would have done, so it asks you instead of trying another way.
- **Proceed** runs the command exactly as written.
- Typing your own answer instead refuses the command and passes your words to Claude ("use git clean -n first").
- Dismissing the question refuses the command too.

Commands with nothing at risk run without a question. Examples: `git reset --hard` with a clean working tree, `git clean -f` with no untracked files, or `rm -rf /full/path/build` when that folder isn't there.

When in doubt, it asks rather than lets a command through:
- **A relative path that isn't found** (`rm -rf build` with no `build` in the session's folder). Claude's shell keeps its own folder between commands, so it may be somewhere else where `build` does exist.
- **A folder that doesn't exist**, such as one a `cd` points to.
- **A git that doesn't answer.** Only git's own "not a git repository" counts as nothing at risk.

## Install

```text
/plugin install atc-blast-radius --marketplace atc-net/atc-agentic-toolkit
```

Answer `y` to add the marketplace and pick a scope. The mod is active straight away, with no restart.

## What it holds

| Command | What you see |
|---------|--------------|
| `rm -r`, `rm -f`, `rm -rf` (Bash) | The files it would delete: count, folders, total size, how many are tracked by git, and the first 10 paths. A glob in the last part of a path (`dist/*.js`) is expanded. |
| `Remove-Item -Recurse` / `-Force`, and its aliases `rm`, `del`, `rd`, `ri` (PowerShell) | The same, for each path, including `-Path a,b` lists |
| `rd /s`, `del /s` (inside `cmd /c`) | The same |
| `git reset --hard [ref]` | The files with uncommitted changes and the lines changed. With a ref, the commits the branch would move back past (still in the reflog). |
| `git checkout -- <paths>`, `git checkout .`, `git checkout -f`, `git restore <paths>` | The files whose changes it would throw away |
| `git clean -f` (with `-d`, `-x`, `-X`, `-e`, paths) | The untracked paths it would delete, from `git clean -n` with the same options |
| `git push --force`, `-f`, `+ref` | The commits on the remote branch that it would drop, as of your last fetch. Always asks. |
| `git push --force-with-lease` | Asks only when it would drop commits, or when there's no fetched copy of the remote branch to compare with. Otherwise the lease protects you. |
| Database migrations: `dotnet ef database update`/`drop`, `Update-Database`, `manage.py migrate`, `rails db:migrate`, `alembic upgrade`, `prisma migrate`, Flyway, Liquibase, Knex, Sequelize, TypeORM, Drizzle, and `migrate` as an argument (`npm run migrate`) | A note that it changes a database, which git can't undo. Pending migrations aren't listed, because listing them would run your project's code first. |
| `find … -delete`, `find … -exec rm`, `… \| xargs rm -rf`, `… \| Remove-Item` | A note that the files are picked when the command runs, so they can't be counted in advance |

It understands where each part runs:
- a leading `cd dir &&`, `pushd`/`popd`, `Set-Location` or `git -C dir`;
- a `cd` inside `( … )` only applies inside the parentheses;
- wrappers such as `sudo`, `env`, `nice` and `timeout`;
- nested shells: `bash -c "…"`, `pwsh -Command "…"`, `cmd /c …`.

Text in quotes and comments isn't treated as commands, so `git commit -m "fix rm -rf bug"` runs without a question.

Warnings are added when a path is a drive or file-system root, your home folder, or a folder that holds the whole project.

## How it works

- **Where it hooks in.** It hooks `tool.call` for the Bash and PowerShell tools.
- **Measuring.** It measures with Claude Code's own file API and with `git`, run with arguments and never through a shell. It needs no `bash`, `find`, `du` or `sleep`, so it behaves the same on every platform. A big tree is counted up to 20,000 entries or 5 seconds, and the count then shows a `+`.
- **Git Bash paths.** On Windows, the Bash tool's drive paths (`/e/work/build`) are measured on that drive (`E:\work\build`). Other Git Bash paths such as `/tmp` can't be followed, so the command is held with a note.
- **Asking.** The question uses Claude Code's own dialog, with **Cancel** as the first option. The files or commits it would touch are listed in the question itself, up to 10 of them.
- **Failures.** If the mod fails while checking a command, the command is refused, not let through. Claude is told why, and you can turn the mod off with `/plugin` if you want the command to run.
- **Permissions.** It only adds a check and never replaces one. After **Proceed**, Claude Code's normal permission rules still apply: a prompt in default mode, the classifier in auto mode, and your allow and deny rules.

## Limits

- **Safety net, not a permission system.** For a hard block, use [permission rules](https://code.claude.com/docs/en/settings) such as `"deny": ["Bash(rm -rf:*)"]`.
- **Command text only.** It reads the command text, not scripts the command calls (`./cleanup.sh`, `npm run clean`), aliases, or `eval`.
- **Unmeasurable paths.** A path built from a variable or an expression (`rm -rf "$OUT"`, `Remove-Item (Join-Path $a b)`) can't be measured. The command is still held, with a note saying so.
- **Without a person.** In a headless run (`claude -p`) there's no one to ask, so a held command is refused.
- **Force pushes.** These are compared with your last fetch of the remote branch. When the push names no remote, it uses the branch's upstream, or `origin`.

## Try it

Use a throwaway folder:

```bash
mkdir blast-demo && cd blast-demo && git init
```

1. `Create a build folder with 50 small files, then delete it with rm -rf build`. The question, with the files it would delete, appears before anything is deleted. Press **Cancel**: the folder stays, and Claude says it didn't run.
2. Ask again and press **Proceed**: the folder is deleted.
3. `Commit a file, change it, then run git reset --hard`. The question lists the changed file.
4. On Windows: `Use PowerShell to remove the build folder with Remove-Item -Recurse -Force`. It is held the same way.
5. `Run git status, then git reset --hard`. With a clean working tree it runs without a question, because nothing is at risk.

## Turn it off

`/plugin` → atc-blast-radius → Disable, or from a shell `claude plugin disable atc-blast-radius@atc-agentic-toolkit`. Turn it back on with Enable, or `claude plugin enable atc-blast-radius@atc-agentic-toolkit`.

## Develop

Run a local copy for one session without installing it, using the absolute path to your clone. Saving a file in the folder reloads the mod.

```bash
claude --plugin-dir <path-to-clone>/plugins/atc-blast-radius
```

Check and test:

```bash
claude plugin validate plugins/atc-blast-radius
claude plugin test plugins/atc-blast-radius
```
