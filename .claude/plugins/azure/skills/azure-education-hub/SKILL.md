---
name: azure-education-hub
description: Expert knowledge for Azure Education Hub development including troubleshooting, and limits & quotas. Use when building, debugging, or optimizing Azure Education Hub applications. Not for Azure Lab Services (use azure-lab-services), Azure DevTest Labs (use azure-devtest-labs), Azure Virtual Desktop (use azure-virtual-desktop).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or fetch_webpage to retrieve documentation.
---
# Azure Education Hub Skill

This skill provides expert guidance for Azure Education Hub. Covers troubleshooting, and limits & quotas. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use `mcp_fetch:fetch` if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L30-L34 | Diagnosing and resolving Azure Dev Tools for Teaching sign-in issues, including common login errors, account problems, and access troubleshooting steps. |
| Limits & Quotas | L35-L39 | Details on Azure for Students free credit limits, yearly quota behavior, renewals, and how to monitor, manage, or avoid hitting those usage caps. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Fix Azure Dev Tools for Teaching sign-in errors | https://learn.microsoft.com/en-us/azure/education-hub/azure-dev-tools-teaching/troubleshoot-login |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand Azure for Students credit limits | https://learn.microsoft.com/en-us/azure/education-hub/about-azure-for-students |
| Manage Azure for Students yearly credit quota | https://learn.microsoft.com/en-us/azure/education-hub/navigate-costs |