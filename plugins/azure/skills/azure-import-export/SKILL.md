---
name: azure-import-export
description: Expert knowledge for Azure Import Export development including troubleshooting, limits & quotas, and security. Use when setting CMK via Key Vault, validating drive/OS support, or debugging Import/Export job and log issues, and other Azure Import Export related development tasks. Not for Azure Data Box (use azure-data-box-family), Azure Blob Storage (use azure-blob-storage), Azure Files (use azure-files).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Import Export Skill

This skill provides expert guidance for Azure Import Export. Covers troubleshooting, limits & quotas, and security. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L25-L31 | Diagnosing and fixing Azure Import/Export job failures, reading Import/Export logs, and repairing failed v1 import/export jobs and copy issues. |
| Limits & Quotas | L33-L36 | Hardware specs, supported OS/file systems, drive types, and software prerequisites needed before using Azure Import/Export for data transfer. |
| Security | L38-L41 | Configuring customer-managed encryption keys (CMK) for Azure Import/Export jobs, including key setup, permissions, and using Azure Key Vault for data-at-rest security. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Handle and repair failed Azure Export jobs (v1 tool) | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-tool-repairing-an-export-job-v1 |
| Handle and repair failed Azure Import jobs (v1 tool) | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-tool-repairing-an-import-job-v1 |
| Use Import/Export logs to diagnose copy issues | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-tool-reviewing-job-status-v1 |
| Troubleshoot common Azure Import/Export job failures | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-tool-troubleshooting-v1 |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Check Azure Import/Export hardware and software requirements | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-requirements |

### Security
| Topic | URL |
|-------|-----|
| Configure customer-managed encryption keys for Azure Import/Export | https://learn.microsoft.com/en-us/azure/import-export/storage-import-export-encryption-key-portal |
