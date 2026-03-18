---
name: azure-network-function-manager
description: Expert knowledge for Azure Network Function Manager development including security, and configuration. Use when building, debugging, or optimizing Azure Network Function Manager applications. Not for Azure Firewall Manager (use azure-firewall-manager), Azure Virtual Network Manager (use azure-virtual-network-manager), Azure Virtual Network (use azure-virtual-network), Azure Network Watcher (use azure-network-watcher).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Network Function Manager Skill

This skill provides expert guidance for Azure Network Function Manager. Covers security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Security | L30-L34 | Setting up secure access for Network Function Manager by registering required Azure resources, managed identities, and permissions for network functions |
| Configuration | L35-L38 | Prerequisites, permissions, and Azure resource requirements you must meet before deploying or managing network functions with Azure Network Function Manager. |

### Security
| Topic | URL |
|-------|-----|
| Register resources and identities for Network Function Manager | https://learn.microsoft.com/en-us/azure/network-function-manager/resources-permissions |

### Configuration
| Topic | URL |
|-------|-----|
| Meet prerequisites and requirements for Network Function Manager | https://learn.microsoft.com/en-us/azure/network-function-manager/requirements |