# CLI Reference — Complete Command Reference

The Aspire CLI (`aspire`) is the primary interface for creating, running, and publishing distributed applications. It is cross-platform and installed standalone (not coupled to the .NET CLI, though `dotnet` commands also work).

**Tested against:** Aspire CLI 17.0 (commands and flags verified against `--help` of the 17.0.0 CLI; 13.x differences are called out inline)

17.0 groups `aspire --help` into **App commands** (`add`, `init`, `integration`, `ls`, `new`, `ps`, `restore`, `run`, `start`, `stop`, `update`), **Resource management** (`resource`, `wait`), **Monitoring** (`dashboard`, `describe`, `export`, `logs`, `otel`, `terminal`, `tray`), **Deployment** (`deploy`, `destroy`, `do`, `publish`), and **Tools & configuration** (`agent`, `cache`, `certs`, `completions`, `config`, `docs`, `doctor`, `mcp`, `secret`, `template`).

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

> **CLI bundle (13.5):** new C# AppHost templates set `AspireUseCliBundle=true`, so the AppHost resolves its own copy of the CLI on the fly via `dnx` and `dotnet run` behaves like `aspire run`. Existing projects stay opt-in (preserve `AspireUseCliBundle` as you find it; add it only when the user opts in). **Agents still use `aspire start --non-interactive`** — the bundle doesn't make a foreground `dotnet run` suitable for agent workflows. Diagnostics: `ASPIRE009` (error — bundle can't be resolved), `ASPIRE010` (warning — project opted out), `ASPIRE011` (`dnx` unavailable). Force the DNX path with `AspireCliInvocationMode=Dnx`.
>
> **13.6:** `AspireCliInvocationMode` has two DNX modes — `Dnx` runs `Aspire.Cli` through DNX **without** a version and honors an in-scope `.config/dotnet-tools.json` tool manifest; `DnxPinned` runs the paired `Aspire.Cli` version and ignores the manifest. `aspire update` also updates repository-local CLI references in npm and .NET tool manifests.
>
> **17.0:** C# AppHosts **require** the CLI bundle — `ASPIRE013` (error) when it's missing; `ASPIRE010` is only a suppressible warning for non-C# AppHosts. Templates and `aspire init` no longer write `AspireUseCliBundle`. The CLI itself is retargeted to .NET 11 (NativeAOT — no runtime needed); `Aspire.Cli.<rid>` tool packages place the binary under `tools/any/<rid>/`.

**Update channels and qualities.** `aspire update --self --channel <stable|daily>` and `aspire new --channel` take a *channel*; the install scripts take a *quality*: `curl -sSL https://aspire.dev/install.sh | bash -s -- -q staging` (or `-q dev`) / `iex "& { $(irm https://aspire.dev/install.ps1) } -Quality staging"`. In a non-interactive shell `aspire update --self` needs `--channel` (it otherwise tries to prompt and fails).

**Shell completions (17.0+):** `aspire completions script <bash|fish|pwsh|zsh>` writes a completion script to stdout (e.g. `aspire completions script bash > aspire-completion.bash && source ./aspire-completion.bash`). Release installers register completions automatically; pass `--skip-completions` to the installer to opt out.

---

## Global Options

All commands support these options:

| Option                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `-l, --log-level <level>` | Minimum console log level (Trace, Debug, Information, Warning, Error, Critical) |
| `--non-interactive`   | Disable all interactive prompts and spinners   |
| `--nologo`            | Suppress the startup banner and telemetry notice |
| `--banner`            | Display the animated welcome banner            |
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
| `ASPIRE_ENVIRONMENT`              | AppHost environment name (selects `appsettings.{env}.json`) when nothing higher-priority is set. Precedence: `--environment`, `DOTNET_ENVIRONMENT`, `ASPIRE_ENVIRONMENT`, then `Production`. Doesn't flow to child resources or the dashboard. |
| `ASPIRE_CONTAINER_RUNTIME`        | `docker` (default) or `podman` — forces the container runtime instead of auto-detection (also for `aspire deploy` to Docker Compose). |
| `ASPIRE_DCP_USE_DEVELOPER_CERTIFICATE` | Default `true`: DCP's internal server uses the ASP.NET Core dev certificate. Set `false` to opt out (DCP generates an ephemeral certificate). |
| `ASPIRE_VERSION_CHECK_DISABLED`   | `true` skips the newer-version check on startup. |
| `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE` | (13.5+) Overrides the port range used for proxyless endpoints without an explicit public `port` (allocated during service preparation). Format `start-end`; default `10000-32767`. |
| `ASPIRE_CONTAINER_RUNTIME=wslc` | (17.0, Windows) Run containers under WSLc 3.0.4.0+. Publish/deploy have preliminary support; Docker Compose deployment is **not** supported. `aspire doctor` reports unsupported WSLc capabilities. |
| `ASPIRE_INIT_SOURCE_URL` / `_PATH` / `_REF` | (17.0) A Git repo (and optional config path and branch/full SHA) whose `aspire.config.json` `aspire new`/`aspire init` offer as a team configuration source. The CLI shows it and asks for consent; accepted sources copy `integrationSources` and `skillSources` into the local config and record a `configSource` binding. |
| `ASPIRE_CLI_TELEMETRY_OPTOUT` | (17.0) `true` opts out of CLI product telemetry (now exported to Azure Monitor). |
| `ASPIRE_DASHBOARD_TELEMETRY_OPTOUT` | (17.0) `true` opts the dashboard out of product telemetry (no longer follows IDE consent). Generated Compose/Helm dashboards set it by default. |

