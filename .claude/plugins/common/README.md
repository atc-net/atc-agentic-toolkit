# Common Plugin

Common base skills, plugins, commands etc.

## Overview

This plugin provides foundational skills and utilities shared across projects.

## MCP Servers

This plugin bundles two MCP servers that start automatically when the plugin is enabled.

### Context7

Documentation context server that provides up-to-date library documentation directly in your prompts. No API keys required.

- Resolves library identifiers and fetches relevant, version-specific documentation

Source: [@upstash/context7-mcp](https://www.npmjs.com/package/@upstash/context7-mcp)

### Playwright

Browser automation server for web testing, scraping, and interaction.

- Navigate, click, fill forms, take screenshots, and execute JavaScript in a browser context

Source: [@playwright/mcp](https://www.npmjs.com/package/@playwright/mcp)

> **macOS/Linux:** The bundled config uses `cmd /c` for Windows. On macOS/Linux, override locally without the wrapper:
> ```bash
> claude mcp add --transport stdio context7 -- npx -y @upstash/context7-mcp@latest
> claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest
> ```

## Skills

### interview

Conducts structured interviews for requirements gathering.

### skill-creator

Guide for creating effective skills that extend Claude's capabilities.

## Requirements

- Node.js (for MCP servers)
- Python 3.x (for skill-creator scripts)

## License

MIT
