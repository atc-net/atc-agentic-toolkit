# Dataverse Plugin

Microsoft Dataverse and Power Platform skills covering connection setup, record CRUD, bulk import, queries and analytics, schema and metadata, solution lifecycle, environment administration, and security.

## Overview

This plugin helps AI coding agents work against a Dataverse environment through natural language. It combines four tools: the Dataverse MCP server, the `dataverse` CLI, the Python SDK (`PowerPlatform-Dataverse-Client`) and the Power Platform CLI (`pac`). Each skill picks the right tool for its task. Every change to an environment follows the same safe lifecycle: confirm the environment, confirm the solution, make the change, then pull the solution into source control.

Start with `dataverse-connect` in a new project. It installs the tools, signs you in, writes `.env`, copies the shared `scripts/auth.py` helper into the project and registers the MCP server.

## Skills

### dataverse-overview

Shared context for all Dataverse work: a map of the skills, hard rules, a reference of what each tool can do, an SDK cheat-sheet and the safe change lifecycle.

This skill is loaded automatically as background knowledge. It does not appear in the `/` menu.

### dataverse-connect

One-step setup and connection diagnostics. It installs the tools, authenticates, writes `.env`, copies the auth helper into the project, registers the MCP server for Claude Code or GitHub Copilot, and checks connectivity.

### dataverse-data

Record-level create, update, delete and upsert, plus bulk operations, CSV import, loads across several tables linked by foreign keys, and generation of sample data.

### dataverse-query

Bulk reads, iteration over many pages, FetchXML and SQL queries, aggregations and analysis with pandas or Jupyter notebooks.

### dataverse-metadata

Writing and inspecting the schema: tables, columns, relationships, alternate keys, forms and views.

### dataverse-solution

The solution lifecycle: publishers, creating solutions, export and import, promotion across environments, and checks after a deployment.

### dataverse-admin

Environment administration: bulk delete, retention, organization and OrgDB settings, the recycle bin and audit. Every change needs explicit confirmation first.

### dataverse-security

Assigning security roles, user access, application users, business units and admin self-elevation.

## Requirements

- A Dataverse environment. The free Power Apps Developer Plan is enough.
- Python 3.12+
- Node.js LTS, for the `dataverse` CLI (`npm install -g @microsoft/dataverse`)
- Power Platform CLI (`pac`)
- Azure CLI (optional, used as an alternative way to sign in)

## License

MIT