### `aspire.config.json` keys (17.0 additions)

| Key | Purpose |
|---|---|
| `integrationSources.<name>` | `{ "source": "<NuGet v3 index URL>", "patterns": ["Team.Hosting.*"] }` — extra feeds for `aspire add`, `aspire integration list/search`, and MCP discovery. `integrationSources.default.enabled: false` disables the built-in feed. |
| `skillSources.<name>` | `{ "repository", "marketplace", "plugins" }` (OpenCode uses catalog URLs) — skill plugins `aspire agent init` registers. Replaces the single built-in `microsoft/aspire-skills` source; the CLI shows each enabled source with a trust warning before the picker. |
| `configSource` | Binding written when a team config source is accepted; refresh with `aspire update --config-source`. |
| `features.appHostServerV2` | `true` opts into the preview AppHost Server v2 bundled in the CLI. |
| `experimentalPolyglotJava` / `…Python` / `…Rust` | Flat polyglot feature keys (were `experimentalPolyglot:java` etc.). Go needs no key. |
| `sdk.version`, `packages` | Polyglot AppHosts: the Aspire SDK version and a `{ "Aspire.Hosting.X": "17.0.0" }` package map (`aspire add` / `aspire update` maintain it). |
| `containerTunnel.baseImage` | Mirrored/custom container tunnel base image (`aspire config set containerTunnel.baseImage <image>`). |

`aspire config set` is array-aware in 17.0: `key[0]` edits an element, the next index appends.

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
#   --version <version>      Version of templates to use
#   --channel <channel>      Channel (stable, daily)
#   --language <language>    AppHost language
#   --template-path <dir>    (17.0+) Unpacked .NET template package directory (repo-relative with
#                            --template-repository)
#   --template-repository <url>      (17.0+) Clone a Git repo containing templates
#   --template-repository-ref <ref>  (17.0+) Branch, tag, or full commit SHA (default: remote HEAD)
#   --use-config-source[=false]      (17.0+) Accept/decline a proposed Git configuration source
#   --suppress-agent-init    Skip AI agent environment configuration after creation
#   --agents <list>          (17.0+) copilot,claude,opencode | all | none (default: detected agents, else Copilot)
#   --scope <project|global> (17.0+) Configuration and skill scope (default: project)
#   --skills <list>          aspire,playwright-cli,dotnet-inspect | all | none (17.0 default: aspire;
#                            dotnet-inspect needs a C# AppHost)
#   --remove-skill-copies    (17.0+) Delete stale copied Aspire skill folders without asking (destructive)
#   --skill-locations <list> (13.6 and earlier) standard,claudecode,github,opencode | all | none

