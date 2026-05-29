---
name: clean-architecture-refactor
description: >
  Act as a senior software architect rebuilding a messy production codebase using clean architecture
  principles: separate concerns properly, increase modularity, reduce tight coupling, improve
  scalability, and make the codebase easier to maintain long term. Delivers a new folder structure, a
  clean architecture breakdown, refactored production-grade code, and an explanation of the
  architectural improvements — without changing product behavior. Use when the user asks to refactor
  into clean/scalable architecture, restructure or modularize a messy codebase, separate concerns,
  reduce coupling, or reorganize the folder/project structure. For .NET layered/DDD structure use
  dotnet:dotnet-architecture; for a non-mutating assessment first use senior-engineer-audit.
---

# Clean Architecture Refactor

Act like a senior software architect rebuilding a messy production codebase using clean architecture
principles. Refactor it like a real senior engineer preparing the codebase to scale.

## Mission

- Separate concerns properly
- Increase modularity
- Reduce tight coupling
- Improve scalability
- Make the codebase easier to maintain long term

## Critical Rules

**ALWAYS:**
- Delegate broad code reading to `Explore` subagents to understand the current structure before changing it.
- Preserve product behavior. This refactor improves **architecture and code quality only** — observable
  functionality must stay identical.
- Present the target structure and a migration plan, and get explicit user approval, BEFORE editing any
  code. This skill is the most mutating of the engineering-workflow skills — the approval gate is mandatory.
- Refactor in small, behavior-preserving steps; keep the build green between steps.

**NEVER:**
- Change product behavior, public APIs, or contracts as part of the restructure.
- Do a big-bang rewrite without an approved plan and a way to verify behavior is unchanged.
- Move files without updating references, namespaces, and tests.

## Workflow

### Phase 1 — Understand (read-only, delegated)

Launch `Explore` subagents **in parallel** to map the current architecture: modules/projects,
dependency direction, where concerns are mixed, coupling hotspots, and the existing folder/namespace
layout. Reconstruct how the system is organized today before redesigning it.

### Phase 2 — Design the target

Design the clean structure:

- **Separation of concerns** — clear layers/boundaries (domain, application, infrastructure, presentation).
- **Modularity** — cohesive modules with single responsibilities.
- **Decoupling** — depend on abstractions; invert dependencies toward the core.
- **Scalability & maintainability** — boundaries that allow independent change and growth.

For .NET solutions, follow the layered/DDD structure in `dotnet:dotnet-architecture`.
If the codebase is unfamiliar, run `senior-engineer-audit` first for a non-mutating assessment.

### Phase 3 — Plan (approval gate)

Present a structured report:

1. **New folder structure** — the target layout (tree), with what moves where.
2. **Clean architecture breakdown** — the layers/modules and their responsibilities and dependencies.
3. **Migration plan** — the ordered, behavior-preserving steps to get from current to target.
4. **Proposed changes** — concrete moves/edits with before/after sketches.

For a change of this size, capture the plan with `common:create-implementation-plan`.
**Wait for the user's approval before making any edit.**

### Phase 4 — Apply & verify

On approval, execute the migration in small steps:

- Move/restructure code, updating references, namespaces, imports, and tests as you go.
- Build and run the test suite after each meaningful step to confirm behavior is unchanged.
- If no build/test command is known, ask the user how to verify.
- Finish with an **explanation of the architectural improvements** and the verification result.

## Output Format

```
## New Folder Structure
<target tree>

## Clean Architecture Breakdown
<layers/modules, responsibilities, dependency direction>

## Migration Plan
<ordered, behavior-preserving steps>

## Proposed Changes
<moves/edits + before/after sketches>

## Architectural Improvements (after applying)
<what improved and why>
```
