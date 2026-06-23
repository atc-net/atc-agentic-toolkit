---
name: azure-network-function-manager
description: Expert knowledge for Azure Network Function Manager development including security, and configuration. Use when setting up NF Manager prerequisites, resource groups, managed identities, role assignments, or secure NF access, and other Azure Network Function Manager related development tasks. Not for Azure Firewall Manager (use azure-firewall-manager), Azure Virtual Network Manager (use azure-virtual-network-manager), Azure Virtual Network (use azure-virtual-network), Azure Virtual WAN (use azure-virtual-wan).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Network Function Manager Skill

This skill provides expert guidance for Azure Network Function Manager. Covers security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Security | L26-L30 | Setting up secure access for Network Function Manager by registering required Azure resources, managed identities, and permissions for network functions |
| Configuration | L31-L34 | Prerequisites, permissions, and Azure resource requirements you must meet before deploying or managing network functions with Azure Network Function Manager. |

### Security
| Topic | URL |
|-------|-----|
| Register resources and identities for Network Function Manager | https://learn.microsoft.com/en-us/azure/network-function-manager/resources-permissions |

### Configuration
| Topic | URL |
|-------|-----|
| Meet prerequisites and requirements for Network Function Manager | https://learn.microsoft.com/en-us/azure/network-function-manager/requirements |