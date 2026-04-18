# Color Palette & Brand Style

**Single source of truth for all colors in generated diagrams.** Edit this file to match your brand — the rest of the skill is universal.

---

## Shape Colors (Semantic)

Colors encode meaning, not decoration. Each semantic purpose has a fill/stroke pair. Always pair a darker stroke with a lighter fill for contrast.

| Semantic Purpose | Fill | Stroke |
|------------------|------|--------|
| Primary/Neutral | `#3b82f6` | `#1e3a5f` |
| Secondary | `#60a5fa` | `#1e3a5f` |
| Tertiary | `#93c5fd` | `#1e3a5f` |
| Start/Trigger | `#fed7aa` | `#c2410c` |
| End/Success | `#a7f3d0` | `#047857` |
| Warning/Reset | `#fee2e2` | `#dc2626` |
| Decision | `#fef3c7` | `#b45309` |
| AI/LLM | `#ddd6fe` | `#6d28d9` |
| Inactive/Disabled | `#dbeafe` | `#1e40af` (use dashed stroke) |
| Error | `#fecaca` | `#b91c1c` |

---

## Text Colors (Hierarchy)

Use color on free-floating text to create visual hierarchy without containers.

| Level | Color | Use For |
|-------|-------|---------|
| Title | `#1e40af` | Section headings, major labels |
| Subtitle | `#3b82f6` | Subheadings, secondary labels |
| Body/Detail | `#64748b` | Descriptions, annotations, metadata |
| On light fills | `#374151` | Text inside light-colored shapes |
| On dark fills | `#ffffff` | Text inside dark-colored shapes |

---

## Evidence Artifact Colors

Used for code snippets, data examples, and other concrete evidence inside technical diagrams.

| Artifact | Background | Text Color |
|----------|-----------|------------|
| Code snippet | `#1e293b` | Syntax-colored (language-appropriate) |
| JSON/data example | `#1e293b` | `#22c55e` (green) |

---

## Default Stroke & Line Colors

| Element | Color |
|---------|-------|
| Arrows | Stroke color of the source element's semantic purpose |
| Structural lines (dividers, trees, timelines) | Primary stroke (`#1e3a5f`) or Slate (`#64748b`) |
| Marker dots (fill + stroke) | Primary fill (`#3b82f6`) |

---

## Background

| Property | Value |
|----------|-------|
| Canvas background | `#ffffff` |

---

## Customization

Do not invent new colors in generated diagrams. If a concept doesn't fit an existing semantic category, use Primary/Neutral or Secondary. To change the palette, edit this file — downstream usage is driven entirely by the table values above.
