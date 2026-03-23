# CLI Reference — Complete Command Reference

The Aspire CLI (`aspire`) is the primary interface for creating, running, and publishing distributed applications. It is cross-platform and installed standalone (not coupled to the .NET CLI, though `dotnet` commands also work).

**Tested against:** Aspire CLI 13.2.0

---

## Installation

```bash
# Linux / macOS
curl -sSL https://aspire.dev/install.sh | bash

# Windows PowerShell
irm https://aspire.dev/install.ps1 | iex

# Verify
aspire --version

# Update the CLI itself
aspire update --self
```

---

## Global Options

All commands support these options:

| Option                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `-d, --debug`         | Enable debug logging to the console            |
| `--non-interactive`   | Disable all interactive prompts and spinners   |
| `--wait-for-debugger` | Wait for a debugger to attach before executing |
| `-?, -h, --help`      | Show help and usage information                |
| `-v, --version`       | Show version information                       |

Many commands also support:

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `--format Json`       | Machine-readable JSON output (stdout); status messages go to stderr |
| `--apphost <path>`    | Target a specific AppHost project                            |

---

## Command Reference

### `aspire new`

Create a new project from a template.

```bash
aspire new [<template>] [options]

# Options:
#   -n, --name <name>        Project name
#   -o, --output <dir>       Output directory
#   -s, --source <source>    NuGet source for templates
#   -v, --version <version>  Version of templates to use
#   --channel <channel>      Channel (stable, daily)

# Examples:
aspire new aspire-starter
aspire new aspire-starter -n MyApp -o ./my-app
aspire new aspire-ts-cs-starter
aspire new aspire-py-starter
aspire new aspire-apphost-singlefile
```

Available templates:

- `aspire-starter` — ASP.NET Core/Blazor starter + AppHost + tests
- `aspire-ts-cs-starter` — ASP.NET Core/React + TypeScript AppHost
- `aspire-py-starter` — FastAPI/React + AppHost
- `aspire-apphost-singlefile` — Empty single-file AppHost

### `aspire init`

Initialize Aspire in an existing project or solution.

```bash
aspire init [options]

# Options:
#   -s, --source <source>    NuGet source for templates
#   -v, --version <version>  Version of templates to use
#   --channel <channel>      Channel (stable, daily)

# Example:
cd my-existing-solution
aspire init
```

Adds AppHost and ServiceDefaults projects to an existing solution. Interactive prompts guide you through selecting which projects to orchestrate.

### `aspire run`

Start all resources locally using the DCP (Developer Control Plane). Runs in the **foreground** — blocks the terminal.

> **13.2+ recommendation:** Use `aspire start` instead for background operation. The new generated skill states: "NEVER use `aspire run` at all" for agent/AI workflows.

```bash
aspire run [options] [-- <additional arguments>]

# Options:
#   --project <path>       Path to AppHost project file
#   --detach               Run in background (equivalent to `aspire start`) (13.2+)
#   --isolated             Randomized ports, isolated secrets (for worktrees) (13.2+)
#   --no-build             Skip build when artifacts already up-to-date (13.2+)

# Examples:
aspire run
aspire run --project ./src/MyApp.AppHost
aspire run --detach --isolated    # equivalent to: aspire start --isolated
```

Behavior:

1. Builds the AppHost project
2. Starts the DCP engine
3. Creates resources in dependency order (DAG)
4. Waits for health checks on gated resources
5. Opens the dashboard in the default browser
6. Streams logs to the terminal

Press `Ctrl+C` to gracefully stop all resources.

### `aspire start` (13.2+)

Start the AppHost in the **background**. Shorthand for `aspire run --detach`. Automatically stops any previously running instance.

```bash
aspire start [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --isolated             Isolated mode (separate ports, user secrets; for worktrees)
#   --format Json          Machine-readable output

# Examples:
aspire start
aspire start --isolated
aspire start --apphost ./src/MyApp.AppHost
```

Behavior:

1. Builds the AppHost project
2. If a previous instance is running, stops it first
3. Starts the DCP engine in the background
4. Returns immediately (non-blocking)

**This is the recommended command for 13.2+.** Relaunching is safe — just run `aspire start` again.

### `aspire stop` (13.2+)

Stop a background AppHost started with `aspire start`.

```bash
aspire stop [options]

# Options:
#   --apphost <path>       Path to AppHost project file

# Example:
aspire stop
```

### `aspire wait` (13.2+)

Block until a resource reaches the specified status.

```bash
aspire wait <resource> [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --status <status>      Target status: healthy, up, down (default: healthy)
#   --timeout <seconds>    Timeout in seconds

# Examples:
aspire start --isolated
aspire wait myapi
aspire wait mydb --timeout 60
```

### `aspire describe` / `aspire resources` (13.2+)

List resources and their status, endpoints, environment variables, and health.

