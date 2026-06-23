---
name: azure-container-storage
description: Expert knowledge for Azure Container Storage development including troubleshooting, decision making, limits & quotas, security, and configuration. Use when configuring CMK-encrypted Elastic SAN volumes, ACS pools, LRS/ZRS redundancy, volume resize, or v1 installs, and other Azure Container Storage related development tasks. Not for Azure Blob Storage (use azure-blob-storage), Azure Files (use azure-files), Azure Elastic SAN (use azure-elastic-san), Azure NetApp Files (use azure-netapp-files).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Container Storage Skill

This skill provides expert guidance for Azure Container Storage. Covers troubleshooting, decision making, limits & quotas, security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L33 | Diagnosing and fixing Azure Container Storage v1 install failures, pool creation/health issues, and related Kubernetes cluster/storage configuration problems. |
| Decision Making | L34-L41 | Guidance on Azure Container Storage costs (v1 vs v2), billing models, and choosing/configuring redundancy options like LRS vs ZRS and multi-zone setups |
| Limits & Quotas | L42-L47 | Guidance on resizing Azure Container Storage volumes (v2 and v1), including capacity/pool limits, constraints, and steps to safely expand volumes within those limits. |
| Security | L48-L52 | Configuring customer-managed key (CMK) encryption for Azure Container Storage using Elastic SAN volumes, including setup steps and security considerations. |
| Configuration | L53-L60 | Configuring Azure Container Storage pools, node placement, and monitoring: storage pool parameters, node affinity, Prometheus setup (v1 & current), and Azure Managed Grafana dashboards. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot Azure Container Storage v1 installation and pool issues | https://learn.microsoft.com/en-us/azure/storage/container-storage/troubleshoot-container-storage |

### Decision Making
| Topic | URL |
|-------|-----|
| Understand billing model for Azure Container Storage v2 | https://learn.microsoft.com/en-us/azure/storage/container-storage/container-storage-billing |
| Understand billing model for Azure Container Storage v1 | https://learn.microsoft.com/en-us/azure/storage/container-storage/container-storage-billing-version-1 |
| Choose LRS vs ZRS for Azure Container Storage | https://learn.microsoft.com/en-us/azure/storage/container-storage/enable-multi-zone-redundancy |
| Configure multi-zone redundancy for Azure Container Storage v1 | https://learn.microsoft.com/en-us/azure/storage/container-storage/enable-multi-zone-redundancy-version-1 |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Resize Azure Container Storage volumes within capacity limits | https://learn.microsoft.com/en-us/azure/storage/container-storage/resize-volume |
| Resize Azure Container Storage v1 volumes within pool limits | https://learn.microsoft.com/en-us/azure/storage/container-storage/resize-volume-version-1 |

### Security
| Topic | URL |
|-------|-----|
| Configure CMK-based encryption for Elastic SAN volumes | https://learn.microsoft.com/en-us/azure/storage/container-storage/configure-encryption-for-elastic-san |

### Configuration
| Topic | URL |
|-------|-----|
| Reference storage pool parameters for Azure Container Storage v1 | https://learn.microsoft.com/en-us/azure/storage/container-storage/container-storage-storage-pool-parameters |
| Enable Prometheus monitoring for Azure Container Storage | https://learn.microsoft.com/en-us/azure/storage/container-storage/enable-monitoring |
| Enable Prometheus monitoring for Azure Container Storage v1 | https://learn.microsoft.com/en-us/azure/storage/container-storage/enable-monitoring-version-1 |
| Configure node affinity for local CSI driver placement | https://learn.microsoft.com/en-us/azure/storage/container-storage/manage-local-container-storage-interface-driver-placement |
| Use Azure Managed Grafana dashboards for container storage | https://learn.microsoft.com/en-us/azure/storage/container-storage/use-grafana-dashboard |