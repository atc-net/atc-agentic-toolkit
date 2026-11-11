---
name: create-assessment-report
description: "Assess a repository as a product and write an Assessment & Roadmap report to plans/assessment-roadmap.md: competitive analysis against named alternatives, new features, improvements, performance, bugs and security, testing and documentation gaps, CI/CD and library concerns. Every finding gets a stable ID, priority, status, effort and evidence, and the report ends in a sequenced roadmap. Re-running it updates the same report and keeps its IDs and decisions. Use when the user asks for an assessment or assessment report of a repository, a roadmap or vNext plan for it, a competitive, market or gap analysis, or to re-run or update an existing assessment. For an architecture deep dive with refactored code, use common:senior-engineer-audit instead."
argument-hint: "[focus area]"
---

# Create Assessment Report

Analyze the repository as a Staff Product Engineer and Principal Architect, and write an **Assessment & Roadmap Report**: where the repository stands against named alternatives, what to fix and add to make it the best, most competitive, highest-quality product in its niche, and in what order.

## Output

- Write the report to `plans/assessment-roadmap.md` at the repository root. Create `plans/` if it does not exist.
- One report per repository. When the file exists, follow the [Re-run Rules](#re-run-rules) instead of overwriting it.
- The report's item IDs are permanent: commits, issues and implementation plans in `plans/` refer to findings by them.
- When the user names a focus area (for example "the TCP server" or "security"), still fill every section, but spend the depth there and say so in the Executive Summary.

## Workflow

1. **Existing report.** If `plans/assessment-roadmap.md` exists, read it first and apply the Re-run Rules throughout.
2. **Discovery.** Work through the [Discovery](#discovery) checklist before writing anything.
3. **House standard.** Run `git remote -v`. When any remote is in the `atc-net` GitHub organization (`github.com/atc-net/` or `github.com:atc-net/`), as in a fork whose `upstream` is atc-net, read [references/pipeline-standard.md](references/pipeline-standard.md) and apply it in Section 8. For any other repository, apply no house standard: write `**Pipeline style:** n/a (no house standard)` in the header, assess CI/CD on its own merits in Section 8, and leave out the pipeline compliance subsection.
4. **Research.** Look up competitors, current package versions and known advisories with the tools you have (Evidence Rule 3).
5. **Write.** Fill [references/report-template.md](references/report-template.md), section by section.
6. **Check.** Before saving, check the report against the [Constraints](#constraints) and the Evidence Rules: every item has an ID, priority, status, effort and evidence; no section has more than 7 items; nothing is invented.
7. **Report back.** In the conversation, give the report's path, the number of 🔴 / 🟡 / 🔵 items, and the Do Next list. Nothing else: the findings live in the file.

On a large repository, split the discovery across parallel read-only subagents (for example, one each for `src/`, `test/` and CI) when the tool exists, and have each return findings with their `path:line` evidence.

## Discovery

Read the repository first. Do not infer or assume conventions. Note what exists and what is missing:

| # | Look at | What you are extracting |
|---|---------|-------------------------|
| 1 | `README.md` | Stated purpose, audience, install and usage story, badges |
| 2 | `CHANGELOG.md`, git log (last ~50 commits), tags | Release cadence, recent direction, abandoned areas |
| 3 | Solution, project and manifest files (`*.sln*`, `*.csproj`, `package.json`, `*.psd1`, `pyproject.toml`, …) | Project layout, dependencies, target frameworks and runtimes |
| 4 | `src/` (or equivalent) | Public surface, module boundaries, core abstractions |
| 5 | `test/` (or equivalent) | Test framework, coverage shape, what is *not* covered |
| 6 | `sample/`, `examples/`, `docs/` | Onboarding quality, whether samples still compile and match the API |
| 7 | `.github/workflows/*`, pipeline files | CI/CD maturity, gates, missing checks |
| 8 | Release automation (`release-please-config.json`, `.release-please-manifest.json`, release workflows) | How versions, changelogs, tags and packages are produced |
| 9 | Build and quality config (`Directory.Build.props`, `global.json`, `.editorconfig`, analyzer and lint config) | Warning level, nullable and strict settings, analyzer coverage |
| 10 | Open issues and PRs (if reachable) | Known pain the maintainers already acknowledge |
| 11 | Governance and security files (`SECURITY.md`, `dependabot.yml`, `LICENSE`, `CODEOWNERS`) | Supply-chain and governance hygiene gaps |

State in the report which of these were **absent**: absence is itself a finding.

## Evidence Rules

These are non-negotiable: an unverified roadmap is worse than no roadmap.

1. **Cite or qualify.** Every claim about current behaviour references a real path, such as `src/Foo/Bar.cs:42` or `.github/workflows/build.yml`. If you could not verify it, prefix the item with `⚠️ unverified` and say what would confirm it.
2. **Named comparators only.** Competitive claims name the actual alternative (`owner/repo`, a NuGet or npm package id, a product name). No "industry standards" or "modern best practice" without a name behind it.
3. **Look things up when you can.** Use the search, docs and package tools you have to check competitor features, current package versions and known CVEs. If a tool is unavailable, say so rather than reciting from memory.
4. **Never invent file paths, APIs or version numbers.**
5. **Prefer "I could not determine X" over a confident wrong answer.**

## Legend

### Priority

- 🔴 **Need**: blocking pain, or a missing critical feature consumers expect today.
- 🟡 **Nice**: clear value for UX or DX, but not an immediate blocker.
- 🔵 **Maybe**: worth discussing, speculative, or possibly out of scope for vNext.

### Status

- ✅ **Implemented**
- 🟠 **Partially implemented**
- 🚧 **In progress**: when an implementation plan covers it, end the item with `· *Plan:* plans/<file>.md`.
- ⬜ **Not started**
- ❌ **Rejected / won't do**

### Effort

Required: priority alone cannot be sequenced.

- **S**: under a day, contained, low risk.
- **M**: a few days, touches several files or needs design thought.
- **L**: a week or more, cross-cutting, breaking, or needs a spike first.

### Item IDs

Every item gets a stable ID: `FEAT-01`, `IMPR-01`, `PERF-01`, `BUG-01`, `TEST-01`, `DOCS-01`, `LIB-01`. IDs are permanent. They are how findings are referenced in commits, issues, implementation plans and later runs.

### Item line format

```text
* `ID` [Priority][Status] **[Title]** — *[Effort]* · [What, concretely]. *Why:* [Value or impact]. *Evidence:* `path:line`.
```

## Constraints

- **At most 7 items per section.** Rank by value and cut the rest. A 200-item dump is not a roadmap.
- **Specific enough to act on.** "Improve error handling" is rejected. "`CosmosReader.ReadAsync` swallows a 429 `CosmosException` without surfacing `RetryAfter`" is accepted.
- No conversational text outside the report's structure.

## Re-run Rules

When `plans/assessment-roadmap.md` already exists:

1. Read the existing report first.
2. **Keep every existing ID.** Never renumber.
3. **Keep ❌ Rejected items** with their reason. A rejection is a decision already made: do not propose it again.
4. **Keep 🚧 In progress items** and their `Plan:` links. Change the status only when the code now shows otherwise.
5. New findings continue the numbering (`FEAT-08`, `FEAT-09`, …).
6. Add a **Changed since last run** note at the top: what moved status, what is new, and what was dropped and why.
