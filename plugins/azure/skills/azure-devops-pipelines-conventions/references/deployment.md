# Deployment Strategies

## 1. Environment Promotion

Promote deployments through environments sequentially, with increasing levels of validation and approval at each stage.

### Typical Promotion Flow

```
Build -> Dev -> QA/Staging -> Production
         |         |              |
         |         |              +-- Manual approval, branch control, smoke tests
         |         +-- Integration/E2E tests, approval optional
         +-- Automatic on successful build
```

### Guidelines

- Define each environment in Azure DevOps (Pipelines > Environments) for deployment tracking and approval management
- Use `dependsOn` and `condition` to enforce promotion order
- Gate production deployments with manual approvals and automated checks
- Use environment-specific variable groups for configuration (connection strings, feature flags, URLs)

### Example (Environment Promotion)

```yaml
stages:
  - stage: Build
    displayName: 'Build'
    jobs:
      - job: Build
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: dotnet publish -c Release -o $(Build.ArtifactStagingDirectory)
          - task: PublishPipelineArtifact@1
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'app'

  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: Build
    jobs:
      - deployment: DeployDev
        environment: 'dev'
        variables:
          - group: app-settings-dev
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'dev-connection'
                    appName: '$(webAppName)'
                    package: '$(Pipeline.Workspace)/app/**/*.zip'

  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: DeployDev
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployStaging
        environment: 'staging'
        variables:
          - group: app-settings-staging
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'staging-connection'
                    appName: '$(webAppName)'
                    package: '$(Pipeline.Workspace)/app/**/*.zip'
            postRouteTraffic:
              steps:
                - script: |
                    curl -sf $(stagingUrl)/health || exit 1
                  displayName: 'Health check'

  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployProd
        environment: 'production'    # Approval gate configured here
        variables:
          - group: app-settings-prod
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'prod-connection'
                    appName: '$(webAppName)'
                    package: '$(Pipeline.Workspace)/app/**/*.zip'
            postRouteTraffic:
              steps:
                - script: |
                    curl -sf $(prodUrl)/health || exit 1
                  displayName: 'Production health check'
```

## 2. Deployment Jobs

Deployment jobs (`deployment:`) differ from regular jobs (`job:`) in several important ways:

- They target an **environment**, enabling approval gates and deployment history
- They support a **strategy** block (`runOnce`, `rolling`, `canary`) with lifecycle hooks
- They automatically download pipeline artifacts from prior stages
- They record deployment history in the Azure DevOps environment view

### Lifecycle Hooks

Each strategy supports lifecycle hooks that run at specific points:

| Hook | When It Runs |
|---|---|
| `preDeploy` | Before the deployment starts |
| `deploy` | The main deployment steps |
| `routeTraffic` | Shift traffic to the new deployment (relevant for canary/blue-green) |
| `postRouteTraffic` | After traffic is routed -- run health checks and smoke tests here |
| `on.failure` | If any previous hook fails |
| `on.success` | If all hooks succeed |

## 3. Strategy: runOnce

The simplest strategy. Deploys once to the target environment.

```yaml
strategy:
  runOnce:
    deploy:
      steps:
        - script: echo "Deploying..."
    postRouteTraffic:
      steps:
        - script: curl -sf $(appUrl)/health
          displayName: 'Health check'
    on:
      failure:
        steps:
          - script: echo "Deployment failed. Investigate."
```

Use `runOnce` for non-critical environments (dev, QA) or when the application handles zero-downtime deployment internally (e.g., Azure App Service slot swaps).

## 4. Strategy: rolling

Deploys to a set of targets incrementally, reducing risk by updating a subset at a time.

```yaml
strategy:
  rolling:
    maxParallel: 2    # Deploy to 2 targets at a time
    deploy:
      steps:
        - script: echo "Deploying to $(Environment.ResourceName)"
    postRouteTraffic:
      steps:
        - script: curl -sf http://$(Environment.ResourceName)/health
          displayName: 'Health check'
    on:
      failure:
        steps:
          - script: echo "Rolling back $(Environment.ResourceName)"
```

Use `rolling` for VM-based deployments or environments with multiple target machines.

## 5. Strategy: canary

Deploys to a small percentage of targets first, validates, then proceeds to the rest.

```yaml
strategy:
  canary:
    increments:
      - 10    # Deploy to 10% first
      - 50    # Then 50%
              # Implicitly finishes with 100%
    deploy:
      steps:
        - script: echo "Canary deployment at $(Strategy.CycleName)% - increment $(Strategy.Increment)"
    postRouteTraffic:
      steps:
        - script: |
            echo "Validating canary at $(Strategy.Increment)%..."
            # Check error rates, latency, etc.
          displayName: 'Canary validation'
    on:
      failure:
        steps:
          - script: echo "Canary failed at $(Strategy.Increment)%. Rolling back."
```

