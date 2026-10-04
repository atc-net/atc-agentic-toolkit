---
name: azure-connector-namespace
description: Expert knowledge for Azure Connector Namespace development including configuration. Use when setting up hosted MCP servers, defining Connector Namespace endpoints, auth settings, or runtime options, and other Azure Connector Namespace related development tasks. Not for Azure Service Connector (use azure-service-connector), Azure API Management (use azure-api-management), Azure Logic Apps (use azure-logic-apps), Azure Functions (use azure-functions).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Connector Namespace Skill

This skill provides expert guidance for Azure Connector Namespace. Covers configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Configuration | L25-L28 | Configuring hosted MCP servers in Connector Namespace, including setup steps, connection settings, and runtime options for managing MCP server hosting. |

### Configuration
| Topic | URL |
|-------|-----|
| Configure hosted MCP servers in Connector Namespace | https://learn.microsoft.com/en-us/azure/connector-namespace/hosted-mcp-dev-guide |