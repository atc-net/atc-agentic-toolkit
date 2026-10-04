---
name: azure-external-attack-surface-management
description: Expert knowledge for Azure External Attack Surface Management development including configuration. Use when filtering EASM inventory by ASN, domains, hosts, IPs, pages, SSL certs, or exporting findings to analytics tools, and other Azure External Attack Surface Management related development tasks. Not for Azure Defender For Cloud (use azure-defender-for-cloud), Azure Security (use azure-security), Azure Sentinel (use azure-sentinel), Azure Networking (use azure-networking).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure External Attack Surface Management Skill

This skill provides expert guidance for Azure External Attack Surface Management. Covers configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Configuration | L25-L37 | Configuring and using Defender EASM inventory filters (ASN, domains, hosts, IPs/blocks, pages, SSL certs, contacts) and exporting EASM data to analytics tools. |

### Configuration
| Topic | URL |
|-------|-----|
| Filter ASN assets in Defender EASM inventory | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/asn-asset-filters |
| Use contact asset filters in Defender EASM | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/contact-asset-filters |
| Configure Defender EASM data exports to analytics | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/data-connections |
| Configure Defender EASM domain asset filters | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/domain-asset-filters |
| Apply host asset filters in Defender EASM | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/host-asset-filters |
| Use Defender EASM inventory filters effectively | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/inventory-filters |
| Configure IP address filters in Defender EASM | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/ip-address-asset-filters |
| Filter IP block assets in Defender EASM | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/ip-block-asset-filters |
| Filter page assets in Defender EASM inventory | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/page-asset-filters |
| Use SSL certificate asset filters in Defender EASM | https://learn.microsoft.com/en-us/azure/external-attack-surface-management/ssl-certificate-asset-filters |