---
name: suggest-pr
description: Generate a pull request title and well-structured markdown summary from the commits on the current branch. Use when the user wants to create or draft a PR description, asks for a PR summary, or says "suggest PR".
disable-model-invocation: true
---

# Suggest PR

## Execution Steps

### Step 1: Determine the Base Branch

Run the following to identify the base branch:

```bash
git remote show origin | grep "HEAD branch" | sed 's/.*: //'
```

If this fails, fall back to `main` or `master` (whichever exists).

Store the result as `BASE_BRANCH`.

### Step 2: Gather Branch Information

Run these commands to collect all information about the current branch's changes:

```bash
git branch --show-current                           # Current branch name
git log origin/${BASE_BRANCH}..HEAD --oneline        # All commits on this branch
git log origin/${BASE_BRANCH}..HEAD --format="%s%n%b" # Full commit messages with bodies
git diff origin/${BASE_BRANCH}..HEAD --stat           # Changed files overview
```

### Step 3: Analyze the Diff for Context

For a thorough understanding, also run:

```bash
git diff origin/${BASE_BRANCH}..HEAD --name-only     # List of all changed files
```

If the changeset is complex (many files across multiple areas), also run:

```bash
git diff origin/${BASE_BRANCH}..HEAD                  # Full diff for deeper analysis
```

### Step 4: Generate PR Title

Create a concise PR title (under 70 characters):

- Use imperative mood ("Add", "Fix", "Update", "Refactor")
- Be specific about what changed
- Match the repository's existing PR/commit style

### Step 5: Generate PR Summary

Produce a markdown summary with these sections:

#### Required Sections

**Summary** - A brief overview (2-4 sentences) of what this PR accomplishes and why.

**Changes** - Categorized list of all changes. Group and prefix with emojis:

| Category | Emoji | When to Use |
|----------|-------|-------------|
| New features | :sparkles: | New functionality added |
| Bug fixes | :bug: | Bugs fixed, errors resolved |
| Breaking changes | :boom: | Breaking API or behavior changes |
| Refactoring | :recycle: | Code restructured without behavior change |
| Documentation | :memo: | Docs, README, comments |
| Configuration | :wrench: | Config files, build settings |
| Performance | :zap: | Performance improvements |
| Styling | :art: | Code formatting, style changes |
| Dependencies | :package: | Dependency updates |
| Removal | :fire: | Removed code or files |
| Security | :lock: | Security fixes or improvements |
| CI/CD | :construction_worker: | Pipeline, build, deployment changes |

#### Optional Sections (include when relevant)

**Breaking Changes** - Detail any breaking changes with migration steps.

**Notes** - Any additional context reviewers should know.

### Step 6: Output Format

Present the output as a clean markdown block that can be directly copy-pasted:

```markdown
# PR Title Here

## Summary

Brief overview of the PR purpose and motivation.

## Changes

### :sparkles: Features
- Add new authentication endpoint for OAuth2 flow
- Implement token refresh mechanism

### :bug: Fixes
- Fix null reference in user profile loading
- Resolve race condition in session management

### :recycle: Refactoring
- Simplify database query builder logic
- Extract common validation into shared module

### :memo: Documentation
- Update API reference for new auth endpoints
```

## Rules

**ALWAYS:**
- Base the summary ONLY on actual commits and diffs from THIS invocation
- Run the git commands every time - never assume or remember previous state
- Use emojis for change categories as specified above
- Group related changes together under appropriate categories
- Write in imperative mood for change descriptions

**NEVER include:**
- Test counts, test pass/fail statistics, or test coverage numbers
- The "Generated with Claude Code" footer or any Claude attribution
- Co-Authored-By lines
- Implementation details that are obvious from the code
- File-by-file listings (summarize by feature/area instead)
- Empty categories (only show categories that have changes)

## Guidelines

- Keep the PR title under 70 characters
- Keep change descriptions concise but informative (focus on the "what" and "why")
- If the branch has many commits, synthesize them into logical groups rather than listing each commit
- Match the tone and style of the repository's existing PRs when possible
- If commits follow Conventional Commits format, use that to inform categorization
