---
name: azure-personalizer
description: Expert knowledge for Azure AI Personalizer development including troubleshooting, decision making, security, configuration, and integrations & coding patterns. Use when choosing single vs multi-slot setups, tuning policies/exploration, using apprentice mode, explainability, or local inference, and other Azure AI Personalizer related development tasks. Not for Azure AI Search (use azure-cognitive-search), Azure Machine Learning (use azure-machine-learning), Azure AI Metrics Advisor (use azure-metrics-advisor), Azure AI Anomaly Detector (use azure-anomaly-detector).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure AI Personalizer Skill

This skill provides expert guidance for Azure AI Personalizer. Covers troubleshooting, decision making, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L33 | Diagnosing and fixing common Azure Personalizer issues: API errors, event/Reward calls, model training problems, configuration mistakes, and steps to validate and debug your setup. |
| Decision Making | L34-L38 | Guidance on when to use single-slot vs multi-slot Personalizer, comparing scenarios, behavior, and design tradeoffs for different personalization needs. |
| Security | L39-L44 | Configuring encryption at rest (including customer-managed keys) and controlling data collection, storage, and privacy settings for Azure Personalizer. |
| Configuration | L45-L51 | Configuring Personalizer’s learning behavior: policies, hyperparameters, exploration, apprentice mode, explainability, model export, and learning loop settings. |
| Integrations & Coding Patterns | L52-L55 | Using the Personalizer local inference SDK for low-latency, offline/edge scenarios, including setup, integration patterns, and best practices for calling the model locally. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common issues in Azure Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/frequently-asked-questions |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose between single-slot and multi-slot Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/concept-multi-slot-personalization |

### Security
| Topic | URL |
|-------|-----|
| Configure data-at-rest encryption and CMK for Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/encrypt-data-at-rest |
| Manage data usage and privacy in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/responsible-data-and-privacy |

### Configuration
| Topic | URL |
|-------|-----|
| Enable and use inference explainability in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-inference-explainability |
| Configure apprentice mode learning behavior in Personalizer | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-learning-behavior |
| Configure Azure Personalizer learning loop settings | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-settings |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use Personalizer local inference SDK for low latency | https://learn.microsoft.com/en-us/azure/ai-services/personalizer/how-to-thick-client |