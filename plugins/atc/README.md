# ATC Plugin

Skills for the ATC.NET libraries and tools: REST API source generation from OpenAPI specifications, and WPF controls with cross-platform XAML development.

## Overview

This plugin teaches the agent how to use the atc-net libraries the way they're meant to be used: which NuGet packages to add, how the source generators are set up, and which conventions the generated code follows.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install atc --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install atc@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### rest-api-generator

The ATC REST API source generator and CLI. It produces server endpoints, C# clients and TypeScript clients from OpenAPI specifications. Covers scaffolding server handlers, typed HTTP clients, TypeScript clients with React Query hooks, API security and rate limiting, caching and resilience, versioning, webhooks, multi-part specs, and moving from the old `atc-rest-api-generator` CLI.

Server code is generated at build time by the `Atc.Rest.Api.SourceGenerator` NuGet package. The `atc-rest-api-gen` .NET tool covers the CLI scenarios.

### wpf

The ATC WPF controls library (160+ controls, forms, components and theming) and the cross-platform XAML toolkit (MVVM, source generators, behaviors). Covers building WPF desktop applications, controls and forms, MVVM with `ObservableProperty` and `RelayCommand` source generators, dependency properties, Light/Dark theming and font icons.

The packages are `Atc.XamlToolkit.Wpf`, `Atc.Wpf.Components` and `Atc.Wpf.Theming`.

## Requirements

- .NET SDK 9.0 or newer

## License

MIT
