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

> **macOS/Linux:** The bundled config uses `cmd /c` for Windows. On macOS/Linux, override locally without the wrapper:
> ```bash
> claude mcp add --transport stdio context7 -- npx -y @upstash/context7-mcp@latest
> ```

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
