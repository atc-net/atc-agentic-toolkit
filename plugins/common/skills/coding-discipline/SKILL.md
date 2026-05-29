---
name: coding-discipline
description: >
  Behavioral guardrails that reduce common AI coding mistakes: understand before implementing, write the
  minimum that solves the problem, change only what the task requires, and define verifiable success
  criteria. Apply this skill whenever writing, reviewing, refactoring, editing, or debugging code in any
  language -- even when the user does not explicitly ask for "discipline" or "best practices." Bias
  toward caution over speed; use judgment on trivial tasks.
user-invocable: false
---

# Coding Discipline

Behavioral guardrails for working on code. They bias toward understanding, minimalism, precision, and
verification — the disciplines that separate a careful change from a sprawling one.

**Tradeoff:** these guardrails favor caution over speed. For trivial, unambiguous tasks, apply judgment
rather than ceremony.

## 1. Understand Before Implementing

**Don't assume. Don't hide confusion. Make tradeoffs visible.**

Before writing code:

- State your assumptions out loud. If a key one is uncertain, ask rather than guess.
- When a request has more than one reasonable interpretation, surface them — don't silently pick one.
- If a simpler path exists than the one requested, say so and push back when it's warranted.
- If something is genuinely unclear, stop and name exactly what's confusing instead of coding around it.

## 2. Write the Minimum

**The smallest code that solves the actual problem. Nothing speculative.**

- No functionality beyond what was asked.
- No abstractions for code that has a single caller.
- No "flexibility" or configuration that nobody requested.
- No error handling for conditions that cannot occur.
- If a solution runs long where it could be short, rewrite it shorter.

Sanity check: *would a senior engineer call this overcomplicated?* If yes, simplify before moving on.

## 3. Change Only What's Needed

**Touch what the task requires. Clean up only the mess you made.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting that the task didn't touch.
- Don't refactor things that aren't broken.
- Match the surrounding style, even where you'd personally do it differently.
- Spot unrelated dead code? Mention it — don't delete it on your own initiative.

When your edits create orphans:

- Remove imports, variables, or functions that *your* change left unused.
- Leave pre-existing dead code alone unless asked to remove it.

The test: every changed line should trace directly back to the request.

## 4. Define Success, Then Verify

**Turn the task into something checkable. Loop until it passes.**

Restate vague tasks as verifiable goals:

- "Add validation" → write tests for the invalid inputs, then make them pass.
- "Fix the bug" → write a test that reproduces it, then make it pass.
- "Refactor X" → confirm the tests pass before and after.

For multi-step work, state a brief plan with a check per step:

```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you iterate independently. Weak criteria ("make it work") force constant
back-and-forth.
