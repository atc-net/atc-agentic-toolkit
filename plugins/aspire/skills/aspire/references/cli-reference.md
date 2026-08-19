# CLI Reference — Complete Command Reference

The Aspire CLI (`aspire`) is the primary interface for creating, running, and publishing distributed applications. It is cross-platform and installed standalone (not coupled to the .NET CLI, though `dotnet` commands also work).

**Tested against:** Aspire CLI 13.5 (commands verified against the 13.5.0 CLI)

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

Alternatively, on a machine with the .NET 10 SDK, install the CLI as a NativeAOT .NET global tool (13.3+):

```bash
dotnet tool install -g Aspire.Cli
```

Package-manager installs (13.4+; recommended acquisition path as of 13.5 — the update notifier detects npm installs and prints the matching npm command):

```bash
npm install -g @microsoft/aspire-cli          # npm
brew install --cask microsoft/aspire/aspire   # Homebrew
winget install Microsoft.Aspire               # Windows
nix profile add github:microsoft/aspire#aspire-cli   # Nix
```

> **CLI bundle (13.5):** new C# AppHost templates set `AspireUseCliBundle=true`, so the AppHost resolves its own copy of the CLI on the fly via `dnx` and `dotnet run` behaves like `aspire run`. Existing projects stay opt-in. Diagnostics: `ASPIRE009` (error — bundle can't be resolved), `ASPIRE010` (warning — project opted out), `ASPIRE011` (`dnx` unavailable). Force the DNX path with `AspireCliInvocationMode=Dnx`.

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

### Environment variables

| Variable                          | Effect                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| `ASPIRE_ENABLE_CONTAINER_TUNNEL`  | Container tunnel is enabled by default (13.3+) for uniform container connectivity across Docker Desktop, Docker Engine, and Podman. Set to `false` before starting the AppHost to disable it. |
| `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE` | (13.5+) Overrides the port range used for proxyless endpoints without an explicit public `port` (allocated during service preparation). Format `start-end`; default `10000-32767`. |

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
aspire new aspire-py-starter --use-redis-cache
aspire new aspire-empty
```

Available templates:

- `aspire-starter` — ASP.NET Core/Blazor starter + AppHost + tests (C# AppHost)
- `aspire-ts-cs-starter` — ASP.NET Core/React starter, **C# AppHost**
- `aspire-ts-starter` — Express/React starter, **TypeScript AppHost**
- `aspire-py-starter` — FastAPI/React starter, **TypeScript AppHost** (13.3+: moved off `dotnet new`, no .NET authoring needed — the .NET SDK is still required under the hood; supports `--use-redis-cache`, uses `addUvicornApp`)
- `aspire-empty` — Empty AppHost (choose language)
- `aspire-ts-empty` — Empty TypeScript AppHost

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
#   --apphost <path>       Path to AppHost project file
#   --detach               Run in background (equivalent to `aspire start`) (13.2+)
#   --isolated             Randomized ports, isolated secrets (for worktrees) (13.2+)
#   --no-build             Skip build when artifacts already up-to-date (13.2+)

# Examples:
aspire run
aspire run --apphost ./src/MyApp.AppHost
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
#   --all                  Stop all running AppHosts
#   --force                (13.5+) Also clean up the AppHost's persistent resources,
#                          permanently deleting their data without an extra confirmation prompt

# Examples:
aspire stop
aspire stop --force    # stop + delete persistent resource data (13.5+)
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
#   -f, --follow           Continuous streaming of resource state changes
#   --format Json          Machine-readable output
#   --include-hidden       Include hidden resources (filtered out by default since 13.3)

# Examples:
aspire describe
aspire describe --format Json
aspire describe --follow             # live updates (used by VS Code extension)
aspire describe --include-hidden     # show resources hidden by default
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
#   --include-hidden       Include hidden resources in the output

# Examples:
aspire resource myapi restart
aspire resource worker stop
aspire resource api rebuild    # custom command if defined
```

**User-defined command arguments (13.5+).** Custom commands can declare named arguments via
`CommandOptions.Arguments` in the AppHost. The dashboard prompts for them before running; the CLI
surfaces each as a `--<name>` option and errors when a required option is missing. Values are read
from `ExecuteCommandContext.Arguments` in the command callback (TypeScript: `ctx.arguments()`).

```bash
aspire resource api echo --message "hello"   # --message declared as a required argument
```

### `aspire logs` (13.2+)

View console logs (stdout/stderr) for a resource.

```bash
aspire logs [resource] [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   -f, --follow           Stream logs in real time
#   -n, --tail <n>         Show the last n lines
#   -t, --timestamps       Show a timestamp per line
#   --search <query>       Full-text filter on log content (13.4+; see https://aka.ms/aspire/cli-search)
#   --include-hidden       Include hidden resources

# Examples:
aspire logs             # all resources
aspire logs myapi       # specific resource
aspire logs --search "error"   # only lines matching the query (13.4+)
```

### `aspire otel` (13.2+)

View OpenTelemetry structured logs, distributed traces, and individual spans from the dashboard telemetry API.