```bash
aspire describe [options]
aspire resources [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --follow               Continuous streaming of resource state changes
#   --format Json          Machine-readable output

# Examples:
aspire describe
aspire describe --format Json
aspire describe --follow    # live updates (used by VS Code extension)
```

### `aspire resource` (13.2+)

Run a command on a specific resource, or control its lifecycle.

```bash
aspire resource <resource> <command> [options]

# Built-in commands:
#   start     Start a stopped resource
#   stop      Stop a running resource
#   restart   Restart a resource

# Options:
#   --apphost <path>       Path to AppHost project file

# Examples:
aspire resource myapi restart
aspire resource worker stop
aspire resource api rebuild    # custom command if defined
```

### `aspire logs` (13.2+)

View console logs (stdout/stderr) for a resource.

```bash
aspire logs [resource] [options]

# Options:
#   --apphost <path>       Path to AppHost project file

# Examples:
aspire logs             # all resources
aspire logs myapi       # specific resource
```

### `aspire otel` (13.2+)

View OpenTelemetry structured logs and distributed traces.

```bash
aspire otel logs [resource] [options]
aspire otel traces [resource] [options]
aspire otel logs --trace-id <id> [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --format Json          Machine-readable output

# Examples:
aspire otel logs myapi                   # structured logs for a resource
aspire otel traces myapi                 # distributed traces
aspire otel logs --trace-id abc123       # logs for a specific trace
```

### `aspire ps` (13.2+)

List running AppHosts.

```bash
aspire ps [options]

# Options:
#   --resources            Include resource details
#   --format Json          Machine-readable output

# Examples:
aspire ps
aspire ps --resources --format Json
```

### `aspire doctor` (13.2+)

Run comprehensive environment diagnostics.

```bash
aspire doctor

# Checks:
#   - HTTPS development certificate status
#   - Container runtime (Docker/Podman) availability
#   - .NET SDK installation
#   - WSL2 configuration (Windows)
#   - Agent configuration status
```

### `aspire docs` (13.2+)

Search and read Aspire documentation from the CLI.

```bash
aspire docs search <query> [options]
aspire docs get <slug> [options]
aspire docs list [options]

# Options:
#   --limit <n>            Limit search results
#   --section <name>       Get a specific section of a doc page
#   --format Json          Machine-readable output

# Examples:
aspire docs search "redis caching"
aspire docs search "service discovery" --limit 5
aspire docs get getting-started
aspire docs get getting-started --section "prerequisites"
aspire docs list
```

### `aspire export` (13.2+)

Capture telemetry and resource data into a zip file for sharing or analysis.

```bash
aspire export [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --resource <name>      Scope to a single resource

# Example:
aspire export
aspire export --resource myapi
```

### `aspire secret` (13.2+)

Manage AppHost user secrets without requiring the .NET CLI.

```bash
aspire secret set <key> <value> [options]
aspire secret list [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --format Json          Machine-readable output

# Examples:
aspire secret set "Parameters:ApiKey" "my-secret-key"
aspire secret list
aspire secret list --format Json
```

### `aspire certs` (13.2+)

Manage development certificates.

```bash
aspire certs clean     # Remove stale developer certificates
aspire certs trust     # Trust the current development certificate
```

### `aspire add`

Add a hosting integration to the AppHost.

```bash
aspire add [<integration>] [options]

# Options:
#   --project <path>         Target project file
#   -v, --version <version>  Version of integration to add
#   -s, --source <source>    NuGet source for integration

# Examples:
aspire add redis
aspire add postgresql
aspire add mongodb
```

> **TypeScript AppHosts (13.2+):** `aspire add` also generates TypeScript SDKs into `.modules/` when used with a TypeScript AppHost.

### `aspire restore` (13.2+)

Regenerate TypeScript SDKs for a TypeScript AppHost. Runs automatically on `aspire run`/`aspire start`, but can be triggered manually after upgrades or branch switches.

```bash
aspire restore [options]

# Options:
#   --apphost <path>       Path to AppHost project file

# Example:
aspire restore
```

### `aspire publish` (Preview)

Generate deployment manifests from the AppHost resource model.

```bash
aspire publish [options] [-- <additional arguments>]

# Options:
#   --project <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output directory (default: ./aspire-output)
#   --log-level <level>                Log level (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs

# Examples:
aspire publish
aspire publish --output-path ./deploy
aspire publish -e Staging
```

### `aspire config`

Manage Aspire configuration settings.

```bash
aspire config <subcommand>

# Subcommands:
#   get <key>              Get a configuration value
#   set <key> <value>      Set a configuration value
#   list                   List all configuration values (color-coded feature flags)
#   delete <key>           Delete a configuration value

# Examples:
aspire config list
aspire config set telemetry.enabled false
aspire config get telemetry.enabled
aspire config delete telemetry.enabled
```

### `aspire cache`

Manage disk cache for CLI operations.