# Examples:
# Agents: always add --non-interactive --suppress-agent-init (this toolkit already provides the skill + MCP)
aspire new aspire-starter -n MyApp -o ./my-app --non-interactive --suppress-agent-init
aspire new aspire-ts-cs-starter -n MyApp -o ./my-app --non-interactive --suppress-agent-init
aspire new aspire-py-starter -n MyApp -o ./my-app --use-redis-cache --non-interactive --suppress-agent-init
aspire new aspire-go-starter -n aspire-app -o aspire-app --non-interactive --suppress-agent-init   # 17.0+
aspire new aspire-empty -n MyApp -o ./my-app --non-interactive --suppress-agent-init
aspire new --template-repository https://github.com/contoso/aspire-templates --template-path templates/api --suppress-agent-init   # 17.0+
```

Available templates:

- `aspire-starter` — ASP.NET Core/Blazor starter + AppHost + tests (C# AppHost)
- `aspire-ts-cs-starter` — ASP.NET Core/React starter, **C# AppHost**
- `aspire-ts-starter` — Express/React starter, **TypeScript AppHost**
- `aspire-py-starter` — FastAPI/React starter, **TypeScript AppHost** (13.3+: moved off `dotnet new`, no .NET authoring needed — the .NET SDK is still required under the hood; supports `--use-redis-cache`, uses `addUvicornApp`)
- `aspire-go-starter` — Go API/React starter, **Go AppHost** (17.0+, preview)
- `aspire-empty` — Empty AppHost (choose language)
- `aspire-ts-empty` — Empty TypeScript AppHost
- `aspire-go-empty` — Empty Go AppHost (17.0+, preview)

17.0 C# templates generate `<Project Sdk="Microsoft.NET.Sdk">` with `Aspire.Hosting.AppHost` and
`Aspire.Hosting.Dotnet` package references and `AddDotnetProject(...)` calls — no `Aspire.AppHost.Sdk`,
no `ProjectReference`s, no `AspireUseCliBundle`.

### `aspire template source` (17.0+)

Manage global template sources searched by `aspire new` (stored in global settings).

```bash
aspire template source add <name> --repository <https-or-ssh-url> [--path <dir>] [--ref <ref>] [-y]
aspire template source add <name> --path <absolute-local-dir>
aspire template source list
```

`add` asks you to trust the source (default **No**); `-y/--yes` skips the prompt — use it only when the
user has said to trust that source. Sources may set `displayName`; interactive `aspire new` groups
their templates under headings.

### `aspire init`

Initialize Aspire in an existing project or solution.

```bash
aspire init [options]

# Options:
#   --language <language>    AppHost language (csharp, typescript, go — go 17.0+)
#   --file-based             (13.6+) Create apphost.cs in the current directory, skipping
#                            .NET solution discovery. Requires C#.
#   --use-config-source[=false]  (17.0+) Accept/decline a proposed Git configuration source
#   --suppress-agent-init    Skip AI agent environment configuration
#   --agents / --scope / --skills / --remove-skill-copies   (17.0+) same as `aspire new`
#   --skill-locations <list> (13.6 and earlier) standard,claudecode,github,opencode | all | none

# Examples:
cd my-existing-solution
aspire init --language csharp --non-interactive --suppress-agent-init
aspire init --language csharp --file-based --non-interactive --suppress-agent-init   # file-based apphost.cs (13.6+)
mkdir apphost && cd apphost && aspire init --language go --non-interactive --suppress-agent-init   # 17.0+
```

Scaffolds a **minimal AppHost skeleton + `aspire.config.json`** (and, unless `--suppress-agent-init`,
sets up Microsoft's agent skills — agents using this toolkit pass `--suppress-agent-init` and then wire
the services themselves with [Wiring](wiring.md)). It does not modify existing projects, `global.json`,
or dev-cert trust. What it creates depends on the repo:

- `.sln`/`.slnx` present + C# → a project-based AppHost added to the solution (17.0: `Microsoft.NET.Sdk` +
  `Aspire.Hosting.AppHost`/`Aspire.Hosting.Dotnet` packages and `AddDotnetProject`; 13.x: `Aspire.AppHost.Sdk`
  with `ProjectReference`s);
- C# `--file-based` (or chosen interactively) → `apphost.cs` with `#:package Aspire.Hosting.AppHost@<version>`
  directives (13.x: `#:sdk Aspire.AppHost.Sdk@<version>`), plus `apphost.run.json`;
- TypeScript → `apphost.mts` + `.aspire/modules/` + `tsconfig.apphost.json`; if the root already has a
  `package.json`, the AppHost becomes a nested `aspire-apphost/` package. 17.0 also adds the language's
  default hosting package (JavaScript), so `addViteApp` works without `aspire add`;
- Go (17.0+) → `apphost.go`, `go.mod` (`replace … => ./.aspire/modules`), `.gitignore` (ignores `.aspire/`),
  and `aspire.config.json` with `Aspire.Hosting.Go` in `packages`. It writes into the current directory and
  stops if a `go.mod` already exists — run it from a subdirectory such as `apphost/`. The language is the
  *AppHost* language, not the services' language. Needs Go 1.26+ (`gofmt` on `PATH`).

Agent rules: **don't run `aspire init` when an AppHost already exists** (any detection signal in
[SKILL.md](../SKILL.md)); pass `--language` when using `--non-interactive`; afterwards resolve
`appHost.path` relative to `aspire.config.json` instead of assuming the AppHost is at the root.
`--source` / `--version` are deprecated no-ops on `init`, and `init` has no `--channel`.

