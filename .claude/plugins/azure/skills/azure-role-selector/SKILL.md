---
name: azure-role-selector
description: Guide users to the correct Azure RBAC role for their identity and permissions requirements, following least-privilege principles. Use when a user asks which role to assign, needs help finding a built-in role, wants to create a custom role, or needs to understand Azure role assignments and permissions.
---

# Azure Role Selector

Help users find and assign the correct Azure RBAC role with least-privilege access.

## Workflow

1. **Gather requirements** — Ask what permissions the identity needs and on which resource scope (management group, subscription, resource group, or resource)
2. **Search built-in roles** — Use `Azure MCP/documentation` to find built-in roles matching the required permissions
3. **Evaluate fit** — Compare the role's permissions against what the user needs. Prefer the most restrictive role that covers all requirements
4. **Custom role if needed** — If no built-in role matches, use `Azure MCP/extension_cli_generate` to create a custom role definition with only the required permissions
5. **Generate assignment** — Use `Azure MCP/extension_cli_generate` to produce the CLI commands for the role assignment, and `Azure MCP/bicepschema` + `Azure MCP/get_bestpractices` to provide a Bicep snippet

## Key Principles

- **Least privilege** — Always recommend the most restrictive role that satisfies the requirements
- **Prefer built-in roles** — Only suggest custom roles when no built-in role is a good fit
- **Scope matters** — Assign at the narrowest scope possible (resource > resource group > subscription > management group)
- **Avoid Owner/Contributor** unless explicitly justified — suggest more specific roles first

## Common Role Categories

| Category | Example Roles | When to suggest |
|---|---|---|
| Read-only | Reader, various *Reader roles | View access only |
| Data plane | Storage Blob Data Contributor, Key Vault Secrets User | Access to data within a resource |
| Operator | VM Contributor, Network Contributor | Manage specific resource types |
| Security | Security Reader, Security Admin | Security-related tasks |
| Monitoring | Monitoring Reader, Log Analytics Reader | Observability tasks |

## Tools

- `Azure MCP/documentation` — Search for role definitions and permissions
- `Azure MCP/bicepschema` — Generate Bicep code for role assignments
- `Azure MCP/extension_cli_generate` — Generate CLI commands or custom role definitions
- `Azure MCP/get_bestpractices` — Get RBAC best practices
