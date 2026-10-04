---
name: azure-artifact-signing
description: Expert knowledge for Azure Artifact Signing development including decision making, security, configuration, and integrations & coding patterns. Use when managing cert storage/rotation, RBAC for signing, DGSSv2 migration, diagnostic logs, or CI/CD signing integration, and other Azure Artifact Signing related development tasks.
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Artifact Signing Skill

This skill provides expert guidance for Azure Artifact Signing. Covers decision making, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L28-L33 | Pricing and SKU selection for Azure Artifact Signing and guidance to migrate from DGSSv2, including plan changes and transition steps. |
| Security | L34-L42 | Managing Artifact Signing security: cert storage/rotation, identity validation lifecycle, RBAC roles/assignments, and secure signing of Windows code integrity policies. |
| Configuration | L43-L47 | Configuring diagnostic settings for Artifact Signing, enabling and routing logs to destinations like Log Analytics, Storage, and Event Hubs for monitoring and analysis. |
| Integrations & Coding Patterns | L48-L51 | Configuring Artifact Signing with supported tools and workflows (e.g., CI/CD systems, package managers), including setup steps and patterns for integrating signing into build and release pipelines. |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose and change Artifact Signing pricing SKUs | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-change-sku |
| Migrate from DGSSv2 to Azure Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-device-guard-signing-service-migration |

### Security
| Topic | URL |
|-------|-----|
| Manage Azure Artifact Signing certificates securely | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management |
| Understand Artifact Signing resources and RBAC roles | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-resources-roles |
| Manage Artifact Signing identity validation lifecycle | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-renew-identity-validation |
| Sign Windows code integrity policies with Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-sign-ci-policy |
| Assign Azure RBAC roles for Artifact Signing access | https://learn.microsoft.com/en-us/azure/artifact-signing/tutorial-assign-roles |

### Configuration
| Topic | URL |
|-------|-----|
| Configure diagnostic settings and log routing for Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-sign-history |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Configure supported signing integrations for Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations |