---
name: azure-baremetal-infrastructure
description: Expert knowledge for Azure Baremetal Infrastructure development including decision making, and architecture & design patterns. Use when choosing NC2 regions/SKUs, planning BareMetal topologies, or integrating NC2 with Azure networking/services, and other Azure Baremetal Infrastructure related development tasks. Not for Azure Large Instances (use azure-large-instances), Azure Virtual Machines (use azure-virtual-machines), Azure Virtual Machine Scale Sets (use azure-vm-scalesets), SAP HANA on Azure Large Instances (use azure-sap).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Baremetal Infrastructure Skill

This skill provides expert guidance for Azure Baremetal Infrastructure. Covers decision making, and architecture & design patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L24-L27 | Guidance on selecting NC2 on Azure regions and hardware SKUs, including capacity, performance, and availability considerations for deployment planning. |
| Architecture & Design Patterns | L29-L32 | NC2 on Azure BareMetal architecture choices, deployment topologies, integration patterns with Azure services, and design considerations for performance, HA, and networking. |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose NC2 on Azure regions and SKUs | https://learn.microsoft.com/en-us/azure/baremetal-infrastructure/workloads/nc2-on-azure/available-regions-skus |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Understand NC2 on Azure BareMetal architecture options | https://learn.microsoft.com/en-us/azure/baremetal-infrastructure/workloads/nc2-on-azure/architecture |
