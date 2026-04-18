# Diagram Design Methodology

Read this when the diagram needs to teach, argue, or hold up as a reference artifact — not just label a few boxes. For quick sketches, stay with the basics in `SKILL.md`.

---

## Core Philosophy

**Diagrams should ARGUE, not DISPLAY.**

A diagram isn't formatted text. It's a visual argument showing relationships, causality, and flow that words alone can't express. The shape should BE the meaning.

- **Isomorphism test**: if you removed all text, would the structure alone communicate the concept? If not, redesign.
- **Education test**: could someone learn something concrete from this diagram, or does it just label boxes? A good diagram teaches — actual formats, real names, concrete examples.

---

## Depth Assessment (Do This First)

Before designing, decide:

**Simple/Conceptual** — abstract shapes + labels. Use when:
- Explaining a mental model or philosophy
- The audience doesn't need technical specifics
- The concept IS the abstraction (e.g. "separation of concerns")

**Comprehensive/Technical** — concrete examples + evidence. Use when:
- Diagramming a real system, protocol, or architecture
- The diagram teaches or explains (docs, tutorials, videos)
- Showing how multiple technologies integrate

**For technical diagrams, include evidence artifacts (see below).**

---

## Research Mandate (Technical Diagrams)

Before drawing anything technical, research the actual specifications.

1. Look up the real JSON/data formats
2. Find the real event names, method names, API endpoints
3. Understand how the pieces actually connect
4. Use real terminology, not generic placeholders

| Bad | Good |
|-----|------|
| "Protocol" → "Frontend" | "AG-UI streams events (RUN_STARTED, STATE_DELTA)" → "CopilotKit renders via `createA2UIMessageRenderer()`" |

---

## Evidence Artifacts

Concrete examples proving the diagram is accurate and helping viewers learn. Include them in technical diagrams.

| Artifact Type | When to Use | How to Render |
|---------------|-------------|---------------|
| Code snippets | APIs, integrations, implementation details | Dark rectangle + syntax-colored text (see `color-palette.md`) |
| Data/JSON examples | Data formats, schemas, payloads | Dark rectangle + colored text |
| Event/step sequences | Protocols, workflows, lifecycles | Timeline pattern (line + dots + labels) |
| UI mockups | Showing actual output/results | Nested rectangles mimicking real UI |
| Real input content | Showing what goes IN to a system | Rectangle with sample content visible |
| API/method names | Real function calls, endpoints | Use actual names from docs |

Principle: **show what things actually look like**, not just what they're called.

---

## Multi-Zoom Architecture

Comprehensive diagrams operate at multiple zoom levels — country borders AND street names.

- **Level 1 – Summary flow**: simplified overview of the full pipeline (top or bottom of diagram).
- **Level 2 – Section boundaries**: labeled regions grouping related components.
- **Level 3 – Detail inside sections**: evidence artifacts, code, concrete examples.

For comprehensive diagrams, aim for all three levels.

---

## Container vs. Free-Floating Text

Not every piece of text needs a shape around it. **Default to free-floating text.** Add containers only when they serve a purpose.

| Use a container when... | Use free-floating text when... |
|-------------------------|-------------------------------|
| It's the focal point of a section | It's a label or description |
| It needs visual grouping with other elements | It's supporting detail or metadata |
| Arrows need to connect to it | It describes something nearby |
| The shape carries meaning (decision diamond) | Typography alone creates hierarchy |
| It represents a distinct "thing" in the system | It's a section title, subtitle, or annotation |

**The container test**: for each boxed element, ask "Would this work as free-floating text?" If yes, remove the container. Aim for <30% of text elements inside containers.

---

## Visual Pattern Library

Each major concept in a multi-concept diagram should use a **different** visual pattern — no uniform card grids.

| If the concept... | Use this pattern |
|-------------------|------------------|
| Spawns multiple outputs | **Fan-out** (radial arrows from center) |
| Combines inputs into one | **Convergence** (funnel, arrows merging) |
| Has hierarchy/nesting | **Tree** (lines + free-floating text, no boxes) |
| Is a sequence of steps | **Timeline** (line + dots + free-floating labels) |
| Loops or improves | **Spiral/Cycle** (arrow returning to start) |
| Is an abstract state | **Cloud** (overlapping ellipses) |
| Transforms input to output | **Assembly line** (before → process → after) |
| Compares two things | **Side-by-side** (parallel with contrast) |
| Separates into phases | **Gap/Break** (visual separation between sections) |

