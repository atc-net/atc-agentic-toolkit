# Plan Template

Use this template for the interview output. Adapt based on scope — small features can omit sections marked (optional).

```markdown
# [Feature Name]

> One-sentence summary of what this feature does and why.

## Context

Why this feature is needed. Link to related issues, discussions, or documentation if they exist.
Include relevant background that someone picking this up later would need.

## Scope

### In Scope
- Bullet list of what this plan covers

### Out of Scope
- Bullet list of what is explicitly deferred or excluded
- Include the reasoning for exclusion where helpful

## Requirements

### User Stories (optional)
- As a [role], I want [goal] so that [benefit]

### Functional Requirements
1. Numbered list of what the system must do
2. Be specific — avoid vague requirements like "handle errors gracefully"

### Non-Functional Requirements (optional)
- Performance targets, security constraints, accessibility needs

## Technical Plan

### Architecture
Describe the high-level approach. Reference existing patterns in the codebase where applicable.

### Data Model (optional)
New entities, schema changes, or migrations needed.

### API Surface (optional)
New or modified endpoints, contracts, request/response shapes.

### UI/UX (optional)
Screens, states, flows, and interactions.

### Key Decisions
Document decisions made during the interview and the reasoning behind them.
Format: **Decision:** [what] — **Reason:** [why]

## Tasks

Ordered list of implementation tasks. Each task should be small enough to be a single commit or PR.

- [ ] Task 1 — brief description
- [ ] Task 2 — brief description
- [ ] Task 3 — brief description

## Open Questions

Anything still unresolved that needs input before or during implementation.

- [ ] Question 1
- [ ] Question 2
```

## Adaptation Guidelines

**Small scope** (bug fix, config change): Use only Summary, Context, Requirements (brief), Tasks.

**Medium scope** (new endpoint, component): Use all sections except UI/UX and Non-Functional Requirements if not applicable.

**Large scope** (subsystem, architectural change): Use all sections. Consider splitting the Tasks section into phases.
