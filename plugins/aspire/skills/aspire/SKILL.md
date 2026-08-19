---
name: aspire
description: 'Aspire skill covering the Aspire CLI (start, stop, describe, wait, logs, otel, mcp), AppHost orchestration, service discovery, integrations, MCP server, dashboard, and deployment. Use when the user asks to create, run, debug, configure, deploy, or troubleshoot an Aspire distributed application. USE FOR: aspire start, aspire stop, aspire describe, aspire wait, aspire logs, aspire otel, list aspire integrations, debug aspire issues, aspire dashboard, aspire add, aspire mcp tools, aspire docs. DO NOT USE FOR: non-Aspire .NET apps (use dotnet CLI), container-only deployments (use docker/podman).'
---

# Aspire — Polyglot Distributed-App Orchestration

Aspire is a **code-first, polyglot toolchain** for building observable, production-ready distributed applications. It orchestrates containers, executables, and cloud resources from a single AppHost project — regardless of whether the workloads are C#, Python, JavaScript/TypeScript, Go, Java, Rust, Bun, Deno, or PowerShell.

> **Mental model:** The AppHost is a *conductor* — it doesn't play the instruments, it tells every service when to start, how to find each other, and watches for problems. The AppHost can be written in C# (all versions) or TypeScript (preview in 13.2/13.3, **GA in 13.4**).

Detailed reference material lives in the `references/` folder — load on demand.

---

## References

| Reference | When to load |
|---|---|
| [CLI Reference](references/cli-reference.md) | Command flags, options, or detailed usage |
| [MCP Server](references/mcp-server.md) | Setting up MCP for AI assistants, available tools |
| [Integrations Catalog](references/integrations-catalog.md) | Discovering integrations via MCP tools, wiring patterns |
| [Polyglot APIs](references/polyglot-apis.md) | Method signatures, chaining options, language-specific patterns, TypeScript AppHost |
| [Architecture](references/architecture.md) | DCP internals, resource model, service discovery, networking, telemetry |
| [Dashboard](references/dashboard.md) | Dashboard features, standalone mode, GenAI Visualizer |
| [Deployment](references/deployment.md) | Docker, Kubernetes, Azure Container Apps, App Service |
| [Testing](references/testing.md) | Integration tests against the AppHost |
| [Troubleshooting](references/troubleshooting.md) | Diagnostic codes, common errors, and fixes |
| [Migration](references/migration.md) | Per-version breaking changes (13.2 → 13.3 → 13.4 → 13.5) to scrub from code, scripts, and CI |

---

## Agent Safety Guardrails

When an AI agent drives Aspire, these rules prevent self-inflicted breakage. They apply to **every** Aspire task — read them before acting.

| ✅ Do | ❌ Don't | Why |
|---|---|---|
| `aspire start` an AppHost (13.2+) | `dotnet run` an AppHost | `dotnet run` bypasses orchestration, the dashboard, and the CLI backchannel. |
| `aspire wait <resource>` before interacting | `curl`/HTTP polling loops | Polling ignores dynamic ports and DAG ordering, producing false negatives. |
| `aspire stop` first if you hit a file lock | `pkill dotnet`, `rm -rf bin obj`, or declare a permanent build failure | A running AppHost holds locks; `MSB3491`/`CS2012` clear once it stops. |
| Pass `--non-interactive` on agent commands | Assume an interactive terminal | Prompts/spinners hang in non-interactive shells. |
| Read `--format Json` for machine output | Scrape human-readable text | Text formatting is not a stable contract. |
| `aspire start --isolated` in worktrees / shared-state risk | Run multiple non-isolated AppHosts | Avoids port and state collisions. |
| Add `--include-hidden` when a resource is missing from `describe`/`resource`/`logs` | Assume the resource doesn't exist | Proxies, helpers, and migration/seed jobs are hidden by default. (Removed from `aspire ps` in 13.5 — `ps` is AppHost-level only; use `aspire describe`.) |
| Regenerate TS SDKs with `aspire add` / `aspire restore` | Edit `.aspire/modules/` by hand | Generated SDKs are overwritten; hand edits are lost. |
| `aspire stop` when the task is done | Leave orphaned processes/containers running | Prevents port conflicts, locks, and stale state. |

See the consolidated lifecycle tips in [§7 Common Patterns](#7-common-patterns) and the per-version scrub list in [Migration](references/migration.md).

### Detecting an Aspire workspace

Confirm it's an Aspire app before applying these rules:

| Signal | Detect | Notes |
|---|---|---|
| C# project AppHost | `.csproj` referencing `Aspire.AppHost.Sdk` | Definitive |
| File-based C# AppHost | `apphost.cs` with `#:sdk Aspire.AppHost.Sdk` and `#:property IsAspireHost=true` | Definitive (.NET 10) |
| TypeScript AppHost | `apphost.mts` / `apphost.ts` | Definitive |
| Aspire config | `aspire.config.json` (`appHost.language` = `"csharp"` or `"typescript/nodejs"`, `appHost.path` = where the AppHost lives) | High (13.2+; replaces legacy `aspire.json`) |
| Generated TS SDKs | `.aspire/modules/` directory present | High (TypeScript AppHost) |
| Service defaults | `Aspire.ServiceDefaults` project reference | Medium |

---

## 1. Researching Aspire Documentation

The Aspire team ships an **MCP server** that provides documentation tools directly inside your AI assistant. See [MCP Server](references/mcp-server.md) for setup details.

### Aspire CLI 13.2+ (recommended — has built-in docs search)

If running Aspire CLI **13.2 or later** (`aspire --version`), docs are accessible via both **MCP tools** and **CLI commands**:

**MCP tools** (when MCP server is running):

| Tool | Description |
|---|---|
| `list_docs` | Lists all available documentation from aspire.dev |
| `search_docs` | Performs weighted lexical search across indexed documentation |
| `get_doc` | Retrieves a specific document by its slug |

**CLI commands** (work without MCP server):

| Command | Description |
|---|---|
| `aspire docs search <query>` | Search documentation |
| `aspire docs get <slug>` | Read a specific doc page |
| `aspire docs get <slug> --section <name>` | Read a specific section of a doc page |
| `aspire docs list` | List all available doc pages |

These tools were added in [PR #14028](https://github.com/dotnet/aspire/pull/14028).

For more on this approach, see David Pine's post: https://davidpine.dev/posts/aspire-docs-mcp-tools/

### Aspire CLI 13.1 (integration tools only)

On 13.1, the MCP server provides integration lookup but **not** docs search:

| Tool | Description |
|---|---|
| `list_integrations` | Lists available Aspire hosting integrations |
| `get_integration_docs` | Gets documentation for a specific integration package |

For general docs queries on 13.1, use **Context7** as your primary source (see below).

### Fallback: Context7

Use **Context7** (`mcp_context7`) when the Aspire MCP docs tools are unavailable (13.1) or the MCP server isn't running:

**Step 1 — Resolve the library ID** (one-time per session):

Call `mcp_context7_resolve-library-id` with `libraryName: ".NET Aspire"`.

| Rank | Library ID | Use when |
|---|---|---|
| 1 | `/microsoft/aspire.dev` | Primary source. Guides, integrations, CLI reference, deployment. |
| 2 | `/dotnet/aspire` | API internals, source-level implementation details. |
| 3 | `/communitytoolkit/aspire` | Non-Microsoft polyglot integrations (Go, Java, Node.js, Ollama). |

**Step 2 — Query docs:**

```
libraryId: "/microsoft/aspire.dev", query: "Python integration AddPythonApp service discovery"
libraryId: "/communitytoolkit/aspire", query: "Golang Java Node.js community integrations"
```

### Fallback: GitHub search (when Context7 is also unavailable)

Search the official docs repo on GitHub:
- **Docs repo:** `microsoft/aspire.dev` — path: `src/frontend/src/content/docs/`
- **Source repo:** `dotnet/aspire`
- **Samples repo:** `dotnet/aspire-samples`
- **Community integrations:** `CommunityToolkit/Aspire`

---

## 2. Prerequisites & Install

| Requirement | Details |
|---|---|
| **.NET SDK** | 10.0+ (required even for non-.NET workloads — the AppHost orchestration host is .NET) |
| **Container runtime** | Docker Desktop, Podman, or Rancher Desktop |
| **IDE (optional)** | VS Code + C# Dev Kit, Visual Studio 2022, JetBrains Rider |

```bash
# Linux / macOS
curl -sSL https://aspire.dev/install.sh | bash

# Windows PowerShell
irm https://aspire.dev/install.ps1 | iex

# Verify
aspire --version

# Install templates
dotnet new install Aspire.ProjectTemplates
```

> **13.3+ alternative install:** with the .NET 10 SDK present, install the CLI as a NativeAOT .NET global tool: `dotnet tool install -g Aspire.Cli`.
>
> **13.5:** also available via package managers — `npm install -g @microsoft/aspire-cli`, `brew install --cask microsoft/aspire/aspire`, `winget install Microsoft.Aspire`, or Nix (`nix profile add github:microsoft/aspire#aspire-cli`). New C# AppHost templates set `AspireUseCliBundle=true` so `dotnet run` resolves the CLI on the fly via `dnx`.

---

## 3. Project Templates

| Template | Command | Description |
|---|---|---|
| **aspire-starter** | `aspire new aspire-starter` | ASP.NET Core/Blazor starter + AppHost + tests (C# AppHost) |
| **aspire-ts-cs-starter** | `aspire new aspire-ts-cs-starter` | ASP.NET Core/React starter, **C# AppHost** |
| **aspire-ts-starter** | `aspire new aspire-ts-starter` | Express/React starter, **TypeScript AppHost** |
| **aspire-py-starter** | `aspire new aspire-py-starter` | FastAPI/React starter, **TypeScript AppHost** (no .NET authoring needed — the .NET SDK is still required under the hood; `--use-redis-cache` option; uses `addUvicornApp`) |
| **aspire-empty** | `aspire new aspire-empty` | Empty AppHost (choose language) |
| **aspire-ts-empty** | `aspire new aspire-ts-empty` | Empty TypeScript AppHost |

---

## 4. AppHost Quick Start

The AppHost orchestrates all services. Non-.NET workloads run as containers or executables.

### C# AppHost (all versions)

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var redis = builder.AddRedis("cache");
var postgres = builder.AddPostgres("pg").AddDatabase("catalog");

// .NET API
var api = builder.AddProject<Projects.CatalogApi>("api")
    .WithReference(postgres).WithReference(redis);

// Python ML service
var ml = builder.AddPythonApp("ml-service", "../ml-service", "main.py")
    .WithHttpEndpoint(targetPort: 8000).WithReference(redis);

// React frontend (Vite) — AddViteApp auto-registers its http endpoint (PORT)
var web = builder.AddViteApp("web", "../frontend")
    .WithReference(api);

// Go worker (official Aspire.Hosting.Go package, 13.4+)
var worker = builder.AddGoApp("worker", "../go-worker")
    .WithReference(redis);

builder.Build().Run();
```

### TypeScript AppHost (GA in 13.4; preview in 13.2/13.3)

```typescript
import { createBuilder } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();
const cache = await builder.addRedis("cache");
const postgres = await builder.addPostgres("pg").addDatabase("catalog");
const api = await builder.addProject("api", "../api")
    .withReference(postgres).withReference(cache);
const web = await builder.addViteApp("web", "../frontend")
    .withReference(api);   // addViteApp auto-registers its http endpoint (PORT)
await builder.build().run();
```

> TypeScript AppHost uses `aspire.config.json` for discovery (no `.csproj`); the orchestrator file is `apphost.mts`. Run `aspire add` to generate TypeScript SDKs into `.aspire/modules/`, and `aspire restore` to regenerate after upgrades. See [Polyglot APIs](references/polyglot-apis.md) for full details.

For complete API signatures, see [Polyglot APIs](references/polyglot-apis.md).

---

## 5. Core Concepts (Summary)

| Concept | Key point |
|---|---|
| **Run vs Publish** | `aspire start` = background dev (13.2+, recommended). `aspire run` = foreground dev (legacy). `aspire publish` = generate deployment manifests. |
| **Service discovery** | Automatic via env vars: `ConnectionStrings__<name>`, `services__<name>__http__0` |
| **Resource lifecycle** | DAG ordering — dependencies start first. `.WaitFor()` gates on health checks. |
| **Resource lifetimes** | Session (default) vs **persistent** (`WithPersistentLifetime()` — survives AppHost restarts; pair with `WithDataVolume()` for data). 13.4 extends shared lifetime APIs to executables/projects (experimental). See [Architecture](references/architecture.md). |
| **Resource types** | `ProjectResource`, `ContainerResource`, `ExecutableResource`, `ParameterResource` |
| **Integrations** | 144+ across 13 categories. Hosting package (AppHost) + Client package (service). |
| **Dashboard** | Real-time logs, traces, metrics, GenAI visualizer. Runs automatically with `aspire start` / `aspire run`. |
| **MCP Server** | AI assistants can query running apps, search docs, and invoke resource MCP tools via CLI (STDIO). |
| **Resource MCP tools** | Resources can expose MCP tools (e.g., `WithPostgresMcp()`). Discover with `aspire mcp tools`. (13.2+) |
| **Interaction Service** | Prompt users from resource commands (dashboard UI). Core prompt/input APIs are **stable in 13.5** (no more `ASPIREINTERACTION001` for prompts); 13.5 adds **file-upload inputs** (stable) and **progress dialogs** (`PromptProgressAsync`, experimental). Works from C# and TypeScript AppHosts. |
| **Resource command arguments** | (13.5+) Commands declare named arguments via `CommandOptions.Arguments`; dashboard prompts, CLI exposes `--<name>` options; read via `ExecuteCommandContext.Arguments`. |
| **Interactive terminals** | (13.5, experimental `ASPIRETERMINAL001`) `WithTerminal()` opens an interactive terminal session on a resource (REPLs, shells) attachable from the dashboard or `aspire terminal attach` (feature flag `terminalCommandsEnabled`). |
| **HTTPS dev certificates** | (13.5, experimental `ASPIRECERTIFICATES001`) `WithHttpsDeveloperCertificate()` / `WithHttpsCertificate(...)` / `WithoutHttpsCertificate()` on project and executable resources. |
| **Cross-scope Azure refs** | (13.5+) `AsExistingInResourceGroup/InSubscription/InTenant` (+ `Run/PublishAsExisting*` variants) reference Azure resources outside the app's own scope. |
| **TypeScript AppHost** | GA in 13.4 (preview in 13.2/13.3). Write AppHost in TypeScript (`apphost.mts`) via `createBuilder()`. Uses `.aspire/modules/` for generated SDKs. 13.5 adds parity: custom health checks, container file copying, interaction service, command arguments, HTTPS certs, faster startup. |
| **Testing** | `Aspire.Hosting.Testing` — spin up full AppHost in xUnit/MSTest/NUnit. |
| **Deployment** | Docker, Kubernetes, Azure Container Apps, Azure App Service. Tear down with `aspire destroy` (13.3+). |
| **Container tunnel** | Enabled by default (13.3+) for uniform connectivity across Docker Desktop, Docker Engine, and Podman. Disable with `ASPIRE_ENABLE_CONTAINER_TUNNEL=false`. |

---

## 6. CLI Quick Reference

### Aspire CLI 13.2+ (recommended)

| Task | Command |
|---|---|
| Start the app | `aspire start` |
| Start isolated (worktrees) | `aspire start --isolated` |
| Restart the app | `aspire start` (stops previous automatically) |
| Wait for resource healthy | `aspire wait <resource>` |
| Stop the app | `aspire stop` |
| Stop + delete persistent resource data | `aspire stop --force` (13.5+) |
| Attach to a resource terminal session | `aspire terminal attach <resource>` (13.5+, experimental — enable `features.terminalCommandsEnabled`) |
| List resources | `aspire describe` or `aspire resources` (add `--include-hidden` to show hidden resources, 13.3+) |
| Run resource command | `aspire resource <resource> <command>` |
| Start/stop/restart resource | `aspire resource <resource> start\|stop\|restart` |
| View console logs | `aspire logs [resource]` (full-text filter with `--search <query>`, 13.4+) |
| View structured logs | `aspire otel logs [resource]` (field-aware `--search`, 13.4+) |
| View traces / spans | `aspire otel traces [resource]` / `aspire otel spans [resource]` |
| Logs for a trace | `aspire otel logs --trace-id <id>` |
| Add an integration | `aspire add` |
| List/search integrations | `aspire integration list` / `aspire integration search <query>` (13.4+) |
| List candidate AppHosts in workspace | `aspire ls` (13.4+; vs `aspire ps` = running) |
| List running AppHosts | `aspire ps` (AppHost-level only; 13.5 removed `--resources`/`--include-hidden` — use `aspire describe`) |
| Update AppHost packages | `aspire update` (`-y/--yes` to skip prompts non-interactively, 13.4+; `--migrate` applies pending project migrations like `apphost.ts` → `apphost.mts`, 13.5+) |
| Update the CLI itself | `aspire update --self` (13.4+) |
| Search docs | `aspire docs search <query>` |
| Get doc page | `aspire docs get <slug>` |
| List doc pages | `aspire docs list` |
| Search API reference | `aspire docs api search <query> [--language csharp\|typescript]` (13.3+) |
| Run dashboard standalone | `aspire dashboard run` (13.3+) |
| Environment diagnostics | `aspire doctor` |
| List resource MCP tools | `aspire mcp tools` |
| Call resource MCP tool | `aspire mcp call <resource> <tool> --input <json>` |
| Export telemetry data | `aspire export` |
| Set user secret | `aspire secret set <key> <value>` |
| List user secrets | `aspire secret list` |
| Trust dev certificate | `aspire certs trust` |
| Regenerate TS SDKs | `aspire restore` |
| Create from template | `aspire new <template>` |
| Initialize in existing project | `aspire init` |
| Generate deployment manifests | `aspire publish` |
| Deploy to targets | `aspire deploy` |
| Tear down a deployment | `aspire destroy` (Azure/Kubernetes/Docker Compose, 13.3+) |
| Configure MCP for AI assistants | `aspire agent init` |

Most commands support `--format Json` for machine-readable output. Use `--apphost <path>` to target a specific AppHost.

### Aspire CLI 13.1 (legacy)

On 13.1, the following 13.2+ commands are **not available**: `start`, `stop`, `wait`, `describe`, `resources`, `resource`, `logs`, `otel`, `ps`, `doctor`, `docs`, `export`, `secret`, `certs`, `mcp tools`, `mcp call`, `restore`. Use `aspire run` (foreground, Ctrl+C to stop) and the MCP tools or dashboard for resource inspection.

| Command | Description |
|---|---|
| `aspire run` | Start all resources locally (foreground, Ctrl+C to stop) |
| `aspire mcp init` | Configure MCP for AI assistants (renamed to `aspire agent init` in 13.2) |

All other commands (`aspire new`, `aspire init`, `aspire add`, `aspire publish`, `aspire config`, `aspire cache`, `aspire deploy`, `aspire do`, `aspire update`) work the same on 13.1.

Full command reference with flags: [CLI Reference](references/cli-reference.md).

---

## 7. Common Patterns

### Running and debugging (13.2+)

1. Start the app: `aspire start` (or `aspire start --isolated` in worktrees)
2. Wait for resource: `aspire wait <resource>`
3. Check status: `aspire describe`
4. View structured logs: `aspire otel logs <resource>`
5. View console logs: `aspire logs <resource>`
6. View traces: `aspire otel traces <resource>`
7. To restart after changes: just run `aspire start` again (auto-stops previous)

### Important rules

- **Always start the app first** (`aspire start`) before making changes to verify the starting state.
- **To restart, just run `aspire start` again** — it automatically stops the previous instance. NEVER use `aspire stop` then `aspire run`. NEVER use `aspire run` at all (13.2+).
- Use `--isolated` when working in a worktree.
- **Avoid persistent containers** early in development to prevent state management issues.
- **Never install the Aspire workload** — it is obsolete.
- Prefer `aspire.dev` and `learn.microsoft.com/dotnet/aspire` for official documentation.

### Adding a new service

1. Create your service directory (any language)
2. Add to AppHost: `Add*App()` or `AddProject<T>()`
3. Wire dependencies: `.WithReference()`
4. Gate on health: `.WaitFor()` if needed
5. Start: `aspire start` (13.2+) or `aspire run` (13.1)

### Adding integrations

Discover hosting integrations with `aspire integration list` / `aspire integration search <query>` (13.4+), and use `aspire docs search` (13.2+) → `aspire docs get` to read the full guide. Use `aspire add` (or `aspire integration add <integration>`) to install the integration package. Restart with `aspire start` for the new resource to take effect.

### Using resource MCP tools (13.2+)

Some resources expose MCP tools (e.g., `WithPostgresMcp()` adds SQL query tools). Discover and call them via CLI:

```bash
aspire mcp tools                                              # list available tools
aspire mcp tools --format Json                                # includes input schemas
aspire mcp call <resource> <tool> --input '{"key":"value"}'   # invoke a tool
```

### Migrating from Docker Compose

1. `aspire new aspire-empty` (empty AppHost)
2. Replace each `docker-compose` service with an Aspire resource
3. `depends_on` → `.WithReference()` + `.WaitFor()`
4. `ports` → `.WithHttpEndpoint()`
5. `environment` → `.WithEnvironment()` or `.WithReference()`

---

## 8. Key URLs

| Resource | URL |
|---|---|
| **Documentation** | https://aspire.dev |
| **AI Coding Agents guide** | https://aspire.dev/get-started/ai-coding-agents/ |
| **Runtime repo** | https://github.com/dotnet/aspire |
| **Docs repo** | https://github.com/microsoft/aspire.dev |
| **Samples** | https://github.com/dotnet/aspire-samples |
| **Community Toolkit** | https://github.com/CommunityToolkit/Aspire |
| **Dashboard image** | `mcr.microsoft.com/dotnet/aspire-dashboard` |
| **Discord** | https://aka.ms/aspire/discord |
| **Reddit** | https://www.reddit.com/r/aspiredotdev/ |
