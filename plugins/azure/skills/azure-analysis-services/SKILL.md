---
name: azure-analysis-services
description: Expert knowledge for Azure Analysis Services development including troubleshooting. Use when resolving server connectivity, firewall/VNet, DNS, client connection, or network error issues, and other Azure Analysis Services related development tasks. Not for Azure Synapse Analytics (use azure-synapse-analytics), Azure SQL Database (use azure-sql-database), Azure SQL Managed Instance (use azure-sql-managed-instance), SQL Server on Azure Virtual Machines (use azure-sql-virtual-machines).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Analysis Services Skill

This skill provides expert guidance for Azure Analysis Services. Covers troubleshooting. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L25-L28 | Diagnosing and fixing Azure Analysis Services connectivity issues, including firewall/VNet settings, DNS, client connections, and common network-related errors. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot Azure Analysis Services network connectivity | https://learn.microsoft.com/en-us/analysis-services/azure-analysis-services/analysis-services-network-faq?view=sql-analysis-services-2025 |