### Lines as Structure

Use `line` elements (not boxes) as primary structural anchors:
- **Timelines**: horizontal/vertical line with small dots (10–20px ellipses), free-floating labels beside each dot
- **Trees**: vertical trunk + horizontal branches, free-floating text labels
- **Dividers**: thin dashed lines
- **Flow spines**: central line that elements relate to

Lines + free-floating text often beats boxes + contained text.

---

## Shape Meaning

| Concept Type | Shape | Why |
|--------------|-------|-----|
| Labels, descriptions, details | **none** (free-floating text) | Typography creates hierarchy |
| Section titles, annotations | **none** (free-floating text) | Font size/weight is enough |
| Markers on a timeline | small `ellipse` (10–20px) | Visual anchor, not container |
| Start, trigger, input | `ellipse` | Soft, origin-like |
| End, output, result | `ellipse` | Completion, destination |
| Decision, condition | `diamond` | Classic decision symbol |
| Process, action, step | `rectangle` | Contained action |
| Abstract state, context | overlapping `ellipse` | Fuzzy, cloud-like |
| Hierarchy node | lines + text (no boxes) | Structure through lines |

---

## Modern Aesthetics

- **`roughness: 0`** — clean, crisp. Default for modern/technical diagrams.
- **`roughness: 1`** — hand-drawn. Only when brainstorming/informal is explicitly wanted.
- **`strokeWidth: 1`** — thin (lines, dividers), **`2`** — standard, **`3`** — bold (sparingly).
- **`opacity: 100` always.** Use color, size, and stroke width for hierarchy, not transparency.
- Use small dots (10–20px ellipses) instead of full shapes for timeline markers, bullet points, visual anchors.

---

## Layout Principles

### Hierarchy Through Scale
- **Hero**: 300×150 — visual anchor, most important
- **Primary**: 180×90
- **Secondary**: 120×60
- **Small**: 60×40

### Whitespace = Importance
The most important element has the most empty space around it (200px+).

### Flow Direction
Guide the eye — typically left→right or top→bottom for sequences, radial for hub-and-spoke.

### Connections Required
Position alone doesn't show relationships. If A relates to B, there must be an arrow.

---

## Section-by-Section for Large Diagrams

Comprehensive diagrams easily exceed a single response's output token budget. Build in sections.

1. **Base file first**: JSON envelope + first section of elements.
2. **One section per edit.** Take time with each — layout, spacing, connections to prior sections.
3. **Descriptive string IDs** (e.g. `"trigger_rect"`, `"arrow_fan_left"`) for readable cross-section references.
4. **Namespace seeds by section** (section 1 = 100xxx, section 2 = 200xxx) to avoid collisions.
5. **Update cross-section bindings as you go.** When a new element binds to one from an earlier section, edit that earlier element's `boundElements` in the same pass.
6. **Review the whole** before rendering — are cross-section arrows bound on both ends, is spacing balanced, do all IDs resolve?

### What NOT to do
- Don't generate the entire diagram in one pass — you'll hit the output token limit and produce truncated JSON.
- Don't write a Python generator script for the JSON — the templating indirection makes debugging harder. Hand-crafted JSON with descriptive IDs is more maintainable.

---

## Quality Checklist

### Depth & Evidence (Technical Diagrams)
1. Research done — you looked up actual specs, formats, event names
2. Evidence artifacts present — code snippets, JSON examples, real data
3. Multi-zoom — summary flow + section boundaries + detail
4. Concrete over abstract — real content shown, not just labeled boxes
5. Educational value — someone could learn something concrete

### Conceptual
6. Isomorphism — each visual structure mirrors its concept's behavior
7. Argument — the diagram SHOWS something text alone couldn't
8. Variety — each major concept uses a different visual pattern
9. No uniform containers — avoided card grids and equal boxes

### Container Discipline
10. Minimal containers — boxed elements that could be free-floating text have been freed
11. Lines as structure — tree/timeline patterns use lines + text, not boxes
12. Typography hierarchy — font size and color do work boxes would otherwise do

### Structural
13. Every relationship has an arrow or line
14. Clear visual path for the eye to follow
15. Important elements are larger / more isolated

### Technical
16. `text` contains only readable words
17. `fontFamily: 3` unless hand-drawn is requested
18. `roughness: 0` for clean/modern
19. `opacity: 100` for all elements
20. <30% of text elements inside containers
