---
name: azure-test-plans
description: Expert knowledge for Azure Test Plans development including limits & quotas, security, configuration, and integrations & coding patterns. Use when configuring test failure types, custom fields, retention, permissions, or tcm.exe-based test suite automation, and other Azure Test Plans related development tasks. Not for Azure DevOps (use azure-devops), Azure Pipelines (use azure-pipelines), Azure Boards (use azure-boards), Azure App Testing (use azure-app-testing).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Test Plans Skill

This skill provides expert guidance for Azure Test Plans. Covers limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Limits & Quotas | L28-L34 | Limits, permissions, and retention rules for Azure Test Plans and Pipelines, plus how to configure test run custom fields and pipeline retention behavior. |
| Security | L35-L39 | Managing permissions, access levels, and security roles for users and groups in Azure Test Plans manual testing features. |
| Configuration | L40-L44 | Configuring and using test failure types in Azure Test Plans, including defining categories, managing them, and applying them to test results for better defect tracking. |
| Integrations & Coding Patterns | L45-L48 | Using tcm.exe CLI to manage Azure Test Plans: create and run test suites, import/export test cases, manage test configurations, and automate test management tasks |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Configure Azure Pipelines retention limits and behavior | https://learn.microsoft.com/en-us/azure/devops/pipelines/policies/retention?view=azure-devops |
| Use custom fields for Azure DevOps test runs | https://learn.microsoft.com/en-us/azure/devops/test/custom-fields?view=azure-devops |
| Understand Azure Test Plans limits, permissions, and retention | https://learn.microsoft.com/en-us/azure/devops/test/reference-qa?view=azure-devops |

### Security
| Topic | URL |
|-------|-----|
| Configure permissions and access for Azure manual testing | https://learn.microsoft.com/en-us/azure/devops/test/manual-test-permissions?view=azure-devops |

### Configuration
| Topic | URL |
|-------|-----|
| Configure and manage test failure types in Azure Test Plans | https://learn.microsoft.com/en-us/azure/devops/test/manage-test-failure-type?view=azure-devops |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use tcm.exe commands for Azure Test Plans management | https://learn.microsoft.com/en-us/azure/devops/test/test-case-managment-reference?view=azure-devops |