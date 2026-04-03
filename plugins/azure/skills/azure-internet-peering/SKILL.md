---
name: azure-internet-peering
description: Expert knowledge for Azure Internet Peering development including troubleshooting. Use when validating Peering Service prefixes, checking prefix registration, verifying routing, or fixing reachability issues, and other Azure Internet Peering related development tasks. Not for Azure ExpressRoute (use azure-expressroute), Azure Virtual Network (use azure-virtual-network), Azure Virtual WAN (use azure-virtual-wan), Azure VPN Gateway (use azure-vpn-gateway).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Internet Peering Skill

This skill provides expert guidance for Azure Internet Peering. Covers troubleshooting. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L23-L26 | Diagnosing and validating Azure Peering Service prefixes, including prefix registration checks, routing verification, and troubleshooting connectivity or reachability issues. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Validate and troubleshoot Azure Peering Service prefixes | https://learn.microsoft.com/en-us/azure/internet-peering/peering-registered-prefix-requirements |
