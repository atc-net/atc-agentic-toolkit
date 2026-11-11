# Report Template

Reproduce the structure between the two markers exactly, replacing every `[bracketed placeholder]`. Do not emit the markers. HTML comments (`<!-- … -->`) are instructions: follow them and leave them out of the report. Everything else, including italic labels such as *Gap to #1 in the niche:*, is part of the report.

<!-- ==================== BEGIN OUTPUT TEMPLATE ==================== -->

# Repository Assessment & vNext Roadmap

**Repo:** [name] · **Assessed:** [YYYY-MM-DD] · **Commit:** [short sha]
**Type:** [library / service / tool / docs / scripts] · **Stack:** [languages, frameworks, target versions]
**Pipeline style:** [NEW / OLD / NONE for an atc-net repository; otherwise `n/a (no house standard)`]

<!-- Re-run only: -->
> **Changed since last run:** [what moved, what is new, what was dropped]

## 0. Executive Summary

<!-- Five bullets at most: the state of the repo, the single biggest risk, and the single highest-leverage move. -->

## 1. Market & Competitive Analysis

<!-- Two to four sentences on positioning, then a comparison table against named alternatives. -->

| Capability | This repo | [owner/repo or package] | [owner/repo or package] |
|------------|-----------|--------------------------|--------------------------|
| [capability] | ✅/🟠/⬜ | ✅/🟠/⬜ | ✅/🟠/⬜ |

*Gap to #1 in the niche:* [what is actually missing to win].

## 2. New Feature Suggestions (Market Inspiration)

<!-- Features inspired by named competitors and real trends. -->

* `FEAT-01` 🔴⬜ **[Feature name]** — *M* · [Concrete description]. *Why:* [Value]. *Evidence:* [competitor or package that has it, or the gap in `path`].

## 3. Improvement of Existing Features

<!-- Current features that are lacking, unoptimized or clunky. -->

* `IMPR-01` 🟡🟠 **[Feature name]** — *S* · [What to change]. *Why:* [DX or UX impact]. *Evidence:* `path:line`.

## 4. Performance & Scalability

<!-- Bottlenecks, allocations, N+1 patterns, blocking I/O, heavy dependencies, hot-path costs. -->

* `PERF-01` 🟡⬜ **[Area or module]** — *M* · [Bottleneck and proposed fix]. *Why:* [Measured or expected effect]. *Evidence:* `path:line`.

<!-- Flag every claim you could not measure, and say in the item whether a benchmark is needed before acting. -->

## 5. Potential Bugs, Edge Cases & Security

<!-- Code smells, race conditions, missing cancellation, unhandled errors, injection, secret and supply-chain risks. -->

* `BUG-01` 🔴⬜ **[Location or function]** — *S* · [Risk and the scenario that triggers it]. *Why:* [Consequence]. *Evidence:* `path:line`.

## 6. Testing Gaps (TDD Focus)

<!-- Every gap above should imply a test. Name the test file and the cases. -->

* `TEST-01` 🔴⬜ **[Component or path]** — *S* · Add `[TestFile]` covering [specific cases and boundaries]. *Covers:* `BUG-01`, `FEAT-02`. *Evidence:* `test/...` (absent).

## 7. Documentation Gaps

<!-- README, docs/, samples, and API or XML docs, including stale examples that no longer compile. -->

* `DOCS-01` 🟡🟠 **[File or section]** — *S* · [What is missing or wrong]. *Why:* [Who gets blocked]. *Evidence:* `path`.

## 8. Build, CI/CD & Repo Hygiene

<!-- Pipeline gates, analyzer and warning cleanliness, dependency freshness, release automation, governance files. -->

* `IMPR-0x` 🟡⬜ **[Area]** — *S* · [Gap]. *Why:* [Risk it removes]. *Evidence:* `.github/workflows/...`.

<!-- atc-net repositories only, filled in even when fully compliant. For any other repository, leave out everything from here to Section 9. -->

**Pipeline compliance**

> **Pipeline style: [NEW / OLD / NONE]**
> **Release shape:** [single package, or multi-package with one release PR / a release PR per package / released together] · [publishing in the release workflow / a publish workflow per package] · [releases from main, or the branches it uses]
> **Compared with:** [the reference for this shape, `atc-net/<repo>`]

<!-- One row per line item of the pipeline standard that applies, in ID order. Leave out the M rows for a single-package repo and the B rows when it ships no package, and say so. -->

| ID | Expected | State | Gap / convergence step |
|----|----------|-------|------------------------|
| A1 | [line item] | ✅/🟠/⬜ | [what differs from the reference shape] |
| … | … | … | … |

*Summary of divergence from the reference:* [one or two lines, or "none"].

## 9. Library & API Concerns

<!-- Only when the repo ships a consumable package or library. Otherwise write "N/A — not a published library" and nothing else. -->

* `LIB-01` 🔴🟠 **[API or package concern]** — *M* · [Public API surface, SemVer and breaking-change risk, target-framework matrix, nullable annotations, packaging metadata, trimming and AOT support, shipped analyzers]. *Why:* [Consumer impact]. *Evidence:* `path`.

---

## 10. Roadmap — Sequenced Plan

<!-- The payoff: the findings above, put in order. Refer to items by ID only; do not restate them. -->

### Do Next (top 3)

1. `ID` — [why this is first and what it unblocks]
2. `ID` — …
3. `ID` — …

### Dependencies

* `FEAT-02` requires `IMPR-01` (the abstraction must be extracted first).
* `TEST-03` should land before `PERF-01` (baseline before optimizing).

### Milestones

| Milestone | Theme | Items | Effort | Exit criteria |
|-----------|-------|-------|--------|---------------|
| **vNext** | [theme] | `BUG-01`, `TEST-01`, `IMPR-02` | S+S+M | [observable, checkable condition] |
| **Later** | [theme] | `FEAT-01`, `PERF-02` | M+M | [condition] |
| **Backlog** | [theme] | `FEAT-05`, `LIB-03` | L | [condition] |

### Quick Wins

*🔴 or 🟡 items sized S that could ship this week:* `ID`, `ID`, `ID`.

### Explicitly Not Doing

<!-- Items assessed and rejected, with the reason. Kept across runs. -->

* `FEAT-06` ❌ — [reason].

---

## Appendix — Verification Notes

* **Not verified:** [claims marked ⚠️ and what would confirm each]
* **Not inspected:** [areas skipped and why]
* **Tools used:** [search, docs and package tools actually used, or "none available"]

<!-- ===================== END OUTPUT TEMPLATE ===================== -->
