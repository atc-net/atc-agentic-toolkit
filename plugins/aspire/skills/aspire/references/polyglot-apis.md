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

**`.WithBrowserLogs()` (browser console + screenshots, 13.3+).** Attaches a tracked Chromium session to any resource that exposes an HTTP/HTTPS endpoint (not just JS frontends). Browser console logs, errors, and network events stream into the resource's log view in the dashboard, and you can capture screenshots as command artifacts. Ships in the `Aspire.Hosting.Browsers` package (`aspire add browsers`). The API is experimental — in C# AppHosts suppress `ASPIREBROWSERLOGS001`.

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

---

## Community (CommunityToolkit/Aspire)

All community integrations follow the same pattern: install the NuGet package in your AppHost, then use the `Add*App()` method.

### Java (Spring Boot)

**Package:** `CommunityToolkit.Aspire.Hosting.Java`

```csharp
builder.AddSpringApp("spring-api", "../spring-service")
    .WithHttpEndpoint(targetPort: 8080)
    .WithReference(postgres)
    .WaitFor(postgres);
```

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`
- `.WithMavenBuild()` — run Maven build before start
- `.WithGradleBuild()` — run Gradle build before start

**Java service discovery:** Env vars via `System.getenv()`:
```java
String dbConn = System.getenv("ConnectionStrings__db");
```

### Rust

**Package:** `CommunityToolkit.Aspire.Hosting.Rust`

```csharp
builder.AddRustApp("rust-worker", "../rust-service")
    .WithHttpEndpoint(targetPort: 3000)
    .WithReference(redis)
    .WaitFor(redis);
```

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`
- `.WithCargoBuild()` — run `cargo build` before start

### Deno

**Package:** `CommunityToolkit.Aspire.Hosting.Deno`

```csharp
builder.AddDenoApp("deno-api", "../deno-service")
    .WithHttpEndpoint(targetPort: 8000)
    .WithReference(redis);
```

Chaining methods:
- `.WithHttpEndpoint(port?, targetPort?, name?)`
- `.WithReference(resource)`
- `.WithEnvironment(key, value)`
- `.WaitFor(resource)`

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

// Java analytics service (Spring Boot)
var analytics = builder.AddSpringApp("analytics", "../spring-analytics")
    .WithHttpEndpoint(targetPort: 8080)
    .WithReference(mongo)
    .WithReference(rabbit)
    .WaitFor(mongo);

// Rust high-perf worker
var worker = builder.AddRustApp("worker", "../rust-worker")
    .WithReference(redis)
    .WithReference(rabbit)
    .WaitFor(redis);

builder.Build().Run();
```

This single AppHost starts 6 services across 5 languages plus 4 infrastructure resources, all wired together with automatic service discovery.
