---
name: azure-anomaly-detector
description: Expert knowledge for Azure AI Anomaly Detector development including troubleshooting, best practices, limits & quotas, configuration, and deployment. Use when tuning Docker-based Anomaly Detector, ACI or IoT Edge deployments, univariate/multivariate APIs, or service limits, and other Azure AI Anomaly Detector related development tasks. Not for Azure AI Metrics Advisor (use azure-metrics-advisor), Azure Monitor (use azure-monitor), Azure Machine Learning (use azure-machine-learning).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure AI Anomaly Detector Skill

This skill provides expert guidance for Azure AI Anomaly Detector. Covers troubleshooting, best practices, limits & quotas, configuration, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L34 | Diagnosing and fixing Azure Anomaly Detector issues, including multivariate error codes, common failures, configuration problems, and step-by-step troubleshooting guidance. |
| Best Practices | L35-L40 | Guidance on preparing data, tuning parameters, interpreting results, and designing workflows for effective use of univariate and multivariate Azure Anomaly Detector APIs. |
| Limits & Quotas | L41-L45 | Service limits for Anomaly Detector: max data points, series length, request rates, model constraints, and how quotas affect API usage and scaling. |
| Configuration | L46-L50 | How to configure and tune Anomaly Detector Docker containers, including environment variables, resource limits, logging, networking, and runtime behavior settings. |
| Deployment | L51-L54 | How to package and run Anomaly Detector in containers: Docker setup, Azure Container Instances deployment, and IoT Edge module deployment and configuration. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot Multivariate Anomaly Detector error codes | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/concepts/troubleshoot |
| Diagnose and resolve Azure Anomaly Detector issues | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/faq |

### Best Practices
| Topic | URL |
|-------|-----|
| Apply univariate Anomaly Detector API best practices | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/concepts/anomaly-detection-best-practices |
| Use multivariate Anomaly Detector API effectively | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/concepts/best-practices-multivariate |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Review Azure Anomaly Detector service limits and quotas | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/service-limits |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Anomaly Detector container runtime settings | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/anomaly-detector-container-configuration |

### Deployment
| Topic | URL |
|-------|-----|
| Deploy and run Anomaly Detector Docker containers | https://learn.microsoft.com/en-us/azure/ai-services/anomaly-detector/anomaly-detector-container-howto |