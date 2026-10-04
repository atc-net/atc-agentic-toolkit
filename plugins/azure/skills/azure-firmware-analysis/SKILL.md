---
name: azure-firmware-analysis
description: Expert knowledge for Azure Firmware Analysis development including best practices, security, integrations & coding patterns, and deployment. Use when configuring RBAC/service principals, uploading firmware via CLI/PowerShell/Python, mapping results to Device Registry, reading SBOM paths, or deploying workspaces with ARM/Bicep/Terraform, and other Azure Firmware Analysis related development tasks.
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Firmware Analysis Skill

This skill provides expert guidance for Azure Firmware Analysis. Covers best practices, security, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L28-L34 | Guidance on reading firmware SBOM paths, understanding unsafe function call alerts, and interpreting/prioritizing firmware weakness findings for security analysis. |
| Security | L35-L40 | Managing secure access to Azure Firmware Analysis using service principals and configuring role-based access control (RBAC) permissions for users and apps |
| Integrations & Coding Patterns | L41-L48 | CLI, PowerShell, and Python examples for uploading firmware to Azure Firmware Analysis and mapping scan results to Azure Device Registry devices and assets. |
| Deployment | L49-L54 | How to provision and deploy an Azure Firmware Analysis workspace using infrastructure-as-code tools: ARM templates, Bicep, and Terraform configuration and setup. |

### Best Practices
| Topic | URL |
|-------|-----|
| Interpret SBOM extractor paths in firmware analysis | https://learn.microsoft.com/en-us/azure/firmware-analysis/interpreting-extractor-paths |
| Interpret unsafe function call findings in firmware analysis | https://learn.microsoft.com/en-us/azure/firmware-analysis/understand-unsafe-function-calls |
| Interpret and prioritize firmware weaknesses data | https://learn.microsoft.com/en-us/azure/firmware-analysis/understand-weaknesses-data |

### Security
| Topic | URL |
|-------|-----|
| Automate firmware analysis with service principals | https://learn.microsoft.com/en-us/azure/firmware-analysis/automate-firmware-analysis-service-principals |
| Configure RBAC access for Azure firmware analysis | https://learn.microsoft.com/en-us/azure/firmware-analysis/firmware-analysis-rbac |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Map firmware analysis results to Azure Device Registry assets | https://learn.microsoft.com/en-us/azure/firmware-analysis/firmware-analysis-integration-with-azure-device-registry |
| Upload firmware to Azure firmware analysis via CLI | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-upload-firmware-using-azure-command-line-interface |
| Upload firmware to Azure analysis with PowerShell | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-upload-firmware-using-powershell |
| Upload firmware to Azure analysis using Python | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-upload-firmware-using-python |

### Deployment
| Topic | URL |
|-------|-----|
| Deploy firmware analysis workspace via ARM template | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-firmware-analysis-arm |
| Deploy firmware analysis workspace with Bicep | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-firmware-analysis-bicep |
| Provision firmware analysis workspace using Terraform | https://learn.microsoft.com/en-us/azure/firmware-analysis/quickstart-firmware-analysis-terraform |