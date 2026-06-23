---
name: azure-network-watcher
description: Expert knowledge for Azure Network Watcher development including troubleshooting, decision making, limits & quotas, security, configuration, and integrations & coding patterns. Use when configuring Connection Monitor, NSG/VNet flow logs, packet capture, Traffic Analytics/KQL, or Sentinel integrations, and other Azure Network Watcher related development tasks. Not for Azure Monitor (use azure-monitor), Azure Virtual Network (use azure-virtual-network), Azure Networking (use azure-networking), Azure Virtual Network Manager (use azure-virtual-network-manager).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Network Watcher Skill

This skill provides expert guidance for Azure Network Watcher. Covers troubleshooting, decision making, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L30-L40 | Diagnosing and fixing Azure network issues: outbound connectivity, NSG/admin rules, and VPN gateway/on-premises connectivity, including automation and CLI/PowerShell-based troubleshooting. |
| Decision Making | L41-L47 | Guidance for migrating network monitoring: moving from classic Connection Monitor and Network Performance Monitor tests, and switching NSG flow logs to VNet flow logs. |
| Limits & Quotas | L48-L52 | How to configure and run Network Watcher packet capture, storage and filtering options, and the key limits/quotas (size, duration, concurrency) that apply to captures |
| Security | L53-L60 | Securing Network Watcher: RBAC setup, hardening deployments and data access, Zero Trust segmentation with Traffic Analytics, and protecting VNet flow logs using managed identities. |
| Configuration | L61-L75 | Configuring and governing Network Watcher logging: AMA for Connection Monitor, NSG/VNet flow logs setup, schemas, filtering, templates (Bicep/ARM), and Azure Policy enforcement. |
| Integrations & Coding Patterns | L76-L81 | Using Network Watcher data in tools and code: parsing NSG flow logs with PowerShell, visualizing in Power BI, triggering packet capture from Functions, querying Traffic Analytics with KQL, and integrating with Sentinel. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Diagnose outbound connection issues with Network Watcher | https://learn.microsoft.com/en-us/azure/network-watcher/connection-troubleshoot-manage |
| Troubleshoot NSG and admin rules with NSG diagnostics | https://learn.microsoft.com/en-us/azure/network-watcher/diagnose-network-security-rules |
| Resolve common Azure Network Watcher issues | https://learn.microsoft.com/en-us/azure/network-watcher/frequently-asked-questions |
| Diagnose on-premises VPN connectivity to Azure with Network Watcher | https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-diagnose-on-premises-connectivity |
| Automate VPN connectivity monitoring with Azure Automation and Network Watcher | https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-monitor-with-azure-automation |
| Troubleshoot VPN gateways and connections with Azure CLI | https://learn.microsoft.com/en-us/azure/network-watcher/vpn-troubleshoot-cli |
| Troubleshoot VPN gateways and connections with PowerShell | https://learn.microsoft.com/en-us/azure/network-watcher/vpn-troubleshoot-powershell |

### Decision Making
| Topic | URL |
|-------|-----|
| Migrate from Connection Monitor classic to new Connection Monitor | https://learn.microsoft.com/en-us/azure/network-watcher/migrate-to-connection-monitor-from-connection-monitor-classic |
| Migrate tests from Network Performance Monitor to Connection Monitor | https://learn.microsoft.com/en-us/azure/network-watcher/migrate-to-connection-monitor-from-network-performance-monitor |
| Migrate from NSG flow logs to VNet flow logs | https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-migrate |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Use Network Watcher packet capture and understand its limits | https://learn.microsoft.com/en-us/azure/network-watcher/packet-capture-overview |

### Security
| Topic | URL |
|-------|-----|
| Configure RBAC permissions for Azure Network Watcher | https://learn.microsoft.com/en-us/azure/network-watcher/required-rbac-permissions |
| Secure Azure Network Watcher deployment and data access | https://learn.microsoft.com/en-us/azure/network-watcher/secure-network-watcher |
| Apply Zero Trust segmentation using Traffic Analytics | https://learn.microsoft.com/en-us/azure/network-watcher/traffic-analytics-zero-trust |
| Secure VNet flow logs with managed identities | https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-managed-identity |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Azure Monitor Agent for Connection Monitor | https://learn.microsoft.com/en-us/azure/network-watcher/azure-monitor-agent-with-connection-monitor |
| Install and manage Azure Monitor Agent on Arc servers | https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-install-azure-monitor-agent |
| Understand Connection Monitor Log Analytics data schemas | https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-schema |
| Enable NSG flow logs using Bicep | https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-bicep |
| Configure and manage Azure NSG flow logs | https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-manage |
| Enable NSG flow logs using ARM templates | https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-template |
| Govern Traffic Analytics with Azure Policy | https://learn.microsoft.com/en-us/azure/network-watcher/traffic-analytics-policy-portal |
| Understand Traffic Analytics schema and aggregation | https://learn.microsoft.com/en-us/azure/network-watcher/traffic-analytics-schema |
| Configure filtering for Azure VNet flow logs | https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-filtering |
| Configure and manage Azure virtual network flow logs | https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-manage |
| Enforce VNet flow logs with Azure Policy | https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-policy |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Parse and read Azure flow logs with PowerShell | https://learn.microsoft.com/en-us/azure/network-watcher/flow-logs-read |
| Trigger Network Watcher packet captures from Azure Functions alerts | https://learn.microsoft.com/en-us/azure/network-watcher/packet-capture-alert-triggered |
| Analyze Traffic Analytics data with KQL queries | https://learn.microsoft.com/en-us/azure/network-watcher/traffic-analytics-queries |