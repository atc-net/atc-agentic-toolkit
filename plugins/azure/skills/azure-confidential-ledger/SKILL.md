---
name: azure-confidential-ledger
description: Expert knowledge for Azure Confidential Ledger development including decision making, security, integrations & coding patterns, and deployment. Use when configuring Entra auth, ACL roles, UDFs, client SDKs, transaction receipts, or ARM/Terraform deployments, and other Azure Confidential Ledger related development tasks. Not for Azure Confidential Computing (use azure-confidential-computing), Azure Virtual Enclaves (use azure-virtual-enclaves), Azure Key Vault (use azure-key-vault), Azure Dedicated HSM (use azure-dedicated-hsm).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Confidential Ledger Skill

This skill provides expert guidance for Azure Confidential Ledger. Covers decision making, security, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Decision Making | L26-L29 | Guidance on migrating from Managed CCF to Azure Confidential Ledger, including compatibility, feature mapping, and steps to move existing apps and data. |
| Security | L31-L41 | Configuring Entra auth and app registration, managing cert- and token-based users/roles, enforcing RBAC/UDF security, and verifying enclave/node trust for Azure Confidential Ledger. |
| Integrations & Coding Patterns | L43-L53 | Client libraries, UDFs, and patterns for integrating Confidential Ledger with apps and services (Blob digests, Power Automate, querying/organizing data, and verifying transaction receipts). |
| Deployment | L55-L59 | How to deploy and provision Azure Confidential Ledger instances using ARM templates or Terraform, including required parameters and configuration steps. |

### Decision Making
| Topic | URL |
|-------|-----|
| Migrate from Managed CCF to Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/managed-confidential-consortium-framework-migration |

### Security
| Topic | URL |
|-------|-----|
| Configure Microsoft Entra authentication for Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/authentication-azure-ad |
| Create and configure client certificates for Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/create-client-certificate |
| Manage Entra token-based users and roles in Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/manage-azure-ad-token-based-users |
| Manage certificate-based users and roles in Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/manage-certificate-based-users |
| Register Confidential Ledger applications in Microsoft Entra ID | https://learn.microsoft.com/en-us/azure/confidential-ledger/register-application |
| Apply security best practices to Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/secure-confidential-ledger |
| Implement advanced UDFs with RBAC in Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/user-defined-endpoints |
| Verify node quotes and establish trust in Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/verify-node-quotes |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Integrate Blob Storage digests with Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/create-blob-managed-app |
| Use Power Automate connector with Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/create-power-automate-workflow |
| Organize and query data in Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/data-organization |
| Use Azure Confidential Ledger .NET client library | https://learn.microsoft.com/en-us/azure/confidential-ledger/quickstart-net |
| Use Azure Confidential Ledger Python client library | https://learn.microsoft.com/en-us/azure/confidential-ledger/quickstart-python |
| Run user-defined functions in Azure Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/server-side-programming |
| Create simple JavaScript UDFs in Confidential Ledger | https://learn.microsoft.com/en-us/azure/confidential-ledger/user-defined-functions |
| Programmatically verify Confidential Ledger transaction receipts | https://learn.microsoft.com/en-us/azure/confidential-ledger/verify-write-transaction-receipts |

### Deployment
| Topic | URL |
|-------|-----|
| Deploy Azure Confidential Ledger via ARM template | https://learn.microsoft.com/en-us/azure/confidential-ledger/quickstart-template |
| Provision Azure Confidential Ledger using Terraform | https://learn.microsoft.com/en-us/azure/confidential-ledger/quickstart-terraform |
