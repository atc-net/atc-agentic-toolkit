---
name: azure-table-storage
description: Expert knowledge for Azure Table Storage development including best practices, architecture & design patterns, limits & quotas, security, configuration, and integrations & coding patterns. Use when securing Table Storage, tuning telemetry, planning scale limits, designing keys, or scripting with PowerShell, and other Azure Table Storage related development tasks. Not for Azure Cosmos DB (use azure-cosmos-db), Azure Blob Storage (use azure-blob-storage), Azure Queue Storage (use azure-queue-storage).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Table Storage Skill

This skill provides expert guidance for Azure Table Storage. Covers best practices, architecture & design patterns, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L30-L34 | Guidance on designing scalable table schemas, partition/row key strategies, throughput optimization, and performance tuning patterns for Azure Table storage. |
| Architecture & Design Patterns | L35-L44 | Designing Azure Table Storage schemas: partition/row key strategies, query-optimized models, handling relationships, efficient updates, and common design patterns/anti-patterns. |
| Limits & Quotas | L45-L49 | Scalability limits, throughput targets, and performance constraints for Azure Table Storage, including partition key design, request rates, and capacity planning. |
| Security | L50-L56 | Configuring Azure Table Storage security: using Microsoft Entra ID, assigning RBAC roles, and applying best practices for access control and data protection. |
| Configuration | L57-L61 | Configuring Azure Table Storage monitoring: enabling metrics and logs, understanding available telemetry, and setting up alerts for performance, availability, and diagnostics. |
| Integrations & Coding Patterns | L62-L65 | Using Azure PowerShell to manage Table storage: create/delete tables, insert/query/update/delete entities, and script common data operations. |

### Best Practices
| Topic | URL |
|-------|-----|
| Apply performance and scalability best practices for Azure Table storage | https://learn.microsoft.com/en-us/azure/storage/tables/storage-performance-checklist |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Design scalable, cost-efficient schemas in Azure Table storage | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design |
| Design Azure Table storage for efficient data modification | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-for-modification |
| Design Azure Table storage schemas optimized for queries | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-for-query |
| Apply Azure Table storage design guidelines for efficient access | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-guidelines |
| Model relationships in Azure Table storage designs | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-modeling |
| Use Azure Table storage design and anti-patterns effectively | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Azure Table storage scalability and performance limits | https://learn.microsoft.com/en-us/azure/storage/tables/scalability-targets |

### Security
| Topic | URL |
|-------|-----|
| Assign Azure RBAC roles for Azure Table data access | https://learn.microsoft.com/en-us/azure/storage/tables/assign-azure-role-data-access |
| Authorize Azure Table storage with Microsoft Entra ID and RBAC | https://learn.microsoft.com/en-us/azure/storage/tables/authorize-access-azure-active-directory |
| Implement security for Azure Table Storage | https://learn.microsoft.com/en-us/azure/storage/tables/secure-tables |

### Configuration
| Topic | URL |
|-------|-----|
| Reference monitoring metrics and logs for Azure Table storage | https://learn.microsoft.com/en-us/azure/storage/tables/monitor-table-storage-reference |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use PowerShell cmdlets for Azure Table storage operations | https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-how-to-use-powershell |