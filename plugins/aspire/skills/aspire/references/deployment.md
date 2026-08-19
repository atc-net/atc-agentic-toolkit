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

### Radius (preview, 13.5+)

**Package:** `Aspire.Hosting.Radius` — publish to a [Radius](https://radapp.io/) environment:

```csharp
builder.AddRadiusEnvironment("radius")
    .WithNamespace("my-app");
```

Publish-time infrastructure configuration (`ConfigureRadiusInfrastructure`) and project
container-image overrides are gated behind experimental diagnostics.

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
