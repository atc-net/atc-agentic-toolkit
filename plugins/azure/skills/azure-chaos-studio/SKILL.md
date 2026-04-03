---
name: azure-chaos-studio
description: Expert knowledge for Chaos Studio development including troubleshooting, limits & quotas, security, configuration, and integrations & coding patterns. Use when defining ARM/Bicep experiments, deploying Chaos Agents, using CLI/REST, or integrating with Azure Monitor, and other Chaos Studio related development tasks. Not for Azure Monitor (use azure-monitor), Azure Resiliency (use azure-resiliency), Azure Reliability (use azure-reliability), Azure Site Recovery (use azure-site-recovery).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Chaos Studio Skill

This skill provides expert guidance for Azure Chaos Studio. Covers troubleshooting, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L27-L33 | Diagnosing and fixing Chaos Studio and Chaos Agent issues, including installation/health problems, VM agent status checks, known errors, and common experiment or connectivity failures. |
| Limits & Quotas | L35-L41 | Chaos Studio limits: agent OS/fault compatibility, known issues, regional/HA behavior, and throttling, quotas, and usage constraints for experiments |
| Security | L43-L56 | Securing Chaos Studio: identities, roles, permissions, CMK encryption, network/IP controls, Private Link, VNet injection, AKS auth, and safely controlling experiment targets/capabilities. |
| Configuration | L58-L69 | Configuring Chaos Studio: ARM/Bicep experiment definitions, deploying agents/targets, parameters, Azure Monitor/Workbook integration, OS/tool compatibility, and onboarding via Azure Policy |
| Integrations & Coding Patterns | L71-L76 | Using CLI/REST to create and manage Chaos Studio experiments, plus patterns for sending Chaos Agent telemetry to Application Insights and integrating experiments into automated workflows |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Review known issues and workarounds for Chaos Agent | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-known-issues |
| Troubleshoot Azure Chaos Agent installation and health | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-troubleshooting |
| Verify and interpret Chaos Agent status on VMs | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-verify-status |
| Troubleshoot common Azure Chaos Studio issues | https://learn.microsoft.com/en-us/azure/chaos-studio/troubleshooting |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Check OS and fault compatibility for Chaos Agent | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-os-support |
| Review Chaos Studio limitations and known issues | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-limitations |
| Understand Chaos Studio regional and HA model | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-region-availability |
| Azure Chaos Studio throttling and usage limits | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-service-limits |

### Security
| Topic | URL |
|-------|-----|
| Allowlist Chaos Studio Relay Bridge Host container image | https://learn.microsoft.com/en-us/azure/chaos-studio/azure-container-instance-details |
| Understand Chaos Agent networking, identity, and dependencies | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-concepts |
| Configure Entra authentication for Chaos Studio AKS faults | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-aks-authentication |
| Authorize Chaos Studio IP ranges for AKS clusters | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-aks-ip-ranges |
| Assign managed identity permissions for Chaos experiments | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-assign-experiment-permissions |
| Configure customer-managed keys for Chaos Studio experiments | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-configure-customer-managed-keys |
| Assign roles for Chaos Studio supported resource types | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-fault-providers |
| Configure permissions and security for Azure Chaos Studio | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-permissions-security |
| Configure Private Link for Chaos Agent experiments | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-private-link-agent-service |
| Secure Chaos Studio with virtual network injection | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-private-networking |
| Control Chaos Studio targets and capabilities securely | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-targets-capabilities |

### Configuration
| Topic | URL |
|-------|-----|
| Deploy Chaos Agent on VM scale sets with ARM | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-agent-arm-template |
| Author Chaos Studio experiments with Bicep templates | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-bicep |
| Use Chaos Studio fault and action parameters | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-fault-library |
| Configure Azure Workbook to measure Chaos Studio faults | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-fault-metrics-and-dashboard |
| Configure Azure Monitor integration for Chaos Studio | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-set-up-azure-monitor |
| Check OS and tool compatibility for Chaos Studio | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-versions |
| Use Azure Policy to onboard resources to Chaos Studio | https://learn.microsoft.com/en-us/azure/chaos-studio/sample-policy-targets |
| Define Chaos Studio experiments using ARM templates | https://learn.microsoft.com/en-us/azure/chaos-studio/sample-template-experiment |
| Deploy Chaos Studio targets and capabilities via ARM | https://learn.microsoft.com/en-us/azure/chaos-studio/sample-template-targets |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Call Azure Chaos Studio REST APIs with CLI samples | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-samples-rest-api |
| Send Chaos Agent experiment telemetry to App Insights | https://learn.microsoft.com/en-us/azure/chaos-studio/chaos-studio-set-up-app-insights |
| Create Chaos Studio experiments via CLI and portal | https://learn.microsoft.com/en-us/azure/chaos-studio/experiment-examples |
