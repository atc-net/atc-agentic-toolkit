---
name: azure-peering-service
description: Expert knowledge for Azure Peering Service development including best practices. Use when building, debugging, or optimizing Azure Peering Service applications. Not for Azure Internet Peering (use azure-internet-peering), Azure Virtual Network (use azure-virtual-network), Azure Virtual WAN (use azure-virtual-wan), Azure ExpressRoute (use azure-expressroute).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
---
# Azure Peering Service Skill

This skill provides expert guidance for Azure Peering Service. Covers best practices. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L29-L32 | Technical requirements and best practices for configuring Azure Peering Service prefixes, including routing, prefix validation, and connectivity constraints. |

### Best Practices
| Topic | URL |
|-------|-----|
| Meet Azure Peering Service prefix technical requirements | https://learn.microsoft.com/en-us/azure/peering-service/peering-service-prefix-requirements |