> **13.6:** `aspire new` and `aspire init` preselect repository-local skills (including `aspireify`); MCP is **unselected by default**.
>
> **17.0:** `aspire new`, `aspire init`, and `aspire agent init` share one agent/scope picker and register Microsoft's `aspire@aspire-skills` plugin instead of copying skills; selecting no agents (`--agents none`) writes nothing. **With this toolkit, pass `--suppress-agent-init`** — the toolkit's `aspire` skill and MCP server are already installed. Never add `--mcp` to `aspire new`/`aspire init`.

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
#   -lp, --launch-profile <name>  (13.6+) .NET launch profile to use when starting the AppHost
#   --format <Json|Table>  Output format for detached results

# Examples:
aspire run
aspire run --apphost ./src/MyApp.AppHost
aspire run --launch-profile Development  # (13.6+)
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
#   --no-build             Skip build/restore
#   -lp, --launch-profile <name>  (13.6+) .NET launch profile to use when starting the AppHost
#   --format Json          Machine-readable output

# Examples:
aspire start
aspire start --isolated
aspire start -lp Development           # (13.6+)
aspire start --apphost ./src/MyApp.AppHost
```

Behavior:

1. Builds the AppHost project
2. If a previous instance is running, stops it first
3. Starts the DCP engine in the background
4. Returns immediately (non-blocking)

**This is the recommended command for 13.2+.** Relaunching restarts the whole AppHost (the previous
instance is stopped automatically) — do that when the **AppHost** changed, and repeat `--isolated` in
worktrees. For a single changed resource use `aspire resource <resource> rebuild|restart` instead.

> **Launch profiles (13.6):** `--launch-profile`/`-lp` flows through direct AppHost launches, detached child processes, and VS Code delegation. When the CLI can't safely reproduce a .NET launch profile it delegates to `dotnet run`.

### `aspire stop` (13.2+)

Stop a background AppHost started with `aspire start`.

```bash
aspire stop [options]          # no --format option — use the exit code

# Options:
#   --apphost <path>       Path to AppHost project file
#   --all                  Stop all running AppHosts
#   --force                (13.5+) Stop and clean up the AppHost's persistent resources;
#                          13.6: volumes are PRESERVED by default
#   --volumes              (13.6+) Also remove Aspire-owned named volumes (requires --force);
#                          anonymous volumes and bind mounts are never removed
#   --pid <pid>            (17.0+) Stop only the AppHost with this process ID (from `aspire ps`;
#                          not the CLI's PID). With --apphost the path must match too.
#                          Can't be combined with --all or --force.

# Examples:
aspire stop --apphost ./src/MyApp.AppHost
aspire stop --apphost ./src/MyApp.AppHost --pid 41236   # one exact instance (17.0+)
aspire stop --force --apphost <path>             # stop + clean up persistent resources, keep volumes (13.6)
aspire stop --force --volumes --apphost <path>   # ...and delete Aspire-owned named volumes (13.6+)
```

> `--force` is not a "stronger stop": it removes persistent resource instances without another
> prompt, and `--volumes` deletes data. Get explicit approval, always pass `--apphost`, and never
> combine `--force` with `--all`.

### `aspire wait` (13.2+)

Block until a resource reaches the specified status.

```bash
aspire wait <resource> [options]

# Options:
#   --apphost <path>       Path to AppHost project file
#   --status <status>      Target status: healthy, up, down (default: healthy)
#   --timeout <seconds>    Timeout in seconds (default 120)
#
# Exit codes: 13.6 returns 18 when the resource reaches FailedToStart — even when
# waiting for `--status down`.

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
#   --format <Json|Mermaid|Table>  Machine-readable output; Mermaid (17.0+) = resource graph
#                                  (can't be combined with --follow)
#   --include-hidden       Include hidden resources (filtered out by default since 13.3)

# Examples:
aspire describe
aspire describe api                  # one resource
aspire describe --format Json
aspire describe --format Mermaid > resources.mmd   # 17.0+
aspire describe --follow             # live updates (used by VS Code extension)
aspire describe --include-hidden     # show resources hidden by default
```

> **13.6:** `describe` redacts secret environment variables, and `describe --follow` emits the current state immediately before streaming changes.
>
> **17.0:** the table's `Type` column shows friendly labels (`Redis`, `PostgreSQL Server`), and finished resources show their exit code (nonzero in red).

### `aspire resource` (13.2+)

Run a command on a specific resource, or control its lifecycle.

```bash
aspire resource <resource> <command> [options] [-- <command-options>]

