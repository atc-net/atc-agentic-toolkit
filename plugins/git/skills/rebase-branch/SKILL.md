---
name: rebase-branch
description: Fetch a base branch (the default branch, unless another is named, such as develop) and rebase the current branch onto it, keeping uncommitted work exactly as it was — staged stays staged, unstaged stays unstaged, untracked files stay. Use when the user wants to update or sync their branch with main, rebase onto main or another base branch, or says "rebase branch" or "rebase on main".
disable-model-invocation: true
argument-hint: "[base-branch]"
---

# Rebase Branch

Brings the current branch up to date with the default branch of the remote (or the base branch the user names) by rebasing it, without touching the user's uncommitted work.

## Git Command Safety

NEVER use `cd <path> && git` compound commands — they trigger security approval prompts. Run `git` commands directly (the working directory is already the target repo), or use `git -C <path>` if you need to target a different directory.

In PowerShell, quote every ref that contains `@{`, or PowerShell reads it as a hashtable: `git stash pop --index 'stash@{1}'`, `git rev-parse '@{u}'`.

## Critical Rules

**ALWAYS:**
- Run the commands below every time — never rely on what you saw earlier in the conversation
- Rebase onto the remote branch (`origin/main`), never the local one, so `main` never has to be checked out. That also works in a linked worktree while `main` is checked out in another one
- Keep the user's uncommitted work exactly as it was: staged changes come back staged, unstaged changes come back unstaged, untracked files come back

**NEVER:**
- Push. Not even when the rebase makes a push necessary — say so, and let the user do it
- Resolve a conflict the user didn't ask you to resolve
- Run `git reset --hard`, `git checkout -- .`, `git clean`, `git stash drop` or `git stash clear` — the user's work lives in the stash until it has been restored
- Use `git pull` or `git rebase --autostash`. Autostash re-applies the stash without `--index`, so staged changes come back unstaged, and it leaves untracked files out
- Check out or update the local base branch

## Step 1: Check the Starting Point

```bash
git rev-parse --abbrev-ref HEAD    # Current branch ("HEAD" means detached)
git status                         # Operations in progress, unmerged paths
git status --short                 # The uncommitted work, kept for the report
git remote                         # Remotes
```

Stop, change nothing, and tell the user why when:
- HEAD is detached
- `git status` shows a rebase, merge, cherry-pick, revert or bisect in progress, or unmerged paths
- There is no remote

## Step 2: Find the Base Branch

**When the user named one** (for example `develop` or `origin/develop`):
- A name that starts with one of the remotes from `git remote` (`origin/develop`) is used as-is
- A bare name (`develop`) is taken from `origin`, or from the only remote when there is no `origin`

**When the user named none**, use the remote's default branch:

```bash
git symbolic-ref --short refs/remotes/origin/HEAD    # e.g. origin/main
```

If that fails, try `origin/main`, then `origin/master` (`git rev-parse --verify --quiet <ref>`). If none exists, ask the user which branch to rebase onto.

When the current branch **is** the base branch (on `main` with base `origin/main`), stop: there is nothing to rebase. Suggest `git pull --ff-only` instead.

## Step 3: Fetch

```bash
git fetch <remote>
git rev-parse --verify --quiet <base>    # The base exists after the fetch
```

If the fetch fails (offline, no access), stop. Nothing has changed yet.

```bash
git rev-list --count HEAD..<base>    # Commits the base has that the branch doesn't
git rev-list --count <base>..HEAD    # The branch's own commits
```

When the first count is `0`, the branch is already up to date: say so and stop. Don't stash anything.

## Step 4: Save the Uncommitted Work

Skip this step when `git status --short` from Step 1 was empty.

```bash
git stash push --include-untracked -m "rebase-branch: <branch> onto <base> <timestamp>"
git stash list                                      # Find the entry by its message
```

Use the current date and time as `<timestamp>`, so the message is unique. The stash is shared by every worktree of the repository, so later steps find the entry by this message, not by assuming it's `stash@{0}`.

Ignored files are not stashed and are not touched by the rebase.

## Step 5: Rebase

```bash
git rebase <base>
```

**If the rebase stops on a conflict:**
1. List the conflicted files: `git diff --name-only --diff-filter=U`
2. Tell the user:
   - which commit stopped (from `git status`) and which files conflict
   - that their uncommitted work is safe in the stash, under its message
   - the choices: resolve the files, `git add` them and `git rebase --continue`; or `git rebase --abort` to go back to where they started
   - that after the rebase is finished or aborted, `git stash pop --index stash@{N}` brings their work back — or they can ask you to continue
3. Stop. Resolve the conflicts only if the user asks. When they ask you to continue after the rebase has finished, go on with Step 6.

If the rebase fails for any other reason (a hook, a dirty tree), show the error, run `git rebase --abort` if a rebase is in progress, then restore the stash as in Step 6 so the user is back where they started.

## Step 6: Restore the Uncommitted Work

Skip this step when nothing was stashed.

```bash
git stash list                       # The entry's index, found by its message
git stash pop --index stash@{N}
git status --short
```

`--index` restores which changes were staged. When `pop` succeeds, git drops the entry itself.

**If `pop` fails, git keeps the entry.** Nothing is lost. Tell the user what happened:
- **Conflicts in the working tree:** the rebased commits changed the same lines. List the conflicted files. When they're resolved, `git stash drop stash@{N}` removes the entry
- **`Conflicts in index. Try without --index.`:** the staged part no longer applies on its own. Offer `git stash pop stash@{N}` without `--index`, which keeps every change but leaves them all unstaged. Run it only if the user agrees

## Step 7: Report

Compare `git status --short` with the one from Step 1: the same files, with the same staged (first column) and unstaged (second column) state.

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}    # The branch's tracking branch, if any
git status -sb                                          # Ahead/behind against it
```

Report briefly:
- The base, and how many commits it brought in
- How many of the branch's commits were replayed on top
- Whether the uncommitted work came back as it was: staged, unstaged and untracked files
- **When the branch has a tracking branch and is now both ahead of and behind it:** the pushed history was rewritten, so the next push needs `git push --force-with-lease`. Never run it. When it's only ahead, a normal `git push` will do

Example:

```text
Rebased feature/paging onto origin/main: 4 new commits from main, your 3 commits replayed on top.
Your uncommitted work is back as it was: 2 staged, 1 unstaged, 1 untracked.
The branch was pushed before, so the next push needs: git push --force-with-lease
```
