# Wiring — Bootstrapping and Wiring an Existing Repo into an AppHost

How to add Aspire to a repo and wire its services into the AppHost: choose `aspire new` vs `aspire init`,
scan the repo, propose a resource graph, edit the AppHost, and validate. This covers the same ground as
Microsoft's `aspire-init` and `aspireify` skills, so you don't need those installed.

Use it when there's **no AppHost yet**, when the AppHost is an **unwired stub** (just scaffolded, empty
`builder.Build().Run()`, `aspire.config.json` without resources), or when the user asks to add services or
integrations. For lifecycle (start/stop/restart) see [SKILL.md](../SKILL.md#7-common-patterns). For
`AddProject` → `AddDotnetProject` see [Project v2 Migration](project-v2-migration.md). For deployment, see
[Deployment](deployment.md).

---

## 1. Bootstrap: `aspire new` vs `aspire init`

Only bootstrap when **all** of these hold: there's no C#, file-based, TypeScript, or Go AppHost; there's no
`aspire.config.json` at the root; and the user explicitly wants to add Aspire. If an AppHost exists, stop
and wire it instead (§ 2).

| Situation | Command |
|---|---|
| Empty directory / brand-new app | `aspire new <template> -n <Name> -o <dir> --non-interactive --suppress-agent-init` — starters come pre-wired, so go straight to validation (§ 6) |
| Existing repo | `aspire init --language csharp\|typescript\|go --non-interactive --suppress-agent-init` (`--language` is required non-interactively when more than one is possible), then wire (§ 2–6) |
| Smallest scaffold | `aspire-empty`, `aspire-ts-empty`, `aspire-go-empty` (17.0+) |
| Python services | `aspire-py-starter` (TypeScript AppHost; `dotnet new aspire-py-starter` was removed in 13.3) |

**Picking the AppHost language:** it's the language the user wants to *write orchestration in*, not the
language of the services. A repo full of Go services can still have a C# AppHost — don't pick `go` just
because there's a `go.mod`. A Go AppHost needs 17.0+ and Go 1.26+; on 13.x, adding Go support needs the
user's approval.

**What init does *not* do:** wire resources, modify project files, change `global.json`, or trust the dev
certificate. Go init writes `apphost.go` + `go.mod` into the current directory and stops if a `go.mod`
already exists — run it from a subdirectory such as `apphost/`. TypeScript init in a repo that already has
a root `package.json` nests the AppHost in `aspire-apphost/`.

**Errors:** AppHost already exists → stop and wire it. Missing `--language` → add it. Go `go.mod` conflict →
use a subdirectory. Missing `#:package` versions → rerun with `--channel stable` (or `daily`). Legacy TS
`apphost.ts` → that's an `aspire update --migrate` (with approval), not an init.

---

## 2. Principles

- **Minimize changes to user code.** Prefer `WithEnvironment(...)` that maps to the variables the service
  already reads, Aspire-managed ports, and 1:1 mappings from existing Compose files. Don't restructure,
  rename, or change build scripts without explaining the trade-off and getting a yes.
- **Offer the zero-code option first**, then the small-code option (e.g. adding ServiceDefaults), and let
  the user choose.
- **Never overwrite files** — merge into existing `package.json`, `tsconfig`, ESLint config, `.csproj`,
  solution files. Never delete `.env*`, `secrets.json.example`, or a `UserSecretsId` without approval.
- **Verify every API** with `aspire docs search` / `aspire docs api search --language …` and
  `aspire integration search` before writing it. Never invent packages, builder methods, or overloads.
- **Keep configuration visible** — if a service reads `.env`, keep it and say how Aspire values relate.
- **HTTPS by default** for HTTP services; pass endpoint references instead of URLs; never hard-code
  `localhost:<port>`.
- **Persistent data** — prefer `WithDataVolume()` + persistent lifetime for databases once the user is
  past early prototyping; resetting persistent data (volumes) needs explicit approval for the exact resource.
- **Keep the repo's SDKs and versions** (root `global.json`, TFMs, package versions, `packageManager`,
  lockfiles). One Aspire release family for all `Aspire.*` packages.
- **Ask before changing service code**, especially OTel and ServiceDefaults wiring.

---

## 3. Workflow: SCAN → PROPOSE → EDIT → VALIDATE → HAND OFF

### Scan (read-only)

- Projects and their types: `.csproj` (`dotnet msbuild <proj> -getProperty:OutputType`), `package.json`
  (scripts, framework, `packageManager`), `pyproject.toml`/`requirements.txt`, `go.mod`, `pom.xml`/`build.gradle`,
  `Cargo.toml`, Dockerfiles, `docker-compose*.yml`.
- Dependencies: connection strings and hard-coded hosts (`grep -rn "localhost:\|ConnectionStrings\|REDIS_URL\|DATABASE_URL"`),
  `dotnet list package` (e.g. `StackExchange.Redis`, `Npgsql`), `go.mod` require blocks.
