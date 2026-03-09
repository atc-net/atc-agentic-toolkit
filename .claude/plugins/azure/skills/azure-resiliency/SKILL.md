---
name: azure-resiliency
description: Expert knowledge for Azure Resiliency development including limits & quotas, security, and configuration. Use when building, debugging, or optimizing Azure Resiliency applications. Not for Azure Reliability (use azure-reliability), Azure Site Recovery (use azure-site-recovery), Azure Backup (use azure-backup), Azure Monitor (use azure-monitor).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
---
# Azure Resiliency Skill

This skill provides expert guidance for Azure Resiliency. Covers limits & quotas, security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L31-L35 | Resiliency support boundaries in Azure: what scenarios are covered or excluded, limitations by service/feature, and how these affect reliability, SLAs, and support expectations. |
| Security | L36-L41 | Configuring security levels, policies, and posture in Azure Resiliency, including how to assess, adjust, and enforce protections for resilient workloads and infrastructure. |
| Configuration | L42-L48 | Configuring and managing Azure Backup/Site Recovery vaults and protection policies, including creation, updates, lifecycle operations, and settings for backup and replication. |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand Resiliency support scenarios and limitations | https://learn.microsoft.com/en-us/azure/resiliency/resiliency-support-matrix |

### Security
| Topic | URL |
|-------|-----|
| Use security levels in Resiliency for protection | https://learn.microsoft.com/en-us/azure/resiliency/security-levels-concept |
| Review and adjust security posture in Resiliency | https://learn.microsoft.com/en-us/azure/resiliency/tutorial-review-security-posture |

### Configuration
| Topic | URL |
|-------|-----|
| Create backup and replication protection policies in Resiliency | https://learn.microsoft.com/en-us/azure/resiliency/backup-protection-policy |
| Configure Recovery Services and Backup vaults in Azure | https://learn.microsoft.com/en-us/azure/resiliency/backup-vaults |
| Manage backup and replication protection policies in Resiliency | https://learn.microsoft.com/en-us/azure/resiliency/manage-protection-policy |
| Manage lifecycle of Azure Backup and Site Recovery vaults | https://learn.microsoft.com/en-us/azure/resiliency/manage-vault |