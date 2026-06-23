---
name: azure-impact-reporting
description: Expert knowledge for Azure Impact Reporting development including troubleshooting, configuration, and integrations & coding patterns. Use when wiring Impact Reporting to Monitor alerts, Logic Apps, Service Health, HPC Guest Health, or impact categories, and other Azure Impact Reporting related development tasks. Not for Azure Carbon Optimization (use azure-carbon-optimization), Azure Cost Management (use azure-cost-management), Azure Monitor (use azure-monitor).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Impact Reporting Skill

This skill provides expert guidance for Azure Impact Reporting. Covers troubleshooting, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L27-L31 | Diagnosing and fixing Azure Impact Reporting connector failures and resolving Azure HPC Guest Health Reporting issues, errors, and data/health reporting problems. |
| Configuration | L32-L38 | Configuring Azure Impact Reporting: creating alert connectors and retrieving valid impact and HPC Guest Health category values for correct classification. |
| Integrations & Coding Patterns | L39-L45 | Patterns and examples for integrating Impact Reporting with Azure Monitor alerts, Logic Apps, diagnostic logs, Service Health, and APIs (sending, attaching data, and viewing insights). |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot Azure Impact Reporting connectors | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/connectors-troubleshooting-guide |

### Configuration
| Topic | URL |
|-------|-----|
| Create Azure Impact Reporting connectors for alerts | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/create-azure-monitor-connector |
| Use valid HPC Guest Health impact categories | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/guest-health-impact-categories |
| Retrieve valid Azure Impact Reporting categories | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/view-impact-categories |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Integrate Azure Monitor alerts with Impact Reporting | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/azure-monitor-connector |
| Use Logic Apps to send Azure impact reports | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/creating-logic-app |
| Attach diagnostic log files to Guest Health reports | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/guest-health-log-upload |
| Report Azure workload impact via Service Health and API | https://learn.microsoft.com/en-us/azure/azure-impact-reporting/report-impact |