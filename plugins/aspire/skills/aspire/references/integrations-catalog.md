# Integrations Catalog

Aspire has **144+ integrations** across 13 categories. Rather than maintaining a static list, use the MCP tools to get live, up-to-date integration data.

---

## Discovering integrations

### CLI docs (13.2+)

On CLI 13.2+, search for integration documentation directly from the command line:

```bash
aspire docs search "redis"           # Find integration docs
aspire docs get <slug>               # Read the full guide
aspire add redis                     # Install into AppHost
```

### MCP tools (all versions)

The Aspire MCP server provides two tools for integration discovery — these work on **all CLI versions** (13.1+) and do **not** require a running AppHost.

| Tool                   | What it does                                                                                             | When to use                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `list_integrations`    | Returns all available Aspire hosting integrations with their NuGet package IDs                           | "What integrations are available for databases?" / "Show me all Redis-related integrations" |
| `get_integration_docs` | Retrieves detailed documentation for a specific integration package (setup, configuration, code samples) | "How do I configure PostgreSQL?" / "Show me the docs for `Aspire.Hosting.Redis`"            |

### Workflow

1. **Browse** — Call `list_integrations` to see what's available. Filter results by category or keyword.
2. **Deep dive** — Call `get_integration_docs` with the package ID (e.g., `Aspire.Hosting.Redis`) and version (e.g., `9.0.0`) to get full setup instructions.
3. **Add** — Run `aspire add <integration>` to install the hosting package into your AppHost.

