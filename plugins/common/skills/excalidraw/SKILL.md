---
name: excalidraw
description: Use when creating new Excalidraw diagrams or reading, modifying, or comparing existing .excalidraw or .excalidraw.json files. Also use when the user asks for hand-drawn style diagrams, whiteboard sketches, architecture diagrams in Excalidraw format, or wants to export Excalidraw to SVG/PNG. Use this skill even if the user doesn't say "Excalidraw" — for example when they ask for a system diagram, flowchart, or architecture sketch that should look hand-drawn or informal.
---

# Excalidraw

## Excalidraw MCP Server (optional)

The official Excalidraw MCP server (`https://mcp.excalidraw.com`) supports natural-language diagram generation. It uses Streamable HTTP transport, which isn't supported by the plugin MCP system — users who want it must add it manually to their Claude Code settings.

If the Excalidraw MCP tools are available in the current session, use them for quick one-shot diagrams. Otherwise, use direct JSON generation as described below.

---

## References

This skill includes detailed reference files. Read them when you need deeper guidance:

| Reference | When to read |
|-----------|-------------|
| [references/element-reference.md](references/element-reference.md) | Need exact properties for a specific element type (text fields, arrow points, image embedding, frames, groups, freedraw) |
| [references/diagram-patterns.md](references/diagram-patterns.md) | Building a flowchart, sequence diagram, mind map, architecture diagram, ERD, or DFD — includes layout patterns, color schemes, and shape conventions |

For most simple diagrams the information in this SKILL.md is sufficient. Consult the references for complex or specific diagram types.

---

## Creating a New Diagram (Direct JSON)

Generate the JSON directly. No subagent needed for creation.

### File Envelope

Every `.excalidraw` file is a JSON object:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

### Element Types

| Type        | Use for                          |
|-------------|----------------------------------|
| `rectangle` | Boxes, nodes, containers         |
| `ellipse`   | Circles, ovals                   |
| `diamond`   | Decision / branching nodes       |
| `arrow`     | Connections between shapes       |
| `line`      | Non-connecting line segments     |
| `text`      | Standalone labels                |

### Required Fields Per Element

Every element needs all of these:

```json
{
  "id": "V1StGXR8_Z5jdHi6B-myT",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 80,
  "angle": 0,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "groupIds": [],
  "frameId": null,
  "roundness": null,
  "seed": 1482348421,
  "version": 1,
  "versionNonce": 391154490,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1700000000000,
  "link": null,
  "locked": false
}
```

IDs must be random alphanumeric strings (~21 chars, nanoid-style). Never use sequential integers — duplicate or predictable IDs corrupt the file silently.

`seed` and `versionNonce` must be random positive integers. Using `0` causes rendering glitches.

### Arrow Bindings

When an arrow connects two shapes, three elements need updating:

**Arrow:**
```json
{
  "type": "arrow",
  "startBinding": { "elementId": "<source-id>", "focus": 0, "gap": 1 },
  "endBinding":   { "elementId": "<target-id>", "focus": 0, "gap": 1 },
  "points": [[0, 0], [200, 0]]
}
```

**Source shape's `boundElements`:**
```json
"boundElements": [{ "type": "arrow", "id": "<arrow-id>" }]
```

**Target shape's `boundElements`:**
```json
"boundElements": [{ "type": "arrow", "id": "<arrow-id>" }]
```

All three must be in sync. A broken binding renders as a disconnected floating arrow.

Arrow `points` always start at `[0, 0]` — coordinates are relative to the arrow's x,y position.

### Text in Shapes

To place text inside a shape, create a separate `text` element with `containerId` set to the parent shape's ID, and add the text to the parent's `boundElements`:

**Parent shape:**
```json
"boundElements": [{ "type": "text", "id": "<text-id>" }]
```

**Text element:**
```json
"containerId": "<parent-shape-id>"
```

The text element's `strokeColor` IS the text color — omitting it can cause invisible text on white backgrounds.

---

## Editing an Existing Diagram

**Never use the Read tool on `.excalidraw` files.** Excalidraw JSON consumes 4k-22k tokens — nearly all visual metadata. Always delegate to a subagent.

### Pattern

```
Main agent                    Subagent
-------------------------------------------------------------
Receive edit request
Create subagent task -------> Read .excalidraw file
                              Return semantic summary:
                              - element labels + types
                              - connection topology
                              - NO raw JSON
Specify changes ------------> Apply changes to JSON
                              Write updated file
                              Confirm: added/changed/removed
```

### Subagent Task Templates

**Understand a diagram:**
> Read `<path>`. Return: a list of all elements with their text labels and types, and which elements are connected to which. Do not return any JSON.

**Modify a diagram:**
> Read `<path>`. Make these changes: `<plain-language changes>`. Write the updated file. Confirm which elements were added, changed, or removed.

**Compare two diagrams:**
> Read `<file-a>` and `<file-b>`. Return the architectural differences — which elements exist in one but not the other, and how the connection topology differs. Do not return any JSON.

---

## Best Practices

### Spacing and Layout

- Minimum 40px between any elements
- 100-120px gap for unlabeled arrows, 150-200px for labeled
- Container/zone padding: 50-60px inside edges

### Styling

- Use `roughness: 0` for technical/formal diagrams (hand-drawn feel only when explicitly requested)
- Use `fontFamily: 2` (Helvetica) for professional diagrams, `1` (Virgil) for casual/sketch
- Stick to Excalidraw's built-in colors — avoid custom hex values
- For containers with children, use `opacity: 25-40` on the background to avoid obscuring contents

### Font Sizing

| Purpose     | Size |
|-------------|------|
| Title       | 28px |
| Section     | 24px |
| Label       | 20px |
| Description | 16px |
| Notes       | 14px |

### Element Sizing from Text

Calculate width: `max(160, charCount * 9)` for Latin text. Height: 60px for single-line, +24px per additional line.

---

## Exporting

Drag and drop any `.excalidraw` file into [excalidraw.com](https://excalidraw.com) to open, edit, and export to PNG/SVG.

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `seed` or `versionNonce` is `0` | Use random positive integers |
| Arrow added but endpoint shapes not updated | Update `boundElements` on both source and target shapes |
| `containerId` set but container missing entry | Keep `containerId` and `boundElements` in sync |
| IDs are sequential integers (`1`, `2`, `3`) | Use nanoid-style random strings (~21 chars) |
| Main agent reads file to "quickly check" | No exceptions — delegate to subagent |
| Text invisible on white background | Set `strokeColor` on text element (it IS the text color) |
| Text on container overlaps children | Use a free-standing text at the top, not bound text |
| `boundElements` set to `[]` | Use `null` for empty — `[]` can cause issues |
| Cross-zone diagonal arrows look messy | Route arrows along zone perimeters instead |