# Built-in commands:
#   start     Start a stopped resource
#   stop      Stop a running resource
#   restart   Restart a resource
#   rebuild   Rebuild a C# project resource (its own build, not the whole AppHost)
# Discover a resource's commands (queries the running AppHost):
#   aspire resource <resource> --help
#   aspire resource <resource> <command> --help

# Options:
#   --apphost <path>       Path to AppHost project file
#   --include-hidden       Include hidden resources in the output

# Examples:
aspire resource myapi restart
aspire resource worker stop
aspire resource api rebuild
aspire resource api mycmd --apphost ./AppHost.cs -- --apphost value   # args after `--` go to the command
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

### `aspire terminal` (13.5+; no feature flag since 13.6)

Attach to interactive terminal sessions on resources configured with `WithTerminal()` (experimental
`ASPIRETERMINAL001` until 13.6; no suppression in 17.0), database/cache REPLs from `WithRepl()`, or
AppHost-owned terminals created through `TerminalService` — drive REPLs, shells, and other terminal programs.

> **17.0:** `attach` and `tape play` resolve an exact resource *instance* ID; the legacy `--replica`/`-r`
> option is hidden but still works. In the dashboard, terminals moved to a dedicated Terminals page
> (`E` shortcut; backtick opens the dock).

```bash
aspire terminal ps [--format Json] [-v]   # list resource-owned AND AppHost-owned terminals (13.6)
aspire terminal attach <resource>         # attach the local terminal to a resource's PTY session
aspire terminal tape play <resource> --tape-file <path.tape> [-r <replica>] [--timeout <s>]
                                          # (13.6) play a VHS tape against a running resource
                                          # terminal and print its final screen (timeout default 120s;
                                          # -r required for replicated resources when non-interactive)
```

> **Changed in 13.6:** the `features.terminalCommandsEnabled` flag no longer exists — the
> command group is always available. The AppHost still needs the `terminals.v1` capability. In 13.x
> the hosting APIs are experimental (`ASPIRETERMINAL001`); 17.0 drops it for `WithTerminal`/`TerminalOptions`
> but keeps it for `TerminalService` and terminal automation.

The dashboard can also attach/detach from the same sessions in its terminal dock.

### `aspire ps` (13.2+)

List running AppHosts. Since 13.3, the output also includes each AppHost's dashboard URL.

```bash
aspire ps [options]

# Options:
#   --format Json          Machine-readable output
#   -f, --follow           (13.5+) Keep running and emit updates as AppHosts change;
#                          JSON output is newline-delimited changed AppHost records
#   --output <Default|Snapshot>  Snapshot = full AppHost snapshots with resource health,
#                          heartbeats, and errors (requires --follow --format json)

# Examples:
aspire ps
aspire ps --format Json
aspire ps --follow --format json --output snapshot
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
aspire doctor [--format Json]

# Checks:
#   - HTTPS development certificate status
#   - Container runtime (Docker/Podman) availability
#   - .NET SDK installation
#   - WSL2 configuration (Windows)
#   - Agent configuration status
#   - Operating-system details, incl. Linux distro info from /etc/os-release (13.5+)
#   - Visual Studio Code detection (13.5+)
#   - DCP health checks (13.5+)
#   - Go toolchain version for Go AppHosts — Go 1.26+ (17.0+)
#   - Only the *configured* container runtime; auto-detect lists Docker, Podman, WSLc (17.0+)
#   - Stale copied Aspire skill folders that would shadow the skills plugin (17.0+)
#
# JSON output includes a structured `operating-system` check for tooling (13.5+).
```

> **17.0:** `doctor` warns about copied Aspire skill folders (from 13.x `aspire agent init`) and suggests
> `aspire agent init --skills aspire`. With this toolkit, don't follow that suggestion on your own — it
> installs Microsoft's skills plugin. Tell the user the copies are stale and that this toolkit's skill
> takes precedence; delete the folders only if they ask.

### `aspire dashboard run` (Preview, 13.3+)

Run the Aspire Dashboard in standalone mode — no AppHost required. Useful for viewing OTLP telemetry from any OpenTelemetry source.

```bash
aspire dashboard run [options]

# Options:
#   --frontend-url <url>         HTTP endpoint(s) serving the dashboard frontend
#   --otlp-grpc-url <url>        OTLP/gRPC endpoint
#   --otlp-http-url <url>        OTLP/HTTP endpoint
#   --allow-anonymous            Allow anonymous access
#   --application-name <name>    (13.6+) Display name; also scopes persisted dashboard data
#   --persistence <mode>         (13.6+) None | Run | Resume (standalone default: None)
#   --config-file-path <path>    JSON configuration file

# Examples:
aspire dashboard run
aspire dashboard run --application-name my-app --persistence Resume   # (13.6+)
```

