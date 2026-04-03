---
name: azure-ddos-protection
description: Expert knowledge for Azure DDos Protection development including troubleshooting, best practices, decision making, architecture & design patterns, security, and configuration. Use when choosing DDoS tiers, configuring IP/Network Protection plans, analyzing DDoS logs, or enforcing Azure Policy, and other Azure DDos Protection related development tasks. Not for Azure Firewall (use azure-firewall), Azure Firewall Manager (use azure-firewall-manager), Azure Web Application Firewall (use azure-web-application-firewall), Azure Networking (use azure-networking).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure DDOS Protection Skill

This skill provides expert guidance for Azure DDOS Protection. Covers troubleshooting, best practices, decision making, architecture & design patterns, security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L28-L33 | Handling and investigating DDoS attacks: engaging Rapid Response, reading Defender for Cloud DDoS alerts, and analyzing DDoS Protection logs in Log Analytics for root cause and mitigation. |
| Best Practices | L35-L41 | Guidance on DDoS Protection design, cost optimization, incident response planning, and safely running/simulating DDoS tests in Azure environments |
| Decision Making | L43-L47 | Guidance on comparing Azure DDoS Protection tiers (Basic vs Standard), pricing, feature differences, and how to choose the right tier for your workloads and budget. |
| Architecture & Design Patterns | L49-L53 | Reference architectures and design patterns for deploying Azure DDoS Protection, including integrating inline L7 protection with network virtual appliances (NVAs). |
| Security | L55-L64 | How to deploy, enable, and manage Azure DDoS IP/Network Protection plans via portal, CLI, or PowerShell, including required permissions and configuration steps. |
| Configuration | L66-L74 | Deploying and configuring Azure DDoS IP/Network Protection via ARM/Bicep, enabling monitoring and metrics, and enforcing protection using Azure Policy definitions. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Engage Azure DDoS Rapid Response during attacks | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-rapid-response |
| Interpret Azure DDoS alerts in Defender for Cloud | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-view-alerts-defender-for-cloud |
| Analyze Azure DDoS Protection logs in Log Analytics | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-view-diagnostic-logs |

### Best Practices
| Topic | URL |
|-------|-----|
| Optimize Azure DDoS Protection costs safely | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-optimization-guide |
| Design an Azure DDoS incident response strategy | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-response-strategy |
| Apply Azure DDoS Protection fundamental best practices | https://learn.microsoft.com/en-us/azure/ddos-protection/fundamental-best-practices |
| Run Azure DDoS Protection simulation tests safely | https://learn.microsoft.com/en-us/azure/ddos-protection/test-through-simulations |

### Decision Making
| Topic | URL |
|-------|-----|
| Compare pricing and choose Azure DDoS tiers | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-pricing-guide |
| Choose the right Azure DDoS Protection tier | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-protection-sku-comparison |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Use Azure DDoS Protection reference architectures | https://learn.microsoft.com/en-us/azure/ddos-protection/ddos-protection-reference-architectures |
| Implement inline L7 DDoS protection with NVAs | https://learn.microsoft.com/en-us/azure/ddos-protection/inline-protection-glb |

### Security
| Topic | URL |
|-------|-----|
| Set up Azure DDoS IP Protection using Azure CLI | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-ip-protection-cli |
| Enable Azure DDoS IP Protection in portal | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-ip-protection-portal |
| Create and configure Azure DDoS Network Protection in portal | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection |
| Configure Azure DDoS Network Protection using Azure CLI | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection-cli |
| Provision Azure DDoS Network Protection with PowerShell | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection-powershell |
| Configure Azure DDoS IP Protection with PowerShell | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection-powershell-ip |
| Configure permissions for Azure DDoS Protection plans | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-permissions |

### Configuration
| Topic | URL |
|-------|-----|
| Deploy Azure DDoS IP Protection with ARM template | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-ip-protection-template |
| Deploy Azure DDoS Network Protection with Bicep | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection-bicep |
| Configure Azure DDoS Network Protection via ARM template | https://learn.microsoft.com/en-us/azure/ddos-protection/manage-ddos-protection-template |
| Configure monitoring for Azure DDoS Protection | https://learn.microsoft.com/en-us/azure/ddos-protection/monitor-ddos-protection |
| Reference for Azure DDoS monitoring data | https://learn.microsoft.com/en-us/azure/ddos-protection/monitor-ddos-protection-reference |
| Use Azure Policy definitions for DDoS Protection | https://learn.microsoft.com/en-us/azure/ddos-protection/policy-reference |
