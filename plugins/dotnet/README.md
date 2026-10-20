# .NET Plugin

C#/.NET development skills including refactoring, testing, async patterns, documentation, NuGet management, and Windows app development.

## Overview

This plugin provides skills for C# and .NET development best practices, tooling, and automation.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install dotnet --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install dotnet@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## MCP Servers

This plugin bundles the NuGet MCP server that starts automatically when the plugin is enabled.

### NuGet

NuGet package management server for resolving vulnerabilities, updating packages, and retrieving package documentation.

- Fix package vulnerabilities by updating to compatible non-vulnerable versions
- Get latest package versions and package README documentation
- Update installed packages with compatibility checks

Requires: .NET 10 SDK

Source: [NuGet.Mcp.Server](https://www.nuget.org/packages/NuGet.Mcp.Server)

## Skills

### format-params

Format C# method parameter declarations with line-breaking rules.

### fix-trailing-newlines

Fix SA1518 StyleCop trailing newline violations across project files.

### csharp-async

Best practices for C# async/await programming patterns.

### csharp-docs

Ensure C# types are documented with XML comments following best practices.

### csharp-xunit

Best practices for xUnit unit testing including data-driven tests.

### dotnet-design-pattern-review

Review C#/.NET code for design pattern implementation and suggest improvements.

### dotnet-upgrade

Comprehensive .NET framework upgrade analysis and execution guidance.

### nuget-manager

Manage NuGet packages using dotnet CLI for .NET projects and solutions.

### winapp-cli

Windows App Development CLI for building, packaging, and deploying Windows applications with MSIX.

## Requirements

- .NET SDK
- Python 3.x (for fix-trailing-newlines script)

## License

MIT