> **It blocks** until stopped. Agents should run it in the background, capture the login URL (with its
> `t=` token) from the first output lines, and never wait for the command to finish.
>
> **13.6:** the standalone dashboard is a Native AOT executable (no managed wrapper). AppHost-started dashboards default to `Run` persistence (SQLite, last 10 runs kept read-only); see [Dashboard](dashboard.md).

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
#   --language <lang>      (docs api list/search/get) csharp / typescript / go (go 17.0+)
#   --format Json          Machine-readable output

# Examples:
aspire docs search "redis caching"
aspire docs search "service discovery" --limit 5
aspire docs get getting-started
aspire docs get getting-started --section "prerequisites"
aspire docs list
aspire docs api search WithReference --language csharp
aspire docs api search AsOptional --language go          # 17.0+
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

Manage AppHost secrets without requiring the .NET CLI.

```bash
aspire secret set <key> [<value>] [options]   # omit <value> for a masked prompt (17.0+)
aspire secret get <key> [options]             # 17.0+
aspire secret list [options]
aspire secret delete <key> [options]          # 17.0+
aspire secret path [options]                  # 17.0+ — print the store path

# Options:
#   --apphost <path>             Path to AppHost project file or directory (run from the AppHost dir)
#   -e, --environment <name>     (17.0+) Environment whose secrets file is used (case-insensitive;
#                                default Development)
#   --envvar <NAME>              (17.0+, set) Read the value from an environment variable
#   --format Json                Machine-readable output (list)

# Examples:
aspire secret set "Parameters:ApiKey" "my-secret-key"
aspire secret set Parameters:database-password --environment production --envvar DATABASE_PASSWORD
aspire secret list
aspire secret list --format Json
```

> **17.0 (breaking):** secrets are stored per AppHost and environment in
> `~/.aspire/secrets/<apphost-id>/<environment>.json` instead of .NET user secrets (existing Development
> user secrets are imported). Non-interactive `set` must get a value or `--envvar`. Prefer `--envvar` in
> agent and CI runs so the value never appears in the command line or shell history. Secrets are local
> only — for CI deploys set `Parameters__<name>` env vars on the deploy process instead. `list` shows
> names; never print secret values back to the user.

### `aspire certs` (13.2+)

Manage development certificates.

```bash
aspire certs clean     # Remove stale developer certificates
aspire certs trust     # Trust the current development certificate
```

> **Linux (13.6):** certificate trust also covers Firefox NSS databases. For non-default profile locations set the `certificates.nssDbPaths` configuration value.

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

Generate deployment artifacts from the AppHost resource model. The **target comes from the
environment resource(s) in the AppHost** (`AddDockerComposeEnvironment`, `AddKubernetesEnvironment`,
`AddAzureContainerAppEnvironment`, …) — there is no `-p`/`--publisher` option. See [Deployment](deployment.md).

```bash
aspire publish [options] [-- <additional arguments>]

# Options:
#   --apphost <path>                   Path to AppHost project file
#   -o, --output-path <path>           Output directory (default: ./aspire-output)
#   --pipeline-log-level <level>       Pipeline log level (trace, debug, information, warning, error, critical)
#                                      (renamed from --log-level in 13.3; -l/--log-level still sets console output)
#   -e, --environment <env>            Environment (default: Production)
#   --include-exception-details        Include stack traces in pipeline logs
#   --no-build                         Don't build or restore the AppHost first
#   --list-steps                       List pipeline steps without running them

# Examples:
aspire publish
aspire publish --output-path ./deploy
aspire publish -e Staging
aspire publish --list-steps
```

### `aspire sdk export` (13.6+, hidden from `aspire --help`)

Emit a deterministic, canonical TypeScript API reference for an Aspire hosting package as JSON — the
same projection the TypeScript code generator uses (optional parameters, promises, DTOs, enums).
Useful for confirming exact polyglot method signatures before generating AppHost code.

```bash
aspire sdk export --language <language> [options] > api.json

# Options:
#   --language <language>        (required) Target language: typescript, or go (17.0+)
#                                (its -l short alias collides with the global -l/--log-level — use the long form)
#   -p, --package <Name@Version> Package to export (default: Aspire.Hosting at the CLI's SDK version)

# Examples:
aspire sdk export --language typescript --package Aspire.Hosting.Redis@13.6.0
aspire sdk export --language typescript --package Aspire.Hosting.Java@13.6.0-preview.1.26479.8
aspire sdk export --language go --package Aspire.Hosting.Redis@17.0.0   # 17.0+
```

