---
name: performance-optimization
description: >
  Act as a senior performance engineer optimizing a production application used by millions of users:
  maximize speed, lower memory usage, improve scalability, speed up rendering, and clean up execution.
  Identifies performance bottlenecks, inefficient logic, unnecessary rendering, expensive operations,
  and memory leaks, then delivers a performance issue breakdown, optimization strategies, improved
  production-ready code, and scalability recommendations. Use when the user asks to optimize
  performance, make code faster, reduce latency or memory, fix a memory leak, profile hotspots, or
  prepare an app for massive traffic. For web/browser profiling use the chrome-devtools-mcp skills; for
  .NET async/throughput use dotnet:csharp-async.
---

# Performance Optimization

Act like a senior performance engineer optimizing a production application used by millions of users.
Optimize the code as if you are preparing it for massive traffic.

## Goals

- Maximum speed
- Lower memory usage
- Better scalability
- Faster rendering
- Cleaner execution

## Critical Rules

**ALWAYS:**
- Measure or reason from the actual code/data path before optimizing — find the real hotspots, don't guess.
- Delegate broad code reading to `Explore` subagents to keep the main context clean.
- Preserve observable functionality. Optimizations must not change results or behavior.
- Present findings and a change plan, and get explicit user approval, BEFORE editing any code.

**NEVER:**
- Micro-optimize cold paths or sacrifice correctness/readability for negligible gains.
- Change behavior, output, or public contracts in the name of speed.
- Claim an improvement without explaining the mechanism (and, where possible, how to verify it).

## Workflow

### Phase 1 — Understand (read-only, delegated)

Launch `Explore` subagents **in parallel** to map the hot paths: the most-traveled request/render
flows, data access, loops over large collections, allocations, I/O, and concurrency. Identify where
time and memory are actually spent before proposing changes.

### Phase 2 — Identify

Carefully identify, prioritized by impact:

- **Performance bottlenecks** — slow queries, blocking/synchronous I/O, repeated expensive work.
- **Inefficient logic** — wrong data structures, O(n²) loops, redundant computation, chatty calls.
- **Unnecessary rendering** — re-renders, recomputation, missing memoization/virtualization (UI).
- **Expensive operations** — N+1 queries, serialization in hot loops, uncached repeated work.
- **Memory leaks** — unreleased handlers/subscriptions, growing caches, retained large objects.

For each finding give: location (`file:line`), the cost/mechanism, and the optimization.

For web/browser work, use the `chrome-devtools-mcp` performance and memory-leak skills.
For .NET throughput and async correctness, use `dotnet:csharp-async`.

### Phase 3 — Plan (approval gate)

Present a structured report:

1. **Performance issue breakdown** — prioritized findings with their cost.
2. **Optimization strategies** — how each will be addressed, ordered by impact-to-effort.
3. **Scalability recommendations** — caching, batching, async, partitioning, back-pressure.
4. **Proposed changes** — concrete files to touch with before/after sketches.

For large changesets, use `common:create-implementation-plan`.
**Wait for the user's approval before making any edit.**

### Phase 4 — Apply & verify

On approval, apply the optimizations, then:

- Build and run the test suite to confirm behavior/results are unchanged.
- Where feasible, capture a before/after measurement (timing, allocations, query count).
- If no build/test/profiling command is known, ask the user how to verify.
- Report what changed and the verification result.

## Output Format

```
## Performance Issue Breakdown
1. [Category] <finding> — file:line — <cost/mechanism> — <optimization>
...

## Optimization Strategies
<ordered, behavior-preserving changes>

## Scalability Recommendations
<caching / batching / async / partitioning / back-pressure>

## Proposed Changes
<files to touch + before/after sketches>
```
