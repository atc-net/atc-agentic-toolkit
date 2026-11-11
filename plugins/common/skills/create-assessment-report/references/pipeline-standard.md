# atc-net Pipeline Standard

Apply this only to repositories in the `atc-net` GitHub organization.

**release-please is the release automation standard for every atc-net repository.** Conventional Commits on `main` drive auto-maintained release PRs that produce the version bump, the `CHANGELOG.md` entry, the git tag and the GitHub release.

atc-net repositories don't all release the same way: some ship one package, some several, and those with several either version them together or apart. So first work out the repository's **release shape**, then compare it with the reference for **that shape**. A multi-package repository is not behind just because it doesn't look like a single-package one.

Compare against the reference repository's actual files (a local clone, `gh api`, or the GitHub MCP server), not against this page or memory. The examples below were true when this was written (2026-11); if a reference has changed, the reference wins. If you can't reach it, say so in the Appendix.

## 1. Release shape

Read `release-please-config.json`, `.release-please-manifest.json` and every workflow that runs on `push` to `main` or on a tag.

### Packages

| Shape | How to recognize it | Example |
|-------|---------------------|---------|
| **Single package** | One package, `"."` | `atc-net/atc-rest-api-source-generator` |
| **Multi-package, one release PR** | Several package paths, `separate-pull-requests: false`. Each package keeps its own version | `atc-net/atc` |
| **Multi-package, a release PR per package** | Several package paths, `separate-pull-requests: true`, a `pull-request-title-pattern` per package so the PRs can be told apart | `atc-net/atc-aspire`, `atc-net/atc-kusto` |
| **Multi-package, released together** | A `linked-versions` plugin listing the components: they always share one version | `atc-net/atc-cosmos-eventstore` |

Multi-package repositories also set `component` and `changelog-path` per package, and `include-component-in-tag: true`, `include-v-in-tag: true` and `tag-separator: "@"` at the top, so tags look like `Atc.Kusto@v4.0.0`.

### Publishing

| Model | How to recognize it | Example |
|-------|---------------------|---------|
| **In the release workflow** | The publish steps follow the release-please step in `release-please.yml`. Single package: gated on `release_created`, checkout of `tag_name`. Multi-package: gated on `releases_created`, packing only the paths in `paths_released` | `atc-rest-api-source-generator`, `atc` |
| **One workflow per package, started by its tag** | A workflow per package with `on: push: tags: ['<component>@v*.*.*']` | `atc-aspire`, `atc-kusto`, `atc-cosmos-eventstore` |

Tags and PRs created with the default `GITHUB_TOKEN` don't start other workflows. So release-please runs with `token: ${{ secrets.RELEASE_PLEASE_PAT }}`, or release PRs get no CI and tag-started publish workflows never run.

### Branches

Every atc-net repository that uses release-please releases from `main`, its default branch: the workflow runs on push to `main`, with no `target-branch` and no long-lived `stable` or `release` branch. A repository that releases from other branches (a GitFlow `main → stable → release` flow, or Nerdbank.GitVersioning) is **NONE**, and moving it is a migration.

Write the shape in the compliance subsection, for example: `**Release shape:** multi-package, a release PR per package, a publish workflow per package, from main`.

## 2. Generation

There are two generations of the setup in use, and **the presence of release-please files does not by itself mean a repository is current.**

| | NEW | OLD |
|-|-----|-----|
| release-please action | `googleapis/release-please-action` pinned to a commit SHA with a version comment | `@v4` |
| Job permissions | `contents: read` and `id-token: write` | none |
| NuGet credentials | `NuGet/login` (Trusted Publishing, OIDC) with `secrets.NUGET_USER` | a stored `secrets.NUGET_KEY` |
| `changelog-sections` | present | absent |
| `extra-files` | inside each package | at the top level |
| Build triggers | `push` to `main` with `tags-ignore`, and `pull_request` to `main` | a bare `on: push:` on every branch |
| Other actions | pinned to commit SHAs | `@v4`, `@v6` tags |

Single-package examples of OLD: `atc-net/atc-cosmos`, `atc-net/atc-hosting`. Generations can mix: a repository with a NEW workflow and an OLD config is OLD for the items that differ.

### Classification

Write this verdict in the report header and at the head of the Section 8 compliance subsection:

