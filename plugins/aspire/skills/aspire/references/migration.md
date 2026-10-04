# Migration & Breaking Changes (per version)

Agent-facing scrub list. Use it when reviewing AppHost code, scripts, or CI for an Aspire version
bump. Each row is a pattern to **search for and replace** before recommending or generating code.

Sources: [Aspire 13.6 release notes](https://aspire.dev/whats-new/aspire-13-6/),
[Aspire 13.5 release notes](https://aspire.dev/whats-new/aspire-13-5/),
[Aspire 13.4 release notes](https://aspire.dev/whats-new/aspire-13-4/), and
[Aspire 13.3 release notes](https://aspire.dev/whats-new/aspire-13-3/) (verified against the live
13.6.0 CLI).

---

## 13.5 → 13.6

| Change | Migration |
|---|---|
| **MongoDB uses TLS by default** — `AddMongoDB` servers (incl. standalone) get the shared developer certificate; the generated connection string includes `tls=true` | Consume the **complete generated connection string** (don't hand-build URIs). Clients must trust the dev cert and connect with a matching hostname — container-to-container clients can hit hostname mismatches. Opt out per resource with `WithoutHttpsCertificate()` / `withoutHttpsCertificate()` (not recommended with replica sets), or use `WithTlsMode(...)` with `PreferTls` (accepts plaintext and TLS, still advertises TLS). The global `ASPIRE_DEVELOPER_CERTIFICATE_DEFAULT_HTTPS_TERMINATION=false` also affects other resources. Local defaults don't configure TLS for published containers. |
| **Cosmos DB `RunAsEmulator` now selects the Linux vNext emulator** (`vnext-latest`, was classic `stable`) | Use `RunAsClassicEmulator()` / `runAsClassicEmulator()` to keep the classic emulator. Otherwise: re-seed persisted data (vNext stores under `/data`, classic under `/tmp/cosmos/appdata`); remove `WithPartitionCount` (throws `NotSupportedException` on vNext); call `WithDataExplorer()` if you want Data Explorer (off by default on vNext); replace obsolete `RunAsPreviewEmulator` with `RunAsEmulator`; drop `ASPIRECOSMOSDB001` suppressions. Revalidate tests and startup expectations. |
| **Front Door origin names include the backend hostname** | Upgrading changes generated origin resource names even when the hostname didn't change, and incremental ARM deployments don't remove the old ones. Deploy, confirm health, then manually delete the old origins — or preserve previous names with the `ConfigureInfrastructure` override (see [Deployment](deployment.md#azure-front-door-origin-names-136)). |
| **Portable connection-string names** — names with hyphens/repeated underscores get a portable alias (`my-db` → `ConnectionStrings__my_db`) | After deployment, Azure App Service, Kubernetes, and Foundry emit **only** the portable alias. Update client integrations alongside the hosting packages (they resolve the logical name first, then the alias); code that reads env vars directly must not assume `ConnectionStrings__my-db` exists — prefer an explicit portable name (`my_db`) or add a logical-then-portable fallback. Colliding names (`my-db` + `my_db`) now **fail** during resolution instead of overwriting. |
| **Terminal APIs moved namespace** — `TerminalService`, `AspireTerminal`, `AspireTerminalKey`, `TerminalLaunchOptions`, `TerminalOwner`, `TerminalPlacement`: `Aspire.Hosting.Terminals` → `Aspire.Hosting.ApplicationModel` (build-breaking, no shim) | Replace `using Aspire.Hosting.Terminals;` with `using Aspire.Hosting.ApplicationModel;` (already an SDK implicit using). `TerminalInteractionOptions` and `WithTerminal` stay in `Aspire.Hosting`. Logger category becomes `Aspire.Hosting.ApplicationModel.TerminalService`. Still gated by `ASPIRETERMINAL001`. |
| **`Aspire.Hosting.GitHub.Models` removed** (deprecated in 13.5) | The final 13.5.x package stays on NuGet but is hidden from `aspire add`. Migrate to Microsoft Foundry. |

**Behavior changes (not on the official breaking list, but scrub scripts for them):**

- **`aspire agent init` no longer configures MCP by default** — it installs skills only. Add `--mcp`
  in scripts that expect the MCP server; `aspire new`/`aspire init` also leave MCP unselected.
- **`aspire stop --force` preserves volumes** — add `--volumes` to also delete Aspire-owned named volumes.
- **`aspire wait` exits with code `18`** when the resource reaches `FailedToStart`, even when waiting for `down`.
- **`features.terminalCommandsEnabled` is gone** — the `aspire terminal` group is always available.
- **Coordinated .NET builds** — `AddDotnetProject` projects build in shared restore/build groups and
  need .NET SDK `11.0.100-rc.1`+ (file-based apps: `11.0.100-rtm.26473.104` or stable `11.0.100`+).
  Projects with per-project restore hooks can opt out via the `Aspire:Dotnet:RestoreProjectsIndividually`
  configuration value. `Aspire.Hosting.Dotnet` is **still a prerelease package** — "no suppression
  needed" doesn't mean stable.
- **Default image bumps** — App Configuration emulator `1.0.2` → `1.2.0` (now health-checks `/health`,
  so `OnResourceReady` runs only once the emulator accepts requests); Cosmos DB emulator `stable` →
  `vnext-latest` (covered by the Cosmos row above). Pin with `WithImageTag(...)` if needed.
- **`AddDotnetProject` resources now publish** via .NET SDK container publishing (13.5 failed publish/deploy).
- **Cosmos DB / AI Inference clients add default-on health checks** — `AddAzureCosmosClient`,
  `AddKeyedAzureCosmosClient`, and AI Inference (calls `/info`); set `DisableHealthChecks` if an
  endpoint doesn't support it.

**Diagnostics in 13.6:** retired **`ASPIREDOTNETPROJECT001`** (coordinated builds are the default — remove
suppressions) and **`ASPIRECOSMOSDB001`** (vNext is the default). New: `ASPIREDENO001` (Deno hosting),
`ASPIREAZUREPROVISIONING001` (`Aspire.Hosting.Azure.Provisioning.*` proxies), `ASPIREACAEXPRESS001`
(`AsExpress`). Also listed in the 13.6 diagnostics reference: `ASPIREBLAZOR001` (Blazor WebAssembly
hosting types), `ASPIRECOMMAND001` (required command validation), `ASPIREACANAMING001`
(`WithCompactResourceNaming`), and Radius IDs `ASPIRERADIUS003/004/006/057`. `ASPIRETERMINAL001` is unchanged.

**New preview packages** (prerelease-only, `13.6.0-preview.*`): `Aspire.Hosting.Java`,
`Aspire.Hosting.Rust`, `Aspire.Hosting.Azure.Sandboxes`, `Aspire.Hosting.Azure.ConnectorNamespace`
(and `Aspire.Hosting.Dotnet` remains preview). Deno ships inside `Aspire.Hosting.JavaScript`.

### Migration checklist (13.5 → 13.6)

1. **Update the CLI first** — `aspire update --self`, then `aspire update` from the repo root (it now
   also bumps repo-local CLI references in npm and `.config/dotnet-tools.json` manifests).
2. **Terminal code** — `using Aspire.Hosting.Terminals;` → `using Aspire.Hosting.ApplicationModel;`.
3. **MongoDB** — make clients use the generated connection string and trust the dev cert, or opt out
   with `WithoutHttpsCertificate()` / `WithTlsMode(...)`.
4. **Cosmos DB** — decide vNext vs `RunAsClassicEmulator()`; remove `WithPartitionCount` and
   `RunAsPreviewEmulator`; re-seed data; add `WithDataExplorer()` if needed.
5. **Connection strings** — grep for `ConnectionStrings__` reads of hyphenated names in non-.NET
   services; rename resources to portable names or add fallbacks; fix colliding names.
6. **Front Door** — plan the origin-name change (redeploy + delete old origins, or keep names via
   `ConfigureInfrastructure`).
7. **Suppressions/config** — remove `ASPIREDOTNETPROJECT001` / `ASPIRECOSMOSDB001` suppressions and any
   `features.terminalCommandsEnabled` config.
8. **Scripts/CI** — add `--mcp` to `aspire agent init` if MCP is wanted; add `--volumes` where
   `aspire stop --force` was expected to delete volumes; handle `aspire wait` exit code `18`.
9. **Review** GitHub Models usage (migrate to Foundry) and the .NET 11 SDK requirement for
   `AddDotnetProject`.

---

## 13.4 → 13.5

| Change | Migration |
|---|---|
| **`ServiceProvider` → `Services`** on hosting context types | Rename the property at every use site (e.g. `ctx.ServiceProvider` → `ctx.Services`). |
| **`PublishAsConnectionString` obsolete** | Switch to `AddConnectionString` in publish-mode app model code. |
| **`aspire ps --resources` and `--include-hidden` removed** | `aspire ps` now shows AppHost-level summaries only; use `aspire describe` for resource detail (add `--include-hidden` there). `--include-hidden` remains on the `aspire resource` subcommand. Verified on 13.5.0. |
| **GitHub Models integration deprecated** | `Aspire.Hosting.GitHub.Models` APIs are `[Obsolete]` and the package no longer appears in `aspire add` output; it will be removed in a future release. Migrate to the Azure AI Foundry integration. |
| **Proxyless endpoint port allocation timing changed** | Proxyless endpoints without an explicit public `port` now receive one during service preparation, before workload resources are created. Default range `10000-32767`; override with `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE=start-end`. |
| **Go polyglot: single optional `options` DTO passed directly** | When an exported API has exactly one optional `options` DTO parameter, the Go generator now passes the DTO directly instead of a generated method-options wrapper struct. Regenerate the SDK and update call sites that used the wrapper form. |
| **`TerminalOptions.Shell` removed; `Columns`/`Rows` validated** | Delete `Shell` assignments. `Columns`/`Rows` now throw `ArgumentOutOfRangeException` when zero or negative. Internal terminal types are gated behind `ASPIRETERMINAL001`. |
| **`DevTunnelRegion` enum values normalized** | `UkSouth` → `UKSouth`, `SouthEastAsia` → `SoutheastAsia`, etc. Fix old spellings. |
| **Dashboard AI Assistant removed** | The chat UI is gone from the dashboard; use the `aspire agent init` agentic flow instead. |
| **VS Code dashboard auto-launch removed** | The extension no longer opens the dashboard automatically; opt in with the `dashboardBrowser` setting or the `launch.json` value. |
| **Orleans provider annotation internal** | `OrleansProviderTypeAnnotation` and `ProviderConfiguration` are now internal; remove external references. |
| **`DotnetProjectResource` moved to `Aspire.Hosting.Dotnet` and made experimental** | Reference the new `Aspire.Hosting.Dotnet` package, update the namespace, and suppress `ASPIREDOTNETPROJECT001`. `aspire publish`/`aspire deploy` fail with an actionable error for path-based projects — use `AddCSharpApp(...)`/`addCSharpApp(...)` or `PublishAsDockerFile(...)` when publishing. *(13.6: suppression retired and these resources participate in .NET SDK container publishing.)* |

**New diagnostics introduced in 13.5** (suppress per-line or via `<NoWarn>` when you opt into the API):
`ASPIRETERMINAL001` (`WithTerminal()` + `aspire terminal` CLI group),
`ASPIRECERTIFICATES001` (`WithHttpsDeveloperCertificate`/`WithHttpsCertificate`/`WithHttpsCertificateConfiguration`),
`ASPIREDOTNETPROJECT001` (`AddDotnetProject`), `ASPIRECOMPUTE002` (Kubernetes/AKS
`AddPersistentVolume`), `ASPIREACANAMING002` (`WithUniqueResourceNaming`), `ASPIREAZURE003`
(virtual-network builder APIs in `Aspire.Hosting.Azure.Network`). CLI-bundle diagnostics:
`ASPIRE009` (error, bundle can't be resolved), `ASPIRE010` (warning, project opts out),
`ASPIRE011` (`dnx` unavailable). **`ASPIREINTERACTION001` scope narrowed** — the core prompt/input
APIs (`PromptInputAsync`, `PromptInputsAsync`, `InteractionInput`, `InputType`,
`InteractionInputCollection`) and file-upload inputs are now stable; only `PromptProgressAsync`
(progress dialogs) still requires the suppression.

### Migration checklist (13.4 → 13.5)

1. **Update the CLI first** — `aspire update --self`.
2. **Update projects** — `aspire update` from the repo root.
3. **Apply pending migrations** — `aspire update --migrate` (migrates legacy TypeScript AppHost
   entry points `apphost.ts` → `apphost.mts`).
4. **Scrub renamed APIs** — `ctx.ServiceProvider` → `ctx.Services`; `PublishAsConnectionString` →
   `AddConnectionString`; `TerminalOptions.Shell` (delete); `DevTunnelRegion` spellings
   (`UKSouth`, `SoutheastAsia`).
5. **Audit scripts/CI** — remove `aspire ps --resources` / `aspire ps --include-hidden`; use
   `aspire describe [--include-hidden]` instead.
6. **Stabilize interaction code** — remove `ASPIREINTERACTION001` suppressions where only the core
   prompt/file-upload APIs are used; keep it for `PromptProgressAsync`.
7. **Review** GitHub Models usage (migrate to Azure AI Foundry), proxyless endpoint port
   assumptions, Go AppHosts using the options-wrapper form (regenerate SDK), and VS Code
   `dashboardBrowser` opt-in if you relied on auto-launch.

---

## 13.3 → 13.4

| Change | Migration |
|---|---|
| **TypeScript AppHost is GA** (was preview in 13.2/13.3) | No code change required. The Aspire Type System (ATS) is GA — **remove `ASPIREATS001` suppressions**. |
| **Generated TS SDK moved** `.modules/` → `.aspire/modules/`; import `aspire.js` → `aspire.mjs`; entry `apphost.ts` → `apphost.mts` | New projects use the new layout. Existing `apphost.ts` projects keep working on the **legacy `.modules/`** layout automatically; migrate only if you want the new default (rename entry to `apphost.mts`, update the import + `tsconfig` `include` + `appHost.path`, then `aspire restore`). **13.5+:** prefer `aspire update --migrate` over hand-renaming — it updates packages first, then migrates config/tsconfig/imports, so get the user's approval for both. |
| **`aspire exec` removed** (with its backchannel + feature flag) | Remove scripts that call `aspire exec`. Use `aspire resource <resource> <command>` for resource-specific actions. |
| **Go hosting graduated to core** — `CommunityToolkit.Aspire.Hosting.Golang` / `AddGolangApp` → `Aspire.Hosting.Go` / `AddGoApp` | Replace package + method. The CommunityToolkit Go package is deprecated. |
| **Bun hosting graduated to core** — `CommunityToolkit.Aspire.Hosting.Bun` → `Aspire.Hosting.JavaScript`; `AddBunApp(name, appDirectory, scriptPath)` | Replace package reference; Bun support ships in `Aspire.Hosting.JavaScript`. |
| **`PublishAsNpmPackageScript` → `PublishAsPackageScript`** (param `startScriptName` → `scriptName`) | Rename call sites and the parameter; the helper now covers npm, pnpm, Yarn, and Bun. |
| **Kubernetes `Ingress.WithRoute(...)` → `WithPath(...)`**; `IngressPathType` split into `KubernetesIngressPathType` / `KubernetesGatewayPathType` | Rename ingress calls and switch the enum. Gateway API `gateway.WithRoute(...)` is **unchanged**. |
| **K8s ingress/gateway routes require external endpoints** | Call `WithExternalHttpEndpoints()` on any resource routed through an ingress/gateway (else `InvalidOperationException` at publish). |
| **Helm config consolidated on `WithHelm(...)`** | Move chart name/version/description/release-name/namespace property assignments into `WithHelm(...)`. |
| **Azure Front Door** now uses Azure.Provisioning name generation | Upgrading can produce duplicate endpoint/origin/route names; set `Name` explicitly via `ConfigureInfrastructure` or remove-and-re-add. |
| **Foundry hosted agents** — `PublishAsHostedAgent` → `WithComputeEnvironment`; `AddPromptAgent` now takes the **resource name first**; `AsHostedAgent` / `RunAsHostedAgent` removed | Update registrations accordingly. *(`AsHostedAgent` is available again in later releases — 13.6 `Aspire.Hosting.Foundry` has it; check `aspire docs api search AsHostedAgent` before removing calls.)* |
| **Keycloak primary endpoint is now HTTPS** (when the dev cert is enabled) | Update references that assumed an HTTP primary endpoint. |
| **`aspire update` requires `--yes` in non-interactive mode** (matches `aspire destroy`) | Add `--yes`/`-y` to CI invocations. |
| **Resource command inputs are named CLI options** (not positional) | `aspire resource <res> <cmd> --<input> <value>`; boolean options require explicit `true`/`false`. |
| **`Aspire.Hosting.Testing` prefers the `https` endpoint** in `CreateHttpClient` / `GetEndpointUriString` when no name is given | Pass an explicit endpoint name if tests relied on the previous `http`-first behavior. |
| **RabbitMQ default image 4.2 → 4.3** | 4.3 rejects transient non-exclusive queue declarations by default; pin with `WithImageTag(...)` if needed. |
| **`AddNatsClient` now registers `INatsClient`** + default serializer registry | User-provided registries still take precedence; usually no action. |

**New diagnostics introduced in 13.4** (suppress per-line or via `<NoWarn>` when you opt into the API):
`ASPIREPERSISTENCE001` (shared resource-lifetime APIs), `ASPIREPROCESSCOMMAND001`
(`WithProcessCommand`), `ASPIREBROWSERLOGS001` (`WithBrowserLogs`). **`ASPIREATS001` was removed.**

### Migration checklist (13.3 → 13.4)

1. **Update the CLI first** — `aspire update --self`. **Required for TypeScript AppHosts**: running
   `aspire update` on a 13.3.x TS project before updating the CLI fails with
   `No code generator found for language: TypeScript` and leaves it half-upgraded
   ([aspire#17077](https://github.com/microsoft/aspire/issues/17077)).
2. **Update projects** — `aspire update` from the repo root (regenerates SDK modules under `.aspire/modules/`).
3. **`aspire doctor`** — check the environment and spot conflicting CLI installs.
4. **Audit scripts/CI** — remove `aspire exec`; add `--yes` to non-interactive `aspire update`.
5. **Kubernetes code** — `WithHelm(...)`, `ingress.WithRoute` → `WithPath`, mark routed endpoints external.
6. **Renamed APIs** — `PublishAsNpmPackageScript` → `PublishAsPackageScript`; Foundry
   `PublishAsHostedAgent` → `WithComputeEnvironment` (new `AddPromptAgent` parameter order).
7. **Review** Keycloak (HTTPS primary), Azure Front Door (explicit names), RabbitMQ (4.3 queues).

---

## 13.2 → 13.3

| Change | Migration |
|---|---|
| `--log-level` → **`--pipeline-log-level`** on `aspire publish` / `aspire deploy` | Update CI/CD scripts. |
| **Dashboard MCP server removed** along with `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL` | AI agents now connect via an **AppHost-level MCP server** — run `aspire agent init`. Delete the env var if set. |
| **In-dashboard GitHub Copilot UI removed** | Replaced by the `aspire agent init`-driven agentic flow (works with Copilot, Claude, Cursor, any MCP/skill agent). |
| `NameOutput` → **`NameOutputReference`** (Azure Network resources) | Replace every `*.NameOutput`. |
| `OtlpEndpointEnvironmentVariableName` property removed | Remove it; the OTLP endpoint env var is managed automatically. |
| `AksSkuTier` enum removed | Delete the reference; AKS control plane defaults to the **Free** SKU. |
| `AddAndPublishPromptAgent` removed | Use `AddPromptAgent`. *(In 13.4 its parameter order changed — see above.)* |
| Kubernetes Ingress / Gateway routing types moved namespaces | Update `using` directives that reference these types directly. |
| `package.json` `engines.node` no longer drives Node image selection | Pin the Node version explicitly via `WithDockerfile` or your Dockerfile base image. |
| `dotnet new aspire-py-starter` removed | Use `aspire new aspire-py-starter` (template moved to the Aspire CLI). |
| TypeScript per-kind `withEnvironment*` helpers deprecated | Use the unified **`withEnvironment(name, value)`** — it accepts string, `ReferenceExpression`, `EndpointReference`, parameter/connection-string builders, or `IExpressionValue`. |
| `ASPIREEXTENSION001` (JS diagnostic) renamed to **`ASPIREJAVASCRIPT001`** | Update `#pragma warning disable` that targeted JavaScript hosting APIs. `ASPIREEXTENSION001` itself still exists for the experimental **extension debugging support** APIs (e.g. the 13.6 `WithDebugSupport` overload) — keep those suppressions. |
| CLI telemetry `--format json` schema aligned with the MCP tool format | Update parsers consuming `--format json` from telemetry commands. |
| Docker Swarm `UpdateConfig` property types changed | Update generated/hand-written Swarm overrides. |
| **`aspire init` no longer wires the AppHost** | It drops a skeleton (`aspire.config.json` + AppHost stub); wire resources/integrations yourself afterward. |

### Deprecated TypeScript `withEnvironment*` → unified API

| Old (deprecated) | Replacement |
|---|---|
| `withEnvironmentExpression(name, expr)` | `withEnvironment(name, expr)` |
| `withEnvironmentEndpoint(name, endpoint)` | `withEnvironment(name, endpoint)` |
| `withEnvironmentParameter(name, param)` | `withEnvironment(name, param)` |
| `withEnvironmentConnectionString(name, resource)` | `withEnvironment(name, resource)` |
| `withEnvironmentFromOutput(name, output)` | `withEnvironment(name, output)` |
| `withEnvironmentFromKeyVaultSecret(name, secret)` | `withEnvironment(name, secret)` |

### Migration checklist (13.2 → 13.3)

1. `aspire update --self`, then `aspire update` from the repo root (get approval before running in CI).
2. Rename `--log-level` → `--pipeline-log-level` in pipelines.
3. Scrub AppHost code for: `NameOutput`→`NameOutputReference`, `AddAndPublishPromptAgent`→`AddPromptAgent`,
   `AksSkuTier` (delete), `OtlpEndpointEnvironmentVariableName` (delete), `ASPIREEXTENSION001`→`ASPIREJAVASCRIPT001`
   (only where it suppressed JavaScript hosting APIs).
4. Replace `dotnet new aspire-py-starter` with `aspire new aspire-py-starter`.
5. Re-run `aspire agent init` if you relied on the dashboard MCP server / `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL`.
6. Replace deprecated TS `withEnvironment*` helpers with the unified `withEnvironment(name, value)`.
7. Re-pin Node versions in Dockerfiles; update K8s `using` directives and Docker Swarm overrides as needed.
