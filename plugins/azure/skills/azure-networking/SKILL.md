---
name: azure-networking
description: Expert knowledge for Azure Networking development including troubleshooting, best practices, decision making, architecture & design patterns, security, and integrations & coding patterns. Use when designing VNets/hubs, routing via firewalls/gateways, enforcing Policy, or querying networks with Resource Graph, and other Azure Networking related development tasks. Not for Azure Virtual Network (use azure-virtual-network), Azure Virtual Network Manager (use azure-virtual-network-manager), Azure Virtual WAN (use azure-virtual-wan), Azure Network Watcher (use azure-network-watcher).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Networking Skill

This skill provides expert guidance for Azure Networking. Covers troubleshooting, best practices, decision making, architecture & design patterns, security, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L28-L31 | Diagnosing and resolving Microsoft.Network resource provisioning failures in Azure, including common error patterns, causes, and step-by-step remediation guidance. |
| Best Practices | L33-L36 | Guidance on boosting Azure NVA and VM network throughput/latency using Accelerated Connections, including configuration, tuning, and performance best practices. |
| Decision Making | L38-L44 | Guidance on choosing Azure network architectures: using region latency data, selecting secure topologies and app delivery options, and planning networking for remote and hybrid work scenarios. |
| Architecture & Design Patterns | L46-L50 | Analyzing and troubleshooting Azure network routing: control plane route selection/interoperability and data plane traffic paths across VNets, hubs, firewalls, and gateways. |
| Security | L52-L57 | Designing Zero Trust VNets for web apps and using Azure Policy to enforce, audit, and remediate security/compliance rules on networking resources |
| Integrations & Coding Patterns | L59-L62 | Using Azure Resource Graph to query, filter, and analyze Azure networking resources at scale (e.g., VNets, NSGs, public IPs) for inventory, compliance, and reporting. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot Microsoft.Network failed provisioning states | https://learn.microsoft.com/en-us/azure/networking/troubleshoot-failed-state |

### Best Practices
| Topic | URL |
|-------|-----|
| Optimize NVA and VM performance with Accelerated Connections | https://learn.microsoft.com/en-us/azure/networking/nva-accelerated-connections |

### Decision Making
| Topic | URL |
|-------|-----|
| Use Azure region latency stats for architecture planning | https://learn.microsoft.com/en-us/azure/networking/azure-network-latency |
| Choose secure Azure application delivery options | https://learn.microsoft.com/en-us/azure/networking/secure-application-delivery |
| Select a secure Azure network topology | https://learn.microsoft.com/en-us/azure/networking/secure-network-topology |
| Plan Azure networking for remote work scenarios | https://learn.microsoft.com/en-us/azure/networking/working-remotely-support |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Analyze control plane routing interoperability in Azure | https://learn.microsoft.com/en-us/azure/networking/connectivity-interoperability-control-plane |
| Analyze data plane paths across Azure networks | https://learn.microsoft.com/en-us/azure/networking/connectivity-interoperability-data-plane |

### Security
| Topic | URL |
|-------|-----|
| Deploy a Zero Trust virtual network for web apps | https://learn.microsoft.com/en-us/azure/networking/create-zero-trust-network-web-apps |
| Use built-in Azure Policy definitions for networking | https://learn.microsoft.com/en-us/azure/networking/policy-reference |
| Apply Azure Policy compliance controls to networking | https://learn.microsoft.com/en-us/azure/networking/security-controls-policy |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Run Azure Resource Graph queries for networking resources | https://learn.microsoft.com/en-us/azure/networking/fundamentals/resource-graph-samples |
