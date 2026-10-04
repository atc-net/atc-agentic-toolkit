# Polyglot APIs — Complete Reference

Aspire supports 10+ languages/runtimes. The AppHost is written in C# (all versions) or TypeScript (preview in 13.2/13.3, **GA in 13.4**), and orchestrated workloads can be any language. Each language has a hosting method that returns a resource you wire into the dependency graph.

---

## Hosting model differences

| Model | Resource type | How it runs | Examples |
|---|---|---|---|
| **Project** | `ProjectResource` | .NET project reference, built by SDK | `AddProject<T>()` |
| **Container** | `ContainerResource` | Docker/OCI image | `AddContainer()`, `AddRedis()`, `AddPostgres()` |
| **Executable** | `ExecutableResource` | Native OS process | `AddExecutable()`, all `Add*App()` polyglot methods |

All polyglot `Add*App()` methods create `ExecutableResource` instances under the hood. They don't require the target language's SDK on the AppHost side — only that the workload's runtime is installed on the dev machine.

---

## Official (Microsoft-maintained)

### .NET / C\#

```csharp
builder.AddProject<Projects.MyApi>("api")
```

**Chaining methods:**
- `.WithHttpEndpoint(port?, targetPort?, name?)` — expose HTTP endpoint
- `.WithHttpsEndpoint(port?, targetPort?, name?)` — expose HTTPS endpoint
- `.WithEndpoint(port?, targetPort?, scheme?, name?)` — generic endpoint
- `.WithReference(resource)` — wire dependency (connection string or service discovery)
- `.WithReplicas(count)` — run multiple instances
- `.WithEnvironment(key, value)` — set environment variable
- `.WithEnvironment(callback)` — set env vars via callback (deferred resolution)
- `.WaitFor(resource)` — don't start until dependency is healthy
- `.WithExternalHttpEndpoints()` — mark endpoints as externally accessible
- `.WithOtlpExporter()` — configure OpenTelemetry exporter
- `.PublishAsDockerFile()` — override publish behavior to Dockerfile
- `.WithTerminal()` — (13.5+, experimental `ASPIRETERMINAL001`) interactive terminal session attachable from the dashboard / `aspire terminal attach`; dimensions via `TerminalOptions` (`Columns` default 120, `Rows` default 30, `ShowTerminalHost`). 13.6 moved `TerminalService`/`AspireTerminal*`/`TerminalLaunchOptions`/`TerminalOwner`/`TerminalPlacement` to `Aspire.Hosting.ApplicationModel` (AppHost-owned terminals: send input, read snapshots, wait for text)
- `.WithRepl()` — (13.6+) on PostgreSQL, MySQL, MongoDB, SQL Server, Redis, Valkey server resources: dashboard command opening an authenticated client shell in the terminal dock (run mode only; uses the resource's credentials — enable only for trusted dashboard users)
- `.WithVolume(name, target, env: "DATA_PATH")` — (13.6+) portable volume path on project/executable resources: the same env var points at a deterministic local directory in run mode and at the mount path (`/data`) when published (also `WithPersistentVolume(..., env:)`)
- `.WithHttpsDeveloperCertificate()` / `.WithHttpsCertificate(cert, password)` / `.WithHttpsCertificateConfiguration(...)` / `.WithoutHttpsCertificate()` — (13.5+, experimental `ASPIRECERTIFICATES001`) HTTPS certificate configuration for project/executable resources
- `.WithContainerFiles(destPath, sourcePath, options?)` / `.WithContainerFiles(destPath, callback, options?)` — (13.5+) copy host files or build-time-generated files into container resources; ownership via `ContainerFilesOptions` (`DefaultOwner`, `DefaultGroup`, `Umask`)
- `builder.AddDotnetProject(name, path)` — (`Aspire.Hosting.Dotnet`, prerelease package) model a .NET project by path without a compile-time `ProjectReference`. **13.6:** no `ASPIREDOTNETPROJECT001` suppression needed (retired); compatible projects are coordinated into shared restore/build groups (file-based C# apps use serialized direct builds), the dashboard **Rebuild** command rebuilds after source changes (**Start**/**Restart** reuse the coordinated output), launch profiles are selectable, MSBuild `-mt` is used when the SDK supports it, and the resources now participate in **.NET SDK container publishing**. Requires .NET SDK `11.0.100-rc.1`+ (file-based apps: `11.0.100-rtm.26473.104` or stable `11.0.100`+). Opt out of grouped restore with the `Aspire:Dotnet:RestoreProjectsIndividually` configuration value. *(13.5: experimental and orchestration-only — publish/deploy failed.)*
- `.WithBuildEnvironment(name, value)` — (13.6+) MSBuild-only environment variable for `AddDotnetProject` builds, separate from runtime env vars. Not supported for file-based apps; never use for secrets.

### Python

```csharp
// Standard Python script
builder.AddPythonApp("service", "../python-service", "main.py")

// Uvicorn ASGI server (FastAPI, Starlette, etc.)
builder.AddUvicornApp("fastapi", "../fastapi-app", "app:app")
```

**`AddPythonApp(name, projectDirectory, scriptPath, args?)`**

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)` — expose HTTP
- `.WithVirtualEnvironment(path?)` — use venv (default: `.venv`)
- `.WithUv()` / `.WithPip()` — select the package manager (13.4+; otherwise auto-detected: `pyproject.toml` → uv, `requirements.txt` → pip)
- `.WithPipPackages(packages)` — install pip packages on start
- `.WithReference(resource)` — wire dependency
- `.WithEnvironment(key, value)` — set env var
- `.WaitFor(resource)` — wait for dependency health

**`AddUvicornApp(name, projectDirectory, appName, args?)`**

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)` — expose HTTP
- `.WithVirtualEnvironment(path?)` — use venv
- `.WithReference(resource)` — wire dependency
- `.WithEnvironment(key, value)` — set env var
- `.WaitFor(resource)` — wait for dependency health

**Python service discovery:** Environment variables are injected automatically. Use `os.environ` to read:
```python
import os
redis_conn = os.environ["ConnectionStrings__cache"]
api_url = os.environ["services__api__http__0"]
```

### JavaScript / TypeScript

**Package:** `Aspire.Hosting.JavaScript` (renamed from `Aspire.Hosting.NodeJs` in 13.0; install via `aspire add javascript`)

```csharp
// Generic JavaScript app (runs the "dev" script by default)
builder.AddJavaScriptApp("frontend", "../web-app")

// Vite dev server
builder.AddViteApp("spa", "../vite-app")

// Node.js script (run a JS file directly)
builder.AddNodeApp("worker", "../node-worker", "server.js")
```

**`AddJavaScriptApp(name, appDirectory, runScriptName?)`** — runs the `dev` script during development, `build` when publishing.

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)` — expose HTTP
- `.WithReference(resource)` — wire dependency
- `.WithEnvironment(key, value)` — set env var
- `.WaitFor(resource)` — wait for dependency health
- `.WithRunScript(name)` / `.WithBuildScript(name)` — override the dev/build script names
- `.WithArgs(...)` — pass CLI args to the script

**`AddViteApp(name, appDirectory, runScriptName?)`**

Auto-registers an `http` endpoint bound to the `PORT` env var — don't call `.WithHttpEndpoint()` yourself (it causes a duplicate-endpoint error). Same chaining as `AddJavaScriptApp`, plus `.WithViteConfig(path)`.

**`AddNodeApp(name, appDirectory, scriptPath)`**

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)` — expose HTTP
- `.WithReference(resource)` — wire dependency
- `.WithEnvironment(key, value)` — set env var

