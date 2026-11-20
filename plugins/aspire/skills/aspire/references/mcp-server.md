# MCP Server — Complete Reference

Aspire exposes an **MCP (Model Context Protocol) server** that lets AI coding assistants query and control your running distributed application, and search Aspire documentation. This enables AI tools to inspect resource status, read logs, view traces, restart services, and look up docs — all from within the AI assistant's context.

Reference: https://aspire.dev/get-started/ai-coding-agents/

> **Changed in 13.3:** This **AppHost-level** MCP server (configured via `aspire agent init`) is the one and only MCP integration. The older **dashboard-embedded** MCP server — and its `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL` setting — was removed in 13.3, along with the in-dashboard GitHub Copilot chat UI.

---

## Setup: `aspire agent init` (13.2+) / `aspire mcp init` (13.1)

The easiest way to configure the MCP server is using the Aspire CLI:

```bash
# 17.0 — pick agents and scope explicitly in scripts
aspire agent init --agents claude --scope project --mcp --non-interactive

# 13.6+ — skills only by default; opt into the MCP server explicitly
aspire agent init --mcp

# 13.2–13.5
aspire agent init

# 13.1
aspire mcp init
```

> **Changed in 13.6:** `aspire agent init` installs skills **without** configuring MCP unless you pass
> `--mcp` (interactive standalone setup offers MCP as an opt-in; `--mcp=false` opts out explicitly).
> `aspire new` / `aspire init` likewise leave MCP unselected. If an agent has Aspire skills but no
> Aspire MCP tools, rerun `aspire agent init --mcp`.
>
> **Configure MCP only when the user asks for it.** Missing MCP config after a successful
> `agent init` is expected. Never add `--mcp` to `aspire new`, `aspire init`, a skill refresh, or
> missing-skill recovery.

> **This toolkit already configures the MCP server** — the `aspire` plugin's `.mcp.json` runs
> `aspire agent mcp` over STDIO — so you don't need `aspire agent init` for MCP either. Use the steps
> below only for agents or editors the toolkit isn't installed in, and only when the user asks.

> **Changed in 17.0:** skills are no longer copied into the repo. `agent init` registers Microsoft's
> Aspire skills **plugin** (`aspire@aspire-skills`, or the `skillSources` in `aspire.config.json`) with
> each selected agent's plugin system; MCP configuration stays separate and opt-in. The embedded skills
> bundle and `--aspire-source` are gone, and `--skill-locations` was replaced by `--agents`
> (`copilot,claude,opencode`) and `--scope project|global`. Reload the agent afterwards.

The command walks you through an interactive setup:

