---
name: azure-large-instances
description: Expert knowledge for Azure Large Instances development including troubleshooting, limits & quotas, and integrations & coding patterns. Use when configuring Epic SKUs, sizing volume groups, tuning EHR storage, or resolving Epic–ALI connectivity/perf issues, and other Azure Large Instances related development tasks. Not for Azure Baremetal Infrastructure (use azure-baremetal-infrastructure), Azure Virtual Machines (use azure-virtual-machines), Azure Virtual Machine Scale Sets (use azure-vm-scalesets), Azure HPC Cache (use azure-hpc-cache).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Large Instances Skill

This skill provides expert guidance for Azure Large Instances. Covers troubleshooting, limits & quotas, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L27-L31 | Diagnosing and resolving common Azure Large Instances issues with Epic integration, including connectivity, performance, configuration, and operational error troubleshooting. |
| Limits & Quotas | L32-L36 | Epic SKU capacity limits and quotas for Azure Large Instances, including supported sizes, scaling constraints, and resource availability per SKU. |
| Integrations & Coding Patterns | L37-L40 | Guidance for configuring, creating, and performance-tuning Epic EHR storage volume groups on Azure Large Instances, including layout, sizing, and best practices. |

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