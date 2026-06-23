---
name: azure-open-datasets
description: Expert knowledge for Azure Open Datasets development including limits & quotas. Use when handling non-Spark dataset downloads, throttling behavior, quota limits, retry logic, or rate-limit workarounds, and other Azure Open Datasets related development tasks. Not for Azure Data Explorer (use azure-data-explorer), Azure Synapse Analytics (use azure-synapse-analytics), Azure Databricks (use azure-databricks), Azure Machine Learning (use azure-machine-learning).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Open Datasets Skill

This skill provides expert guidance for Azure Open Datasets. Covers limits & quotas. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L25-L28 | Managing and troubleshooting non-Spark download limits for Azure Open Datasets, including throttling behavior, quotas, and strategies to avoid or handle rate limits |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Handle Azure Open Datasets non-Spark download limits | https://learn.microsoft.com/en-us/azure/open-datasets/samples |