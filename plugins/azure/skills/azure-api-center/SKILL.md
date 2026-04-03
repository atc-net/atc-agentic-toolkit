---
name: azure-api-center
description: Expert knowledge for Azure Api Center development including best practices, security, configuration, integrations & coding patterns, and deployment. Use when automating API linting/registration, customizing the portal, syncing with API gateways, or enforcing design-time governance, and other Azure Api Center related development tasks. Not for Azure API Management (use azure-api-management), Azure App Configuration (use azure-app-configuration), Azure Service Connector (use azure-service-connector).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure API Center Skill

This skill provides expert guidance for Azure API Center. Covers best practices, security, configuration, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L27-L30 | Best practices for enforcing API governance early in development using the Azure API Center VS Code extension, including policy checks, linting, and design-time validation. |
| Security | L32-L36 | Configuring API authorization schemes for APIs in API Center and managing who can access the API Center portal via the VS Code extension |
| Configuration | L38-L49 | Configuring and deploying Azure API Center: setup via ARM/Bicep/CLI, portal customization, API linting/analysis, metadata schemas, MCP/A2A agent setup, and inventory management. |
| Integrations & Coding Patterns | L51-L59 | Patterns and scripts for syncing APIs between API Center and platforms like API Management, Amazon API Gateway, and Copilot Studio, plus automation via Azure CLI and Logic Apps/Teams |
| Deployment | L61-L66 | Automating API linting and registration to Azure API Center (e.g., via GitHub Actions) and instructions for self-hosting the Azure API Center portal. |

### Best Practices
| Topic | URL |
|-------|-----|
| Apply shift-left API governance with VS Code extension | https://learn.microsoft.com/en-us/azure/api-center/govern-apis-vscode-extension |

### Security
| Topic | URL |
|-------|-----|
| Configure API authorization schemes in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/authorize-api-access |
| Control API Center portal access via VS Code extension | https://learn.microsoft.com/en-us/azure/api-center/enable-api-center-portal-vs-code-extension |

### Configuration
| Topic | URL |
|-------|-----|
| Use managed API linting and analysis in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/enable-managed-api-analysis-linting |
| Configure metadata schema for Azure API Center governance | https://learn.microsoft.com/en-us/azure/api-center/metadata |
| Register and discover MCP servers in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/register-discover-mcp-server |
| Configure and manage A2A agents in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/register-manage-agents |
| Create Azure API Center via ARM template | https://learn.microsoft.com/en-us/azure/api-center/set-up-api-center-arm-template |
| Provision Azure API Center using Azure CLI | https://learn.microsoft.com/en-us/azure/api-center/set-up-api-center-azure-cli |
| Deploy Azure API Center with Bicep templates | https://learn.microsoft.com/en-us/azure/api-center/set-up-api-center-bicep |
| Set up and customize the Azure API Center portal | https://learn.microsoft.com/en-us/azure/api-center/set-up-api-center-portal |
| Define custom metadata schema in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/tutorials/add-metadata-properties |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Export API Center APIs as Copilot Studio connectors | https://learn.microsoft.com/en-us/azure/api-center/export-to-copilot-studio |
| Import Azure API Management APIs into API Center | https://learn.microsoft.com/en-us/azure/api-center/import-api-management-apis |
| Script API Center inventory management with Azure CLI | https://learn.microsoft.com/en-us/azure/api-center/manage-apis-azure-cli |
| Automate API registration notifications with Logic Apps and Teams | https://learn.microsoft.com/en-us/azure/api-center/set-up-notification-workflow |
| Synchronize Azure API Management APIs with API Center | https://learn.microsoft.com/en-us/azure/api-center/synchronize-api-management-apis |
| Sync Amazon API Gateway APIs into Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/synchronize-aws-gateway-apis |

### Deployment
| Topic | URL |
|-------|-----|
| Automate API linting deployment in Azure API Center | https://learn.microsoft.com/en-us/azure/api-center/enable-api-analysis-linting |
| Automate API registration to API Center with GitHub Actions | https://learn.microsoft.com/en-us/azure/api-center/register-apis-github-actions |
| Self-host the Azure API Center portal implementation | https://learn.microsoft.com/en-us/azure/api-center/self-host-api-center-portal |
