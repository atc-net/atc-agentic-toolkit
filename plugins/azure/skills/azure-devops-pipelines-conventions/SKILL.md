---
name: azure-devops-pipelines-conventions
description: 'Best practices and conventions for writing Azure DevOps Pipelines in YAML. Covers CI/CD pipeline structure, stages, jobs, steps, triggers, variable and parameter management, template reuse, build optimization, IaC validation in build stages, testing integration (unit, integration, E2E with JUnit/VSTest), deployment strategies (blue-green, canary, rolling), environment promotion, cross-stage variable passing with stageDependencies and ##vso[task.setvariable], multi-subscription deployment patterns, Bicep deployment with AzureResourceManagerTemplateDeployment, module publishing to ACR, security hardening (Key Vault, managed identities, approval gates), and performance tuning (caching, parallel jobs, matrix strategies). Apply this skill whenever creating, reviewing, modifying, or troubleshooting azure-pipelines.yml files, multi-stage YAML pipelines, pipeline templates, or any Azure DevOps pipeline configuration. Also apply when the user asks about Azure DevOps CI/CD conventions, pipeline YAML best practices, deployment strategies in Azure Pipelines, pipeline security, cross-stage outputs, or variable/template management -- even if they do not mention "Azure DevOps" by name.'
user-invocable: false
---

# Azure DevOps Pipelines YAML Conventions

Follow these conventions when creating or modifying Azure DevOps Pipelines YAML to produce pipelines that are secure, maintainable, and performant.

> **Note:** This skill focuses on YAML pipeline authoring conventions and best practices. For Azure Pipelines service reference documentation, see the `azure-pipelines` skill. For Azure DevOps CLI commands, see the `azure-devops-cli` skill.

## General Guidelines

- Use YAML syntax with 2-space indentation consistently across all pipeline files
- Give every pipeline, stage, job, and step a meaningful `name` or `displayName` so the run UI is easy to scan
- Handle errors explicitly with `condition`, `continueOnError`, and status-check functions (`succeeded()`, `failed()`, `always()`)
- Parameterize with variables and runtime parameters so pipelines are reusable without duplication
- Follow least-privilege for service connections -- grant only the permissions each pipeline actually needs

## Pipeline Structure

### Stages, Jobs, and Steps

- Use **stages** to represent major phases (Build, Test, Deploy-Dev, Deploy-Staging, Deploy-Prod) -- they appear as visual gates in the UI
- Use **jobs** within stages to group related work and enable parallel execution
- Use **steps** for individual tasks within a job
- Define `dependsOn` between stages and jobs to express ordering and fan-in/fan-out patterns
- Use `condition` at every level for conditional execution based on branch, variable, or prior outcome

### Templates and Modularity

- Extract common patterns into **templates** (`stages`, `jobs`, `steps`, `variables`) and reference them with `template:`
- Store shared templates in a dedicated repository and consume via `resources: repositories`
- Use **extends templates** for enforcing organizational standards (required stages, security scans)
- Version templates by branch or tag so consumers can pin to a known-good version

For detailed pipeline structure guidance and examples, see [references/pipeline-structure.md](references/pipeline-structure.md).

## Build Best Practices

- Specify explicit agent pool and VM image versions rather than relying on `latest` -- this prevents surprise breakage when images update
- Cache package manager dependencies (`Cache@2` task) to reduce restore times
- Publish build artifacts with `PublishBuildArtifacts@1` or `PublishPipelineArtifact@1` and set retention policies
- Use build variables for versioning (e.g., `$(Build.BuildId)`, semantic version via a variable or script)
- Include code quality gates: linting, static analysis, security scans -- fail the build on violations
- For IaC pipelines, **validate templates in the build stage** before deployment (e.g., `az bicep build --file main.bicep`) to catch syntax and type errors early

## Testing Integration

- Run unit tests early in the pipeline and publish results in standard formats (JUnit XML, VSTest TRX)
- Use `PublishTestResults@2` with `testResultsFormat` set appropriately
- Collect and publish code coverage with `PublishCodeCoverageResults@2`
- Run integration and E2E tests in dedicated stages after deployment to a test environment
- Set `failTaskOnFailedTests: true` to fail the pipeline on test failures rather than silently continuing

For detailed testing patterns and examples, see [references/testing.md](references/testing.md).

## Security

