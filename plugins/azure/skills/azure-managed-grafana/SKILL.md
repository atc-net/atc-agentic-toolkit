---
name: azure-managed-grafana
description: Expert knowledge for Azure Managed Grafana development including troubleshooting, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring Azure data sources, Entra/RBAC access, private endpoints, HA workspaces, or alert/reporting setup, and other Azure Managed Grafana related development tasks. Not for Azure Monitor (use azure-monitor), Azure Data Explorer (use azure-data-explorer).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Managed Grafana Skill

This skill provides expert guidance for Azure Managed Grafana. Covers troubleshooting, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L31-L36 | Diagnosing and resolving common Azure Managed Grafana issues, including access, configuration, and private endpoint connectivity and DNS problems. |
| Decision Making | L37-L44 | Guidance on choosing and managing Grafana Enterprise plans, migrating from self‑hosted/other dashboards, and planning upgrades (Grafana 11→12) in Azure Managed Grafana. |
| Limits & Quotas | L45-L51 | Limits, quotas, regions, and support for Azure Managed Grafana, plus constraints and how to use/report on image rendering and reporting features. |
| Security | L52-L66 | Securing Managed Grafana: auth and RBAC, Entra/Team Sync, service accounts/tokens, private endpoints and outbound IPs, data encryption/storage, Azure Monitor access, and security best practices. |
| Configuration | L67-L76 | Configuring Managed Grafana workspaces: instance settings, bundled Prometheus, plugins, metrics via Azure Monitor, diagnostic logs, and SMTP email alert setup. |
| Integrations & Coding Patterns | L77-L90 | Connecting Grafana to Azure/AKS/Prometheus data, configuring data source plugins, MCP endpoints, AI agents, and setting up monitoring dashboards and alert integrations. |
| Deployment | L91-L94 | Designing highly available Azure Managed Grafana workspaces, including reliability features, SLAs, and enabling zone-redundant deployments for resiliency. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common Azure Managed Grafana issues | https://learn.microsoft.com/en-us/azure/managed-grafana/troubleshoot-managed-grafana |
| Fix Managed Grafana private endpoint connection problems | https://learn.microsoft.com/en-us/azure/managed-grafana/troubleshoot-mpe-connection |

### Decision Making
| Topic | URL |
|-------|-----|
| Activate and manage Grafana Enterprise plans in Azure | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-grafana-enterprise |
| Migrate self-hosted or cloud Grafana to Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-migrate |
| Migrate from Essential to Standard or Azure Monitor dashboards | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-migrate-essential-service-tier |
| Plan and execute upgrade from Grafana 11 to 12 in Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-upgrade-grafana-12 |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Azure Managed Grafana limits, regions, and support details | https://learn.microsoft.com/en-us/azure/managed-grafana/faq |
| Use reporting and image rendering in Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-use-reporting-and-image-rendering |
| Review Azure Managed Grafana service limits and constraints | https://learn.microsoft.com/en-us/azure/managed-grafana/known-limitations |

### Security
| Topic | URL |
|-------|-----|
| Understand data storage and encryption in Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/encryption |
| Authenticate to Azure Managed Grafana data plane APIs | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-authenticate-data-plane-api |
| Configure authentication and permissions for Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-authentication-permissions |
| Connect Managed Grafana to data sources via private endpoints | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-connect-to-data-source-privately |
| Set up deterministic outbound IPs for Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-deterministic-ip |
| Manage Azure Managed Grafana roles and access | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-manage-access-permissions-users-identities |
| Grant Azure Monitor access to Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-permissions |
| Use service accounts and tokens in Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-service-accounts |
| Configure private access and endpoints for Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-set-up-private-access |
| Configure Grafana Team Sync with Entra groups | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-sync-teams-with-entra-groups |
| Apply security best practices to Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/secure-azure-managed-grafana |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Azure Managed Grafana instance settings | https://learn.microsoft.com/en-us/azure/managed-grafana/grafana-settings |
| Configure bundled Prometheus in Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-bundled-prometheus |
| Manage Grafana plugins in Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-manage-plugins |
| Monitor Managed Grafana metrics with Azure Monitor charts | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-monitor-managed-grafana-metrics |
| Configure diagnostic settings for Managed Grafana workspaces | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-monitor-managed-grafana-workspace |
| Configure SMTP email alerts in Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-smtp-settings |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Monitor Agent Framework workflows in Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/agent-framework-workflow-dashboard |
| Build Azure AI Foundry monitoring dashboards in Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/azure-ai-foundry-dashboard |
| Configure Azure Managed Grafana MCP server endpoint | https://learn.microsoft.com/en-us/azure/managed-grafana/grafana-mcp-server |
| Integrate AI coding agents with Grafana monitoring | https://learn.microsoft.com/en-us/azure/managed-grafana/grafana-opentelemetry-app-insights |
| Configure Grafana MCP with Azure AI Foundry agents | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-configure-mcp-for-ai-foundry |
| Add Azure Data Explorer as a Grafana data source | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-connect-azure-data-explorer |
| Connect Azure Monitor workspace Prometheus to Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-connect-azure-monitor-workspace |
| Manage data source plugins for Azure Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-data-source-plugins-managed-identity |
| Integrate Azure Monitor alerts with Managed Grafana | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-use-azure-monitor-alerts |
| Connect AKS Prometheus to Managed Grafana privately | https://learn.microsoft.com/en-us/azure/managed-grafana/tutorial-mpe-oss-prometheus |

### Deployment
| Topic | URL |
|-------|-----|
| Enable zone-redundant Azure Managed Grafana workspaces | https://learn.microsoft.com/en-us/azure/managed-grafana/how-to-enable-zone-redundancy |