# Aspire Plugin

Aspire distributed application orchestration skills covering AppHost, CLI, integrations, dashboard, and deployment.

## Overview

This plugin provides skills for working with .NET Aspire, a polyglot toolchain for building observable, production-ready distributed applications.

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

Expert guidance for Aspire distributed application development including AppHost orchestration, service discovery, integrations, CLI usage, dashboard, and deployment.

**Usage:**

```
/aspire:aspire
```

## Requirements

- .NET SDK 8.0+
- Aspire CLI 13.2+ (install via [aspire.dev](https://aspire.dev): `curl -sSL https://aspire.dev/install.sh | bash` or `irm https://aspire.dev/install.ps1 | iex`)

## License

MIT