- Store secrets in **Azure Key Vault** and access them via the `AzureKeyVault@2` task -- never hardcode secrets in YAML
- Use **variable groups** linked to Key Vault for centralized secret management
- Grant service connections the minimum permissions required; prefer **managed identities** over service principals with client secrets
- Integrate security scanning: dependency checking (e.g., OWASP, WhiteSource), static analysis (e.g., SonarQube, Roslyn analyzers)
- Configure **approval gates** and **checks** on environments before production deployments
- Use **branch control** checks on environments to restrict which branches can deploy

For detailed security guidance and Key Vault examples, see [references/security.md](references/security.md).

## Deployment Strategies

- Promote through environments sequentially: dev, staging, production
- Use **deployment jobs** (`deployment:`) with `environment:` targeting for deployment tracking and approvals
- Implement appropriate strategies: `runOnce`, `rolling`, `canary` via the `strategy:` block
- Include health checks and smoke tests after each deployment; roll back automatically on failure
- Manage infrastructure as code (ARM templates, Bicep, Terraform) within the pipeline

For detailed deployment patterns and rollback examples, see [references/deployment.md](references/deployment.md).

## Variable and Parameter Management

- Use **variable groups** for configuration shared across pipelines (connection strings, feature flags)
- Use **runtime parameters** (`parameters:`) to accept input at queue time for flexibility
- Apply `condition` with variable values for conditional logic
- Mark sensitive variables as `isSecret: true` in variable groups or use Key Vault references
- Use **variable templates** to share variable definitions across pipelines without duplication
- Use a dedicated **`variables.yml`** template file for environment-specific values (service connections, subscription IDs, environment names) and import it with `template: variables.yml`

For detailed variable and parameter patterns, see [references/variables-and-parameters.md](references/variables-and-parameters.md).

## Cross-Stage Variable Passing

Passing outputs between stages and jobs is essential for IaC pipelines where deployment outputs (resource names, connection strings) feed into subsequent stages.

### Setting Output Variables

Use `##vso[task.setvariable]` in PowerShell or Bash steps to export dynamic values as pipeline variables:

```yaml
- task: PowerShell@2
  name: bicep_outputs
  displayName: Export deployment outputs
  inputs:
    targetType: inline
    script: |
      ($env:DEPLOYMENT_OUTPUT | ConvertFrom-Json).PSObject.Properties | ForEach-Object {
          Write-Output "##vso[task.setvariable variable=$($_.Name);isOutput=true]$($_.Value.value)"
      }
```

Mark variables with `isOutput=true` to make them accessible from other jobs and stages.

### Reading Cross-Stage Outputs

Use `stageDependencies` to reference outputs from prior stages. The syntax depends on whether the source is a regular job or a deployment job:

```yaml
variables:
  # From a deployment job in a prior stage
  - name: resourceGroupName
    value: $[ stageDependencies.DeployInfra.deploy.outputs['deploy.bicep_outputs.resourceGroupName'] ]

  # From a regular job in a prior stage
  - name: buildVersion
    value: $[ stageDependencies.Build.build.outputs['version.buildVersion'] ]
```

For outputs between jobs within the same stage, use `dependencies` instead of `stageDependencies`:

```yaml
variables:
  - name: keyVaultName
    value: $[ dependencies.setup.outputs['setup.step_name.keyVaultName'] ]
```

### Multi-Subscription Deployment Pattern

For enterprise environments spanning multiple Azure subscriptions, use per-environment service connections and pass subscription-specific parameters through templates:

```yaml
# variables.yml
variables:
  devServiceConnection: 'Platform - DEV - Service Connection'
  prodServiceConnection: 'Platform - PROD - Service Connection'

# azure-pipelines.yml
stages:
  - stage: deploy_dev
    jobs:
      - template: templates/environment.yml
        parameters:
          environment: DEV
          serviceConnection: ${{ variables.devServiceConnection }}
          subscriptionId: ${{ variables.devSubscriptionId }}

  - stage: deploy_prod
    dependsOn: deploy_dev
    jobs:
      - template: templates/environment.yml
        parameters:
          environment: PROD
          serviceConnection: ${{ variables.prodServiceConnection }}
          subscriptionId: ${{ variables.prodSubscriptionId }}
```

## IaC Deployment Patterns

### Bicep Deployment with AzureResourceManagerTemplateDeployment

For deploying Bicep templates at subscription scope with parameter files:

