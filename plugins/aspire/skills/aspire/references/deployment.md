# Deployment — Complete Reference

Aspire separates **orchestration** (what to run) from **deployment** (where to run it). You declare
the target as a **compute environment resource** in the AppHost (`AddDockerComposeEnvironment`,
`AddKubernetesEnvironment`, `AddAzureContainerAppEnvironment`, …) and then run plain
`aspire publish` (generate artifacts) or `aspire deploy` (generate + apply).

> **There is no `-p <target>` flag** on `aspire publish` (verified on 13.6.0). The target comes from the
> environment resource(s) in the AppHost, not from the command line.

---

## Publish vs Deploy

| Concept | What it does |
|---|---|
| **`aspire publish -o <dir>`** | Generates deployment artifacts (Compose file + `.env`, Helm chart, Bicep, …) as a one-way handoff to another tool |
| **`aspire deploy -e <env>`** | Evaluates the AppHost, builds/pushes images, provisions and applies — the whole flow inside Aspire |
| **`aspire do <step>`** | Runs one named pipeline step (e.g. `build`, `push`, `prepare-<env-resource>`) — use `--list-steps` to see the names |
| **`aspire destroy -e <env> [-y]`** | Tears down what `aspire deploy` provisioned |

```bash
aspire publish -o ./aspire-output             # artifacts only (default: <AppHost dir>/aspire-output)
aspire deploy --environment Production        # provision + deploy (default environment: Production)
aspire do push --environment staging          # build + push images only
aspire destroy -e Staging -y                  # tear down, skip the confirmation prompt
```

All four accept `--apphost`, `-e/--environment`, `--no-build`, `--list-steps`, and
`--include-exception-details`; `deploy` also has `--clear-cache`. Since 13.3, a container-runtime
health check runs before `aspire deploy` so missing/stopped Docker/Podman is caught early.

**Deployment rules for agents:**

- `aspire deploy` does **not** consume an earlier `aspire publish` output directory — it re-evaluates
  the AppHost. Use `publish` *or* `deploy`, not publish-then-deploy.
- Deploy the resources the AppHost declares — **never containerize or deploy the AppHost itself**.
- `--list-steps` previews the pipeline, but it is not proof a deploy can run unattended (prompts for
  missing parameters/credentials still happen at run time).
- Provisioning cloud resources costs money: when the user asked for a plan or a preview, **ask before
  running `aspire deploy`**. `aspire destroy` needs explicit approval and an exact environment.
- Don't declare a deployment done until a health/endpoint check against the target passes.
- Don't commit generated artifacts (`aspire-output/`, `.env.<environment>`, Helm values with resolved
  values) — they can contain secrets. Deployment state (below) is sensitive too.
- Keep all Aspire packages on **one release family**. Several deployment packages are preview-only
  (`Aspire.Hosting.Kubernetes` / `Aspire.Hosting.Azure.Kubernetes` are `13.6.0-preview.*`) and
  `Aspire.Hosting.AWS` versions independently (13.7.x) — don't expect identical version strings, but
  don't mix 13.5 and 13.6 packages (`MissingMethodException` / `TypeLoadException` at startup).

> **Deployment state (13.6):** state is isolated per AppHost and environment under
> `<ASPIRE_HOME>/deployments/<AppHostSha>/<environment>.json`. The VS Code extension exposes
> **Deploy**, **Publish**, **Run pipeline step**, and **Debug pipeline step** on AppHost items.

### Portable names and paths (13.6)

- **Connection-string names** — names containing hyphens or repeated underscores get a portable alias
  (`my-db` → `ConnectionStrings__my_db`). Azure App Service, Kubernetes, and Foundry emit **only** the
  alias after deployment; updated client integrations resolve the logical name first, then the alias.
  Colliding names (`my-db` and `my_db`) fail during resolution. Prefer portable names (`my_db`) for
  anything read directly from env vars.
- **Volume paths** — `WithVolume("data", "/data", env: "DATA_PATH")` (TS: `withVolume('/data', 'data', 'DATA_PATH')`)
  gives projects/executables one env-var contract that works locally and in Docker Compose,
  Kubernetes (`withKubernetesPersistentVolumeMount(..., { env })`), and Azure Container Apps.

---

## Choosing a target

