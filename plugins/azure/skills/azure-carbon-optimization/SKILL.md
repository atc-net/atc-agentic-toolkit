---
name: azure-carbon-optimization
description: Expert knowledge for Azure Carbon Optimization development including troubleshooting, security, and integrations & coding patterns. Use when using Carbon Service REST API, Python exports, RBAC roles, emissions data quality, or dashboard issues, and other Azure Carbon Optimization related development tasks. Not for Azure Cost Management (use azure-cost-management), Azure Impact Reporting (use azure-impact-reporting), Azure Monitor (use azure-monitor), Azure Policy (use azure-policy).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Carbon Optimization Skill

This skill provides expert guidance for Azure Carbon Optimization. Covers troubleshooting, security, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L25-L28 | Diagnosing and resolving common Azure Carbon Optimization issues, including data collection gaps, configuration problems, inaccurate emissions estimates, and troubleshooting dashboards or reports. |
| Security | L30-L33 | Setting up Azure RBAC roles and permissions so users and apps can securely access and manage Azure Carbon Optimization resources. |
| Integrations & Coding Patterns | L35-L39 | Using the Carbon Service REST API and Python scripts to programmatically export Azure emissions data, authenticate, query, and integrate carbon metrics into external systems. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common Azure Carbon optimization issues | https://learn.microsoft.com/en-us/azure/carbon-optimization/troubleshooting |

### Security
| Topic | URL |
|-------|-----|
| Configure RBAC access for Azure Carbon optimization | https://learn.microsoft.com/en-us/azure/carbon-optimization/permissions |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use Carbon Service REST API to export emissions data | https://learn.microsoft.com/en-us/azure/carbon-optimization/api-export-data |
| Export Azure carbon data via Python REST integration | https://learn.microsoft.com/en-us/azure/carbon-optimization/tutorial-export-python |