> **Pipeline style: NEW** (matches the reference for its shape) · **OLD** (release-please present, earlier generation) · **NONE** (no release automation, or releases from other branches)

`NONE` is 🔴. `OLD` is 🟠, with each differing line item named.

## 3. Line items: every repository

| # | Expected | Check for |
|---|----------|-----------|
| A1 | `release-please-config.json` | `release-type`, `bootstrap-sha`, `changelog-sections`, `pull-request-title-pattern` (per package when each package gets its own PR); for multi-package, `component` and `changelog-path` per package and the tag settings in section 1. `extra-files` inside each package; at the top level it still works (it's the default for every package), so that's a convergence step, not a defect |
| A2 | `.release-please-manifest.json` | One entry per package path, each matching the version in that package's version file. With `linked-versions`, every linked entry is the same |
| A3 | Version markers | `x-release-please-start-version` / `x-release-please-end` comments around the version in every file listed under `extra-files` (paths are relative to the package). Without them `extra-files` silently does nothing |
| A4 | Release workflow | Runs on push to `main` with `token: ${{ secrets.RELEASE_PLEASE_PAT }}`, and publishes in the way that fits the shape (section 1): every publish step gated on `release_created` or `releases_created`, or one tag-started workflow per package whose tag pattern matches that package's `component` |
| A5 | Explicit `permissions` | On every job that publishes, tag-started publish workflows included, least privilege (`contents: read` plus `id-token: write` for Trusted Publishing) |
| A6 | Publish credentials | `NuGet/login` (OIDC / Trusted Publishing) in every workflow that publishes, not a long-lived stored key. **A long-lived key is also a Section 5 security finding.** |
| A7 | Action pinning | Third-party actions in every workflow pinned to a commit SHA with the version as a trailing comment (`@3d3c42e5… # v7.0.1`), not a floating `@v6` |
| A8 | CI triggers | Build and test run on `pull_request` to `main` and on push to `main` with `tags-ignore`, not on a bare `on: push:` across all branches and tags |
| A9 | Job separation | Build, test and any smoke or sample verification are separate jobs chained with `needs`, not one job doing everything |
| A10 | `fail-fast: false` | Set on any OS or version matrix, so one failing leg doesn't cancel the rest |
| A11 | Commit discipline | Conventional Commits actually used in recent history; enforced by a check such as the reference's `commit-messages.yml` |
| A12 | Step naming | Workflow step names carry the house emoji prefix |

### Multi-package repositories only

| # | Expected | Check for |
|---|----------|-----------|
| M1 | Every package is wired up | Each package in the config has a manifest entry, a changelog, and a way to publish: it's in the `paths_released` loop, or it has a tag-started workflow. A package with no way to publish gets versions and tags but never ships |
| M2 | Tags match | Each tag-started workflow's pattern is exactly `<component>@v*.*.*` for a `component` in the config. A typo means that package never publishes |
| M3 | Nested package paths | When one package path lies inside another (`src` and `src/Atc.Kusto.CLI`), check that a commit to the inner package doesn't also release the outer one. `⚠️ verify before changing`: look at the last release PRs |
| M4 | Released together, when it should be | Packages that must always ship with the same version (a library and its extension package) are in a `linked-versions` group; packages that evolve separately are not |

## 4. Line items: published package repositories only

Skip this block, and say so, when the repository ships no package.

| # | Expected | Check for |
|---|----------|-----------|
| B1 | Explicit build target | The solution or project passed explicitly to restore and build, not left implicit |
| B2 | Per-project packaging | An explicit pack step per publishable project (for multi-package, only the packages being released), not one blanket pack over the solution |
| B3 | Sample or smoke verification | Sample or template projects built in CI, so a published package that can't be consumed is caught |
| B4 | Multi-OS matrix | Build verified across the OS matrix the package claims to support |

## 5. Reporting

- Report each gap as an `IMPR-xx` item in Section 8, naming the line-item ID (`A6`, `M2`, `B2`).
- Fill the compliance table with one row per line item that applies, in ID order, even when the repository is fully compliant. Leave out the M rows for a single-package repository and the B rows when it ships no package, and say so.
- Name the reference you compared against for the repository's shape.
- **Do not assert that an old-style setup is broken.** It ships releases today. The check is "differs from the reference shape", not "is incorrect". Phrase each gap as a convergence step, and mark anything you could not confirm from the files alone as `⚠️ verify before changing`.
