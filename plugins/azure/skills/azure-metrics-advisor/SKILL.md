---
name: azure-metrics-advisor
description: Expert knowledge for Azure AI Metrics Advisor development including decision making, security, configuration, and integrations & coding patterns. Use when configuring data feeds, tuning anomaly detection, managing alert hooks, or integrating the Metrics Advisor APIs, and other Azure AI Metrics Advisor related development tasks. Not for Azure AI Anomaly Detector (use azure-anomaly-detector), Azure Monitor (use azure-monitor), Azure Machine Learning (use azure-machine-learning).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Metrics Advisor Skill

This skill provides expert guidance for Azure Metrics Advisor. Covers decision making, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L26-L29 | Guidance on estimating, optimizing, and controlling Azure Metrics Advisor costs, including pricing concepts, cost drivers, and budgeting/management best practices. |
| Security | L31-L35 | Configuring Metrics Advisor security: encrypting data at rest with customer-managed keys and creating/using secure credential entities for data source access. |
| Configuration | L37-L41 | Setting up Metrics Advisor: configuring alert hooks (email/webhook), alerting rules, data feed and detection settings, and tuning anomaly detection behavior for your instance. |
| Integrations & Coding Patterns | L43-L48 | Connecting Metrics Advisor to various data sources, crafting valid ingestion queries, and using its REST API/SDKs to integrate anomaly detection into applications |

### Decision Making
| Topic | URL |
|-------|-----|
| Plan and manage Azure Metrics Advisor costs | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/cost-management |

### Security
| Topic | URL |
|-------|-----|
| Configure data-at-rest encryption for Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/encryption |
| Create secure credential entities for Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/how-tos/credential-entity |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Metrics Advisor alert hooks and rules | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/how-tos/alerts |
| Configure Metrics Advisor instance and detection settings | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/how-tos/configure-metrics |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Connect diverse data sources to Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/data-feeds-from-different-sources |
| Use Metrics Advisor REST API and client SDKs | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/quickstarts/rest-api-and-client-library |
| Write valid data ingestion queries for Metrics Advisor | https://learn.microsoft.com/en-us/azure/ai-services/metrics-advisor/tutorials/write-a-valid-query |