1. **Workspace root** — prompts for the path to your workspace root (defaults to current directory)
2. **Agent and scope selection** — detects supported AI agents (GitHub Copilot incl. VS Code, Copilot CLI, and the Copilot app; Claude Code; OpenCode) and asks which to configure and whether at project or global scope (17.0; `aspire new`/`init` use the same picker)
3. **Skills** — `aspire` by default; optionally `playwright-cli` and `dotnet-inspect` (C# AppHosts only)
4. **Config creation** — writes the appropriate configuration (e.g., `.vscode/mcp.json` when MCP is selected)
5. **Skills plugin** — 17.0: registers the skills plugin; 13.6 and earlier: copies skill files with Aspire-specific instructions

> **Note:** The init command uses interactive prompts (Spectre.Console). It must be run in a real terminal — the VS Code integrated terminal may not handle the prompts correctly. Use an external terminal if needed.

---

## Understanding the Configuration

When you run `aspire agent init` (or `aspire mcp init` on 13.1), the CLI creates configuration files appropriate for your detected environment.

### VS Code (GitHub Copilot)

Creates or updates `.vscode/mcp.json`:

```json
{
  "servers": {
    "aspire": {
      "type": "stdio",
      "command": "aspire",
      "args": ["agent", "mcp"]
    }
  }
}
```

## MCP Tools

The tools available depend on your Aspire CLI version. Check with `aspire --version` (or `aspire -v` on 13.2+).

### Tools available in 13.1+ (stable)

#### Resource management tools

These tools require a running AppHost (`aspire start` on 13.2+, or `aspire run` on 13.1).

| Tool                         | Description                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `list_resources`             | Lists all resources, including state, health status, source, endpoints, and commands                |
| `list_console_logs`          | Lists console logs for a resource                                                                   |
| `list_structured_logs`       | Lists structured logs, optionally filtered by resource name                                         |
| `list_traces`                | Lists distributed traces. Traces can be filtered using an optional resource name parameter          |
| `list_trace_structured_logs` | Lists structured logs for a specific trace                                                          |
| `execute_resource_command`   | Executes a resource command (accepts resource name and command name)                                |

> **13.2+ alternative:** Many of these operations are also available via CLI commands (`aspire describe`, `aspire logs`, `aspire otel logs/traces`, `aspire resource`). CLI commands work directly in the terminal without needing the MCP server.

#### AppHost management tools

| Tool             | Description                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `list_apphosts`  | Lists all detected AppHost connections, showing which are in/out of working directory scope |
| `select_apphost` | Selects which AppHost to use when multiple are running                                      |

#### Integration tools

These work without a running AppHost.

| Tool                   | Description                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `list_integrations`    | Lists available Aspire hosting integrations (NuGet packages for databases, message brokers, cloud services, etc.) |
| `get_integration_docs` | Gets documentation for a specific Aspire hosting integration package                                              |

### Tools added in 13.2+ (documentation search)

> **Version gate:** These tools were added in [PR #14028](https://github.com/dotnet/aspire/pull/14028) and ship in Aspire CLI **13.2**. If you are on 13.1, these tools will NOT appear.

| Tool          | Description                                                              |
| ------------- | ------------------------------------------------------------------------ |
| `list_docs`   | Lists all available documentation from aspire.dev                        |
| `search_docs` | Performs weighted lexical search across indexed aspire.dev documentation |
| `get_doc`     | Retrieves a specific document by its slug                                |

These tools index aspire.dev content using the `llms.txt` specification and provide weighted lexical search (titles 10x, summaries 8x, headings 6x, code 5x, body 1x). They work without a running AppHost.

> **CLI alternative (13.2+):** Docs are also accessible via CLI: `aspire docs search <query>`, `aspire docs get <slug>`, `aspire docs list`. These work without the MCP server running.

### Resource MCP tools (13.2+)

Some Aspire resources expose their own MCP tools when configured. For example, `WithPostgresMcp()` adds SQL query tools for a PostgreSQL resource.

These are **separate from** the Aspire MCP server tools above — resource MCP tools are tools exposed **by individual resources**, discoverable and callable through the CLI:

| CLI Command                                          | Description                                      |
| ---------------------------------------------------- | ------------------------------------------------ |
| `aspire mcp tools`                                   | List all available resource MCP tools             |
| `aspire mcp tools --format Json`                     | List with input schemas                           |
| `aspire mcp call <resource> <tool> --input <json>`   | Invoke a resource MCP tool                        |

```bash
# Example: discover and call resource MCP tools
aspire mcp tools
aspire mcp tools --format Json                                # includes input schemas
aspire mcp call mydb query-tool --input '{"sql":"SELECT 1"}'  # invoke a tool
```

To declare that a resource **already serves** an MCP endpoint (so it shows up in `aspire mcp tools`),
call `WithMcpServer(...)` on it — stable in 17.0 (no `ASPIREMCP001` suppression).

### Fallback for documentation (13.1 users)

If you are on Aspire CLI 13.1 and don't have `list_docs`/`search_docs`/`get_doc`, use **Context7** as a fallback for documentation queries. See the [SKILL.md documentation research section](../SKILL.md#1-researching-aspire-documentation) for details.

---

## Excluding Resources from MCP

Resources and associated telemetry can be excluded from MCP results by annotating the resource:

```csharp
var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddDotnetProject("apiservice", "../Api/Api.csproj")
    .ExcludeFromMcp();  // Hidden from MCP tools

builder.AddDotnetProject("webfrontend", "../Web/Web.csproj")
    .WithExternalHttpEndpoints()
    .WithReference(apiService);

builder.Build().Run();
```

---

## Supported AI Assistants

The `aspire agent init` (13.2+) / `aspire mcp init` (13.1) command supports:

- [VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) (GitHub Copilot)
- [Copilot CLI](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli#add-an-mcp-server)
- [Claude Code](https://docs.claude.com/en/docs/claude-code/mcp)
- [OpenCode](https://opencode.ai/docs/mcp-servers/)

The MCP server uses the **STDIO transport protocol** and may work with other agentic coding environments that support this protocol.

**VS Code extension tools (not MCP).** The Aspire VS Code extension also contributes language-model
tools to Copilot Chat: `aspire_apphost_start` / `aspire_apphost_stop` (see
[VS Code Lifecycle Tools](vscode-lifecycle.md)), `aspire_resource_debug` (attach the debugger to a
running .NET or Go resource — the user confirms first; extension v1.25.0+), and, from extension v1.24.0,
six editor-assistance tools: debug-session status, list the AppHosts VS Code runs, explain the latest
launch failure, check whether Hot Reload applies to a resource, open the dashboard, and open the Aspire
output channel. Their results are summaries — no raw logs, env vars, or dashboard login URLs.

---

## Usage Patterns

### Debugging with AI assistance (MCP)

Once MCP is configured, your AI assistant can:

1. **Inspect running state:**

   - "List all my Aspire resources and their status"
   - "Is the database healthy?"
   - "What port is the API running on?"

2. **Read logs:**

   - "Show me the recent logs from the ML service"
   - "Are there any errors in the worker logs?"

3. **View traces:**

   - "Show me the trace for the last failed request"
   - "What's the latency for API → Database calls?"

4. **Control resources:**

   - "Restart the API service"
   - "Stop the worker while I debug the queue"

5. **Search docs (13.2+):**
   - "Search the Aspire docs for Redis caching"
   - "How do I configure service discovery?"
   - _(Requires CLI 13.2+. On 13.1, use Context7 or `list_integrations`/`get_integration_docs` for integration-specific docs.)_

### Debugging with CLI (13.2+)

On 13.2+, many debugging operations can be done directly via CLI without MCP:

1. `aspire describe` — check resource status, endpoints, health
2. `aspire otel logs <resource>` — view structured logs
3. `aspire logs <resource>` — view console output
4. `aspire otel traces <resource>` — view distributed traces
5. `aspire otel logs --trace-id <id>` — logs for a specific trace
6. `aspire resource <resource> restart` — restart a service
7. `aspire doctor` — environment diagnostics

---

## Security Considerations

- The MCP server only exposes resources from the local AppHost
- No authentication is required (local development only)
- The STDIO transport only works for the AI tool that spawned the process
- **Do not expose the MCP endpoint to the network in production**

---

## Limitations

- AI models have limits on data processing. Large data fields (e.g., stack traces) may be truncated.
- Requests involving large collections of telemetry may be shortened by omitting older items.

---

## Troubleshooting

If you run into issues, check the [open MCP issues on GitHub](https://github.com/microsoft/aspire/issues?q=is%3Aissue+is%3Aopen+label%3Aarea-mcp).
`aspire doctor` checks the agent configuration (17.0 fixed an MCP doctor timeout on Windows).

## See Also

- [AI coding agents guide](https://aspire.dev/get-started/ai-coding-agents/)
- [Aspire skills setup](https://aspire.dev/get-started/aspire-skills/) and [microsoft/aspire-skills](https://github.com/microsoft/aspire-skills)
- [aspire agent init command](https://aspire.dev/reference/cli/commands/aspire-agent-init/)
- [aspire agent mcp command](https://aspire.dev/reference/cli/commands/aspire-agent-mcp/)
- [How I taught AI to read Aspire docs](https://davidpine.dev/posts/aspire-docs-mcp-tools/)
