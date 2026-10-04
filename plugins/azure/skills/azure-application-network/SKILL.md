---
name: azure-application-network
description: Expert knowledge for Azure Application Network development including decision making, and configuration. Use when enabling App Network logs, Azure Monitor metrics, AKS/App Gateway versioning, or upgrade compatibility, and other Azure Application Network related development tasks. Not for Azure Virtual Network (use azure-virtual-network), Azure Virtual Network Manager (use azure-virtual-network-manager), Azure Networking (use azure-networking), Azure Application Gateway (use azure-application-gateway).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Application Network Skill

This skill provides expert guidance for Azure Application Network. Covers decision making, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L26-L30 | Guidance on choosing compatible AKS, Application Gateway, and Application Network versions, including supported combinations and upgrade considerations. |
| Configuration | L31-L35 | Configuring Application Network observability: enabling and analyzing logs in Azure Monitor and setting up/using metrics for monitoring and troubleshooting. |

### Decision Making
| Topic | URL |
|-------|-----|
| Select compatible versions for AKS Application Network | https://learn.microsoft.com/en-us/azure/application-network/supported-versions |

### Configuration
| Topic | URL |
|-------|-----|
| Enable and analyze Application Network logs in Azure Monitor | https://learn.microsoft.com/en-us/azure/application-network/logs |
| Configure Azure Monitor metrics for Application Network | https://learn.microsoft.com/en-us/azure/application-network/metrics |