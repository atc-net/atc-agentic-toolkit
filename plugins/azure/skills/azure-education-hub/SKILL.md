---
name: azure-education-hub
description: Expert knowledge for Azure Education Hub development including troubleshooting, and limits & quotas. Use when managing Azure for Students credits, yearly quotas, renewals, or Dev Tools for Teaching sign-in issues, and other Azure Education Hub related development tasks. Not for Azure Lab Services (use azure-lab-services), Azure DevTest Labs (use azure-devtest-labs), Azure Virtual Desktop (use azure-virtual-desktop).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Education Hub Skill

This skill provides expert guidance for Azure Education Hub. Covers troubleshooting, and limits & quotas. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L26-L30 | Diagnosing and resolving Azure Dev Tools for Teaching sign-in issues, including common login errors, account problems, and access troubleshooting steps. |
| Limits & Quotas | L31-L35 | Details on Azure for Students free credit limits, yearly quota behavior, renewals, and how to monitor, manage, or avoid hitting those usage caps. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Fix Azure Dev Tools for Teaching sign-in errors | https://learn.microsoft.com/en-us/azure/education-hub/azure-dev-tools-teaching/troubleshoot-login |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Understand Azure for Students credit limits | https://learn.microsoft.com/en-us/azure/education-hub/about-azure-for-students |
| Manage Azure for Students yearly credit quota | https://learn.microsoft.com/en-us/azure/education-hub/navigate-costs |