| Target | `aspire add` | AppHost (C#) | AppHost (TS) |
|---|---|---|---|
| Docker Compose | `docker` | `AddDockerComposeEnvironment("compose")` | `addDockerComposeEnvironment('compose')` |
| Kubernetes (any cluster) | `kubernetes` (preview) | `AddKubernetesEnvironment("k8s")` | `addKubernetesEnvironment('k8s')` |
| Azure Container Apps | `azure-appcontainers` | `AddAzureContainerAppEnvironment("aca")` | `addAzureContainerAppEnvironment('aca')` |
| Azure App Service | `azure-appservice` | `AddAzureAppServiceEnvironment("appsvc")` | `addAzureAppServiceEnvironment('appsvc')` |
| AKS | `azure-kubernetes` (preview) | `AddAzureKubernetesEnvironment("aks")` | `addAzureKubernetesEnvironment('aks')` |

- If the user just says "Azure", **ask** which compute target (ACA, App Service, or AKS) before adding one.
- If the AppHost already has exactly one environment, use it. With a single environment every compute
  resource goes there automatically; `WithComputeEnvironment(env)` is only needed when there are several.
- Resources added only inside a run-mode branch (`if (!builder.ExecutionContext.IsPublishMode)`) are
  not deployed.

---

## Supported Targets

### Docker Compose

**Package:** `Aspire.Hosting.Docker` (`aspire add docker`)

```csharp
var compose = builder.AddDockerComposeEnvironment("compose");
var api = builder.AddProject<Projects.Api>("api");   // automatically included in the Compose output
```

```bash
aspire publish -o ./aspire-output              # docker-compose.yaml + .env (parameters unfilled)
aspire do prepare-compose --environment staging  # + .env.staging with resolved values, builds images
aspire deploy --environment staging            # prepare + `docker compose up`
```

| Output | Contents |
|---|---|
| `docker-compose.yaml` | Services, networks, volumes for every compute resource |
| `.env` | Expected parameters, **unfilled** after `aspire publish` |
| `.env.<environment>` | Resolved values, written by `prepare-<env-resource>` / `deploy` — treat as a secret |

- Customize the model, don't hand-edit the generated YAML: `ConfigureComposeFile(file => …)` on the
  environment, `ConfigureEnvFile(env => …)` for the `.env` model, and
  `PublishAsDockerComposeService((resource, service) => …)` per resource (labels, restart policy, …).
- Container runtime: auto-detected; force one with `ASPIRE_CONTAINER_RUNTIME=docker|podman`. Podman
  must be **5.0.0+** (older versions are flagged by `aspire doctor` and ignored).
- `PublishAsDockerFile()` on a project overrides the default .NET SDK container build.

### Kubernetes

**Package:** `Aspire.Hosting.Kubernetes` (`aspire add kubernetes`, preview). Prerequisites: `kubectl`
with a configured context and **Helm v4.2.0+** on `PATH`.

```csharp
var k8s = builder.AddKubernetesEnvironment("k8s");
var registry = builder.AddContainerRegistry("registry", "myregistry.example.com:5000");

var api = builder.AddProject<Projects.Api>("api").WithReplicas(3);
var web = builder.AddProject<Projects.Web>("web");

// Services are reachable only inside the cluster by default — expose them explicitly:
var ingress = k8s.AddIngress("public")
    .WithIngressClass("nginx")
    .WithHostname("app.example.com")
    .WithTls();
ingress.WithPath("/api", api.GetEndpoint("http"));
ingress.WithPath("/", web.GetEndpoint("http"));
```

- **Helm is the default engine** — `aspire publish` produces a Helm chart; `WithHelm(h => …)` only
  customizes namespace / release name / chart version. Per-resource tweaks:
  `PublishAsKubernetesService(resource => …)`.
- **External traffic:** `WithExternalHttpEndpoints()` alone does **not** make a service public. Use
  `AddIngress(...)` (`WithPath`, `WithDefaultBackend`; named `WithRoute` before 13.4) or `AddGateway(...)`
  (Gateway API — preferred for new clusters; `gateway.WithRoute(...)`).
- **A container registry is required** (`AddContainerRegistry`) — it must be reachable from your
  machine and the cluster nodes. There is no local-registry fallback.
- `aspire deploy` uses the **current kubectl context** (`kubectl config current-context`) and
  `helm install`/`upgrade`; it never creates the cluster. Manual handoff:
  `helm install|upgrade <release> ./k8s-artifacts [-f values.production.yaml]`.
- External charts: `AddHelmChart(...)` on the environment installs them as post-deploy steps.
- For AKS use `AddAzureKubernetesEnvironment(...)` **instead of** (not alongside) `AddKubernetesEnvironment`.

**Persistent volumes (13.5+, experimental `ASPIRECOMPUTE002`).** Model Kubernetes
`PersistentVolumeClaim`s as first-class resources. Available on both the Kubernetes environment and
the AKS environment (`Aspire.Hosting.Azure.Kubernetes`):

```csharp
#pragma warning disable ASPIRECOMPUTE002
using Aspire.Hosting.Kubernetes;

var k8s = builder.AddKubernetesEnvironment("k8s");

var data = k8s.AddPersistentVolume("data")
    .WithStorageClass("managed-csi")
    .WithCapacity("10Gi")
    .WithAccessMode(PersistentVolumeAccessMode.ReadWriteOnce);

builder.AddContainer("postgres", "postgres:16")
    .WithVolume("data", "/var/lib/postgresql/data")
    .WithPersistentVolume(data);   // bound workloads render as StatefulSet, not Deployment
```

**13.6 Kubernetes/AKS updates:** Ingress/Gateway routes inherit `WithHostname(...)` when no explicit
host is set; Helm values include embedded parameters resolved during deployment; AKS provisions
persistent storage; inline CSI volumes (`CsiVolumeSourceV1`, `VolumeV1.Csi`) give ephemeral
pod-scoped mounts; `aspire destroy` on AKS acquires credentials and runs Helm cleanup before removing
Azure resources.

### Radius (preview, 13.5+)

**Package:** `Aspire.Hosting.Radius` — publish to a [Radius](https://radapp.io/) environment:

```csharp
builder.AddRadiusEnvironment("radius")
    .WithNamespace("my-app");
```

Publish-time infrastructure configuration (`ConfigureRadiusInfrastructure`) and project
container-image overrides are gated behind experimental diagnostics (`ASPIRERADIUS003/004/006/057`).

**13.6:** experimental APIs configure recipe parameters and secrets globally or per resource;
consumers get addresses/credentials from the backing resource's deployed schema and recipe outputs;
new publish diagnostics flag unsupported endpoints, database mappings, credentials, and secret
collisions. Radius **v0.60.2** is recommended (minimum v0.60.0).

### Azure (all targets)

Local `aspire deploy` authenticates with Azure CLI credentials by default (`Azure:CredentialSource` /
`Azure__CredentialSource` selects another: `AzureDeveloperCli`, `VisualStudio`, `AzurePowerShell`, …).
Shared settings (config keys or env vars):

| Setting | Purpose |
|---|---|
| `Azure__SubscriptionId` | Target subscription |
| `Azure__Location` | Default region |
| `Azure__ResourceGroup` | Resource group to create or reuse |
| `Azure__CredentialProcessTimeoutSeconds` | Credential subprocess timeout (5–600 s) |
| `Parameters__<name>` | AppHost parameters |

- `aspire secret set` is for local development only — in CI (and for TypeScript AppHosts) supply
  values as environment variables on the `aspire deploy` process.
- Local deploys prompt for missing values. Don't pipe an interactive deploy through `tee`/`tail`
  (it breaks the prompts); run it non-interactively with everything supplied instead.
- Failed provisioning: start from the first failed ARM operation —
  `az deployment operation group list -g <rg> -n <deployment> --query "[?properties.provisioningState=='Failed']"`.

### Azure Container Apps

**Package:** `Aspire.Hosting.Azure.AppContainers` (`aspire add azure-appcontainers`)

```csharp
builder.AddAzureContainerAppEnvironment("aca-env");

var api = builder.AddProject<Projects.Api>("api")
    .WithExternalHttpEndpoints()        // maps to external ingress
    .WithReplicas(3);                   // maps to min replicas

// Azure resources are auto-provisioned
var storage = builder.AddAzureStorage("storage");   // creates Storage Account
var cosmos = builder.AddAzureCosmosDB("cosmos");    // creates Cosmos DB account
var sb = builder.AddAzureServiceBus("messaging");   // creates Service Bus namespace
```

- The environment plus the app resources is enough for a standard deployment — use
  `PublishAsAzureContainerApp((infra, app) => …)` only to customize the generated Container App.
- Endpoints are grouped by target port: at most **one external HTTP** ingress (served via the platform
  HTTPS endpoint, HTTP redirected) and **no external non-HTTP** endpoints; HTTP and TCP can't share a
  target port. External HTTP endpoints are upgraded to HTTPS in generated URLs/connection strings
  (`WithHttpsUpgrade(false)` opts out).
- Named volumes and bind mounts become **Azure Files** mounts. The Aspire dashboard is provisioned by
  default (except with ACA Express).

**ACA Express (13.6, preview, experimental `ASPIREACAEXPRESS001`).** Call `AsExpress()` on the
**container app environment** (`AddAzureContainerAppEnvironment(...).AsExpress()`) to publish and
deploy HTTP apps with the Azure Container Apps Express preview — rapid provisioning, fewer settings,
scale-to-zero when idle and on-demand scale-out. Express defaults to zero minimum replicas and does
**not** provision the managed Aspire dashboard; explicit replica settings and infrastructure
customization are preserved, and app-to-app references require explicitly public HTTP endpoints.
Suppress `ASPIREACAEXPRESS001` to use it.

**Deterministic environment naming (13.5+, experimental `ASPIREACANAMING002`).** Opt into
collision-resistant resource names when deploying multiple environments into the same resource
group — names get a `uniqueString(resourceGroup().id)` suffix while preserving each environment's
digits (`cae1` / `cae2` stay distinct). **Don't apply it retroactively without explicit approval** —
changing the naming scheme can recreate an existing environment:

```csharp
#pragma warning disable ASPIREACANAMING002
builder.AddAzureContainerAppEnvironment("acaenv")
    .WithUniqueResourceNaming();
```

**Delegated subnets (13.5+, experimental `ASPIREAZURE003`).** ACA and Azure App Service environments
can be placed into a delegated subnet. Declare the subnet with `WithServiceDelegation(serviceName)`,
then attach it with `WithDelegatedSubnet(subnet)`. The virtual-network builder APIs live in
`Aspire.Hosting.Azure.Network`.

**Cross-scope existing resources (13.5+).** Reference Azure resources outside your app's own
resource group, subscription, or tenant. Each accepts literal strings or `ParameterResource` values
(so scope details can come from parameters/secrets), and each has `RunAsExisting*` /
`PublishAsExisting*` variants:

```csharp
var name = builder.AddParameter("sb-name");
var resourceGroup = builder.AddParameter("sb-rg");
var subscription = builder.AddParameter("sb-sub");

builder.AddAzureServiceBus("sb")
    .AsExistingInResourceGroup(name, resourceGroup, subscription);
// Also: AsExistingInSubscription(name, subscription), AsExistingInTenant(name)
```

### Azure Container Apps Sandboxes (13.6, prerelease)

**Package:** `Aspire.Hosting.Azure.Sandboxes` (`aspire add azure-sandboxes`). Deploys project,
container, and Dockerfile resources as isolated sandboxes. `AddAzureSandboxGroup` provisions the
sandbox group, an Azure Container Registry, identities, and role assignments:

```csharp
using Aspire.Hosting.Azure;

builder.AddAzureSandboxGroup("sandboxes");
builder.AddDockerfile("web", "./web")
    .WithHttpEndpoint(port: 8080, targetPort: 8080, name: "http")
    .WithExternalHttpEndpoints()
    .PublishAsAzureSandbox(new AzureSandboxOptions
    {
        Tier = AzureSandboxTier.Small,
        AutoSuspendEnabled = true,
        AutoSuspendInterval = TimeSpan.FromMinutes(15),
        AutoSuspendMode = AzureSandboxAutoSuspendMode.Disk
    });
```

TypeScript: `addAzureSandboxGroup('sandboxes')` and `publishAsAzureSandbox({ tier: AzureSandboxTier.Small, autoSuspendEnabled: true, autoSuspendInterval: 900_000, autoSuspendMode: AzureSandboxAutoSuspendMode.Disk })`
(interval in **milliseconds** in TS).

- Tiers: `ExtraSmall`, `Small`, `Medium`, `Large`, `ExtraLarge`. Auto-suspend modes: `None`, `Memory`, `Disk`.
  Auto-delete options (`AfterCreation` / `AfterSuspend` triggers) and group identity
  (`withSystemAssignedIdentity`, `withUserAssignedIdentity`, `withAcrPullIdentity`, `withNoManagedIdentity`) are also available.
- Images resolve to immutable linux/amd64 digests; egress is **deny-by-default**; stale sandboxes and
  images are cleaned up on redeploy and `aspire destroy`.
- External endpoints must be marked explicitly; public HTTPS URLs require Microsoft Entra auth unless
  you opt into anonymous access.
- **Not yet supported:** volumes, TCP ports, private service discovery, Windows/ARM64 images.

### Azure Connector Namespace (13.6, prerelease)

**Package:** `Aspire.Hosting.Azure.ConnectorNamespace` — model connections to external services and
managed MCP server configurations with explicit operation allow-lists and Microsoft Entra access
policies in the AppHost. Requires preview access in your subscription/region. A connection supplies
connection info, not authorization.

### Azure infrastructure customization (13.6, experimental)

Experimental per-service `Aspire.Hosting.Azure.Provisioning.*` packages expose
`configureInfrastructure` to polyglot AppHosts for customizing Azure Provisioning SDK properties and
composing Bicep expressions. Shared diagnostic: `ASPIREAZUREPROVISIONING001`.

Other 13.6 Azure changes: location changes require explicit confirmation before delete/recreate;
more reliable service-principal / federated-workload identity detection.

### Azure Front Door origin names (13.6)

Origin names now include the backend hostname, so **upgrading renames generated origins** even if the
hostname didn't change — and incremental ARM deployments don't delete the old ones. Deploy the new
names, confirm health, then delete the old origins manually. To keep the previous names:

```csharp
using Azure.Provisioning;
using Azure.Provisioning.Cdn;
using Azure.Provisioning.Expressions;

builder.AddAzureFrontDoor("frontdoor")
    .WithOrigin(api)
    .ConfigureInfrastructure(infrastructure =>
    {
        foreach (var origin in infrastructure.GetProvisionableResources()
            .OfType<FrontDoorOrigin>())
        {
            origin.Name = BicepFunction.Take(
                BicepFunction.Interpolate($"{origin.BicepIdentifier.Replace("_", "")}-{BicepFunction.GetUniqueString(BicepFunction.GetResourceGroup().Id)}"),
                origin.GetResourceNameRequirements().MaxLength);
        }
    });
```

### Azure App Service

**Package:** `Aspire.Hosting.Azure.AppService` (`aspire add azure-appservice`)

```csharp
var appService = builder.AddAzureAppServiceEnvironment("appsvc")
    .WithAzureApplicationInsights();   // opt-in; App Insights is not provisioned by default
// .WithDashboard(false)               // the Aspire dashboard is included by default
```

Generates Bicep for the App Service plan and web apps, with connection strings and app settings.
App settings accept only letters, numbers, and underscores — prefer portable names (13.6 emits the
`my_db` alias for connection strings); for other dashed names call `SkipEnvironmentVariableNameChecks()`
after `PublishAsAzureAppServiceWebsite(...)` only when you intend to bypass validation.

---

## Resource model to deployment mapping

| AppHost concept | Docker Compose | Kubernetes | Azure Container Apps |
|---|---|---|---|
| `AddProject<T>()` | `service` with Dockerfile | `Deployment` + `Service` | `Container App` |
| `AddContainer()` | `service` with `image:` | `Deployment` + `Service` | `Container App` |
| `AddRedis()` | `service: redis` | `StatefulSet` | Managed Redis |
| `AddPostgres()` | `service: postgres` | `StatefulSet` | Azure PostgreSQL |
| `.WithReference()` | `environment:` vars | `ConfigMap` / `Secret` | App settings |
| `.WithReplicas(n)` | `deploy: replicas: n` | `replicas: n` | `minReplicas: n` |
| `.WithVolume()` | `volumes:` | `PersistentVolumeClaim` | Azure Files |
| `.WithHttpEndpoint()` | `ports:` | `Service` port | Ingress |
| `.WithExternalHttpEndpoints()` | `ports:` (host) | Cluster-internal until routed via `AddIngress`/`AddGateway` | External ingress |
| `AddParameter(secret: true)` | `.env.<environment>` file | `Secret` | Key Vault reference |

---

## CI/CD integration

Pick the shape by how your release is structured:

| Need | Command(s) |
|---|---|
| One job builds and deploys | `aspire deploy --environment production --non-interactive` |
| Build and release separated (approvals, artifact promotion) | `aspire do push` + `aspire publish --output-path ./aspire-output` |
| CI stages around specific AppHost steps | `aspire do build`, `aspire do push`, `aspire do <step>` (names from `--list-steps`) |
| Validate only | `aspire deploy --list-steps` |

`--environment` selects the deployment context; `Parameters__*` env vars supply the values. Uploaded
publish output (`.env.<environment>`, Helm values) can contain secrets — scope artifact access.

### GitHub Actions example (Azure, OIDC)

```yaml
name: Deploy
on:
  push:
    branches: [main]

permissions:
  id-token: write   # OIDC / workload identity federation
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Install Aspire CLI
        run: |
          curl -sSL https://aspire.dev/install.sh | bash
          echo "$HOME/.aspire/bin" >> "$GITHUB_PATH"   # make `aspire` available to later steps

      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy
        run: aspire deploy --environment Production --non-interactive
        env:
          Azure__SubscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          Azure__Location: westeurope
          Azure__ResourceGroup: rg-myapp-prod
          Parameters__api_key: ${{ secrets.API_KEY }}
```

- **TypeScript AppHost:** add `actions/setup-node` (Node 22.x), `npm ci`, and pass
  `--apphost ./apphost.mts`.
- **Container registry (non-Azure targets):** log in first (e.g. `docker/login-action` for GHCR),
  then pass `Parameters__registry_endpoint` / `Parameters__registry_repository` to `aspire do push`.
- **Deployment state:** cache `~/.aspire/deployments` (`actions/cache`) to avoid re-prompting;
  the cache contains parameter values — restrict access.
- **Destroy jobs:** gate behind `workflow_dispatch` or a protected Environment and run
  `aspire destroy -e <env> --yes --non-interactive`.

### Azure DevOps example

Use an Azure Resource Manager service connection (prefer workload identity federation):

```yaml
trigger:
  branches:
    include: [main]

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UseDotNet@2
    inputs:
      version: '10.0.x'

  - script: |
      curl -sSL https://aspire.dev/install.sh | bash
      echo "##vso[task.prependpath]$HOME/.aspire/bin"
    displayName: 'Install Aspire CLI'

  - task: AzureCLI@2
    displayName: 'aspire deploy'
    inputs:
      azureSubscription: 'my-service-connection'
      scriptType: bash
      scriptLocation: inlineScript
      inlineScript: aspire deploy --environment Production --non-interactive
    env:
      Azure__CredentialSource: AzureCli
      Azure__SubscriptionId: $(AZURE_SUBSCRIPTION_ID)
      Azure__Location: westeurope
      Azure__ResourceGroup: rg-myapp-prod
```

---

## Environment-specific configuration

### Using parameters for secrets

```csharp
// AppHost
var dbPassword = builder.AddParameter("db-password", secret: true);
var postgres = builder.AddPostgres("db", password: dbPassword);
```

In deployment:
- **Docker:** Loaded from `.env.<environment>` (generated by `prepare-<env>` / `deploy`)
- **Kubernetes:** Loaded from `Secret` resource
- **Azure:** Loaded from Key Vault via managed identity

**Parameter naming:** a parameter `registry-endpoint` is read from config key
`Parameters:registry-endpoint` or env var `Parameters__registry_endpoint` (dashes become underscores
in env vars). Supply every required parameter before a non-interactive deploy.

### Conditional resources

```csharp
// Use Azure services in production, emulators locally
if (builder.ExecutionContext.IsPublishMode)
{
    var cosmos = builder.AddAzureCosmosDB("cosmos");    // real Azure resource
}
else
{
    var cosmos = builder.AddAzureCosmosDB("cosmos")
        .RunAsEmulator();                                // local emulator
}
```

---

## Dev Containers & GitHub Codespaces

Aspire templates include `.devcontainer/` configuration:

```json
{
  "name": "Aspire App",
  "image": "mcr.microsoft.com/devcontainers/dotnet:10.0",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "postCreateCommand": "curl -sSL https://aspire.dev/install.sh | bash",
  "forwardPorts": [18888],
  "portsAttributes": {
    "18888": { "label": "Aspire Dashboard" }
  }
}
```

Port forwarding works automatically in Codespaces — the dashboard and all service endpoints are accessible via forwarded URLs.
