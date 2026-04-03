---
name: azure-test-plans
description: Expert knowledge for Azure Test Plans development including limits & quotas, security, and integrations & coding patterns. Use when configuring test result fields, managing access and licenses, or automating test suites via tcm.exe, and other Azure Test Plans related development tasks. Not for Azure DevOps (use azure-devops), Azure Boards (use azure-boards), Azure Pipelines (use azure-pipelines), Azure App Testing (use azure-app-testing).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Test Plans Skill

This skill provides expert guidance for Azure Test Plans. Covers limits & quotas, security, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L25-L29 | Configuring custom test result fields and understanding Azure Test Plans limits, quotas, and data retention policies for test results and related data. |
| Security | L31-L34 | Managing Azure Test Plans access: configuring permissions, security roles, and licensing requirements for users and groups |
| Integrations & Coding Patterns | L36-L39 | Using tcm.exe CLI to manage Azure Test Plans: create and run test suites, import/export test cases, manage test configurations, and automate test management tasks |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Configure custom fields for Azure Test Plans results | https://learn.microsoft.com/en-us/azure/devops/test/custom-fields?view=azure-devops |
| Understand Azure Test Plans limits and data retention | https://learn.microsoft.com/en-us/azure/devops/test/reference-qa?view=azure-devops |

### Security
| Topic | URL |
|-------|-----|
| Configure permissions and licensing for Azure Test Plans | https://learn.microsoft.com/en-us/azure/devops/test/manual-test-permissions?view=azure-devops |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use tcm.exe commands for Azure Test Plans management | https://learn.microsoft.com/en-us/azure/devops/test/test-case-managment-reference?view=azure-devops |