> **Tip:** These tools return the same data as the [official integrations gallery](https://aspire.dev/integrations/gallery/). Prefer them over static docs — integrations are added frequently.

---

## Integration pattern

Every integration follows a two-package pattern:

- **Hosting package** (`Aspire.Hosting.*`) — adds the resource to the AppHost
- **Client package** (`Aspire.*`) — configures the client SDK in your service with health checks, telemetry, and retries
- **Community Toolkit** (`CommunityToolkit.Aspire.*`) — community-maintained integrations from [Aspire Community Toolkit](https://github.com/CommunityToolkit/Aspire)

```csharp
// === AppHost (hosting side) ===
var redis = builder.AddRedis("cache");  // Aspire.Hosting.Redis
var api = builder.AddProject<Projects.Api>("api")
    .WithReference(redis);

// === Service (client side) — in API's Program.cs ===
builder.AddRedisClient("cache");        // Aspire.StackExchange.Redis
// Automatically configures: connection string, health checks, OpenTelemetry, retries
```

---

## Categories at a glance

Use `list_integrations` for the full live list. This summary covers the major categories:

| Category            | Key integrations                                                                      | Example hosting package                  |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| **AI**              | Azure OpenAI, OpenAI, Microsoft Foundry, Ollama (GitHub Models **removed in 13.6**)   | `Aspire.Hosting.Azure.CognitiveServices` |
| **Caching**         | Redis, Garnet, Valkey, Azure Cache for Redis                                          | `Aspire.Hosting.Redis`                   |
| **Cloud / Azure**   | Storage, Cosmos DB, Service Bus, Key Vault, Event Hubs, Functions, SQL, SignalR (25+) | `Aspire.Hosting.Azure.Storage`           |
| **Cloud / AWS**     | AWS SDK integration                                                                   | `Aspire.Hosting.AWS`                     |
| **Databases**       | PostgreSQL, SQL Server, MongoDB, MySQL, Oracle, Elasticsearch, Milvus, Qdrant, SQLite | `Aspire.Hosting.PostgreSQL`              |
| **DevTools**        | Data API Builder, Dev Tunnels, Mailpit, k6, Flagd, Ngrok, Stripe                      | `Aspire.Hosting.DevTunnels`              |
| **Messaging**       | RabbitMQ, Kafka, NATS, ActiveMQ, LavinMQ                                              | `Aspire.Hosting.RabbitMQ`                |
| **Observability**   | OpenTelemetry (built-in), Seq, OTel Collector                                         | `Aspire.Hosting.Seq`                     |
| **Compute**         | Docker Compose, Kubernetes, AKS, Radius (preview, 13.5+), ACA Sandboxes (13.6 prerelease) | `Aspire.Hosting.Docker`                  |
| **Reverse Proxies** | YARP                                                                                  | `Aspire.Hosting.Yarp`                    |
| **Security**        | Keycloak                                                                              | `Aspire.Hosting.Keycloak`                |
| **Frameworks**      | JavaScript, Python, Go, Java (13.6 preview), Rust (13.6 preview), Bun, Deno, Orleans, MAUI, Dapr, PowerShell | `Aspire.Hosting.Python`                  |

For polyglot framework method signatures, see [Polyglot APIs](polyglot-apis.md).

---

## 13.6 integration highlights

- **Java** (`Aspire.Hosting.Java`, preview) — `AddSpringBootApp`, `AddQuarkusApp`, `AddJavaApp`,
  `AddJavaContainer`; Maven/Gradle wrappers, OTel Java agent, multi-stage Dockerfiles. See
  [Polyglot APIs](polyglot-apis.md#java-aspirehostingjava-preview).
- **Rust** (`Aspire.Hosting.Rust`, preview) — `AddRustApp` for Cargo apps; `WithHttpEndpoint(env: "PORT")`.
- **Deno** (in `Aspire.Hosting.JavaScript`, experimental `ASPIREDENO001`) — `AddDenoApp(name, dir, script)`
  with `WithDenoAllow(DenoPermissionKind, values)`; distinct from the CommunityToolkit Deno package.
- **Azure Container Apps Sandboxes** (`Aspire.Hosting.Azure.Sandboxes`) and **Azure Connector Namespace**
  (`Aspire.Hosting.Azure.ConnectorNamespace`) — prerelease; see [Deployment](deployment.md).
- **Database/cache REPLs** — `WithRepl()` on PostgreSQL, MySQL, MongoDB, SQL Server, Redis, Valkey.
- **MongoDB** — **TLS on by default** with the developer certificate (`tls=true` in the connection
  string; opt out with `WithoutHttpsCertificate()`, tune strictness with `WithTlsMode(...)`:
  `AllowTls` / `PreferTls` / `RequireTls`). Experimental `WithReplicaSet()` makes a single-member
  replica set (transactions, change streams); `AddMongoDBReplicaSet(name)` + `WithMember(...)` for
  multi-member local scenarios. Replica sets are local-run only (publishing throws).
- **Cosmos DB** — `RunAsEmulator()` now uses the Linux **vNext** emulator (`vnext-latest`, exports
  traces/metrics); `RunAsClassicEmulator()` keeps the classic one; `RunAsPreviewEmulator` is obsolete.
  `AddAzureCosmosClient` / `AddKeyedAzureCosmosClient` add default-on health checks (`DisableHealthChecks` to opt out).
- **Microsoft Foundry** — `project.AddToolbox(name)` bundles tools behind one MCP endpoint with
  immutable versions (e.g. `.WithWebSearchTool("web-search", "Search the public web.")`, then
  `.WithReference(toolbox)`); `RunAsFoundryLocal(endpoint)` observes a Foundry Local service on another
  host and handles the newer `foundry server` CLI.
- **AI Inference** — health check calls `GetModelInfoAsync` (`/info`); endpoints without that route may need `DisableHealthChecks`.
- **Dev tunnels** — `WithExpiration(...)` sets idle expiration (1–30 hours); tunnel URLs show as
  highlighted properties plus a **Show tunnel URLs** command.
- **Blazor WebAssembly** — dashboard commands to start/stop Edge/Chrome debugging; Dotnet gateway APIs
  available to polyglot AppHosts (experimental `ASPIREBLAZOR001`).
- **App Configuration emulator** `1.2.0` (health-checks `/health`).
- **GitHub Models removed** — `Aspire.Hosting.GitHub.Models` is gone (final 13.5.x package remains on
  NuGet, hidden from `aspire add`). Use Microsoft Foundry.

---

## 13.5 integration highlights

- **Redis modules** — `AddRedis(...).WithModule(path)` loads a Redis module into the container;
  `RedisModules` constants (`Json`, `Search`, `BloomFilter`, `TimeSeries`) point at the modules
  shipped in Redis 8+ images. TypeScript parity: `withModule(RedisModules.Json)`.
- **Foundry Local** — `AddFoundry(name).RunAsFoundryLocal()` drives the installed **foundry CLI**
  for lifecycle management; resources can be exposed as hosted agents with `AsHostedAgent(...)`,
  where `HostedAgentProtocol` is `Responses` or `Invocations`.
- **GitHub Models deprecated** — `Aspire.Hosting.GitHub.Models` APIs are `[Obsolete]`, the package
  no longer appears in `aspire add` output, and it will be removed in a future release. Migrate to
  the Azure AI Foundry integration.
- **Dev tunnels regions** — `DevTunnelOptions.Region` (a `DevTunnelRegion?` enum) pins the region a
  tunnel is created in. **Breaking (13.5):** enum names normalized — `UKSouth` (not `UkSouth`),
  `SoutheastAsia` (not `SouthEastAsia`).
- **.NET projects by path** — `Aspire.Hosting.Dotnet` package with the experimental
  `AddDotnetProject(name, path)` API (`ASPIREDOTNETPROJECT001`); orchestration-only. *(13.6: coordinated
  builds, suppression retired.)*
- **Blazor gateway on Docker Compose** — Blazor gateway resources now support Docker Compose
  publishing.
- **Radius (preview)** — `Aspire.Hosting.Radius` adds `AddRadiusEnvironment(name)` (with
  `WithNamespace(...)`) to publish to a Radius environment. See [Deployment](deployment.md).
- **Templates** — new project templates target **.NET 11 preview** in addition to the current LTS,
  and C# AppHost templates set `AspireUseCliBundle=true` (CLI bundle resolved via `dnx`).

---
