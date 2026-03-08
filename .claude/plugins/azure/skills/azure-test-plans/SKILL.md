---
name: azure-test-plans
description: Expert knowledge for Azure Test Plans development including limits & quotas, security, and configuration. Use when building, debugging, or optimizing Azure Test Plans applications. Not for Azure DevOps (use azure-devops), Azure Boards (use azure-boards), Azure Pipelines (use azure-pipelines), Azure App Testing (use azure-app-testing).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or fetch_webpage to retrieve documentation.
---
# Azure Test Plans Skill

This skill provides expert guidance for Azure Test Plans. Covers limits & quotas, security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use `mcp_fetch:fetch` if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L31-L35 | Configuring and managing custom fields on test results in Azure Test Plans, including setup steps, field types, and how they appear in test runs and reports. |
| Security | L36-L40 | Managing Azure Test Plans access: configuring permissions, security roles, and licensing requirements for users and groups |
| Configuration | L41-L44 | Using tcm.exe to manage Azure Test Plans: creating and running test suites, importing/exporting tests, managing test configurations, and automating test plan operations via CLI. |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Configure custom fields for Azure Test Plans results | https://learn.microsoft.com/en-us/azure/devops/test/custom-fields?view=azure-devops |

### Security
| Topic | URL |
|-------|-----|
| Configure permissions and licensing for Azure Test Plans | https://learn.microsoft.com/en-us/azure/devops/test/manual-test-permissions?view=azure-devops |

### Configuration
| Topic | URL |
|-------|-----|
| Use tcm.exe command-line for Azure Test Plans management | https://learn.microsoft.com/en-us/azure/devops/test/test-case-managment-reference?view=azure-devops |