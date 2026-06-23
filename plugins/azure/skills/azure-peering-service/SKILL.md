---
name: azure-peering-service
description: Expert knowledge for Azure Peering Service development including best practices. Use when designing Peering Service prefixes, routing policies, prefix validation rules, or connectivity constraints, and other Azure Peering Service related development tasks. Not for Azure Internet Peering (use azure-internet-peering), Azure Virtual Network (use azure-virtual-network), Azure Virtual WAN (use azure-virtual-wan), Azure ExpressRoute (use azure-expressroute).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Peering Service Skill

This skill provides expert guidance for Azure Peering Service. Covers best practices. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L25-L28 | Technical requirements and best practices for configuring Azure Peering Service prefixes, including routing, prefix validation, and connectivity constraints. |

### Best Practices
| Topic | URL |
|-------|-----|
| Meet Azure Peering Service prefix technical requirements | https://learn.microsoft.com/en-us/azure/peering-service/peering-service-prefix-requirements |