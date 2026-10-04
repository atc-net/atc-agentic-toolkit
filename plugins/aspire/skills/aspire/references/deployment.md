# Deployment — Complete Reference

Aspire separates **orchestration** (what to run) from **deployment** (where to run it). The `aspire publish` command translates your AppHost resource model into deployment manifests for your target platform.

---

## Publish vs Deploy

| Concept | What it does |
|---|---|
| **`aspire publish`** | Generates deployment artifacts (Dockerfiles, Helm charts, Bicep, etc.) |
| **Deploy** | You run the generated artifacts through your CI/CD pipeline |

Aspire does NOT deploy directly via `aspire publish`. It generates the manifests — you deploy them through CI/CD.

### Direct deploy & teardown (Preview, 13.3+)

For supported targets (Azure, Kubernetes, Docker Compose), the CLI can also deploy and tear down directly:

```bash
aspire deploy                 # provision + deploy to the target environment
aspire destroy                # tear down what `aspire deploy` provisioned
aspire destroy -e Staging -y  # target an environment, skip the confirmation prompt
```

> Since 13.3, a container-runtime health check runs before `aspire deploy` so missing/stopped Docker/Podman is caught early. Use `--list-steps` on `deploy`/`destroy` to preview the pipeline without executing it.

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

## Supported Targets

### Docker

**Package:** `Aspire.Hosting.Docker`

```bash
aspire publish -p docker -o ./docker-output
```

Generates:
- `docker-compose.yml` — service definitions matching your AppHost
- `Dockerfile` for each .NET project
- Environment variable configuration
- Volume mounts
- Network configuration

```csharp
// AppHost configuration for Docker publishing
var api = builder.AddProject<Projects.Api>("api")
    .PublishAsDockerFile();  // override default publish behavior
```

> **13.3+:** Docker Compose deployments also support **Podman** as the container runtime, plus privileged-mode publishing.

### Kubernetes

**Package:** `Aspire.Hosting.Kubernetes`

```bash
aspire publish -p kubernetes -o ./k8s-output
```

Generates:
- Kubernetes YAML manifests (Deployments, Services, ConfigMaps, Secrets)
- Helm chart (optional)
- Ingress configuration
- Resource limits based on AppHost configuration

```csharp
// AppHost: customize K8s publishing
var api = builder.AddProject<Projects.Api>("api")
    .WithReplicas(3)                    // maps to K8s replicas
    .WithExternalHttpEndpoints();       // maps to Ingress/LoadBalancer
```

> **13.3+:** A Helm-based Kubernetes deployment engine is available via `AddKubernetesEnvironment(...)`. Declare external traffic with first-class routing resources — `AddIngress(...)` (legacy) or `AddGateway(...)` (preferred for new clusters) — which generate the matching Ingress / Gateway API YAML in the Helm chart output. For AKS specifically, use `AddAzureKubernetesEnvironment(...)`.

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

### Azure Container Apps

**Package:** `Aspire.Hosting.Azure.AppContainers`

```bash
aspire publish -p azure -o ./azure-output
```

Generates:
- Bicep templates for Azure Container Apps Environment
- Container App definitions for each service
- Azure Container Registry configuration
- Managed identity configuration
- Dapr components (if using Dapr integration)
- VNET configuration

```csharp
// AppHost: Azure-specific configuration
var api = builder.AddProject<Projects.Api>("api")
    .WithExternalHttpEndpoints()        // maps to external ingress
    .WithReplicas(3);                   // maps to min replicas

// Azure resources are auto-provisioned
var storage = builder.AddAzureStorage("storage");   // creates Storage Account
var cosmos = builder.AddAzureCosmosDB("cosmos");    // creates Cosmos DB account
var sb = builder.AddAzureServiceBus("messaging");   // creates Service Bus namespace
```

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
digits (`cae1` / `cae2` stay distinct):

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

**Package:** `Aspire.Hosting.Azure.AppService`

```bash
aspire publish -p appservice -o ./appservice-output
```

Generates:
- Bicep templates for App Service Plans and Web Apps
- Connection string configuration
- Application settings

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
| `.WithExternalHttpEndpoints()` | `ports:` (host) | `Ingress` / `LoadBalancer` | External ingress |
| `AddParameter(secret: true)` | `.env` file | `Secret` | Key Vault reference |

---

## CI/CD integration

### GitHub Actions example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Install Aspire CLI
        run: curl -sSL https://aspire.dev/install.sh | bash

      - name: Generate manifests
        run: aspire publish -p azure -o ./deploy

      - name: Deploy to Azure
        uses: azure/arm-deploy@v2
        with:
          template: ./deploy/main.bicep
          parameters: ./deploy/main.parameters.json
```

### Azure DevOps example

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

  - script: curl -sSL https://aspire.dev/install.sh | bash
    displayName: 'Install Aspire CLI'

  - script: aspire publish -p azure -o $(Build.ArtifactStagingDirectory)/deploy
    displayName: 'Generate deployment manifests'

  - task: AzureResourceManagerTemplateDeployment@3
    inputs:
      deploymentScope: 'Resource Group'
      templateLocation: '$(Build.ArtifactStagingDirectory)/deploy/main.bicep'
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
- **Docker:** Loaded from `.env` file
- **Kubernetes:** Loaded from `Secret` resource
- **Azure:** Loaded from Key Vault via managed identity

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
