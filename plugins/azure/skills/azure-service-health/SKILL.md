---
name: azure-service-health
description: Expert knowledge for Azure Service Health development including troubleshooting, limits & quotas, security, configuration, and integrations & coding patterns. Use when routing Service Health alerts via APIs/webhooks, configuring ARM/Bicep alerts, or diagnosing VM Resource Health, and other Azure Service Health related development tasks. Not for Azure Monitor (use azure-monitor), Azure Reliability (use azure-reliability), Azure Resiliency (use azure-resiliency), Azure Quotas (use azure-quotas).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Service Health Skill

This skill provides expert guidance for Azure Service Health. Covers troubleshooting, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L33 | Understanding VM Resource Health annotations, diagnosing VM health issues, and troubleshooting platform or user-caused VM availability and performance problems |
| Limits & Quotas | L34-L38 | Details on how long Azure Service Health notifications are kept, their lifecycle stages, and retention behavior for different event types and channels |
| Security | L39-L47 | Managing who can see Azure Service Health and security advisories using tenant/subscription roles and RBAC, including configuring access scopes and viewing security-related notifications. |
| Configuration | L48-L55 | Configuring Service Health and Resource Health alerts via ARM/Bicep/PowerShell and querying Service Health data/fields with Azure Resource Graph. |
| Integrations & Coding Patterns | L56-L66 | Using APIs, Resource Graph, webhooks, and connectors to query Azure Service Health/Security data and route alerts into tools like OpsGenie, PagerDuty, and ServiceNow |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Interpret and troubleshoot VM Resource Health annotations | https://learn.microsoft.com/en-us/azure/service-health/resource-health-vm-annotation |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand lifecycle and retention of Service Health notifications | https://learn.microsoft.com/en-us/azure/service-health/service-health-notification-transitions |

### Security
| Topic | URL |
|-------|-----|
| Understand tenant admin roles for Service Health access | https://learn.microsoft.com/en-us/azure/service-health/admin-access-reference |
| Manage Azure Service Health history access with RBAC | https://learn.microsoft.com/en-us/azure/service-health/health-history-overview |
| Configure subscription access for Azure Security advisories | https://learn.microsoft.com/en-us/azure/service-health/security-advisories-add-subscription |
| Access and view Azure Service Health security advisories | https://learn.microsoft.com/en-us/azure/service-health/security-advisories-elevated-access |
| Configure tenant vs subscription access for Service Health | https://learn.microsoft.com/en-us/azure/service-health/subscription-vs-tenant |

### Configuration
| Topic | URL |
|-------|-----|
| Define Service Health alert rules using ARM templates | https://learn.microsoft.com/en-us/azure/service-health/alerts-activity-log-service-notifications-arm |
| Configure Service Health activity log alerts with Bicep | https://learn.microsoft.com/en-us/azure/service-health/alerts-activity-log-service-notifications-bicep |
| Understand Azure Resource Graph fields for Service Health | https://learn.microsoft.com/en-us/azure/service-health/azure-resource-graph-overview |
| Configure Resource Health alerts with PowerShell and ARM templates | https://learn.microsoft.com/en-us/azure/service-health/resource-health-alert-powershell-template |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Access Azure Security advisories via API endpoint | https://learn.microsoft.com/en-us/azure/service-health/access-service-advisories-api |
| Run Azure Resource Graph queries for Resource Health | https://learn.microsoft.com/en-us/azure/service-health/resource-graph-health-samples |
| Query Azure Service Health impacted resources with ARG | https://learn.microsoft.com/en-us/azure/service-health/resource-graph-impacted-samples |
| Query Azure Service Health with Resource Graph | https://learn.microsoft.com/en-us/azure/service-health/resource-graph-samples |
| Integrate Azure Service Health alerts via webhooks | https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-webhook-guide |
| Forward Azure Service Health alerts to OpsGenie | https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-webhook-opsgenie |
| Integrate Azure Service Health alerts with PagerDuty webhooks | https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-webhook-pagerduty |
| Send Azure Service Health alerts to ServiceNow | https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-webhook-servicenow |