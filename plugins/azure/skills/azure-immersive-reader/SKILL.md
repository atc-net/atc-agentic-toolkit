---
name: azure-immersive-reader
description: Expert knowledge for Azure AI Immersive Reader development including best practices, limits & quotas, security, configuration, and integrations & coding patterns. Use when tuning read-aloud/translation, storing user prefs, Entra auth setup, JS SDK integration, or language support, and other Azure AI Immersive Reader related development tasks. Not for Azure AI Language (use azure-language-service), Azure AI Speech (use azure-speech), Azure Translator (use azure-translator), Azure AI services (use microsoft-foundry-tools).
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Immersive Reader Skill

This skill provides expert guidance for Azure Immersive Reader. Covers best practices, limits & quotas, security, configuration, and integrations & coding patterns. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: This file may be large. Use the **Category Index** below to locate relevant sections, then use `read_file` with specific line ranges (e.g., `L136-L144`) to read the sections needed for the user's question
This skill requires **network access** to fetch documentation content.
Use `mcp_microsoftdocs:microsoft_docs_fetch` to retrieve full articles.
- **Fallback**: Use the built-in `WebFetch` tool if the Microsoft Learn MCP server is not available.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Best Practices | L27-L30 | Guidance on improving Immersive Reader performance by caching authentication tokens, including token reuse patterns and reducing auth overhead. |
| Limits & Quotas | L32-L35 | Supported languages and feature availability for Immersive Reader (e.g., which languages work with read-aloud, translation, and other capabilities). |
| Security | L37-L42 | Configuring Immersive Reader security: creating the resource with Entra auth, managing Entra role assignments, and setting cookie policy and user consent. |
| Configuration | L44-L49 | Configuring Immersive Reader behavior: read-aloud voice/speed, translation languages and behavior, and storing/managing per-user reading and language preferences. |
| Integrations & Coding Patterns | L51-L60 | Implementing Immersive Reader in web/iOS apps: launch flows, JS SDK usage, HTML/MathML prep, custom buttons, multi-resource setups, and Vision Read integration. |

### Best Practices
| Topic | URL |
|-------|-----|
| Cache Immersive Reader auth tokens for performance | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-cache-token |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Check supported languages for Immersive Reader features | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/language-support |

### Security
| Topic | URL |
|-------|-----|
| Create Immersive Reader resource and configure Entra auth | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-create-immersive-reader |
| Configure Immersive Reader cookie policy and consent | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to/set-cookie-policy |
| Update Immersive Reader Entra role assignments for security | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/security-how-to-update-role-assignment |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Immersive Reader Read Aloud options | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-configure-read-aloud |
| Configure translation settings in Immersive Reader | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-configure-translation |
| Store and manage Immersive Reader user preferences | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-store-user-preferences |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Customize the Immersive Reader launch button | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-customize-launch-button |
| Launch Azure Immersive Reader from application code | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-launch-immersive-reader |
| Use multiple Immersive Reader resources in one app | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-multiple-resources |
| Prepare HTML content for Immersive Reader integration | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to-prepare-html |
| Render MathML expressions in Immersive Reader | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/how-to/display-math |
| Use the Immersive Reader JavaScript SDK API | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/reference |
| Build iOS app integrating Vision Read and Immersive Reader | https://learn.microsoft.com/en-us/azure/ai-services/immersive-reader/tutorial-ios-picture-immersive-reader |