```yaml
- task: AzureResourceManagerTemplateDeployment@3
  displayName: Deploy bicep template
  inputs:
    deploymentName: 'environment-${{ lower(parameters.environment) }}-$(Build.BuildNumber)'
    deploymentScope: Subscription
    deploymentOutputs: DEPLOYMENT_OUTPUT
    azureResourceManagerConnection: ${{ parameters.serviceConnection }}
    subscriptionId: ${{ parameters.subscriptionId }}
    location: ${{ parameters.location }}
    csmFile: $(Pipeline.Workspace)/drop/deploy/bicep/main.bicep
    csmParametersFile: $(Pipeline.Workspace)/drop/deploy/bicep/main.${{ lower(parameters.environment) }}.bicepparam
    overrideParameters: '-location "${{ parameters.location }}" -environment "${{ parameters.environment }}"'
```

Capture outputs with `deploymentOutputs` and export them with `##vso[task.setvariable]` for downstream stages.

### Bicep Module Publishing to ACR

Automate publishing of versioned Bicep modules to Azure Container Registry in a dedicated pipeline stage:

```yaml
- stage: publish_modules
  displayName: Publish IaC bicep modules
  jobs:
    - deployment: deploy
      strategy:
        runOnce:
          deploy:
            steps:
              - task: AzurePowerShell@5
                displayName: Push bicep modules to container registry
                inputs:
                  azureSubscription: ${{ parameters.serviceConnection }}
                  azurePowerShellVersion: latestVersion
                  scriptType: InlineScript
                  inline: |
                    Get-ChildItem -Path "$(modulePath)" -Filter "*.bicep" -Recurse | ForEach-Object {
                        $module = # extract module name and version from filename
                        Publish-AzBicepModule -FilePath $_.FullName -Target "br:$registry/bicep/modules/$module"
                    }
```

## Performance Optimization

- Run independent jobs in **parallel** by not specifying `dependsOn`
- Use **matrix strategies** to test across multiple configurations concurrently
- Cache dependencies and build outputs with `Cache@2`
- Use shallow clone (`fetchDepth: 1`) when full git history is not needed
- Use Docker layer caching for container builds
- Configure **pipeline resource triggers** to chain pipelines efficiently rather than polling

For detailed optimization patterns, see [references/optimization.md](references/optimization.md).

## Branch and Trigger Strategy

- Use `trigger:` for CI on push events; filter by branch and path
- Use `pr:` for pull request validation; include appropriate branch and path filters
- Use `schedules:` for maintenance tasks (nightly builds, dependency updates)
- Use `resources: pipelines:` triggers to chain pipelines (e.g., build completion triggers deployment)
- Disable CI triggers on template-only or documentation-only branches with `trigger: none`

## Example: Multi-Stage Pipeline Structure

