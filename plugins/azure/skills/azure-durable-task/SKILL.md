---
name: azure-durable-task
description: Expert knowledge for Azure Durable Task development including best practices, decision making, architecture & design patterns, limits & quotas, configuration, integrations & coding patterns, and deployment. Use when choosing Durable storage backends, versioning orchestrations, using fan-out/fan-in, human approvals, or instance APIs, and other Azure Durable Task related development tasks. Not for Azure Functions (use azure-functions), Azure Logic Apps (use azure-logic-apps), Azure App Service (use azure-app-service), Azure Service Fabric (use azure-service-fabric).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Durable Task Skill

This skill provides expert guidance for Azure Durable Task. Covers best practices, decision making, architecture & design patterns, limits & quotas, configuration, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L31-L39 | Patterns and constraints for writing robust orchestrator code, including retries and error handling, eternal/continue-as-new flows, external event handling, and singleton orchestration patterns. |
| Decision Making | L40-L45 | Guidance on when to use Durable Functions vs raw Durable Task SDK, and how to compare and choose durable storage providers/backends for orchestrations. |
| Architecture & Design Patterns | L46-L53 | Patterns for orchestrating Durable workflows: fan-out/fan-in, human approval steps, long-running monitors, and function chaining design and implementation. |
| Limits & Quotas | L54-L59 | Configuring orchestration status size/retention limits, querying status, and monitoring Durable Task Scheduler action metrics, performance, and billing impacts. |
| Configuration | L60-L64 | Configuring Durable Task hubs storage (connection, scaling, reliability) and using instance management APIs to query, control, and manage orchestration instances. |
| Integrations & Coding Patterns | L65-L69 | Managing Durable Task workflow instances: starting, querying, terminating, purging, and using instance management APIs for lifecycle control and monitoring |
| Deployment | L70-L73 | Guidance on safely deploying Durable orchestrations using versioning strategies, handling breaking changes, and managing upgrades without disrupting running workflows. |

### Best Practices
| Topic | URL |
|-------|-----|
| Follow orchestrator code constraints in Durable Functions | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-code-constraints |
| Implement error handling and retries in Durable Functions | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-error-handling |
| Implement eternal orchestrations with continue-as-new | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-eternal-orchestrations |
| Handle external events in Durable orchestrations | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-external-events |
| Implement singleton orchestrators in Durable Functions | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-singletons |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose Durable Functions vs Durable Task SDK hosting | https://learn.microsoft.com/en-us/azure/durable-task/common/choose-orchestration-framework |
| Compare Durable Task storage providers and choose backends | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-storage-providers |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Implement fan-out/fan-in pattern in Durable Functions | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-fan-in-fan-out |
| Design human interaction workflows in Durable Task | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-human-interaction |
| Build monitor pattern workflows with Durable orchestrations | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-monitor |
| Use function chaining pattern in Durable workflows | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-sequence |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Configure and query custom orchestration status limits | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-custom-orchestration-status |
| Monitor Durable Task Scheduler action metrics and billing | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-metrics |

### Configuration
| Topic | URL |
|-------|-----|
| Configure and manage Durable Task hubs storage | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-hubs |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Use instance management APIs for Durable Task workflows | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-instance-management |

### Deployment
| Topic | URL |
|-------|-----|
| Use orchestration versioning for safe Durable deployments | https://learn.microsoft.com/en-us/azure/durable-task/common/durable-orchestration-versioning |