# Common Plugin

Common base skills, plugins, commands etc.

## Overview

This plugin provides foundational skills and utilities shared across projects.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install common --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install common@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## MCP Servers

This plugin bundles the Context7 MCP server that starts automatically when the plugin is enabled.

### Context7

Documentation context server that provides up-to-date library documentation directly in your prompts. No API keys required.

- Resolves library identifiers and fetches relevant, version-specific documentation

Source: [@upstash/context7-mcp](https://www.npmjs.com/package/@upstash/context7-mcp)

### Draw.io

Professional diagramming with 10,000+ shapes including AWS, Azure, GCP, Kubernetes, and UML icons.

- Open diagrams from XML, CSV, or Mermaid syntax
- Full draw.io editor with export capabilities

Requires: Node.js

Source: [@drawio/mcp](https://www.npmjs.com/package/@drawio/mcp)

### Mermaid

Text-to-diagram generation supporting flowcharts, sequence diagrams, class diagrams, ER diagrams, and more.

- Generate diagrams from Mermaid syntax as PNG, SVG, or base64
- Configurable themes and backgrounds

Requires: Node.js

Source: [mcp-mermaid](https://www.npmjs.com/package/mcp-mermaid)

## Skills

### interview

Conducts structured interviews for requirements gathering.

### skill-creator

Creates and improves skills with you: it drafts the `SKILL.md`, runs test prompts with and without the skill, grades and benchmarks the results, and tunes the description so the skill triggers when it should. Ask Claude to "create a skill for …" or "improve the … skill", or run `/common:skill-creator`.

Its scripts also work on their own. Run them from the repository root.

Check a skill's frontmatter (name, description and the allowed fields):

```bash
python plugins/common/skills/skill-creator/scripts/quick_validate.py plugins/dotnet/skills/csharp-xunit
```

Check every skill in the repository:

```bash
# Bash, Git Bash or zsh
python plugins/common/skills/skill-creator/scripts/quick_validate.py plugins/*/skills/*/
```

```powershell
# PowerShell
python plugins/common/skills/skill-creator/scripts/quick_validate.py (Get-ChildItem plugins/*/skills/* -Directory)
```

The check accepts the Agent Skills standard's fields and the ones Claude Code adds, such as `user-invocable`. Add `--strict` to accept only the standard's fields, as a claude.ai upload needs. `python -m scripts.package_skill <skill folder>`, run from the skill-creator folder, packages a skill as a `.skill` file for upload, and it always checks strictly.

### create-agentsmd

Generate an AGENTS.md file for a repository.

### create-implementation-plan

Create resumable implementation plan files for features, refactoring, or architecture changes, with per-phase verification and handoff summaries.

### create-llms

Create an llms.txt file from scratch based on repository structure.

### update-llms

Update an existing llms.txt file to reflect documentation changes.

### repo-story-time

Generate a comprehensive repository summary and narrative from commit history.

### excalidraw

Create, edit, and export Excalidraw diagrams using the bundled MCP server or direct JSON generation.

### markdown-to-html

Convert Markdown files to HTML using various tools and approaches.

## Requirements

- Node.js (for MCP servers)
- Python 3.x with PyYAML (`pip install pyyaml`), for the skill-creator scripts

## License

MIT
