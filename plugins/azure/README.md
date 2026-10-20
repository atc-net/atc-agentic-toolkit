# Azure Plugin

Azure services skills including IoT Edge modules, IoT Hub, and related services.

## Overview

This plugin provides skills and automation for working with Azure services, with a focus on development efficiency and best practices.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install azure --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install azure@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## MCP Servers

This plugin bundles two MCP servers that start automatically when the plugin is enabled.

### Microsoft Learn MCP Server

Remote server providing real-time access to official Microsoft documentation. No API keys or authentication required.

- `microsoft_docs_search` — semantic search across Microsoft Learn documentation
- `microsoft_docs_fetch` — fetch a full documentation page as markdown
- `microsoft_code_sample_search` — find official code snippets and examples

Source: [MicrosoftDocs/mcp](https://github.com/MicrosoftDocs/mcp)

### Azure MCP Server

Local server providing tools for managing Azure resources, querying Azure Resource Graph, and interacting with Azure services directly from your agent.

Requires: Node.js and an authenticated Azure CLI session (`az login`).

Source: [@azure/mcp](https://www.npmjs.com/package/@azure/mcp)

## Skills

### azure-iot-edge-module

Scaffolds new Azure IoT Edge modules with complete project structure, deployment manifests, and solution integration.

**Features:**

- Creates module with .NET project structure
- Generates Dockerfiles for development and production
- Adds module to deployment manifest
- Integrates with existing .NET solutions
- Supports first-module scenarios
- Includes logging, service patterns, and constants

**Usage:**

```markdown
Use the azure-iot-edge-module skill to create a new module named [ModuleName]
```

The skill can also be invoked directly:

```
/azure:azure-iot-edge-module
```

## Requirements

- .NET SDK
- Python 3.x

## License

MIT
