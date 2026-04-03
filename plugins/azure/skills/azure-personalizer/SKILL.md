---
name: azure-personalizer
description: Expert knowledge for Azure AI Personalizer development including troubleshooting, decision making, limits & quotas, security, configuration, and integrations & coding patterns. Use when tuning exploration/apprentice mode, single vs multi-slot calls, model export, quotas, or local inference SDK, and other Azure AI Personalizer related development tasks. Not for Azure AI services (use microsoft-foundry-tools), Azure AI Search (use azure-cognitive-search), Azure AI Metrics Advisor (use azure-metrics-advisor), Azure AI Anomaly Detector (use azure-anomaly-detector).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Personalizer Skill

This skill provides expert guidance for Azure Personalizer. Covers troubleshooting, decision making, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L28-L31 | Diagnosing and resolving common Azure Personalizer issues, including configuration, learning behavior, low-quality recommendations, API errors, and integration or data/feature problems. |
| Decision Making | L33-L36 | Guidance on when to use single-slot vs multi-slot Personalizer, comparing scenarios, behavior, and design tradeoffs for different personalization needs. |
| Limits & Quotas | L38-L41 | Guidance on scaling Personalizer for high-traffic workloads, capacity planning, throughput/latency expectations, and performance considerations under Azure limits and quotas. |
| Security | L43-L47 | Configuring encryption at rest (including customer-managed keys) and controlling data collection, storage, and privacy settings for Azure Personalizer. |
| Configuration | L49-L57 | Configuring Personalizer’s learning behavior: policies, hyperparameters, exploration, apprentice mode, explainability, model export, and learning loop settings. |
| Integrations & Coding Patterns | L59-L62 | Using the Personalizer local inference SDK for low-latency, offline/edge scenarios, including setup, integration patterns, and best practices for calling the model locally. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common Azure Personalizer issues | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/frequently-asked-questions |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose between single-slot and multi-slot Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/concept-multi-slot-personalization |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Plan scalability and performance for Personalizer workloads | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/concepts-scalability-performance |

### Security
| Topic | URL |
|-------|-----|
| Configure data-at-rest encryption and CMK for Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/encrypt-data-at-rest |
| Manage data usage and privacy in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/responsible-data-and-privacy |

### Configuration
| Topic | URL |
|-------|-----|
| Configure learning policy and hyperparameters in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/concept-active-learning |
| Configure exploration settings for Azure Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/concepts-exploration |
| Enable and use inference explainability in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-inference-explainability |
| Configure apprentice mode learning behavior in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-learning-behavior |
| Export and manage Personalizer model and learning settings | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-manage-model |
| Configure Azure Personalizer learning loop settings | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-settings |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use Personalizer local inference SDK for low latency | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-thick-client |