- Existing ServiceDefaults (`*.ServiceDefaults.csproj`, `<IsAspireSharedProject>true`) — reuse, don't duplicate.

Map what you find to integrations — e.g. `AddStackExchangeRedisCache` → `AddRedis`, Npgsql → `AddPostgres`,
`postgres` image → `AddPostgres`, `mssql` → `AddSqlServer`, `azurite` → `AddAzureStorage().RunAsEmulator()`,
`rabbitmq` → `AddRabbitMQ`, `mongo` → `AddMongoDB`, Kafka → `AddKafka`.

### Propose (then wait)

Present the resource graph before editing: each resource, its Aspire API and package, references/waits,
endpoints, what changes in which file, and open questions (ports to keep? persistent data? which Compose
profile?). **Wait for confirmation** — then edit only what was approved.

### Edit

Wire in tiers — prefer the higher tier:

1. **Typed integrations** (`Aspire.Hosting.*`: `AddPostgres`, `AddRedis`, `AddViteApp`, `AddPythonApp`,
   `AddGoApp`, `AddDotnetProject`, …) — install with `aspire add <name>` (then `aspire restore` for TS/Go).
2. **Generic resources** — `AddExecutable`, `AddDockerfile`, `AddContainer` — only when no integration fits.

Rules while wiring:

- `WithReference(x)` for service-to-service and resource connections; `WithEnvironment("NAME", ref)` when a
  service needs a specific variable name. Check each integration's **connection properties** in the docs
  before modeling passwords — typed integrations generate them (`POSTGRES_PASSWORD`, `MSSQL_SA_PASSWORD`, …
  from a Compose file should *not* become parameters).
- `WaitFor(x)` for infrastructure; `WaitForCompletion(job)` for migration/seed jobs.
- **Never pass secrets through `WithArgs()`** — use parameters (`AddParameter(name, secret: true)`) and env vars.
- `WithExternalHttpEndpoints()` on user-facing resources only. Admin/management endpoints:
  `WithEndpoint("admin", e => e.ExcludeReferenceEndpoint = true)`. `WithEndpoint(name, …)` updates an existing
  endpoint rather than throwing.
- HTTPS: `WithHttpsEndpoint()`; JS and Python HTTPS servers use `WithHttpsDeveloperCertificate()`. A Redis TLS
  handshake failure is fixed with `WithoutHttpsCertificate()` on that resource — not by switching to `AddContainer()`.
  Never use `WithUrlForEndpoint` to fake `*.dev.localhost` URLs.
