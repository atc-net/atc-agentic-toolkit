---
name: azure-route-server
description: Expert knowledge for Azure Route Server development including troubleshooting, best practices, architecture & design patterns, limits & quotas, security, and configuration. Use when designing Route Server topologies, BGP peering/policies, route maps/filtering, RBAC, or capacity limits, and other Azure Route Server related development tasks. Not for Azure Virtual Network (use azure-virtual-network), Azure Virtual Network Manager (use azure-virtual-network-manager), Azure Virtual WAN (use azure-virtual-wan), Azure VPN Gateway (use azure-vpn-gateway).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Route Server Skill

This skill provides expert guidance for Azure Route Server. Covers troubleshooting, best practices, architecture & design patterns, limits & quotas, security, and configuration. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L30-L34 | Diagnosing and resolving common Azure Route Server problems, including BGP session issues, route propagation/advertisement errors, and connectivity or configuration troubleshooting steps. |
| Best Practices | L35-L39 | Configuring Azure Route Server routing preferences, BGP path selection, and custom routing policies to control traffic flow and route advertisement to your NVA or on-premises routers. |
| Architecture & Design Patterns | L40-L54 | Designing Azure Route Server network topologies: dual-homed, multi-region, anycast, hub-spoke; NVA next-hop, path selection, route injection, route maps, filtering, AS-path prepending, communities. |
| Limits & Quotas | L55-L59 | Guidance on Route Server capacity planning, scale units, connection limits, and how many peers/routes each deployment can support. |
| Security | L60-L65 | RBAC roles, permissions, and security hardening guidance for Azure Route Server, including access control, best practices, and securing deployments against threats. |
| Configuration | L66-L71 | Configuring Route Server BGP (peering, policies), setting up and using route maps, and monitoring Route Server health and performance with Azure Monitor metrics. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Troubleshoot common Azure Route Server issues | https://learn.microsoft.com/en-us/azure/route-server/troubleshoot-route-server |

### Best Practices
| Topic | URL |
|-------|-----|
| Configure routing preference in Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/hub-routing-preference |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Design dual-homed networks with Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/about-dual-homed-network |
| Implement anycast routing with Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/anycast |
| Integrate Route Server with ExpressRoute and VPN | https://learn.microsoft.com/en-us/azure/route-server/expressroute-vpn-support |
| Design multi-region networks with Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/multiregion |
| Design NVA next-hop IP patterns with Route Server | https://learn.microsoft.com/en-us/azure/route-server/next-hop-ip |
| Configure path selection using Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/path-selection |
| Use route injection in Azure hub-and-spoke networks | https://learn.microsoft.com/en-us/azure/route-server/route-injection-in-spokes |
| Control Azure Route Server routing with route maps | https://learn.microsoft.com/en-us/azure/route-server/route-maps-about |
| Filter and drop inbound BGP routes in Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/route-maps-scenario-drop-inbound-routes |
| Use route maps to prepend BGP AS paths in Azure | https://learn.microsoft.com/en-us/azure/route-server/route-maps-scenario-prepend-routes |
| Tag BGP routes with communities using Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/route-maps-scenario-tag-bgp-communities |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Plan Azure Route Server capacity and scale units | https://learn.microsoft.com/en-us/azure/route-server/route-server-capacity |

### Security
| Topic | URL |
|-------|-----|
| Configure RBAC roles for managing Azure Route Server | https://learn.microsoft.com/en-us/azure/route-server/roles-permissions |
| Secure and harden Azure Route Server deployments | https://learn.microsoft.com/en-us/azure/route-server/secure-route-server |

### Configuration
| Topic | URL |
|-------|-----|
| Configure and manage Azure Route Server BGP settings | https://learn.microsoft.com/en-us/azure/route-server/configure-route-server |
| Monitor Azure Route Server with Azure Monitor metrics | https://learn.microsoft.com/en-us/azure/route-server/monitor-route-server |
| Configure Azure Route Server route maps | https://learn.microsoft.com/en-us/azure/route-server/route-maps-how-to |