> Observed on 13.6.0: exporting the default `Aspire.Hosting` package failed with "No managed
> assemblies for package 'Aspire.Hosting' ... could be mapped", while integration packages exported
> fine. If it happens, fall back to integration packages or `aspire docs api`.

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
aspire config list --all            # also lists available feature flags
aspire config set telemetry.enabled false
aspire config get telemetry.enabled
aspire config delete telemetry.enabled
```

Feature flags on 13.6 (`aspire config set features.<name> true|false [--global]`):

| Flag | Default | Effect |
|---|---|---|
| `defaultWatchEnabled` | `false` | AppHost-level watch: restarts the app after AppHost (and C# project) changes. Not per-resource hot reload. |
| `experimentalPolyglot:go` / `:java` / `:python` / `:rust` | `false` | Experimental AppHost language support beyond C#/TypeScript |
| `showAllTemplates` | `false` | Show experimental templates in `aspire new` / `aspire init` |
| `showDeprecatedPackages` | `false` | Show deprecated packages in `aspire add` search |
| `stagingChannelEnabled` | `false` | Allow the staging channel |
| `polyglotIntegrationFilterEnabled` | `false` | (Experimental) restrict `aspire add` in non-C# AppHosts to `polyglot`-tagged packages — only useful against a local feed |
| `nugetSignatureVerificationEnabled` | `true` | Default `DOTNET_NUGET_SIGNATURE_VERIFICATION` for NuGet operations |
| `updateNotificationsEnabled` | `true` | CLI update notifications |

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
#   --no-build                         Don't build or restore the AppHost first
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
#   --no-build                         Don't build or restore the AppHost first
#   --list-steps                       List pipeline steps without running them

# Examples:
aspire do --list-steps                 # show step names (they depend on the AppHost's environments)
aspire do build --apphost ./src/MyApp.AppHost
aspire do push --environment staging
aspire do prepare-compose --environment staging   # prepare-<environment-resource-name>
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
#   --include-exception-details        Include stack traces in pipeline logs
#   --no-build                         Don't build or restore the AppHost first
#   --list-steps                       List the steps without running them
#   --format <Json|Table>              Output format
#   -y, --yes                          Do not prompt for confirmation before destroying

# Examples:
aspire destroy
aspire destroy -e Staging -y
```

> **17.0:** `destroy` rejects unknown options and positional arguments instead of ignoring them.

### `aspire update` (Preview)

Update integrations in the Aspire project, repository-local CLI references (13.6: npm and `.config/dotnet-tools.json` manifests), or the CLI itself. Self-update is channel-aware (13.6) — it preserves the channel the CLI was acquired from.

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
#   --config-source        (17.0+) Re-apply allowed settings from the saved Git configuration source
#                          (replaces local edits to those settings; doesn't update packages or the CLI)
#   --use-config-source[=false]  (17.0+) Accept/decline a proposed configuration source

# Examples:
aspire update                          # Update project integrations
aspire update --self                   # Update the CLI itself
aspire update --self --channel stable --non-interactive --yes   # agent/CI self-update (needs --channel)
aspire update --self --channel daily   # Update CLI to daily build
aspire update -y                       # Non-interactive (CI)
aspire update --migrate                # Update + apply pending migrations (13.5+)
aspire update --config-source          # Refresh team defaults (17.0+)
```

> **17.0:** `aspire update` does **not** move a C# AppHost off the obsolete `Aspire.AppHost.Sdk`;
> `--migrate` reports that the manual `ASPIRE012` steps are needed. The version-skew warning now appears
> only when the CLI is older than the AppHost SDK.

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
aspire agent init --mcp            # (13.6+) also configure the Aspire MCP server
aspire agent init --agents claude --scope project --skills aspire --non-interactive   # 17.0+

# Options (17.0):
#   --workspace-root <path>    Workspace root directory
#   --agents <list>            copilot,claude,opencode | all | none (default: detected agents,
#                              else Copilot). Selecting none writes nothing.
#   --scope <project|global>   Configuration and skill scope (default: project)
#   --skills <list>            aspire,playwright-cli,dotnet-inspect | all | none (default: aspire;
#                              dotnet-inspect needs a C# AppHost)
#   --remove-skill-copies      Delete copied Aspire skill folders (incl. local edits) without asking,
#                              when the plugin replaces them at the selected scope. Destructive.
#   --mcp                      (13.6+) Configure the MCP server; omit = leave MCP unconfigured,
#                              --mcp=false = explicit opt-out
#
# 13.6 and earlier also had:
#   --skill-locations <list>   standard,claudecode,github,opencode | all | none   (removed in 17.0)
#   --aspire-source <...>      embedded skills bundle source                     (removed in 17.0)

# On 13.1, use `aspire mcp init` instead.
```

