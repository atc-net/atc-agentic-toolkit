# Bicep Plugin

Azure Bicep Infrastructure as Code best practices, naming conventions, modularization, and security patterns.

## Overview

This plugin provides background knowledge skills that help AI coding agents write idiomatic, secure, and maintainable Bicep templates. Skills are automatically loaded when working with `.bicep` files.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install bicep --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install bicep@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### bicep-conventions

Best practices for Azure Bicep IaC including naming conventions (lowerCamelCase), parameter design with decorators, resource references using symbolic names, multi-stage modularization, security patterns, and documentation standards.

This skill is automatically loaded as background knowledge — it does not appear in the `/` menu.

## License

MIT