> **Package managers (13.4+):** JS resources auto-install dependencies by default and use **npm** unless told otherwise. Select another with `.WithNpm()`, `.WithYarn()`, `.WithPnpm()`, or `.WithBun()` (each accepts custom install args). Publish-time installs are deterministic (e.g. `npm ci`, `yarn install --immutable`, `pnpm install --frozen-lockfile`, `bun install --frozen-lockfile`) when a lockfile is present.

**`AddNextJsApp(name, appDirectory)`** — Next.js with run/publish defaults. Marked `[Experimental]`; in C# AppHosts suppress `ASPIREJAVASCRIPT001`. Requires `output: "standalone"` in `next.config.*` for publish (opt out with `.DisableBuildValidation()`).

**`.WithBrowserLogs()` (browser console + screenshots, 13.3+).** Attaches a tracked Chromium session to any resource that exposes an HTTP/HTTPS endpoint (not just JS frontends). It adds a **child resource `<parent>-browser-logs`** (type `BrowserLogs`); browser console logs, errors, exceptions, and network events stream into **that child's** console log stream, and you can capture screenshots as command artifacts. From the CLI: `aspire resource web-browser-logs open-tracked-browser`, then `aspire logs web-browser-logs` (not `aspire otel logs web`); `capture-screenshot` is the screenshot command. The parent needs an HTTP/HTTPS endpoint (HTTPS preferred). Ships in the `Aspire.Hosting.Browsers` package (`aspire add browsers`). The API is experimental — in C# AppHosts suppress `ASPIREBROWSERLOGS001`.

