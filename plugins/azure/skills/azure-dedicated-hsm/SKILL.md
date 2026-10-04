---
name: azure-dedicated-hsm
description: Expert knowledge for Azure Dedicated HSM development including troubleshooting, decision making, architecture & design patterns, security, and deployment. Use when sizing HSM clusters, configuring ExpressRoute IP SKUs, securing VNets, or planning HSM retirement/migration, and other Azure Dedicated HSM related development tasks. Not for Azure Cloud Hsm (use azure-cloud-hsm), Azure Key Vault (use azure-key-vault), Azure Payment Hsm (use azure-payment-hsm).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Dedicated HSM Skill

This skill provides expert guidance for Azure Dedicated HSM. Covers troubleshooting, decision making, architecture & design patterns, security, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L34 | Diagnosing and fixing Azure Dedicated HSM deployment, configuration, usage, and support issues, including common errors and steps to resolve failed or misconfigured HSM instances. |
| Decision Making | L35-L40 | Guidance on Dedicated HSM retirement, choosing successors (Managed/Cloud HSM), and planning/migrating ExpressRoute IPs and HSM workloads to new SKUs or services. |
| Architecture & Design Patterns | L41-L47 | Guidance on designing Dedicated HSM deployments: sizing and topology, high availability and failover patterns, and secure networking (VNet, subnets, routing, and connectivity). |
| Security | L48-L53 | Physical security controls for Dedicated HSM devices and recommended security configurations, policies, and operational best practices for protecting keys and access. |
| Deployment | L54-L57 | Guidance for migrating the ExpressRoute gateway IP SKU used with Azure Dedicated HSM, including steps, prerequisites, and configuration considerations. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Resolve common Azure Dedicated HSM usage and support questions | https://learn.microsoft.com/en-us/azure/dedicated-hsm/faq |
| Troubleshoot Azure Dedicated HSM deployment and configuration issues | https://learn.microsoft.com/en-us/azure/dedicated-hsm/troubleshoot |

### Decision Making
| Topic | URL |
|-------|-----|
| Plan migration from Azure Dedicated HSM to Managed or Cloud HSM | https://learn.microsoft.com/en-us/azure/dedicated-hsm/migration-guide |
| Understand Azure Dedicated HSM retirement and successors | https://learn.microsoft.com/en-us/azure/dedicated-hsm/overview |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Design deployment architecture for Azure Dedicated HSM | https://learn.microsoft.com/en-us/azure/dedicated-hsm/deployment-architecture |
| Design high availability for Azure Dedicated HSM | https://learn.microsoft.com/en-us/azure/dedicated-hsm/high-availability |
| Plan networking architecture for Azure Dedicated HSM | https://learn.microsoft.com/en-us/azure/dedicated-hsm/networking |

### Security
| Topic | URL |
|-------|-----|
| Understand physical security of Azure Dedicated HSM devices | https://learn.microsoft.com/en-us/azure/dedicated-hsm/physical-security |
| Apply security best practices for Azure Dedicated HSM | https://learn.microsoft.com/en-us/azure/dedicated-hsm/secure-dedicated-hsm |

### Deployment
| Topic | URL |
|-------|-----|
| Migrate Dedicated HSM ExpressRoute gateway IP SKU | https://learn.microsoft.com/en-us/azure/dedicated-hsm/migration-basic-standard |