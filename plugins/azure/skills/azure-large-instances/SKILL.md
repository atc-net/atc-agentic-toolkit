---
name: azure-large-instances
description: Expert knowledge for Azure Large Instances development including troubleshooting, limits & quotas, and integrations & coding patterns. Use when building, debugging, or optimizing Azure Large Instances applications. Not for Azure Baremetal Infrastructure (use azure-baremetal-infrastructure), Azure Virtual Machines (use azure-virtual-machines), Azure Virtual Machine Scale Sets (use azure-vm-scalesets), SAP HANA on Azure Large Instances (use azure-sap).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Large Instances Skill

This skill provides expert guidance for Azure Large Instances. Covers troubleshooting, limits & quotas, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L31-L35 | Diagnosing and resolving common Azure Large Instances issues with Epic integration, including connectivity, performance, configuration, and operational error troubleshooting. |
| Limits & Quotas | L36-L40 | Epic SKU capacity limits and quotas for Azure Large Instances, including supported sizes, scaling constraints, and resource availability per SKU. |
| Integrations & Coding Patterns | L41-L44 | Guidance for configuring, creating, and performance-tuning Epic EHR storage volume groups on Azure Large Instances, including layout, sizing, and best practices. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Resolve common Azure Large Instances Epic issues | https://learn.microsoft.com/en-us/azure/azure-large-instances/faq |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Review Azure Large Instances Epic SKU capacities | https://learn.microsoft.com/en-us/azure/azure-large-instances/workloads/epic/available-skus |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Create and tune Epic volume groups on Azure Large Instances | https://learn.microsoft.com/en-us/azure/azure-large-instances/workloads/epic/create-a-volume-group |