```csharp
#pragma warning disable ASPIREBROWSERLOGS001
builder.AddViteApp("web", "../frontend")
    .WithBrowserLogs(browser: "msedge", userDataMode: BrowserUserDataMode.Isolated);
```

> This is distinct from **browser telemetry** (the OpenTelemetry JS SDK sending traces/metrics from inside the app — see [Dashboard](dashboard.md)). The two can be used together.

**JS/TS service discovery:** Environment variables are injected. Use `process.env`:
```javascript
const redisUrl = process.env.ConnectionStrings__cache;
const apiUrl = process.env.services__api__http__0;
```

### Publishing JS/TS apps (13.3+)

Choose a production serving model based on **which resource owns the public HTTP surface** (see [Deploy JavaScript apps](https://aspire.dev/deploy-javascript-apps/)):

| Production entrypoint | API |
|---|---|
| Static frontend served by its own JS resource | `PublishAsStaticWebsite` (preview; SPA, with optional API reverse-proxy) |
| Built Node/SSR server artifact | `PublishAsNodeServer` |
| Node/SSR app started by a package script | `PublishAsPackageScript` |
| Next.js standalone app | `AddNextJsApp` |
| Static frontend served by a backend/gateway | `PublishWithContainerFiles` / `PublishWithStaticFiles` |

13.3 also adds first-class **Bun**, **Yarn**, and **pnpm** support for JS/TS resources.

### Go (official — `Aspire.Hosting.Go`, 13.4+)

Go graduated from the CommunityToolkit into core Aspire in 13.4. Use `Aspire.Hosting.Go` and `AddGoApp`; the old `CommunityToolkit.Aspire.Hosting.Golang` / `AddGolangApp` package is **deprecated**.

```csharp
builder.AddGoApp("go-api", "../go-service")
    .WithHttpEndpoint(env: "PORT")
    .WithReference(redis)
    .WithEnvironment("LOG_LEVEL", "debug")
    .WaitFor(redis);
```

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`

**Go service discovery:** Standard env vars via `os.Getenv()`:
```go
redisAddr := os.Getenv("ConnectionStrings__cache")
```

**Debugging (13.5+):** The Delve server accepts a single client by default; opt into multi-client
mode with `WithDelveServer(o => o.AcceptMultiClient = true)`. Typed options for common Delve server
flags (including `--continue`) are configured through `DelveServerOptions`.

> **Breaking change (13.5, Go polyglot AppHosts):** when an exported API has exactly one optional
> `options` DTO parameter, the Go code generator now passes the DTO directly instead of a generated
> method-options wrapper struct. Regenerate the SDK and update call sites — see
> [Migration](migration.md).

### Bun (official — `Aspire.Hosting.JavaScript`, 13.4+)

Bun graduated into core Aspire in 13.4. `AddBunApp` now lives in `Aspire.Hosting.JavaScript` (the old `CommunityToolkit.Aspire.Hosting.Bun` package is superseded). Packages auto-install with Bun when a `package.json` is present.

```csharp
builder.AddBunApp("bun-api", "../bun-service", "server.ts")
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithReference(redis);
```

**`AddBunApp(name, appDirectory, scriptPath)`** — run a Bun app directly. (To use Bun only as the *package manager* for a JS/Vite resource, call `.WithBun()` on that resource instead.)

---

## TypeScript AppHost (GA in 13.4; preview in 13.2/13.3)

The AppHost itself can be written in **TypeScript** as an alternative to C#. The TypeScript code runs as a guest process communicating with Aspire's .NET orchestration host via JSON-RPC over local transport — .NET SDK is still required under the hood, but you write the orchestration in TypeScript (`apphost.mts`).

### How it works

- `aspire add` inspects integration assemblies and generates TypeScript SDKs into `.aspire/modules/`
- `aspire restore` regenerates SDKs after upgrades or branch switches (also runs automatically on `aspire start` / `aspire run`)
- `aspire.config.json` enables automatic TypeScript AppHost discovery (no `.csproj` needed)
- VS Code extension provides CodeLens, gutter decorations, and debugging support for `createBuilder()` calls

### Configuration: `aspire.config.json`

```json
{
  "appHost": {
    "path": "apphost.mts",
    "language": "typescript/nodejs"
  },
  "sdk": {
    "version": "13.4.0"
  },
  "channel": "stable"
}
```

### Basic pattern

The API mirrors C# but in idiomatic TypeScript (camelCase):

```typescript
import { createBuilder } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

// Infrastructure
const cache = await builder.addRedis("cache");
const postgres = await builder.addPostgres("pg").addDatabase("catalog");

// .NET API
const api = await builder.addProject("api", "../api")
    .withReference(postgres)
    .withReference(cache)
    .waitFor(postgres)
    .waitFor(cache);

// React frontend (Vite)
const web = await builder.addViteApp("web", "../frontend")
    .withReference(api);   // addViteApp auto-registers its http endpoint (PORT)

await builder.build().run();
```

### C# → TypeScript API mapping

| C# (PascalCase)                  | TypeScript (camelCase)              |
|---|---|
| `AddProject<T>(name)`            | `addProject(name, path)`           |
| `AddRedis(name)`                 | `addRedis(name)`                   |
| `AddPostgres(name)`              | `addPostgres(name)`                |
| `.WithReference(resource)`       | `.withReference(resource)`         |
| `.WithHttpEndpoint(...)`         | `.withHttpEndpoint({ ... })`       |
| `.WithEnvironment(key, value)`   | `.withEnvironment(key, value)`     |
| `.WaitFor(resource)`             | `.waitFor(resource)`               |
| `builder.Build().Run()`          | `builder.build().run()`            |

> **Deprecated in 13.3:** The per-kind `withEnvironment*` helpers (`withEnvironmentExpression`, `withEnvironmentEndpoint`, `withEnvironmentParameter`, `withEnvironmentConnectionString`, `withEnvironmentFromOutput`, `withEnvironmentFromKeyVaultSecret`) are superseded by the unified `withEnvironment(name, value)` shown above — pass an expression, endpoint, parameter, or connection string as the value. Prefer the unified form.

> **Note:** TypeScript AppHost is **GA as of 13.4** (preview in 13.2/13.3). Use `aspire docs search "typescript apphost"` for the latest API reference.

### TypeScript parity additions (13.5)

13.5 closes most remaining C# ↔ TypeScript gaps. Startup is also faster (the CLI races the RPC
connection retry loop against process exit instead of waiting a fixed delay).

**Custom health checks** — register a callback and attach it (or a built-in check) to a resource:

```typescript
import { createBuilder, HealthStatus } from './.aspire/modules/aspire.mjs';
import type { HealthCheckResult } from './.aspire/modules/aspire.mjs';

const builder = await createBuilder();

const myCheck = async (): Promise<HealthCheckResult> => ({
    status: HealthStatus.Healthy,
    description: 'All systems nominal',
});

await builder.addHealthCheck('my_check', myCheck);
await builder.addRedis('cache').withHealthCheck('my_check');
```

Project resources also gain `withEndpointsInEnvironment(endpointNames)` to control which endpoints
are injected into environment variables.

**Container file copying** — copy host files into containers, or generate files at build time:

```typescript
await builder.addContainer('myapp', 'nginx')
    .withContainerFiles('/usr/share/nginx/html', './wwwroot', {
        defaultOwner: 101,   // nginx user UID
    })
    .withContainerFilesCallback('/etc/nginx/conf.d', async (ctx) => {
        await ctx.createFile('default.conf', { contents: 'server { listen 80; }' });
    });
```

Ownership/permissions via `ContainerFilesOptions` (`defaultOwner`, `defaultGroup`, `umask`).
C# equivalent: `WithContainerFiles(...)` overloads.

**Interaction Service parity** — prompts, message boxes, notifications, and dynamic inputs work the
same from TypeScript. 13.5 adds **file uploads** (`createFileInput` — uploads arrive as on-disk
paths via `file.filePath`, read with Node `fs`) and **progress dialogs** (`promptProgress`):

```typescript
const interaction = await ctx.services().getInteractionService();

// Commands invoked from the CLI run without an attached UI, where prompting throws.
if (!(await interaction.isAvailable())) {
    return { success: true, message: 'No interactive dashboard.' };
}

const fileInput = await interaction.createFileInput('dataFile', {
    fileFilter: '.json',
    maxFileSize: 10 * 1024 * 1024,   // 10 MB
});
const result = await interaction.promptInput(
    'Import data', 'Select a JSON file to import.', fileInput, { primaryButtonText: 'Import' });
if (await result.canceled()) {
    return { success: false, message: 'Canceled.' };
}

await interaction.promptProgress('Processing…', {
    work: async () => { /* long-running work; dialog closes when the callback completes */ },
});
```

**User-defined command arguments** — declare named arguments; the dashboard prompts, the CLI exposes
`--<name>` options, and the callback reads them via `ctx.arguments()`:

```typescript
import { createBuilder, InputType } from './.aspire/modules/aspire.mjs';

await builder.addContainer('api', 'nginx').withCommand('echo', 'Echo', async (ctx) => {
    const args = await ctx.arguments();
    const message = await args.value('message');
    return { success: true, message: `message=${message ?? ''}` };
}, {
    commandOptions: {          // 4th parameter is WithCommandOptions → { commandOptions: CommandOptions }
        arguments: [
            { name: 'message', inputType: InputType.Text, required: true },
        ],
    },
});
```

`args.value(name)` returns `string | undefined`; `args.requiredValue(name)` throws when missing
(also `get`, `required`, `toArray`). On the CLI, put command arguments that collide with Aspire
options after `--` (`aspire resource api echo -- --apphost x`).

**HTTPS developer certificates** — `addProject('api', './src/Api').withHttpsDeveloperCertificate()`.

**Cross-scope Azure references** — `asExistingInResourceGroup(name, resourceGroup, subscription)`,
`asExistingInSubscription(name, subscription)`, `asExistingInTenant(name)` (+ `runAsExisting*` /
`publishAsExisting*` variants); each accepts literal strings or parameters.

**.NET projects by path** — `addDotnetProject('inventory', '../InventoryService/InventoryService.csproj', { launchProfileName: 'https' })`
(`aspire add dotnet`, prerelease; flat `DotnetProjectOptions`: `launchProfileName`, `excludeLaunchProfile`,
`excludeKestrelEndpoints`). 13.6: coordinated builds and .NET SDK container publishing (13.5 was
orchestration-only). Migrating existing `addProject` calls: [Project v2 Migration](project-v2-migration.md).

**Interactive terminals** — `withTerminal()` (parameterless in polyglot AppHosts; `TerminalOptions`
dimensions are C#-only).

**Redis modules** — `addRedis('cache').withModule(RedisModules.Json).withModule(RedisModules.Search)`.

**Kubernetes persistent volumes** — `addPersistentVolume` on the Kubernetes/AKS environment
(`withStorageClass` / `withCapacity` / `withAccessMode`), bound via `withKubernetesPersistentVolume(...)`;
bound workloads render as StatefulSets. Note the polyglot `withVolume()` parameter order is
`(target, name?)` — mount path first.

### TypeScript AppHost additions (13.6)

**Configuration from `appsettings.json`** — a TypeScript AppHost loads standard configuration from
`appsettings.json` (and environment-specific files) beside `apphost.mts`; env vars and CLI args remain
in the stack:

```typescript
import { createBuilder } from './.aspire/modules/aspire.mjs';
const builder = await createBuilder();
const configuration = await builder.getConfiguration();
const region = await configuration.getConfigValue('Deployment:Region');
```

**Deno as the AppHost runtime** — Deno 2+ can run `apphost.mts` itself (detected from
`packageManager`, `deno.lock`, `deno.json`, `deno.jsonc`), with native type checking and watch mode;
certificate trust is wired via `DENO_CERT`.

**Portable volume paths** — `withVolume(target, name, env)`, e.g.
`await api.withVolume('/data', 'data', 'DATA_PATH');` (mount path first, as above).

**REPLs and coordinated .NET builds** — `await builder.addRedis('cache').withRepl();` and
`await (await builder.addDotnetProject('api', '../Api/Api.csproj')).withBuildEnvironment('ContinuousIntegrationBuild', 'true');`
(13.6: these resources participate in .NET SDK container publishing).

**Exact signatures** — `aspire sdk export --language typescript --package <Name@Version>` emits the
canonical TypeScript API JSON for any hosting package (see [CLI Reference](cli-reference.md)).

---

## Java, Rust, and Deno (first-party, 13.6+)

Before 13.6 these were CommunityToolkit-only. 13.6 ships first-party integrations; the
`CommunityToolkit.Aspire.Hosting.Java` / `.Rust` / `.Deno` packages still exist but use different
APIs (e.g. CommunityToolkit's `AddSpringApp`) — don't mix the two.

### Java (`Aspire.Hosting.Java`, preview)

**Package:** `Aspire.Hosting.Java` (prerelease, `aspire add java`). Supports executable JARs,
Maven/Gradle wrappers, Spring Boot, Quarkus, and prebuilt images; detects the target Java release from
Maven/Gradle, generates multi-stage Dockerfiles that run as non-root, and supports VS Code debugging.

```csharp
builder.AddSpringBootApp("catalog", "../catalog")   // HTTP endpoint declared via SERVER_PORT
    .WithExternalHttpEndpoints()
    .WithReference(postgres)
    .WaitFor(postgres);
```

```typescript
const catalog = await builder.addSpringBootApp('catalog', '../catalog');
await catalog.withExternalHttpEndpoints();
```

| API (TS name) | Purpose |
|---|---|
| `addSpringBootApp(name, appDirectory)` | Spring Boot via its own Maven/Gradle wrapper (`spring-boot:run` / `bootRun`); HTTP endpoint via `SERVER_PORT` |
| `addQuarkusApp(name, appDirectory)` | Quarkus dev mode (`quarkus:dev` / `quarkusDev`); HTTP endpoint via `QUARKUS_HTTP_PORT` |
| `addJavaApp(name, appDirectory)` | Plain `java` launch — configure **exactly one** launch mode: `withMavenGoal(goal, args)`, `withGradleTask(task, args)`, or a JAR |
| `addJavaAppWithJar(name, appDirectory, jarPath, args)` | Run a prebuilt JAR with `java -jar` (C#: `AddJavaApp` overload taking `jarPath`) |
| `addJavaContainer(name, image, options?)` | Run an existing image as-is (no endpoint declared — add one yourself) |

Chaining: `withMavenBuild(args)`, `withGradleBuild(args)`, `withJarArtifact(jarPath)`,
`withMainClass(mainClass)`, `withJvmArgs(args)`, `withWrapperPath(path)`,
`withOtelAgent(agentPath)` / `withOtelAgentDefaultPath()` (expects
`target/agent/opentelemetry-javaagent.jar` for Maven or `build/agent/...` for Gradle — the build must
put it there; nothing is downloaded).

**Java service discovery:** Env vars via `System.getenv()`:
```java
String dbConn = System.getenv("ConnectionStrings__db");
```

### Rust (`Aspire.Hosting.Rust`, preview)

**Package:** `Aspire.Hosting.Rust` (prerelease, `aspire add rust`). Runs `cargo run` in the app
directory; generates multi-stage Dockerfiles; VS Code discovery/run/debug for resources.

```csharp
builder.AddRustApp("api", "../rust-api")
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();
```

```typescript
await builder
    .addRustApp('api', '../rust-api')
    .withHttpEndpoint({ env: 'PORT' })
    .withExternalHttpEndpoints();
```

Chaining: `withCargoArgs(args)` (cargo args, before `--`) vs `withArgs(...)` (app args, after `--`),
`withCargoBinTarget(binName)`, `withCargoExample(name)`, `withCargoFeatures(features)`,
`withCargoPackage(name)`, `withCargoProfile(name)`, `withCargoReleaseBuild()`, `withCargoLocked()`,
`withCargoTarget(target)`, `withCargoManifestPath(path)`.

### Deno (`Aspire.Hosting.JavaScript`, experimental `ASPIREDENO001`)

Deno hosting ships in `Aspire.Hosting.JavaScript` (Deno must be on `PATH`). Run mode executes
`deno run -A <script>`; generated containers use the stricter `deno run --allow-net --allow-env`.
Deno's built-in OpenTelemetry is enabled via `OTEL_DENO`.

```csharp
#pragma warning disable ASPIREDENO001
builder.AddDenoApp("deno-api", "../deno-api", "main.ts")
    .WithDenoAllow(DenoPermissionKind.Net, "api.example.com");
#pragma warning restore ASPIREDENO001
```

```typescript
import { createBuilder, DenoPermissionKind } from './.aspire/modules/aspire.mjs';
const deno = await builder.addDenoApp('deno-api', '../deno-api', 'main.ts');
await deno.withDenoAllow(DenoPermissionKind.Net, ['api.example.com']);
```

Chaining: task/serve modes (`withDenoTask(taskName)`, `withDenoServe()`, `withDenoRun()`),
permissions (`withDenoAllow(kind, values)`, `withDenoDeny(kind, values)`, `withDenoAllowAll()`),
`withDenoConfig(file)`, `withDenoImportMap(file)`, `withDenoLock(file)` / `withDenoNoLock()`,
`withDenoUnstable(features)`, `withDenoWatch()`, `withDenoInspect()`, `withDenoRuntimeArgs(args)`,
`withDenoScriptArgs(args)`. `withDeno()` also switches other JavaScript resources (Node/Vite/Next.js)
to the Deno package manager.

## Community (CommunityToolkit/Aspire)

All community integrations follow the same pattern: install the NuGet package in your AppHost, then use the `Add*App()` method.

### PowerShell

```csharp
builder.AddPowerShell("ps-script", "../scripts/process.ps1")
    .WithReference(storageAccount);
```

### Dapr

**Package:** `Aspire.Hosting.Dapr` (official)

```csharp
var dapr = builder.AddDapr();
var api = builder.AddProject<Projects.Api>("api")
    .WithDaprSidecar("api-sidecar");
```

---

## Complete mixed-language example

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var redis = builder.AddRedis("cache");
var postgres = builder.AddPostgres("pg").AddDatabase("catalog");
var mongo = builder.AddMongoDB("mongo").AddDatabase("analytics");
var rabbit = builder.AddRabbitMQ("messaging");

// .NET API (primary)
var api = builder.AddProject<Projects.CatalogApi>("api")
    .WithReference(postgres)
    .WithReference(redis)
    .WithReference(rabbit)
    .WaitFor(postgres)
    .WaitFor(redis);

// Python ML service (FastAPI)
var ml = builder.AddUvicornApp("ml", "../ml-service", "app:app")
    .WithHttpEndpoint(targetPort: 8000)
    .WithVirtualEnvironment()
    .WithReference(redis)
    .WithReference(mongo)
    .WaitFor(redis);

// TypeScript frontend (Vite + React)
var web = builder.AddViteApp("web", "../frontend")   // npm packages auto-install; http endpoint auto-registered
    .WithReference(api);

// Go event processor
var processor = builder.AddGoApp("processor", "../go-processor")
    .WithReference(rabbit)
    .WithReference(mongo)
    .WaitFor(rabbit);

// Java analytics service (Spring Boot, Aspire.Hosting.Java preview — HTTP endpoint via SERVER_PORT)
var analytics = builder.AddSpringBootApp("analytics", "../spring-analytics")
    .WithReference(mongo)
    .WithReference(rabbit)
    .WaitFor(mongo);

// Rust high-perf worker (Aspire.Hosting.Rust preview)
var worker = builder.AddRustApp("worker", "../rust-worker")
    .WithReference(redis)
    .WithReference(rabbit)
    .WaitFor(redis);

builder.Build().Run();
```

This single AppHost starts 6 services across 5 languages plus 4 infrastructure resources, all wired together with automatic service discovery.
