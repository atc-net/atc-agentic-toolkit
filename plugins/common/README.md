# Common Plugin

Common base skills, plugins, commands etc.

## Overview

This plugin provides foundational skills and utilities shared across projects.

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

### Excalidraw

Hand-drawn style whiteboard and diagramming with real-time streaming.

- Create and edit diagrams with natural language
- Interactive fullscreen editing with viewport control

Source: [excalidraw-mcp](https://github.com/excalidraw/excalidraw-mcp)

## Skills

### interview

Conducts structured interviews for requirements gathering.

### skill-creator

Guide for creating effective skills that extend Claude's capabilities.

### create-agentsmd

Generate an AGENTS.md file for a repository.

### create-implementation-plan

Create implementation plan files for features, refactoring, or architecture changes.

### create-llms

Create an llms.txt file from scratch based on repository structure.

### update-llms

Update an existing llms.txt file to reflect documentation changes.

### repo-story-time

Generate a comprehensive repository summary and narrative from commit history.

### markdown-to-html

Convert Markdown files to HTML using various tools and approaches.

## Requirements

- Node.js (for MCP servers)
- Python 3.x (for skill-creator scripts)

## License

MIT
