# Pipeline Structure and Templates

## 1. YAML Fundamentals

- Use 2-space indentation throughout all pipeline files for consistency.
- Avoid tabs; YAML parsers reject them and Azure DevOps will fail to parse the file.
- Quote strings that contain special YAML characters (`:`, `#`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``).
- Use block scalars (`|` for literal, `>` for folded) for multi-line script content.

### Example (Block Scalar for Scripts)

```yaml
steps:
  - script: |
      echo "Building application..."
      dotnet build --configuration Release
      dotnet test --no-build
    displayName: 'Build and test'
```

## 2. Stages

Stages represent the major phases of a pipeline and appear as visual gates in the Azure DevOps run UI.

- Name stages descriptively: `Build`, `UnitTests`, `DeployDev`, `IntegrationTests`, `DeployProd`.
- Use `dependsOn` to define execution order. Stages without `dependsOn` run in parallel by default when they are at the same level.
- Use `condition` to gate execution (e.g., only deploy to production from the `main` branch).
- Keep stages focused on a single responsibility.

### Example (Multi-Stage with Dependencies)

```yaml
stages:
  - stage: Build
    displayName: 'Build'
    jobs:
      - job: BuildApp
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: echo "Building..."

  - stage: Test
    displayName: 'Run Tests'
    dependsOn: Build
    jobs:
      - job: UnitTests
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: echo "Testing..."

  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: Test
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployStaging
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to staging..."

  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployProd
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to production..."
```

## 3. Jobs

Jobs run on an agent and group related steps. They are the unit of parallelism within a stage.

- Use `job:` for standard build/test work.
- Use `deployment:` for deployments that target an environment (enables approvals, deployment history, and rollback tracking).
- Set `timeoutInMinutes` on every job to prevent runaway agents from consuming capacity.
- Use `dependsOn` between jobs within a stage for ordering; omit it for parallel execution.
- Pass data between jobs using `output` variables.

### Example (Parallel Jobs with Output)

```yaml
jobs:
  - job: BuildApi
    displayName: 'Build API'
    pool:
      vmImage: 'ubuntu-22.04'
    timeoutInMinutes: 30
    steps:
      - script: dotnet build src/Api
        displayName: 'Build API project'
      - script: echo "##vso[task.setvariable variable=apiVersion;isOutput=true]1.2.3"
        name: setVersion

  - job: BuildWeb
    displayName: 'Build Web Frontend'
    pool:
      vmImage: 'ubuntu-22.04'
    timeoutInMinutes: 30
    steps:
      - script: npm ci && npm run build
        displayName: 'Build frontend'

  - job: Deploy
    displayName: 'Deploy'
    dependsOn:
      - BuildApi
      - BuildWeb
    variables:
      apiVersion: $[ dependencies.BuildApi.outputs['setVersion.apiVersion'] ]
    steps:
      - script: echo "Deploying API version $(apiVersion)"
        displayName: 'Deploy with version from build'
```

## 4. Steps

Steps are the individual tasks within a job.

- Give every step a descriptive `displayName` so the run log is scannable.
- Prefer built-in tasks (e.g., `DotNetCoreCLI@2`, `Npm@1`) over inline `script` or `bash` for better error handling and logging.
- Use `condition` on steps for conditional execution (e.g., only publish on the main branch).
- Pin task versions to a major version (`@2`) to avoid breaking changes from minor updates.

### Example (Steps with Conditions)

```yaml
steps:
  - task: DotNetCoreCLI@2
    displayName: 'Restore packages'
    inputs:
      command: restore

  - task: DotNetCoreCLI@2
    displayName: 'Build'
    inputs:
      command: build
      arguments: '--configuration Release --no-restore'

  - task: DotNetCoreCLI@2
    displayName: 'Publish test results'
    inputs:
      command: test
      arguments: '--no-build'
      publishTestResults: true

  - task: PublishPipelineArtifact@1
    displayName: 'Publish artifact (main only)'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    inputs:
      targetPath: '$(Build.ArtifactStagingDirectory)'
      artifactName: 'drop'
```

## 5. Templates

Templates are the primary mechanism for reuse in Azure DevOps Pipelines. There are four template types:

| Template Type | Purpose | Reference Syntax |
|---|---|---|
| **Stage template** | Reuse an entire stage (with its jobs and steps) | `- template: stages/deploy.yml` |
| **Job template** | Reuse a job definition | `- template: jobs/build.yml` |
| **Step template** | Reuse a sequence of steps | `- template: steps/restore-and-build.yml` |
| **Variable template** | Reuse variable definitions | `- template: variables/common.yml` |

### Step Template Example

**File: `templates/steps/dotnet-build.yml`**
```yaml
parameters:
  - name: configuration
    type: string
    default: 'Release'
  - name: projects
    type: string
    default: '**/*.csproj'

steps:
  - task: DotNetCoreCLI@2
    displayName: 'Restore'
    inputs:
      command: restore
      projects: ${{ parameters.projects }}

  - task: DotNetCoreCLI@2
    displayName: 'Build (${{ parameters.configuration }})'
    inputs:
      command: build
      projects: ${{ parameters.projects }}
      arguments: '--configuration ${{ parameters.configuration }} --no-restore'
```

**Consuming the template:**
```yaml
jobs:
  - job: Build
    pool:
      vmImage: 'ubuntu-22.04'
    steps:
      - template: templates/steps/dotnet-build.yml
        parameters:
          configuration: 'Release'
```

### Extends Templates

Extends templates enforce organizational standards. The pipeline must use the template as its base, and the template controls what the pipeline can and cannot do.

```yaml
# templates/pipeline-base.yml
parameters:
  - name: stages
    type: stageList
    default: []

stages:
  - stage: SecurityScan
    displayName: 'Mandatory Security Scan'
    jobs:
      - job: Scan
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - task: CredScan@3
            displayName: 'Credential scan'

  - ${{ each stage in parameters.stages }}:
    - ${{ stage }}
```

```yaml
# azure-pipelines.yml
extends:
  template: templates/pipeline-base.yml
  parameters:
    stages:
      - stage: Build
        jobs:
          - job: BuildApp
            pool:
              vmImage: 'ubuntu-22.04'
            steps:
              - script: echo "Building..."
```

### Cross-Repository Templates

Share templates across projects by referencing an external repository:

```yaml
resources:
  repositories:
    - repository: templates
      type: git
      name: MyProject/pipeline-templates
      ref: refs/tags/v1.0

stages:
  - template: stages/build.yml@templates
    parameters:
      configuration: 'Release'
```

Pin the `ref` to a tag or specific branch to avoid unexpected changes when the templates repository is updated.

## 6. Pipeline File Organization

For non-trivial projects, organize pipeline files into a clear directory structure:

```
pipelines/
  azure-pipelines.yml          # Main pipeline entry point
  templates/
    stages/
      build.yml
      deploy.yml
    jobs/
      build-dotnet.yml
      run-tests.yml
    steps/
      restore-and-build.yml
      publish-artifact.yml
    variables/
      common.yml
      dev.yml
      prod.yml
```

This structure makes pipelines easier to navigate, review, and maintain. Each template file has a single responsibility, and the main pipeline file reads as a high-level orchestration document.
