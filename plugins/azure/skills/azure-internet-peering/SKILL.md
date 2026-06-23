---
name: azure-internet-peering
description: Expert knowledge for Azure Internet Peering development including troubleshooting. Use when validating Peering Service prefixes, checking prefix registration, verifying routing, or fixing reachability issues, and other Azure Internet Peering related development tasks. Not for Azure ExpressRoute (use azure-expressroute), Azure Virtual Network (use azure-virtual-network), Azure Virtual WAN (use azure-virtual-wan), Azure VPN Gateway (use azure-vpn-gateway).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Internet Peering Skill

This skill provides expert guidance for Azure Internet Peering. Covers troubleshooting. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L25-L28 | Diagnosing and validating Azure Peering Service prefixes, including prefix registration checks, routing verification, and troubleshooting connectivity or reachability issues. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Validate and troubleshoot Azure Peering Service prefixes | https://learn.microsoft.com/en-us/azure/internet-peering/peering-registered-prefix-requirements |