```bash
aspire cache <subcommand>

# Subcommands:
#   clear                  Clear all cache entries

# Example:
aspire cache clear
```

### `aspire deploy` (Preview)

Deploy the contents of an Aspire apphost to its defined deployment targets.

```bash
aspire deploy [options] [-- <additional arguments>]

# Options:
#   --project <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output path for deployment artifacts
#   --log-level <level>                Log level (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs
#   --clear-cache                      Clear deployment cache for current environment

# Example:
aspire deploy --project ./src/MyApp.AppHost
```

### `aspire do` (Preview)

Execute a specific pipeline step and its dependencies.

```bash
aspire do <step> [options] [-- <additional arguments>]

# Options:
#   --project <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output path for artifacts
#   --log-level <level>                Log level (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs

# Example:
aspire do build-images --project ./src/MyApp.AppHost
```

### `aspire update` (Preview)

Update integrations in the Aspire project, or update the CLI itself.

```bash
aspire update [options]

# Options:
#   --project <path>       Path to AppHost project file
#   --self                 Update the Aspire CLI itself to the latest version
#   --channel <channel>    Channel to update to (stable, daily)

# Examples:
aspire update                          # Update project integrations
aspire update --self                   # Update the CLI itself
aspire update --self --channel daily   # Update CLI to daily build
```

### `aspire mcp`

MCP (Model Context Protocol) tools and server management.

```bash
aspire mcp <subcommand>

# 13.2+ subcommands:
#   tools                  List resource MCP tools
#   call <res> <tool>      Call a resource MCP tool

# 13.1 subcommands (replaced by `aspire agent` in 13.2):
#   init                   Initialize MCP configuration (use `aspire agent init` on 13.2+)
#   start                  Start the MCP server (use `aspire agent mcp` on 13.2+)
```

#### `aspire mcp tools` / `aspire mcp call` (13.2+)

Discover and invoke resource MCP tools. Some resources expose MCP tools when configured (e.g., `WithPostgresMcp()`).

```bash
aspire mcp tools [options]
aspire mcp call <resource> <tool> --input <json> [options]

# Options:
#   --format Json          Machine-readable output (includes input schemas)
#   --apphost <path>       Path to AppHost project file

# Examples:
aspire mcp tools
aspire mcp tools --format Json
aspire mcp call mydb query-tool --input '{"sql":"SELECT 1"}'
```

### `aspire agent`

Agent and AI assistant integration commands.

#### `aspire agent init` (13.2+, replaces `aspire mcp init`)

```bash
aspire agent init

# Interactive — detects your AI environment and creates config files + skill files.
# Supported environments:
# - VS Code (GitHub Copilot)
# - Copilot CLI
# - Claude Code
# - OpenCode

# On 13.1, use `aspire mcp init` instead.
```

Generates the appropriate configuration and skill files for your detected AI tool.
See [MCP Server](mcp-server.md) for details.

#### `aspire agent mcp` (13.2+, replaces `aspire mcp start`)

```bash
aspire agent mcp

# Starts the MCP server using STDIO transport.
# This is typically invoked by your AI tool, not run manually.
```

---

## Commands That Do NOT Exist

The following commands are **not valid**. Use alternatives:

| Invalid Command                    | Alternative                                                          |
| ---------------------------------- | -------------------------------------------------------------------- |
| `aspire build`                     | Use `dotnet build ./AppHost`                                         |
| `aspire test`                      | Use `dotnet test ./Tests`                                            |
| `aspire dev`                       | Use `aspire start` (13.2+) or `aspire run` (background/foreground)   |
| `aspire list`                      | Use `aspire new --help` for templates, `aspire add` for integrations |
| `aspire start` (on 13.1)          | Use `aspire run` (foreground only on 13.1)                           |
| `aspire describe` (on 13.1)       | Use MCP `list_resources` tool or dashboard                           |
| `aspire logs` (on 13.1)           | Use MCP `list_console_logs` tool or dashboard                        |

---

## .NET CLI equivalents

The `dotnet` CLI can perform some Aspire tasks:

| Aspire CLI                  | .NET CLI Equivalent              |
| --------------------------- | -------------------------------- |
| `aspire new aspire-starter` | `dotnet new aspire-starter`      |
| `aspire start` (13.2+)     | `dotnet run --project ./AppHost` (foreground only) |
| `aspire run`                | `dotnet run --project ./AppHost` |
| N/A                         | `dotnet build ./AppHost`         |
| N/A                         | `dotnet test ./Tests`            |

The Aspire CLI adds value with `start`, `stop`, `wait`, `describe`, `resource`, `logs`, `otel`, `ps`, `doctor`, `docs`, `export`, `secret`, `certs`, `publish`, `deploy`, `add`, `mcp`, `agent`, `config`, `cache`, `do`, `restore`, and `update` — commands that have no direct `dotnet` equivalent.