```yaml
trigger:
  branches:
    include:
      - main
      - release/*
  paths:
    exclude:
      - docs/*
      - '*.md'

pr:
  branches:
    include:
      - main

parameters:
  - name: deployEnvironment
    displayName: 'Deploy to environment'
    type: string
    default: 'dev'
    values:
      - dev
      - staging
      - production

variables:
  - group: common-settings
  - name: buildConfiguration
    value: 'Release'

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - checkout: self
            fetchDepth: 1

          - task: Cache@2
            displayName: 'Cache NuGet packages'
            inputs:
              key: 'nuget | "$(Agent.OS)" | **/packages.lock.json'
              restoreKeys: |
                nuget | "$(Agent.OS)"
              path: $(Pipeline.Workspace)/.nuget/packages

          - task: DotNetCoreCLI@2
            displayName: 'Restore dependencies'
            inputs:
              command: restore

          - task: DotNetCoreCLI@2
            displayName: 'Build'
            inputs:
              command: build
              arguments: '--configuration $(buildConfiguration) --no-restore'

          - task: DotNetCoreCLI@2
            displayName: 'Run unit tests'
            inputs:
              command: test
              arguments: '--configuration $(buildConfiguration) --no-build --collect:"XPlat Code Coverage"'
              publishTestResults: true

          - task: PublishCodeCoverageResults@2
            displayName: 'Publish code coverage'
            inputs:
              summaryFileLocation: '$(Agent.TempDirectory)/**/coverage.cobertura.xml'

          - task: PublishPipelineArtifact@1
            displayName: 'Publish build artifact'
            inputs:
              targetPath: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'

  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: Build
    condition: and(succeeded(), eq('${{ parameters.deployEnvironment }}', 'dev'))
    jobs:
      - deployment: DeployDev
        displayName: 'Deploy to Dev Environment'
        environment: 'dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureKeyVault@2
                  displayName: 'Fetch secrets from Key Vault'
                  inputs:
                    azureSubscription: 'dev-service-connection'
                    KeyVaultName: 'kv-myapp-dev'
                    SecretsFilter: '*'

                - task: AzureWebApp@1
                  displayName: 'Deploy to Azure Web App'
                  inputs:
                    azureSubscription: 'dev-service-connection'
                    appName: 'webapp-myapp-dev'
                    package: '$(Pipeline.Workspace)/drop/**/*.zip'

  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployDev
    condition: and(succeeded(), eq('${{ parameters.deployEnvironment }}', 'production'))
    jobs:
      - deployment: DeployProd
        displayName: 'Deploy to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureKeyVault@2
                  displayName: 'Fetch secrets from Key Vault'
                  inputs:
                    azureSubscription: 'prod-service-connection'
                    KeyVaultName: 'kv-myapp-prod'
                    SecretsFilter: '*'

                - task: AzureWebApp@1
                  displayName: 'Deploy to Azure Web App'
                  inputs:
                    azureSubscription: 'prod-service-connection'
                    appName: 'webapp-myapp-prod'
                    package: '$(Pipeline.Workspace)/drop/**/*.zip'
```

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Is Harmful | Better Approach |
|---|---|---|
| Hardcoded secrets in YAML | Secrets visible in source control; security breach risk | Use variable groups linked to Azure Key Vault |
| Single monolithic pipeline file | Difficult to maintain, test, and reuse across projects | Break into templates for stages, jobs, and steps |
| Using `latest` VM images | Builds break unpredictably when the image updates | Pin to a specific image version (e.g., `ubuntu-22.04`) |
| No `dependsOn` or `condition` | Stages run unconditionally, wasting time and resources | Use `dependsOn` for ordering and `condition` for gating |
| Ignoring test failures (`continueOnError: true`) | Broken code proceeds to deployment; bugs reach production | Set `failTaskOnFailedTests: true`; fail the build on test failures |
| Duplicated steps across pipelines | Maintenance burden; drift between pipeline copies | Extract into step or job templates; share via a templates repo |
| Overly broad service connection permissions | Violates least privilege; larger blast radius if compromised | Scope service connections to specific resource groups and roles |
| No caching of dependencies | Every build re-downloads packages; slow feedback loops | Use `Cache@2` with `hashFiles`-based keys |
| Skipping approval gates for production | Accidental or unauthorized production deployments | Configure environment approvals and branch control checks |
| Deep git clones when not needed | Wastes time and bandwidth fetching full history | Use `fetchDepth: 1` for shallow clones when history is irrelevant |
| Polling for pipeline chaining | Wasteful and slow; adds unnecessary delay | Use `resources: pipelines:` triggers for event-driven chaining |
| No timeout on jobs | Stuck jobs consume agent capacity indefinitely | Set `timeoutInMinutes` on every job |

## Pipeline Review Checklist

Use this checklist when creating or reviewing Azure DevOps Pipeline YAML files.

### General Structure
- [ ] Pipeline has a clear `name` or the file is descriptively named
- [ ] Appropriate `trigger` and `pr` settings with branch and path filters
- [ ] Stages represent logical phases with meaningful `displayName`
- [ ] `dependsOn` correctly expresses ordering between stages and jobs
- [ ] `condition` is used for conditional execution where appropriate

### Build
- [ ] Agent pool uses a pinned VM image version
- [ ] Dependencies are cached with `Cache@2`
- [ ] Build artifacts are published with retention policies
- [ ] Code quality gates (linting, analysis) are included

### Testing
- [ ] Unit tests run and results are published (`PublishTestResults@2`)
- [ ] Code coverage is collected and published
- [ ] `failTaskOnFailedTests: true` is set
- [ ] Integration/E2E tests run in appropriate stages

### Security
- [ ] Secrets come from Key Vault or secret-marked variable groups, not inline
- [ ] Service connections follow least privilege
- [ ] Security scans (dependency, static analysis) are integrated
- [ ] Production environments have approval gates and branch control

### Deployment
- [ ] Deployment jobs use `environment:` for tracking and approvals
- [ ] Strategy (`runOnce`, `rolling`, `canary`) is chosen appropriately
- [ ] Health checks and smoke tests run post-deployment
- [ ] Rollback plan exists and is tested

### Performance
- [ ] Independent jobs run in parallel
- [ ] Matrix strategies are used for multi-configuration testing
- [ ] Shallow clone (`fetchDepth: 1`) is used where full history is not needed
- [ ] `timeoutInMinutes` is set on all jobs

### Templates and Reuse
- [ ] Common patterns are extracted into templates
- [ ] Shared templates are versioned and consumed via `resources: repositories`
- [ ] Variable templates are used for shared configuration