- gRPC: `WithEndpoint(...)` with the right `UriScheme`/`Transport`.
- Use `context.Services` (C#) / `ctx.services()` (TS) in callbacks — `ServiceProvider` is obsolete.
  Use `AddConnectionString`, not `PublishAsConnectionString`. Check `IInteractionService.IsAvailable` before prompting.
- When the AppHost has several compute environments, assign each resource with `WithComputeEnvironment(env)`.
- Optional settings: `AddParameter(name).AsOptional()` (17.0) instead of empty defaults.

### Validate

```bash
aspire start --non-interactive --apphost <path> --format Json   # add --isolated in a worktree
aspire describe --apphost <path> --include-hidden --format Json
aspire wait <resource> --apphost <path>                          # each resource you added
aspire stop --apphost <path>                                     # if you started it only to validate
```

Fix failures from `aspire logs <resource>` / `aspire otel logs <resource>` before handing off. Optionally
run `aspire publish --list-steps` to confirm the model is deployable.

### Hand off

Once `aspire start` comes up clean, say the wiring is done and continue with the normal run/debug loop.

---

## 4. Docker Compose → AppHost

- **Profiles:** list them and ask which to model. Services without a profile always run.
- Map images to typed integrations (table above); `build:` → prefer native hosting (`AddDotnetProject`,
  `AddViteApp`, `AddPythonApp`, …) and fall back to `AddDockerfile`.
- `depends_on` → `WithReference` + `WaitFor`; `condition: service_completed_successfully` → `WaitForCompletion`.
- `ports` → drop host ports for typed integrations (Aspire assigns them); custom containers use
  `WithHttpEndpoint(targetPort: …)`. Ask before pinning a host port.
- `volumes` → `WithDataVolume()` / `WithVolume(name, target)` / `WithBindMount(source, target)`.
- `environment` → `WithEnvironment(...)` or `WithReference(...)`; secrets → parameters.
- Setup scripts → a resource command, an `AddExecutable(...)` + `WaitForCompletion`, or leave them manual (ask).

---

## 5. Large .NET solutions

- **Don't dump 60+ projects** into the AppHost. Classify (`OutputType`, web vs worker vs library vs test),
  wire a **core loop** first (frontend + API + its data stores), then add two or three projects at a time.
- Migration runners → `WaitForCompletion`. Custom MSBuild SDKs and `#if` conditional compilation → surface
  them and ask.
- **Mixed SDKs:** if the root `global.json` pins an SDK older than the AppHost needs (.NET 10 for 17.0), add a
  nested `global.json` in the AppHost directory (e.g. `"version": "10.0.100", "rollForward": "latestFeature"`).
  Don't change the root `global.json` or existing TFMs, and don't downgrade the AppHost.
- Ask whether the AppHost joins the solution (`dotnet sln add`).
- Reuse an existing ServiceDefaults project. Legacy `IHostBuilder`/`Startup` apps: offer to skip
  ServiceDefaults for them or to modernize — batch that decision; don't write `IHostBuilder` adapter extensions.

---

## 6. ServiceDefaults and OpenTelemetry

- **.NET:** if there's no ServiceDefaults project: `dotnet new install Aspire.ProjectTemplates@<aspire-version>`,
  then `dotnet new aspire-servicedefaults -n <App>.ServiceDefaults`. Each service references it and calls
  `builder.AddServiceDefaults()` and `app.MapDefaultEndpoints()` (`/health`, `/alive` in development). The
  AppHost then uses `.WithHttpHealthCheck("/health")` so `WaitFor` gates on real health. See
  [Architecture](architecture.md#servicedefaults-pattern).
- **Non-.NET:** Aspire injects `OTEL_EXPORTER_OTLP_ENDPOINT` (and service name/resource attributes).
  - Node: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/sdk-metrics`,
    `@opentelemetry/exporter-trace-otlp-grpc`, `@opentelemetry/exporter-metrics-otlp-grpc` (not the deprecated
    `exporter-otlp-grpc`; use the `metricReaders` array from sdk-node 0.204.0).
  - Python: `opentelemetry-distro`, `opentelemetry-exporter-otlp`, `opentelemetry-bootstrap -a install`, run under
    `opentelemetry-instrument`.
  - Go: `go.opentelemetry.io/otel`, `otlptracegrpc`, `sdk/trace`, `otelhttp`.
  - Java: the OpenTelemetry javaagent (`withOtelAgent(...)`).
- Frontends reach backends through `services__<name>__http__0` env vars (or the framework's proxy config).

---

## 7. JavaScript / TypeScript specifics

**Resource choice:** Vite → `AddViteApp`; a package script → `AddJavaScriptApp` (`WithRunScript("start:dev")`);
a Node entry file → `AddNodeApp`; Next.js → `AddNextJsApp` (stable in 17.0). Add
`.WithEnvironment("BROWSER", "none")` for dev servers that open a browser. Prefer these over hand-written
Dockerfiles; publish with `PublishAsStaticWebsite` / `PublishAsNodeServer` / `PublishAsPackageScript`.

**Package-manager detection** (first match wins, checked in the app's directory, then its parent):
`packageManager` in `package.json` → `bun.lock` / `bun.lockb` → `pnpm-lock.yaml` → `yarn.lock` →
`.yarnrc.yml` → `package-lock.json` → npm. Don't change `packageManager` or regenerate lockfiles to steer
detection. **Yarn Classic (1.x) is unsupported** — stop and ask the user to move to Yarn 4+ (or another manager).
In Yarn workspace monorepos, install once at the root instead of `.WithYarn()` per resource (EPERM on Windows).

**TypeScript AppHost `package.json`:** an existing root package gets delegate scripts
(`aspire:start`, `aspire:build`, `aspire:dev`); otherwise the AppHost lives in `aspire-apphost/`.
`engines.node` is `^20.19.0 || ^22.13.0 || >=24`. Don't add `"type": "module"` to an existing package, don't
overwrite scripts, and don't add Aspire SDK packages by hand (`aspire add` / `aspire restore` own
`.aspire/modules/`). The AppHost compiles with its own `tsconfig.apphost.json` (`module: nodenext`) — don't
repurpose the root `tsconfig.json`; only augment an existing ESLint config. Start with `aspire start`, never a
raw `npm run`/`tsx`.

**Unified `withEnvironment(name, value)`** — the per-kind `withEnvironmentEndpoint` / `…Parameter` /
`…ConnectionString` / `…Expression` / `…FromOutput` / `…FromKeyVaultSecret` helpers are deprecated (13.3).

---

## 8. Go AppHost specifics (17.0)

Edit only `apphost.go`; never `.aspire/modules/`. Add integrations with `aspire add <name>`, recover the SDK
with `aspire restore --apphost apphost.go`, check with `go vet .`, and run with `aspire start` — never
`go run .`. Errors are deferred to `Build()`/`Run()` (`aspire.FormatError`). Go services use `AddGoApp`
(`AddGoAppBuildTags`, `AddGoAppLdFlags`, `AddGoAppGcFlags`, `AddGoAppRaceDetector` options; `WithModTidy`
— the scaffold default — `WithModDownload`, `WithModVendor`, `WithVetTool`, `WithGoPrivate`,
`WithDelveServer`). Note `go mod tidy -e` can change `go.mod`/`go.sum`. See
[Polyglot APIs](polyglot-apis.md#go-apphost-preview-in-170).
