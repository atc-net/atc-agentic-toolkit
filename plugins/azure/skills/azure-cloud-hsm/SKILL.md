---
name: azure-cloud-hsm
description: Expert knowledge for Azure Cloud Hsm development including troubleshooting, best practices, limits & quotas, security, and integrations & coding patterns. Use when configuring Cloud HSM auth/networking, PKCS#11 apps, X.509 cert storage, capacity limits, or cluster issues, and other Azure Cloud Hsm related development tasks. Not for Azure Dedicated HSM (use azure-dedicated-hsm), Azure Payment Hsm (use azure-payment-hsm), Azure Key Vault (use azure-key-vault), Azure Attestation (use azure-attestation).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Cloud Hsm Skill

This skill provides expert guidance for Azure Cloud Hsm. Covers troubleshooting, best practices, limits & quotas, security, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L29-L34 | Diagnosing and fixing Azure Cloud HSM cluster issues, including user/key synchronization problems, common error codes, connectivity failures, and operational faults. |
| Best Practices | L35-L39 | Guidance on secure key lifecycle management, HSM partition/role design, access control, network and operational hardening, and compliance-oriented security practices for Azure Cloud HSM deployments. |
| Limits & Quotas | L40-L45 | Service capacity limits (objects, transactions), quotas, and which cryptographic algorithms and key sizes are supported by Azure Cloud HSM |
| Security | L46-L57 | Security configuration for Cloud HSM: auth methods, network and Private Link setup, user management, logging to Event Hubs, and security/compliance best practices. |
| Integrations & Coding Patterns | L58-L62 | Using PKCS#11 with Azure Cloud HSM to store, access, and manage X.509 certificates, including configuring certificate storage and integration patterns for apps and services. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Fix user and key sync issues in Azure Cloud HSM clusters | https://learn.microsoft.com/en-us/azure/cloud-hsm/synchronize-users-keys |
| Troubleshoot common Azure Cloud HSM errors and issues | https://learn.microsoft.com/en-us/azure/cloud-hsm/troubleshoot |

### Best Practices
| Topic | URL |
|-------|-----|
| Apply key management best practices in Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/key-management |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Review Azure Cloud HSM service object and transaction limits | https://learn.microsoft.com/en-us/azure/cloud-hsm/service-limits |
| Review supported algorithms and key sizes in Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/supported-algorithms |

### Security
| Topic | URL |
|-------|-----|
| Configure authentication methods for Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/authentication |
| Understand security, compliance, and usage for Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/faq |
| Integrate Azure Cloud HSM with Azure Private Link | https://learn.microsoft.com/en-us/azure/cloud-hsm/integrate-with-private-link |
| Configure network security for Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/network-security |
| Apply security best practices to Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/secure-cloud-hsm |
| Route Azure Cloud HSM logs to Event Hubs | https://learn.microsoft.com/en-us/azure/cloud-hsm/tutorial-configure-event-hub |
| Configure and query Azure Cloud HSM operation logs | https://learn.microsoft.com/en-us/azure/cloud-hsm/tutorial-operation-event-logging |
| Implement secure user management in Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/user-management |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use PKCS#11 API to manage certificates in Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/pkcs-api-certificate-storage |
| Configure PKCS#11 certificate storage with Azure Cloud HSM | https://learn.microsoft.com/en-us/azure/cloud-hsm/tutorial-certificate-storage |