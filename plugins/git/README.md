# Git Plugin

Git workflow utilities including commit message generators, PR descriptions and rebasing a branch onto main or another base branch.

## Overview

This plugin provides skills for streamlining Git workflows.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install git --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install git@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### suggest-commit

Generate conventional commit message suggestions based on staged changes.

### suggest-pr

Generate PR titles and structured markdown summaries for pull requests.

### rebase-branch

Fetch a base branch (the default branch, unless you name another) and rebase your branch onto it, with your uncommitted work left exactly as it was: staged changes stay staged, unstaged changes stay unstaged, and untracked files stay.

```text
/git:rebase-branch
/git:rebase-branch develop
/git:rebase-branch origin/release/2.0
```

**Choosing the base branch.** Without an argument, it rebases onto the remote's default branch: `origin/HEAD`, or else `origin/main`, or else `origin/master`. Name a branch to rebase onto something else, for example `develop` in a git-flow repository where feature branches come off `develop` rather than `main`. A bare name like `develop` is taken from `origin`. Add the remote to pick another one: `fork/develop`.

**What it does:**

1. Checks that you're on a branch with no rebase, merge or cherry-pick in progress
2. Fetches the remote, and stops if your branch already contains the base
3. Stashes your uncommitted work, including untracked files
4. Rebases onto the remote base branch, such as `origin/main`, so the local `main` is never checked out. That also works in a linked worktree while `main` is checked out somewhere else
5. Restores your work with `git stash pop --index`, so what was staged is staged again
6. Reports how many commits came in, how many of yours were replayed, and whether the next push needs `--force-with-lease`

**When something conflicts**, it stops and shows you the files:

- **During the rebase:** resolve the files, then run `git rebase --continue`, or `git rebase --abort` to go back. Your uncommitted work waits in the stash meanwhile. Ask Claude to continue, and it finishes the rebase and restores your work.
- **When your work is restored:** git keeps the stash entry, so nothing is lost. Claude says which files conflict and how to drop the entry once you've resolved them.

**It never** pushes, resolves conflicts you didn't ask it to, or runs `git reset --hard`, `git clean` or `git stash drop`.

**Why not `git rebase --autostash`?** It re-applies the stash without `--index`, so staged changes come back unstaged, and it doesn't stash untracked files.

## License

MIT
