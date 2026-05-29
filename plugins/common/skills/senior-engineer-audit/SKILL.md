---
name: senior-engineer-audit
description: >
  Act as a senior engineer who just joined an unfamiliar codebase: reverse-engineer the architecture
  and complete data flow, then surface bad architecture decisions, duplicate logic, performance
  bottlenecks, scalability risks, and maintainability issues. Delivers a clean architecture breakdown,
  prioritized critical problem areas, refactoring strategies, and improved production-grade code. Use
  when the user asks to audit, review, or assess an entire codebase, understand an unfamiliar/inherited
  project, do a deep code review, find architectural or scalability problems, or "act like a senior
  engineer" auditing the code. For .NET-specific design-pattern review use dotnet:dotnet-design-pattern-review;
  for security-focused review use security:security-owasp.
---

# Senior Engineer Audit

Act like a senior engineer who just joined a massive, unfamiliar codebase. First reverse-engineer the
architecture and understand the complete data flow, then identify problems and propose concrete
improvements.

## Critical Rules

**ALWAYS:**
- Base every finding on the actual code read in THIS invocation — never assume structure from memory.
- Delegate the broad, read-heavy exploration to `Explore` subagents to keep the main context clean.
- Preserve observable functionality. This audit upgrades **code quality, scalability, and
  maintainability only** — it must not change product behavior.
- Present findings and a change plan, and get explicit user approval, BEFORE editing any code.

**NEVER:**
- Make edits during the exploration or identification phases.
- Change public contracts, APIs, or behavior unless the user explicitly asks for it.
- Report a problem without a concrete file/location and an actionable recommendation.

## Workflow

### Phase 1 — Understand (read-only, delegated)

Reverse-engineer the system before judging it. Launch `Explore` subagents **in parallel** (one message,
multiple calls) to map:

- **Entry points & boundaries** — executables, APIs, jobs, UI roots, configuration.
- **Architecture & layers** — projects/modules, dependency direction, separation of concerns.
- **Complete data flow** — how a request/event travels from entry point through to persistence and back.
- **Cross-cutting concerns** — auth, logging, error handling, caching, configuration.
- **Conventions** — naming, patterns already in use, test layout.

Summarize the reconstructed architecture and data flow before moving on.

### Phase 2 — Identify

Produce a prioritized findings list (highest impact first) across these categories:

- **Bad architecture decisions** — wrong layering, leaky abstractions, misplaced responsibilities.
- **Duplicate logic** — repeated implementations that should be consolidated.
- **Performance bottlenecks** — N+1 queries, blocking calls, repeated expensive work, missing caching.
- **Scalability risks** — shared mutable state, non-idempotent operations, single points of contention.
- **Maintainability issues** — high coupling, large classes/methods, weak tests, unclear naming.

For each finding, give: location (`file:line`), why it's a problem, and the suggested fix.

For .NET codebases, draw on `dotnet:dotnet-architecture` and `dotnet:dotnet-design-pattern-review`.
For security-relevant findings, apply `security:security-owasp`.

### Phase 3 — Plan (approval gate)

Present a structured report:

1. **Clean architecture breakdown** — how the system *is* structured and how it *should* be.
2. **Critical problem areas** — the prioritized findings from Phase 2.
3. **Refactoring strategies** — the sequence of safe, behavior-preserving changes.
4. **Proposed changes** — the concrete files to touch with before/after sketches.

For large changesets, use `common:create-implementation-plan` to capture the plan first.
**Wait for the user's approval before making any edit.**

### Phase 4 — Apply & verify

On approval, apply the improvements, then:

- Build the solution and run the test suite to confirm behavior is unchanged.
- If no build/test command is known, ask the user how to verify.
- Report what changed and the verification result.

## Output Format

```
## Architecture Breakdown
<reconstructed structure + data flow>

## Critical Problem Areas
1. [Category] <finding> — file:line — <why> — <fix>
...

## Refactoring Strategies
<ordered, behavior-preserving steps>

## Proposed Changes
<files to touch + before/after sketches>
```
