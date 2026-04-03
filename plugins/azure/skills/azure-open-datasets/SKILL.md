---
name: azure-open-datasets
description: Expert knowledge for Azure Open Datasets development including limits & quotas. Use when handling non-Spark dataset downloads, throttling behavior, quota limits, retry logic, or rate-limit workarounds, and other Azure Open Datasets related development tasks. Not for Azure Data Explorer (use azure-data-explorer), Azure Synapse Analytics (use azure-synapse-analytics), Azure Databricks (use azure-databricks), Azure Machine Learning (use azure-machine-learning).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Open Datasets Skill

This skill provides expert guidance for Azure Open Datasets. Covers limits & quotas. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L23-L26 | Managing and troubleshooting non-Spark download limits for Azure Open Datasets, including throttling behavior, quotas, and strategies to avoid or handle rate limits |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Handle Azure Open Datasets non-Spark download limits | https://learn.microsoft.com/en-us/azure/open-datasets/samples |
