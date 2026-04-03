---
name: azure-artifact-signing
description: Expert knowledge for Azure Artifact Signing development including best practices, decision making, security, configuration, and integrations & coding patterns. Use when managing signing cert lifecycle, RBAC roles, DGSSv2 migration, diagnostic logs, or CI/CD signing workflows, and other Azure Artifact Signing related development tasks.
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Artifact Signing Skill

This skill provides expert guidance for Azure Artifact Signing. Covers best practices, decision making, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L27-L30 | Guidance on managing signing certificates end-to-end: rotation, renewal, expiration handling, key protection, and lifecycle policies for Azure Artifact Signing. |
| Decision Making | L32-L36 | Pricing and SKU selection for Azure Artifact Signing and guidance to migrate from DGSSv2, including plan changes and transition steps. |
| Security | L38-L44 | RBAC roles, identities, and validations for Artifact Signing, plus secure signing of Windows code integrity policies and access control configuration. |
| Configuration | L46-L49 | Configuring diagnostic settings for Artifact Signing, enabling and routing logs to destinations like Log Analytics, Storage, and Event Hubs for monitoring and analysis. |
| Integrations & Coding Patterns | L51-L54 | How to integrate Azure Artifact Signing with supported tools and CI/CD systems, configure signing workflows, and apply recommended coding and automation patterns. |

### Best Practices
| Topic | URL |
|-------|-----|
| Apply certificate lifecycle practices in Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-certificate-management |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose and change Artifact Signing pricing SKUs | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-change-sku |
| Migrate from DGSSv2 to Azure Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-device-guard-signing-service-migration |

### Security
| Topic | URL |
|-------|-----|
| Understand Artifact Signing resources and RBAC roles | https://learn.microsoft.com/en-us/azure/artifact-signing/concept-resources-roles |
| Manage Artifact Signing identity validations securely | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-renew-identity-validation |
| Sign Windows code integrity policies with Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-sign-ci-policy |
| Assign Azure RBAC roles for Artifact Signing resources | https://learn.microsoft.com/en-us/azure/artifact-signing/tutorial-assign-roles |

### Configuration
| Topic | URL |
|-------|-----|
| Configure diagnostic settings and log routing for Artifact Signing | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-sign-history |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Configure Artifact Signing integrations for supported tools | https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations |
