# Troubleshooting — Diagnostics & Common Issues

---

## Diagnostic Codes

Aspire emits diagnostic codes for common issues. These appear in build warnings/errors and IDE diagnostics.

### Standard diagnostics

| Code          | Severity | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| **ASPIRE001** | Warning  | Resource name contains invalid characters                  |
| **ASPIRE002** | Warning  | Duplicate resource name detected                           |
| **ASPIRE003** | Error    | Missing required package reference                         |
| **ASPIRE004** | Warning  | Deprecated API usage                                       |
| **ASPIRE005** | Error    | Invalid endpoint configuration                             |
| **ASPIRE006** | Warning  | Health check not configured for resource with `.WaitFor()` |
| **ASPIRE007** | Warning  | Container image tag not specified (using `latest`)         |
| **ASPIRE008** | Error    | Circular dependency detected in resource graph             |

### Experimental diagnostics (ASPIREHOSTINGX\*)

These codes indicate usage of experimental/preview APIs. They may require `#pragma warning disable` or `<NoWarn>` if you intentionally use experimental features:

| Code                      | Area                             |
| ------------------------- | -------------------------------- |
| ASPIRE_HOSTINGX_0001–0005 | Experimental hosting APIs        |
| ASPIRE_HOSTINGX_0006–0010 | Experimental integration APIs    |
| ASPIRE_HOSTINGX_0011–0015 | Experimental deployment APIs     |
| ASPIRE_HOSTINGX_0016–0022 | Experimental resource model APIs |
| `ASPIREPERSISTENCE001`    | Shared resource-lifetime APIs (`WithPersistentLifetime`/`WithSessionLifetime`/`WithParentProcessLifetime`/`WithLifetimeOf`) for executables/projects (13.4) |
| `ASPIREPROCESSCOMMAND001` | Process-backed resource commands — `WithProcessCommand`, `ProcessCommandSpec`, `ProcessCommandOptions` (13.4) |
| `ASPIREBROWSERLOGS001`    | Browser logs — `WithBrowserLogs` (`Aspire.Hosting.Browsers`), tracked Chromium console/network capture (13.3+) |
| `ASPIRETERMINAL001`       | Interactive terminal sessions — `WithTerminal()`, `TerminalOptions`, and the `aspire terminal` CLI group (13.5; CLI side also needs `features.terminalCommandsEnabled`) |
| `ASPIREINTERACTION001`    | Interaction Service. **Scope narrowed in 13.5:** core prompt/input APIs (`PromptInputAsync`, `PromptInputsAsync`, `InteractionInput`, `InputType`, `InteractionInputCollection`) and file-upload inputs are now **stable** — only `PromptProgressAsync` (progress dialogs) still requires the suppression. |
| `ASPIRECERTIFICATES001`   | HTTPS certificate configuration — `WithHttpsDeveloperCertificate`, `WithHttpsCertificate`, `WithHttpsCertificateConfiguration`, `WithoutHttpsCertificate` (13.5) |
| `ASPIREDOTNETPROJECT001`  | `AddDotnetProject` / `DotnetProjectResource` — model a .NET project by path; moved to the `Aspire.Hosting.Dotnet` package in 13.5 |
| `ASPIRECOMPUTE002`        | Kubernetes/AKS persistent volumes — `AddPersistentVolume`, `WithPersistentVolume` (13.5) |
| `ASPIREACANAMING002`      | Azure Container Apps `WithUniqueResourceNaming()` deterministic naming (13.5) |
| `ASPIREAZURE003`          | Azure virtual-network builder APIs in `Aspire.Hosting.Azure.Network` — `WithServiceDelegation`, `WithDelegatedSubnet` (13.5) |

**CLI-bundle diagnostics (13.5, build/MSBuild-level, not suppressible experimental gates):**

| Code          | Severity | Meaning |
| ------------- | -------- | ------- |
| **ASPIRE009** | Error    | CLI bundle can't be resolved (with `AspireUseCliBundle=true`) |
| **ASPIRE010** | Warning  | Project opts out of the CLI bundle |
| **ASPIRE011** | Warning  | `dnx` isn't available to acquire the CLI bundle |

To suppress experimental warnings:

```xml
<!-- In .csproj -->
<PropertyGroup>
  <NoWarn>$(NoWarn);ASPIRE_HOSTINGX_0001</NoWarn>
</PropertyGroup>
```

Or per-line:

```csharp
#pragma warning disable ASPIRE_HOSTINGX_0001
var resource = builder.AddExperimentalResource("test");
#pragma warning restore ASPIRE_HOSTINGX_0001
```

### JavaScript diagnostics

| Code                   | Notes                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **ASPIREJAVASCRIPT001** | Experimental JavaScript/TypeScript hosting APIs (e.g. `AddNextJsApp`). Renamed from `ASPIREEXTENSION001` in 13.3 — update any existing `<NoWarn>`/`#pragma` suppressions. |
| **ASPIREATS001** | **Removed in 13.4** when the TypeScript AppHost went GA — it was the experimental TS-AppHost SDK warning. If you still see it, drop any `<NoWarn>`/`#pragma` suppression for it. |

---

## Common Issues & Solutions

### Fixed in 13.5

If you hit these on 13.4 or earlier, upgrade (`aspire update --self && aspire update`):

- **Deadlock during startup** — async callbacks stored in `IOptions.Configure` invoked during `BeforeStartEvent` deadlocked the AppHost.
- **`WithBrowserLogs()` startup flakiness** — tracked browser sessions could fail even when the browser eventually became responsive; the CDP startup timeout was increased.
- **Proxyless container endpoint references accessed before container creation** — no longer fails.
- **`aspire run` failing for polyglot AppHosts using `*.dev.localhost` resource service URLs.**
- **Stale AppHost backchannel sockets** blocking commands like `aspire add` — now pruned automatically; Ctrl+C/SIGTERM handling is also more responsive during startup.
- **Slow TypeScript AppHost startup** — the CLI no longer waits a fixed delay before connecting; it races the RPC retry loop against process exit.

### Container runtime

| Problem                           | Solution                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Cannot connect to Docker daemon" | Start Docker Desktop / Podman / Rancher Desktop                                                        |
| Container fails to start          | Check `docker ps -a` for exit codes; check dashboard console logs                                      |
| Port already in use               | Another process is using the port; Aspire auto-assigns, but `targetPort` must be free on the container |
| Container image pull fails        | Check network connectivity; verify image name and tag                                                  |
| "Permission denied" on Linux      | Add user to `docker` group: `sudo usermod -aG docker $USER`                                            |
| Container connectivity issues (13.3+) | The container tunnel is on by default. To rule it out, disable it: set `ASPIRE_ENABLE_CONTAINER_TUNNEL=false` before starting the AppHost |

### Service discovery

| Problem                       | Solution                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Service can't find dependency | Verify `.WithReference()` in AppHost; check env vars in dashboard            |
| Connection string is null     | The reference resource name doesn't match; check `ConnectionStrings__<name>` |
| Wrong port in service URL     | Check `targetPort` vs actual service listen port                             |
| Env var not set               | Rebuild AppHost; verify resource name matches exactly                        |

### Python workloads

| Problem                           | Solution                                                        |
| --------------------------------- | --------------------------------------------------------------- |
| "Python not found"                | Ensure Python is on PATH; specify full path in `AddPythonApp()` |
| venv not found                    | Use `.WithVirtualEnvironment()` or create venv manually         |
| pip packages fail to install      | Use `.WithPipPackages()` or install in venv before starting the app |
| ModuleNotFoundError               | venv isn't activated; `.WithVirtualEnvironment()` handles this  |
| "Port already in use" for Uvicorn | Check `targetPort` — another instance may be running            |

### JavaScript / TypeScript workloads

| Problem                       | Solution                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| "node_modules not found"      | Packages auto-install by default (13.4+); verify `package.json` is valid. Pick a package manager with `.WithNpm()`/`.WithYarn()`/`.WithPnpm()`/`.WithBun()` |
| npm install fails             | Check `package.json` is valid; check npm registry connectivity   |
| Vite dev server won't start   | Verify `vite` is in devDependencies; check Vite config           |
| Port mismatch                 | Ensure `targetPort` matches the port in your JS framework config |
| TypeScript compilation errors | These happen in the service, not Aspire — check service logs     |

### Go workloads

| Problem                    | Solution                                                   |
| -------------------------- | ---------------------------------------------------------- |
| "go not found"             | Ensure Go is installed and on PATH                         |
| Build fails                | Check `go.mod` exists in working directory                 |
| "no Go files in directory" | Verify `workingDir` points to the directory with `main.go` |

### Java workloads

| Problem                  | Solution                                                |
| ------------------------ | ------------------------------------------------------- |
| "java not found"         | Ensure JDK is installed and `JAVA_HOME` is set          |
| Maven/Gradle build fails | Verify build files exist; check build tool installation |
| Spring Boot won't start  | Check `application.properties`; verify main class       |

### Rust workloads

| Problem              | Solution                                                             |
| -------------------- | -------------------------------------------------------------------- |
| "cargo not found"    | Install Rust via rustup                                              |
| Build takes too long | Rust compile times are normal; use `.WithCargoBuild()` for pre-build |

### Health checks & startup

| Problem                      | Solution                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Resource stuck in "Starting" | Health check endpoint not responding; check service logs                       |
| `.WaitFor()` timeout         | Increase timeout or fix health endpoint; default is 30 seconds                 |
| Health check always fails    | Verify endpoint path (default: `/health`); check service binds to correct port |
| Cascading startup failures   | A dependency failed; check the root resource first                             |

### Dashboard

| Problem                               | Solution                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Dashboard doesn't open                | Check terminal for URL; use `--dashboard-port` for fixed port             |
| No logs appearing                     | Service may not be writing to stdout/stderr; check console output         |
| No traces for non-.NET services       | Configure OpenTelemetry SDK in the service; see [Dashboard](dashboard.md) |
| Traces don't show cross-service calls | Propagate trace context headers (`traceparent`, `tracestate`)             |

### Build & configuration

| Problem                                   | Solution                                                            |
| ----------------------------------------- | ------------------------------------------------------------------- |
| "Project not found" for `AddProject<T>()` | Ensure `.csproj` is in the solution and referenced by AppHost       |
| Package version conflicts                 | Pin all Aspire packages to the same version                         |
| AppHost won't build                       | Check `Aspire.AppHost.Sdk` is in the project; run `dotnet restore`  |
| `aspire run` / `aspire start` build error | Fix the build error first; both commands require a successful build |

### Process management (13.2+)

| Problem                               | Solution                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `aspire start` says "already running" | Just run `aspire start` again — it auto-stops the previous instance                  |
| `aspire wait` times out               | Check resource health with `aspire describe`; inspect logs with `aspire logs <resource>` |
| `aspire describe` shows no resources  | AppHost may not be running; check with `aspire ps`                                   |
| Port conflict with `--isolated`       | Ensure no other instances conflict; check with `aspire ps`                           |
| TypeScript AppHost `.aspire/modules/` missing| Run `aspire restore` to regenerate TypeScript SDKs (path was `.modules/` before 13.4) |
| `aspire.config.json` migration issues | CLI auto-migrates legacy files on first command; check for merge conflicts           |

### Deployment

| Problem                                  | Solution                                                             |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `aspire publish` fails                   | Check publisher package is installed (e.g., `Aspire.Hosting.Docker`) |
| Generated Bicep has errors               | Check for unsupported resource configurations                        |
| Container image push fails               | Verify registry credentials and permissions                          |
| Missing connection strings in deployment | Check generated ConfigMaps/Secrets match resource names              |

---

## Debugging strategies

### 1. Check the dashboard first

The dashboard shows resource state, logs, traces, and metrics. Start here for any issue.

### 2. Check environment variables

In the dashboard, click a resource to see all injected environment variables. Verify connection strings and service URLs are correct.

### 3. Read console logs

Dashboard → Console Logs → filter by the failing resource. Raw stdout/stderr often contains the root cause.

### 4. Check the DAG

If services fail to start, check the dependency order. A failed dependency blocks all downstream resources.

### 5. Use MCP for AI-assisted debugging

If MCP is configured (see [MCP Server](mcp-server.md)), ask your AI assistant:

- "What resources are failing?"
- "Show me the logs for [service]"
- "What traces show errors?"

### 6. Isolate the problem

Run just the failing resource by commenting out others in the AppHost. This narrows whether the issue is the resource itself or a dependency.

### 7. Use CLI diagnostics (13.2+)

Run `aspire doctor` to check your environment (SDK versions, container runtime, HTTPS certs, WSL2, agent config).

Use `aspire describe` + `aspire otel logs <resource>` + `aspire otel traces <resource>` for quick command-line inspection without needing the dashboard or MCP.

---

## Local vs. deployed diagnostics

The Aspire CLI talks to a **locally running** AppHost over a local backchannel (see
[Architecture](architecture.md)). It **cannot** reach an app that's deployed to Azure, Kubernetes, or a
remote Docker host — route those to the platform's own tooling instead.

| Need | Local (`aspire start`) | Deployed |
|---|---|---|
| Console logs | `aspire logs <resource>` | `az containerapp logs show` / `kubectl logs <pod>` / `docker logs` |
| Structured logs | `aspire otel logs <resource>` | Application Insights query / platform logs |
| Traces / spans | `aspire otel traces` / `aspire otel spans` | App Insights Transaction Search |
| Resource state | `aspire describe` (add `--include-hidden`) | `kubectl describe pod` / Azure Portal |
| Telemetry snapshot | `aspire export` | App Insights export / KQL |
| Metrics | Dashboard (or `aspire dashboard run`) | Azure Monitor / Container Insights |

**Exception — a standalone or remote dashboard:** `aspire otel` and `aspire export` can query one directly
with `--dashboard-url <url>` (a base URL or a `…/login?t=<token>` URL) and, for ApiKey-secured dashboards,
`--api-key <key>`.

## Endpoint discovery for browser testing (Playwright handoff)

Don't guess a frontend's URL — Aspire assigns ports dynamically. Discover the live endpoint from Aspire
state, then hand it to your browser-testing tool (e.g. the Playwright skill/MCP):

```bash
aspire describe --format Json     # extract the resource's http/https endpoint
# pass the discovered URL to Playwright (browser_navigate / baseURL)
```

Use `--apphost <path>` to disambiguate when multiple AppHosts are present.

## Agent operational gotchas

Lower-level quirks worth knowing when scripting against the CLI. These are **reported upstream by
Microsoft's `aspire-skills`** (issue links below) rather than independently re-verified here — treat the
symptom/workaround as the value and confirm the issue status against your CLI version:

| Symptom | Handling |
|---|---|
| `aspire start --format json` emits human-readable text before the JSON | Strip everything before the first `{`/`[` ([aspire#15843](https://github.com/microsoft/aspire/issues/15843)). |
| `aspire ps --format Json` has both `name` and `displayName` | Use `displayName` when passing a resource to `aspire wait` ([aspire#15842](https://github.com/microsoft/aspire/issues/15842)). |
| TypeScript AppHost telemetry "No such host" for `*.dev.localhost` | Query the dashboard directly with `--dashboard-url localhost:<port>` ([aspire#15782](https://github.com/microsoft/aspire/issues/15782)). |
| `--isolated` telemetry not reachable | The OTLP port isn't randomized under `--isolated`; avoid `--isolated` when you need telemetry ([aspire#16107](https://github.com/microsoft/aspire/issues/16107)). |

---

## Getting help

| Channel                 | URL                                            |
| ----------------------- | ---------------------------------------------- |
| GitHub Issues (runtime) | https://github.com/dotnet/aspire/issues        |
| GitHub Issues (docs)    | https://github.com/microsoft/aspire.dev/issues |
| Discord                 | https://aka.ms/aspire/discord                  |
| Stack Overflow          | Tag: `dotnet-aspire`                           |
| Reddit                  | https://www.reddit.com/r/aspiredotdev/         |
