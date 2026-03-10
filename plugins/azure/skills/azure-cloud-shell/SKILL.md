---
name: azure-cloud-shell
description: Expert knowledge for Azure Cloud Shell development including troubleshooting, limits & quotas, and security. Use when building, debugging, or optimizing Azure Cloud Shell applications. Not for Azure Portal (use azure-portal), Azure Virtual Machines (use azure-virtual-machines), Azure Resource Manager (use azure-resource-manager).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
---
# Azure Cloud Shell Skill

This skill provides expert guidance for Azure Cloud Shell. Covers troubleshooting, limits & quotas, and security. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L31-L36 | Diagnosing and fixing common Cloud Shell errors, storage and connectivity issues, plus deployment and network problems when running Cloud Shell in private VNets. |
| Limits & Quotas | L37-L41 | Details on Cloud Shell session duration, resource and storage limits, quotas, and how persistent storage works and is constrained across Bash and PowerShell. |
| Security | L42-L46 | Securing Cloud Shell storage accounts, including multi-user access patterns, network isolation, and configuring private endpoints for locked-down access. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common Azure Cloud Shell issues and FAQs | https://learn.microsoft.com/en-us/azure/cloud-shell/faq-troubleshooting |
| Troubleshoot Cloud Shell deployments in private VNets | https://learn.microsoft.com/en-us/azure/cloud-shell/vnet/troubleshooting |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand Azure Cloud Shell session and storage limits | https://learn.microsoft.com/en-us/azure/cloud-shell/overview |

### Security
| Topic | URL |
|-------|-----|
| Configure Cloud Shell storage for multiple users securely | https://learn.microsoft.com/en-us/azure/cloud-shell/security/how-to-support-multiple-users |
| Secure Cloud Shell storage with private endpoints | https://learn.microsoft.com/en-us/azure/cloud-shell/vnet/how-to-use-private-endpoint-storage |