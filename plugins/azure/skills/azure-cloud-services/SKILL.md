---
name: azure-cloud-services
description: Expert knowledge for Azure Cloud Services development including troubleshooting, best practices, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when managing Cloud Services (extended support), Guest OS versions, Key Vault certs, autoscale rules, or PowerShell automation, and other Azure Cloud Services related development tasks. Not for Azure Networking (use azure-networking), Azure Virtual Machines (use azure-virtual-machines), Azure Resource Manager (use azure-resource-manager), Azure Portal (use azure-portal).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Cloud Services Skill

This skill provides expert guidance for Azure Cloud Services. Covers troubleshooting, best practices, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L30-L33 | Diagnosing and fixing common migration errors when moving classic Cloud Services to Cloud Services (extended support), including deployment, configuration, and compatibility issues. |
| Best Practices | L35-L38 | Guidance on designing and configuring autoscale rules for Cloud Services, including metrics, thresholds, and patterns to optimize performance, reliability, and cost. |
| Decision Making | L40-L47 | Guidance on when to use Cloud Services (extended support), comparing with VM Scale Sets, and planning/migrating classic and non-VNet Cloud Services into VNets and extended support. |
| Limits & Quotas | L49-L54 | VM instance size limits/capacities and timelines, impacts, and constraints related to Guest OS family retirements for Azure Cloud Services. |
| Security | L56-L61 | Using Key Vault for certificates in Cloud Services and understanding Azure Guest OS security updates, support lifecycle, and retirement policies |
| Configuration | L63-L80 | Configuring Cloud Services roles and deployments: .csdef/.cscfg schemas, network/load balancer settings, diagnostics, RDP, Key Vault, extensions, alerts, and scaling/SKU overrides. |
| Integrations & Coding Patterns | L82-L87 | Automating Azure Cloud Services (extended support) with PowerShell: creating deployments, retrieving service details, and resetting or redeploying cloud service instances. |
| Deployment | L89-L92 | Guidance on planning and managing Guest OS version upgrades for Azure Cloud Services, including upgrade paths, scheduling, and compatibility considerations. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Resolve common errors when migrating to Cloud Services extended support | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/in-place-migration-common-errors |

### Best Practices
| Topic | URL |
|-------|-----|
| Configure autoscaling rules for Cloud Services deployments | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/configure-scaling |

### Decision Making
| Topic | URL |
|-------|-----|
| Decide when and how to use Azure Cloud Services (extended support) | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/faq |
| Compare Cloud Services and Virtual Machine Scale Sets features | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/feature-support-analysis |
| Plan migration from Cloud Services classic to extended support | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/in-place-migration-overview |
| Understand technical requirements for Cloud Services migration | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/in-place-migration-technical-details |
| Plan migration of non-VNet Cloud Services into VNets | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/non-vnet-migration |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| VM size options and capacities for Cloud Services instances | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/available-sizes |
| Guest OS Family 1 retirement dates and deployment impact | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-guestos-family-1-retirement |
| Guest OS Families 2–4 retirement timelines and impact | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-guestos-family-2-3-4-retirement |

### Security
| Topic | URL |
|-------|-----|
| Securely store and use certificates with Key Vault in Cloud Services | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/certificates-and-key-vault |
| Review MSRC security updates applied to Azure Guest OS | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-guestos-microsoft-security-response-center-releases |
| Understand support and retirement policy for Azure Guest OS | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-guestos-retirement-policy |

### Configuration
| Topic | URL |
|-------|-----|
| Understand Cloud Services model, config, and package files | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-model-and-package |
| Configure monitoring alerts for Cloud Services instances | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/enable-alerts |
| Enable Key Vault VM extension for Cloud Services roles | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/enable-key-vault-virtual-machine |
| Configure Remote Desktop extension for Cloud Services | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/enable-rdp |
| Configure Azure diagnostics extension for Cloud Services | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/enable-wad |
| Configure and manage extensions for Cloud Services roles | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/extensions |
| Override Cloud Services SKU and instance count via allowModelOverride | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/override-sku |
| Reference schema for Cloud Services configuration (.cscfg) | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-cscfg-file |
| Configure NetworkConfiguration for Cloud Services deployments | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-cscfg-networkconfiguration |
| Configure role settings in Cloud Services .cscfg | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-cscfg-role |
| Reference schema for Cloud Services definition (.csdef) | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-csdef-file |
| Configure LoadBalancerProbe in Cloud Services definitions | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-csdef-loadbalancerprobe |
| Configure NetworkTrafficRules in Cloud Services definitions | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-csdef-networktrafficrules |
| Define and configure WebRole schema for Cloud Services | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-csdef-webrole |
| Define and configure WorkerRole schema for Cloud Services | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/schema-csdef-workerrole |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use PowerShell to create Cloud Services (extended support) | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/sample-create-cloud-service |
| Use PowerShell to retrieve Cloud Service details | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/sample-get-cloud-service |
| Use PowerShell to reset Cloud Services deployments | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/sample-reset-cloud-service |

### Deployment
| Topic | URL |
|-------|-----|
| Plan Azure Cloud Services Guest OS upgrade path | https://learn.microsoft.com/en-us/azure/cloud-services-extended-support/cloud-services-guestos-update-matrix |
