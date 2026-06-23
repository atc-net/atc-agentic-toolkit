---
name: azure-metrics-advisor
description: Expert knowledge for Azure AI Metrics Advisor development including decision making, limits & quotas, security, configuration, and integrations & coding patterns. Use when configuring data feeds, tuning anomaly detection, managing alerts/hooks, or calling Metrics Advisor REST/SDKs, and other Azure AI Metrics Advisor related development tasks. Not for Azure AI Anomaly Detector (use azure-anomaly-detector), Azure Monitor (use azure-monitor), Azure Stream Analytics (use azure-stream-analytics).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure AI Metrics Advisor Skill

This skill provides expert guidance for Azure AI Metrics Advisor. Covers decision making, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L29-L33 | Guidance on estimating, controlling, and optimizing Metrics Advisor costs and usage, including pricing factors, quotas, and cost-management best practices. |
| Limits & Quotas | L34-L38 | Service limits for Metrics Advisor: max metrics, dimensions, alerts, data ingestion rates, detection constraints, and guidance on scaling within quotas. |
| Security | L39-L44 | Configuring Metrics Advisor security: data encryption, auth options (keys, AAD), and creating/managing secure credential entities for data sources and monitoring. |
| Configuration | L45-L49 | Setting up Metrics Advisor: configuring alert hooks (email/webhook), alerting rules, data feed and detection settings, and tuning anomaly detection behavior for your instance. |
| Integrations & Coding Patterns | L50-L54 | Connecting Metrics Advisor to various data sources, crafting valid ingestion queries, and using its REST API/SDKs to integrate anomaly detection into applications |

### Decision Making
| Topic | URL |
|-------|-----|
| Plan and manage Azure Metrics Advisor costs and usage | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/cost-management |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand Metrics Advisor limits and constraints | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/faq |

### Security
| Topic | URL |
|-------|-----|
| Configure encryption and authentication for Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/encryption |
| Create and manage Metrics Advisor credential entities securely | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/how-tos/credential-entity |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Metrics Advisor instance and detection settings | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/how-tos/configure-metrics |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Connect diverse data sources to Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/data-feeds-from-different-sources |
| Use Metrics Advisor REST API and client SDKs | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/quickstarts/rest-api-and-client-library |