```bash
aspire otel logs [resource] [options]
aspire otel traces [resource] [options]
aspire otel spans [resource] [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   -f, --follow           Stream telemetry in real time
#   --format <Table|Json>  Output format
#   -n, --limit <n>        Maximum number of items to return
#   --trace-id <id>        Filter by trace ID
#   --severity <level>     (logs) Minimum severity: Trace|Debug|Information|Warning|Error|Critical
#   --has-error <bool>     (spans) Show only / exclude error spans
#   --search <query>       Field-aware search (see syntax below)
#   --dashboard-url <url>  Query a standalone/remote dashboard instead of an AppHost
#   --api-key <key>        API key for a dashboard secured with ApiKey auth

# Examples:
aspire otel logs myapi                          # structured logs for a resource
aspire otel logs --severity Error --format Json # error logs as JSON
aspire otel traces myapi                        # distributed traces
aspire otel spans --has-error true              # only error spans
aspire otel logs --trace-id abc123              # logs for a specific trace
```

**`--search` syntax (13.4+).** Search, tail, and resource filters are applied **server-side before**
data streams to the CLI — prefer it over piping into `grep`. Full reference:
https://aspire.dev/reference/cli/search-filter/

| Syntax | Meaning |
|---|---|
| `word` | Free-text fragment — matches any searchable field |
| `"quoted phrase"` | A single fragment containing spaces |
| `field:value` | Field qualifier — value must match the named field |
| `-field:value` | Negated qualifier — excludes matches |
| `@attr:value` | Custom attribute qualifier (e.g. `@http.method:GET`) |
| `field:>N` `field:>=N` `field:<N` `field:<=N` | Numeric comparison (spans/traces, e.g. `duration:>100`) |

- **Structured-log fields:** `severity`, `resource`, `scope`, `message`, `trace-id`, `span-id`, `event`.
- **Span/trace fields:** `resource`, `name`, `span-id`, `trace-id`, `status`, `kind`, `duration`.

```bash
aspire otel logs --search "scope:Microsoft.EntityFrameworkCore severity:Warning"
aspire otel spans --search "@http.method:GET status:error duration:>100"
aspire otel traces --search "POST /orders -resource:cache"
```

`aspire logs` (console logs) also accepts `--search`, but only as free-text over the log line and resource name.

### `aspire terminal` (Experimental, 13.5+)

Attach to interactive terminal sessions on resources configured with the experimental
`WithTerminal()` API (`ASPIRETERMINAL001`) — drive REPLs, shells, and other terminal programs
running as Aspire resources.

```bash
# Opt in via feature flag first:
aspire config set features.terminalCommandsEnabled true

aspire terminal ps                    # list resources with active terminal sessions
aspire terminal attach <resource>     # attach to a resource's terminal session
```

The dashboard can also attach/detach from the same sessions in its terminal view.

### `aspire ps` (13.2+)

List running AppHosts. Since 13.3, the output also includes each AppHost's dashboard URL.

```bash
aspire ps [options]

# Options:
#   --format Json          Machine-readable output
#   -f, --follow           (13.5+) Keep running and emit updates as AppHosts change;
#                          JSON output is newline-delimited full snapshots

# Examples:
aspire ps
aspire ps --format Json
```

> **Breaking change (13.5):** `--resources` and `--include-hidden` were removed. `aspire ps` now
> focuses on AppHost-level summaries — use `aspire describe` (optionally with `--include-hidden`)
> for detailed resource data.

### `aspire ls` (13.4+)

List candidate AppHost project files in the workspace. This is about **discovering AppHosts on disk** — use `aspire ps` for *running* AppHosts.

```bash
aspire ls [options]

# Options:
#   --format <Json|Table>  Output format
#   --all                  Include all candidates, ignoring .gitignore and built-in filters
#   --stream               Emit discovered AppHosts as newline-delimited JSON (requires --format json)

# Example:
aspire ls
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
#   - Operating-system details, incl. Linux distro info from /etc/os-release (13.5+)
#   - Visual Studio Code detection (13.5+)
#   - DCP health checks (13.5+)
#
# JSON output includes a structured `operating-system` check for tooling (13.5+).
```

### `aspire dashboard run` (Preview, 13.3+)

Run the Aspire Dashboard in standalone mode — no AppHost required. Useful for viewing OTLP telemetry from any OpenTelemetry source.

```bash
aspire dashboard run [options]

# Example:
aspire dashboard run
```

> The dashboard is also available as a standalone container image — see [Dashboard](dashboard.md).

### `aspire docs` (13.2+)

Search and read Aspire documentation from the CLI.

```bash
aspire docs search <query> [options]
aspire docs get <slug> [options]
aspire docs list [options]

# API reference subcommands (13.3+):
aspire docs api search <query> [options]   # search the API reference
aspire docs api list <scope>               # list API entries under a parent scope
aspire docs api get <id>                    # get the markdown for an API item

# Options:
#   --limit <n>            Limit search results
#   --section <name>       Get a specific section of a doc page
#   --language <lang>      (docs api search) limit results to a language, e.g. csharp / typescript
#   --format Json          Machine-readable output

# Examples:
aspire docs search "redis caching"
aspire docs search "service discovery" --limit 5
aspire docs get getting-started
aspire docs get getting-started --section "prerequisites"
aspire docs list
aspire docs api search WithReference --language csharp
```