Use `canary` for production deployments where you want to validate with real traffic before full rollout.

## 6. Blue-Green Deployment (Slot Swap Pattern)

Azure App Service deployment slots enable blue-green deployments. Deploy to a staging slot, validate, then swap.

```yaml
stages:
  - stage: DeployProd
    jobs:
      - deployment: DeployProd
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                # Deploy to staging slot
                - task: AzureWebApp@1
                  displayName: 'Deploy to staging slot'
                  inputs:
                    azureSubscription: 'prod-connection'
                    appName: 'webapp-myapp-prod'
                    deployToSlotOrASE: true
                    slotName: 'staging'
                    package: '$(Pipeline.Workspace)/app/**/*.zip'

                # Validate staging slot
                - script: |
                    curl -sf https://webapp-myapp-prod-staging.azurewebsites.net/health || exit 1
                  displayName: 'Validate staging slot'

                # Swap staging to production
                - task: AzureAppServiceManage@0
                  displayName: 'Swap staging to production'
                  inputs:
                    azureSubscription: 'prod-connection'
                    Action: 'Swap Slots'
                    WebAppName: 'webapp-myapp-prod'
                    SourceSlot: 'staging'
                    TargetSlot: 'production'

            postRouteTraffic:
              steps:
                - script: |
                    curl -sf https://webapp-myapp-prod.azurewebsites.net/health || exit 1
                  displayName: 'Production health check after swap'

            on:
              failure:
                steps:
                  # Swap back if health check fails
                  - task: AzureAppServiceManage@0
                    displayName: 'Rollback: swap production back to staging'
                    inputs:
                      azureSubscription: 'prod-connection'
                      Action: 'Swap Slots'
                      WebAppName: 'webapp-myapp-prod'
                      SourceSlot: 'production'
                      TargetSlot: 'staging'
```

## 7. Rollback Mechanisms

### Automatic Rollback via Lifecycle Hooks

Use `on.failure` hooks to trigger automatic rollback when health checks fail:

```yaml
strategy:
  runOnce:
    deploy:
      steps:
        - script: echo "Deploying version $(Build.BuildId)..."
    postRouteTraffic:
      steps:
        - script: |
            for i in 1 2 3 4 5; do
              if curl -sf $(appUrl)/health; then
                echo "Health check passed"
                exit 0
              fi
              echo "Health check attempt $i failed, retrying in 10s..."
              sleep 10
            done
            echo "Health check failed after 5 attempts"
            exit 1
          displayName: 'Health check with retries'
    on:
      failure:
        steps:
          - task: AzureWebApp@1
            displayName: 'Rollback to previous version'
            inputs:
              azureSubscription: 'prod-connection'
              appName: '$(webAppName)'
              package: '$(Pipeline.Workspace)/previous-app/**/*.zip'
```

### Redeployment-Based Rollback

Maintain versioned artifacts so any previous version can be redeployed:

- Tag artifacts with the build number or semantic version
- Store artifacts in Azure Artifacts or a blob storage account with versioning enabled
- Create a rollback pipeline that accepts a version parameter and deploys that specific artifact

```yaml
parameters:
  - name: rollbackVersion
    displayName: 'Version to roll back to'
    type: string

stages:
  - stage: Rollback
    jobs:
      - deployment: Rollback
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadPipelineArtifact@2
                  inputs:
                    buildType: 'specific'
                    project: '$(System.TeamProjectId)'
                    pipeline: '$(System.DefinitionId)'
                    buildVersionToDownload: 'specific'
                    pipelineId: '${{ parameters.rollbackVersion }}'
                    artifactName: 'app'
                    targetPath: '$(Pipeline.Workspace)/rollback'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'prod-connection'
                    appName: '$(webAppName)'
                    package: '$(Pipeline.Workspace)/rollback/**/*.zip'
```

## 8. Infrastructure as Code (IaC)

Manage infrastructure alongside application deployments in the pipeline.

### Bicep Example

```yaml
steps:
  - task: AzureCLI@2
    displayName: 'Deploy infrastructure (Bicep)'
    inputs:
      azureSubscription: 'infra-connection'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az deployment group create \
          --resource-group $(resourceGroup) \
          --template-file infra/main.bicep \
          --parameters infra/parameters.$(env).json \
          --parameters appVersion=$(Build.BuildId)
```

### Terraform Example

```yaml
steps:
  - script: |
      cd infra
      terraform init -backend-config="key=$(env).tfstate"
      terraform plan -var-file="$(env).tfvars" -out=tfplan
      terraform apply -auto-approve tfplan
    displayName: 'Apply Terraform changes'
    env:
      ARM_CLIENT_ID: $(armClientId)
      ARM_TENANT_ID: $(armTenantId)
      ARM_SUBSCRIPTION_ID: $(armSubscriptionId)
      ARM_USE_OIDC: true    # When using Workload Identity Federation
```
