# Variable and Parameter Management

## 1. Variable Types

Azure DevOps Pipelines supports several variable mechanisms, each suited to different use cases:

| Mechanism | Scope | Set At | Best For |
|---|---|---|---|
| Inline `variables:` | Pipeline or stage | Design time | Build configuration, feature flags |
| Variable groups | Across pipelines | Design time (UI/CLI) | Shared config, Key Vault-linked secrets |
| Runtime parameters | Pipeline | Queue time | User-selectable options, environment targeting |
| Template variables | Template consumers | Design time | Shared variable definitions |
| Pipeline variables (`##vso`) | Job/step | Runtime | Computed values, inter-step communication |
| Predefined variables | System | Runtime | Build info (`Build.BuildId`, `Build.SourceBranch`) |

## 2. Inline Variables

Define variables directly in the pipeline YAML. Use for build configuration and non-sensitive settings.

```yaml
variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0.x'
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

stages:
  - stage: Build
    jobs:
      - job: Build
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)
          - script: dotnet build --configuration $(buildConfiguration)
```

### Conditional Variables

Set variable values based on conditions:

```yaml
variables:
  ${{ if eq(variables['Build.SourceBranch'], 'refs/heads/main') }}:
    environment: 'production'
    deploySlot: 'staging'
  ${{ elseif startsWith(variables['Build.SourceBranch'], 'refs/heads/release/') }}:
    environment: 'staging'
    deploySlot: 'staging'
  ${{ else }}:
    environment: 'dev'
    deploySlot: ''
```

## 3. Variable Groups

Variable groups store collections of variables that can be shared across multiple pipelines.

### Guidelines

- Create separate variable groups per environment: `app-settings-dev`, `app-settings-staging`, `app-settings-prod`
- Link variable groups to Azure Key Vault for secrets (see [security.md](security.md))
- Restrict access using pipeline permissions -- only authorized pipelines should consume a group
- Use descriptive names that indicate scope and purpose

### Example (Referencing Variable Groups)

```yaml
variables:
  - group: app-settings-common
  - group: app-settings-$(environment)
  - name: localVar
    value: 'local-value'
```

### Example (Variable Group per Stage)

```yaml
stages:
  - stage: DeployDev
    variables:
      - group: app-settings-dev
    jobs:
      - deployment: Deploy
        environment: 'dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "DB=$(dbConnectionString)"

  - stage: DeployProd
    variables:
      - group: app-settings-prod
    jobs:
      - deployment: Deploy
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "DB=$(dbConnectionString)"
```

## 4. Runtime Parameters

Parameters allow pipeline users to provide input at queue time. They support type validation, default values, and constrained choices.

### Supported Parameter Types

| Type | Description | Example |
|---|---|---|
| `string` | Free-form text or constrained to `values` | Environment name |
| `number` | Numeric value | Replica count |
| `boolean` | True/false toggle | Enable verbose logging |
| `object` | YAML object | Complex configuration |
| `stepList` | List of steps | Custom steps injected by template consumers |
| `jobList` | List of jobs | Custom jobs injected by template consumers |
| `stageList` | List of stages | Custom stages injected by template consumers |

### Example (Parameters with Validation)

```yaml
parameters:
  - name: environment
    displayName: 'Target environment'
    type: string
    default: 'dev'
    values:
      - dev
      - staging
      - production

  - name: runIntegrationTests
    displayName: 'Run integration tests'
    type: boolean
    default: true

  - name: replicaCount
    displayName: 'Number of replicas'
    type: number
    default: 2

stages:
  - stage: Deploy
    displayName: 'Deploy to ${{ parameters.environment }}'
    jobs:
      - deployment: Deploy
        environment: '${{ parameters.environment }}'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: |
                    echo "Deploying to ${{ parameters.environment }}"
                    echo "Replicas: ${{ parameters.replicaCount }}"

  - stage: IntegrationTests
    displayName: 'Integration Tests'
    dependsOn: Deploy
    condition: and(succeeded(), eq('${{ parameters.runIntegrationTests }}', true))
    jobs:
      - job: Test
        steps:
          - script: echo "Running integration tests..."
```

## 5. Variable Templates

Variable templates let you define variables in a separate file and reference them from multiple pipelines.

### Example (Variable Template)

**File: `templates/variables/common.yml`**
```yaml
variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0.x'
  artifactName: 'app-artifact'
```

**File: `templates/variables/dev.yml`**
```yaml
variables:
  environment: 'dev'
  azureSubscription: 'dev-service-connection'
  resourceGroup: 'rg-myapp-dev'
  webAppName: 'webapp-myapp-dev'
```

**Consuming variable templates:**
```yaml
variables:
  - template: templates/variables/common.yml
  - template: templates/variables/dev.yml
  - name: additionalVar
    value: 'extra-value'
```

## 6. Setting Variables at Runtime

Use logging commands to set variables during step execution. This is essential for computed values and inter-step communication.

### Within a Job (Step-to-Step)

```yaml
steps:
  - script: |
      VERSION=$(cat version.txt)
      echo "##vso[task.setvariable variable=appVersion]$VERSION"
    displayName: 'Read version'
    name: readVersion

  - script: echo "Version is $(appVersion)"
    displayName: 'Use version'
```

### Across Jobs (Output Variables)

```yaml
jobs:
  - job: GetVersion
    steps:
      - script: |
          echo "##vso[task.setvariable variable=appVersion;isOutput=true]1.2.3"
        name: setVar

  - job: UseVersion
    dependsOn: GetVersion
    variables:
      version: $[ dependencies.GetVersion.outputs['setVar.appVersion'] ]
    steps:
      - script: echo "Version is $(version)"
```

### Secret Variables at Runtime

Mark a runtime variable as secret so it is masked in logs:

```yaml
steps:
  - script: |
      TOKEN=$(curl -s https://auth.example.com/token)
      echo "##vso[task.setvariable variable=authToken;isSecret=true]$TOKEN"
    displayName: 'Fetch auth token'

  - script: |
      curl -H "Authorization: Bearer $(authToken)" https://api.example.com/data
    displayName: 'Call API with token'
```

## 7. Expression Syntax

Azure DevOps supports three expression syntaxes, each evaluated at different times:

| Syntax | Evaluated At | Use For |
|---|---|---|
| `${{ }}` | Template parsing (compile time) | Template parameters, conditional insertion |
| `$[ ]` | Runtime (before step runs) | Expressions in `variables:` and `condition:` |
| `$()` | Runtime (during step execution) | Macro expansion in task inputs and scripts |

### Example (All Three Syntaxes)

```yaml
parameters:
  - name: env
    type: string
    default: 'dev'

variables:
  # Compile-time: template expression
  configFile: ${{ parameters.env }}-config.json

  # Runtime expression: evaluated before steps run
  isMainBranch: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

steps:
  # Macro syntax: expanded during step execution
  - script: echo "Config: $(configFile), Is main: $(isMainBranch)"
```