### `aspire export` (13.2+)

Capture telemetry and resource data into a **zip file** for sharing or offline analysis. The bundle
holds, per resource, the resource definition (state, endpoints, environment), console logs, structured
logs, and traces.

```bash
aspire export [resource] [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   -o, --output <path>    Output zip file path
#   --include-hidden       Include hidden resources
#   --dashboard-url <url>  Export from a standalone/remote dashboard
#   --api-key <key>        API key for a dashboard secured with ApiKey auth

# Examples:
aspire export                          # export everything
aspire export myapi                    # scope to one resource (positional argument)
aspire export -o ./diagnostics.zip
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
#   --apphost <path>         AppHost project file (or directory) to add the integration to
#   -v, --version <version>  Version of integration to add
#   -s, --source <source>    NuGet source for integration

# Examples:
aspire add redis
aspire add postgresql
aspire add mongodb
```

> **TypeScript AppHosts:** `aspire add` also generates TypeScript SDKs into `.aspire/modules/` when used with a TypeScript AppHost (TS AppHost is GA in 13.4).

### `aspire integration` (13.4+)

Discover and add hosting integrations. `aspire add` remains the shorthand for `aspire integration add`.

```bash
aspire integration list                # List available hosting integrations
aspire integration search <query>      # Search available hosting integrations
aspire integration add <integration>   # Add an integration (same as `aspire add`)

# Examples:
aspire integration list
aspire integration search postgres
aspire integration add redis
```

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
#   --apphost <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output directory (default: ./aspire-output)
#   --pipeline-log-level <level>       Pipeline log level (trace, debug, information, warning, error, critical)
#                                      (renamed from --log-level in 13.3; -l/--log-level still sets console output)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs
#   --list-steps                       List pipeline steps without running them

# Examples:
aspire publish
aspire publish --output-path ./deploy
aspire publish -e Staging
aspire publish --list-steps
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
#   --apphost <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output path for deployment artifacts
#   --pipeline-log-level <level>       Pipeline log level (trace, debug, information, warning, error, critical)
#                                      (renamed from --log-level in 13.3; -l/--log-level still sets console output)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs
#   --list-steps                       List pipeline steps without running them
#   --clear-cache                      Clear deployment cache for current environment

# Example:
aspire deploy --apphost ./src/MyApp.AppHost
```

### `aspire do` (Preview)

Execute a specific pipeline step and its dependencies.

```bash
aspire do <step> [options] [-- <additional arguments>]

# Options:
#   --apphost <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output path for artifacts
#   --pipeline-log-level <level>       Pipeline log level (trace, debug, information, warning, error, critical)
#                                      (renamed from --log-level in 13.3; -l/--log-level still sets console output)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs
#   --list-steps                       List pipeline steps without running them

# Examples:
aspire do build-images --apphost ./src/MyApp.AppHost
aspire do --list-steps                 # show pipeline steps without executing
```

### `aspire destroy` (Preview, 13.3+)

Tear down what `aspire deploy` provisioned. Works across Azure, Kubernetes, and Docker Compose targets.

```bash
aspire destroy [options] [-- <additional arguments>]

# Options:
#   --apphost <path>                   Path to AppHost project file
#   -o, --output-path <path>           Path containing the deployment artifacts to destroy
#   --pipeline-log-level <level>       Pipeline log level (trace, debug, information, warning, error, critical)
#   -e, --environment <env>            Environment (default: Production)
#   --list-steps                       List the steps without running them
#   -y, --yes                          Do not prompt for confirmation before destroying

# Examples:
aspire destroy
aspire destroy -e Staging -y
```

### `aspire update` (Preview)

Update integrations in the Aspire project, or update the CLI itself.

```bash
aspire update [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --self                 Update the Aspire CLI itself to the latest version
#   -y, --yes              Auto-confirm prompts (required for non-interactive use, 13.4+)
#   --migrate              (13.5+) Apply pending project migrations after updating packages
#                          (e.g. legacy TypeScript AppHost entry apphost.ts → apphost.mts)
#   --nuget-config-dir <dir>  Directory to create or update the NuGet.config file in (13.5+)
#   --channel <channel>    Channel to update to (stable, daily)

# Examples:
aspire update                          # Update project integrations
aspire update --self                   # Update the CLI itself
aspire update --self --channel daily   # Update CLI to daily build
aspire update -y                       # Non-interactive (CI)
aspire update --migrate                # Update + apply pending migrations (13.5+)
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
| `aspire list`                      | Use `aspire ls` (candidate AppHosts), `aspire integration list` (integrations), or `aspire new --help` (templates) |
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

The Aspire CLI adds value with `start`, `stop`, `wait`, `describe`, `resource`, `logs`, `otel`, `ps`, `ls`, `doctor`, `docs`, `export`, `secret`, `certs`, `publish`, `deploy`, `destroy`, `add`, `integration`, `mcp`, `agent`, `config`, `cache`, `do`, `restore`, and `update` — commands that have no direct `dotnet` equivalent.
