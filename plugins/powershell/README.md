# PowerShell Plugin

PowerShell cmdlet development and scripting best practices based on Microsoft guidelines.

## Overview

This plugin provides background knowledge skills that help AI coding agents write idiomatic, safe, and maintainable PowerShell scripts and cmdlets. Skills are automatically loaded when working with `.ps1` and `.psm1` files.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install powershell --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install powershell@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### powershell-conventions

PowerShell cmdlet development guidelines including Verb-Noun naming, parameter design with validation, pipeline support, error handling with ShouldProcess, comment-based help, and consistent formatting standards.

This skill is automatically loaded as background knowledge — it does not appear in the `/` menu.

## License

MIT
