# Migration & Breaking Changes (per version)

Agent-facing scrub list. Use it when reviewing AppHost code, scripts, or CI for an Aspire version
bump. Each row is a pattern to **search for and replace** before recommending or generating code.

Sources: [Aspire 13.4 release notes](https://aspire.dev/whats-new/aspire-13-4/) and
[Aspire 13.3 release notes](https://aspire.dev/whats-new/aspire-13-3/) (verified against the live
13.4.2 CLI).

---

## 13.3 → 13.4

| Change | Migration |
|---|---|
| **TypeScript AppHost is GA** (was preview in 13.2/13.3) | No code change required. The Aspire Type System (ATS) is GA — **remove `ASPIREATS001` suppressions**. |
| **Generated TS SDK moved** `.modules/` → `.aspire/modules/`; import `aspire.js` → `aspire.mjs`; entry `apphost.ts` → `apphost.mts` | New projects use the new layout. Existing `apphost.ts` projects keep working on the **legacy `.modules/`** layout automatically; migrate only if you want the new default (rename entry to `apphost.mts`, update the import + `tsconfig` `include` + `appHost.path`, then `aspire restore`). |
| **`aspire exec` removed** (with its backchannel + feature flag) | Remove scripts that call `aspire exec`. Use `aspire resource <resource> <command>` for resource-specific actions. |
| **Go hosting graduated to core** — `CommunityToolkit.Aspire.Hosting.Golang` / `AddGolangApp` → `Aspire.Hosting.Go` / `AddGoApp` | Replace package + method. The CommunityToolkit Go package is deprecated. |
| **Bun hosting graduated to core** — `CommunityToolkit.Aspire.Hosting.Bun` → `Aspire.Hosting.JavaScript`; `AddBunApp(name, appDirectory, scriptPath)` | Replace package reference; Bun support ships in `Aspire.Hosting.JavaScript`. |
| **`PublishAsNpmPackageScript` → `PublishAsPackageScript`** (param `startScriptName` → `scriptName`) | Rename call sites and the parameter; the helper now covers npm, pnpm, Yarn, and Bun. |
| **Kubernetes `Ingress.WithRoute(...)` → `WithPath(...)`**; `IngressPathType` split into `KubernetesIngressPathType` / `KubernetesGatewayPathType` | Rename ingress calls and switch the enum. Gateway API `gateway.WithRoute(...)` is **unchanged**. |
| **K8s ingress/gateway routes require external endpoints** | Call `WithExternalHttpEndpoints()` on any resource routed through an ingress/gateway (else `InvalidOperationException` at publish). |
| **Helm config consolidated on `WithHelm(...)`** | Move chart name/version/description/release-name/namespace property assignments into `WithHelm(...)`. |
| **Azure Front Door** now uses Azure.Provisioning name generation | Upgrading can produce duplicate endpoint/origin/route names; set `Name` explicitly via `ConfigureInfrastructure` or remove-and-re-add. |
| **Foundry hosted agents** — `PublishAsHostedAgent` → `WithComputeEnvironment`; `AddPromptAgent` now takes the **resource name first**; `AsHostedAgent` / `RunAsHostedAgent` removed | Update registrations accordingly. |
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
| `ASPIREEXTENSION001` (JS diagnostic) renamed to **`ASPIREJAVASCRIPT001`** | Update `#pragma warning disable` and any code-search rules. |
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
   `AksSkuTier` (delete), `OtlpEndpointEnvironmentVariableName` (delete), `ASPIREEXTENSION001`→`ASPIREJAVASCRIPT001`.
4. Replace `dotnet new aspire-py-starter` with `aspire new aspire-py-starter`.
5. Re-run `aspire agent init` if you relied on the dashboard MCP server / `ASPIRE_DASHBOARD_MCP_ENDPOINT_URL`.
6. Replace deprecated TS `withEnvironment*` helpers with the unified `withEnvironment(name, value)`.
7. Re-pin Node versions in Dockerfiles; update K8s `using` directives and Docker Swarm overrides as needed.
