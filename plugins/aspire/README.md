# Aspire Plugin

Aspire distributed application orchestration skills covering AppHost, CLI, integrations, dashboard, and deployment.

## Overview

This plugin provides skills for working with Aspire, a polyglot toolchain for building observable,
production-ready distributed applications. It covers Aspire 13.1 through **17.0**, including C#,
TypeScript, and Go AppHosts.

The plugin is self-contained: it ships the `aspire` skill and configures the Aspire MCP server
(`aspire agent mcp`), so you don't need Microsoft's `aspire-skills` plugin or `aspire agent init`.
The skill tells agents to pass `--suppress-agent-init` to `aspire new` and `aspire init`, so the
CLI doesn't install Microsoft's skills alongside this one.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install aspire --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install aspire@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### aspire

Expert guidance for Aspire distributed application development:

- Agent guardrails for driving the Aspire CLI (`aspire start`, `wait`, `describe`, `logs`, `otel`, `stop`).
- AppHost detection and authoring in C#, TypeScript, and Go.
- Bootstrapping and wiring existing repos, service discovery, and integrations.
- Terminals and REPLs, the dashboard, the tray companion, MCP, and testing.
- Deployment to Docker Compose, Kubernetes, Azure, and AWS.
- Per-version migration guides, including 13.6 → 17.0 and the move from `Aspire.AppHost.Sdk` and
  `AddProject` to `AddDotnetProject`.

**Usage:**

```text
/aspire:aspire
```

## Requirements

- .NET SDK 10.0+ (required by Aspire 17.0 AppHosts and packages)
- Aspire CLI 13.2+, 17.0 recommended. Install from [aspire.dev](https://aspire.dev) with
  `curl -sSL https://aspire.dev/install.sh | bash` or `irm https://aspire.dev/install.ps1 | iex`,
  and upgrade with `aspire update --self`.
- Optional: Node.js (TypeScript AppHosts) or Go 1.26+ (Go AppHosts)

## License

MIT