**17.0 model:** instead of copying skill files into the repo, `agent init` registers Microsoft's skills
plugin (`aspire@aspire-skills` from `microsoft/aspire-skills`, or the sources in `skillSources`) with
each selected agent's own plugin/marketplace system — GitHub Copilot (incl. AppImage installs), Claude
Code, and OpenCode (skill catalogs). Updates then arrive through the agent's plugin updates, not a new
CLI bundle; re-running `agent init` doesn't move a pinned version. After it runs, **reload the agent**;
a missing `.agents/skills/aspire/SKILL.md` is expected. Older copied skills are removed only when the
plugin replaces them (or reported by `aspire doctor`). Enabled skill sources are listed with trust
warnings above the picker. `--non-interactive` now works with multiple AppHosts in the workspace.

> **With this toolkit:** you don't need `aspire agent init` — the toolkit's `aspire` plugin provides the
> skill and the Aspire MCP server (`aspire agent mcp` in its `.mcp.json`). Run it only when the user asks
> (e.g. to set up a teammate's agent), and then say that it installs Microsoft's plugin alongside the toolkit.

> **Changed in 13.6:** `aspire agent init` defaults to **skills only, without MCP**. Interactive standalone setup offers MCP as an opt-in; pass `--mcp` in scripts. GitHub Copilot is detected even without the standalone Copilot CLI on `PATH`.
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
| `aspire agent init --skill-locations` / `--aspire-source` (on 17.0) | Use `--agents` / `--scope` / `--skills`                  |
| `go run .` for a Go AppHost        | Use `aspire start` / `aspire run`                                    |
| `dotnet run --operation publish` (17.0) | Use `aspire publish` (now fails fast)                           |

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

The Aspire CLI adds value with `start`, `stop`, `wait`, `describe`, `resource`, `logs`, `otel`, `ps`, `ls`, `doctor`, `docs`, `export`, `secret`, `certs`, `publish`, `deploy`, `destroy`, `add`, `integration`, `mcp`, `agent`, `config`, `cache`, `do`, `restore`, `update`, and (17.0) `template`, `completions`, and `tray` — commands that have no direct `dotnet` equivalent.

### `aspire tray` (17.0+, Preview)

Manage the **tray companion** — a desktop icon and panel for your local AppHosts, so you don't have to
keep re-running `aspire ps`.

```bash
aspire tray start   # start the tray companion, or restore its icon if it's already running
aspire tray stop    # stop the tray — running AppHosts are NOT stopped
```

Only the global options apply (`--non-interactive`, `-l/--log-level`, `--nologo`, …).

**What it does:** discovers local AppHosts and shows their aggregate resource health (colored dots;
gray square = stopped; "No resources" when nothing is visible), lets you open the dashboard, start
AppHosts, stop an *exact* instance, and manage pinned favorites and history. `tray start` doesn't
change desktop configuration or register itself for login startup. On Linux, `tray stop` cancels any
open tray dialogs without confirming their actions or saving settings.

**Where it runs:**

| Platform | Surface | Requirements |
|---|---|---|
| macOS | Menu bar icon | Native CLI install |
| Windows | Notification area icon | Native CLI install |
| Linux (glibc x64/ARM64) | StatusNotifierItem icon; GNOME renders the D-Bus menu via an AppIndicator extension, other desktops get an Aspire-owned panel | Graphical session, GTK 3, a StatusNotifierItem host (e.g. Waybar's tray module); GNOME: an AppIndicator library + enabled extension; non-GNOME Wayland: `libgtk-layer-shell.so.0` + a layer-shell compositor; non-GNOME X11: a compositing manager |

Not supported: headless sessions, musl-based distros, managed development builds, or running through
.NET CLI commands — it needs a **native Aspire CLI bundle that includes the tray companion** (the
command is hidden from `--help` where it's unsupported). If no tray host is available, `tray start`
says so; the icon appears once tray support becomes available.

**Agent guidance:** the tray is a human-facing UI. Start it only when the user asks for it, and don't
use it as a lifecycle or status signal — keep using `aspire ps` / `aspire describe` / `aspire wait` /
`aspire stop --apphost <path>` (or `--pid`). Stopping the tray never stops AppHosts, so it's not a
cleanup step either.
