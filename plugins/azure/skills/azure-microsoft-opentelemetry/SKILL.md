---
name: azure-microsoft-opentelemetry
description: Expert knowledge for Azure Microsoft Opentelemetry development including configuration. Use when setting sampling, exporters, resource attributes, env vars, or tuning tracing/metrics behavior, and other Azure Microsoft Opentelemetry related development tasks. Not for Azure Monitor (use azure-monitor).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Microsoft Opentelemetry Skill

This skill provides expert guidance for Azure Microsoft Opentelemetry. Covers configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Configuration | L25-L28 | How to configure Microsoft OpenTelemetry Distro options (sampling, exporters, resource attributes, environment variables) and tune tracing/metrics behavior for your applications. |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Microsoft OpenTelemetry Distro settings and options | https://learn.microsoft.com/en-us/azure/microsoft-opentelemetry/configuration |