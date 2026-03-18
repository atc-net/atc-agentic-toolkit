# Performance Optimization

## 1. Parallel Jobs

Jobs within a stage run in parallel by default (unless constrained by `dependsOn`). Use this to speed up pipelines by running independent work concurrently.

### Guidelines

- Separate truly independent work into distinct jobs (e.g., build API and build frontend in parallel)
- Be aware of your organization's parallel job limit -- paid tiers allow more concurrent agents
- Use `dependsOn` only when there is a real data or ordering dependency

### Example (Parallel Build Jobs)

```yaml
stages:
  - stage: Build
    jobs:
      - job: BuildApi
        displayName: 'Build API'
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: dotnet build src/Api

      - job: BuildWeb
        displayName: 'Build Frontend'
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: npm ci && npm run build
            workingDirectory: src/web

      - job: RunLint
        displayName: 'Lint and Static Analysis'
        pool:
          vmImage: 'ubuntu-22.04'
        steps:
          - script: npm run lint
            workingDirectory: src/web

      # This job waits for all three to complete
      - job: Package
        displayName: 'Package artifacts'
        dependsOn:
          - BuildApi
          - BuildWeb
          - RunLint
        steps:
          - script: echo "Packaging..."
```

## 2. Matrix Strategies

Matrix strategies run a job multiple times with different variable combinations. This is ideal for testing across OS versions, framework versions, or configurations.

### Example (OS and Framework Matrix)

```yaml
jobs:
  - job: Test
    displayName: 'Test'
    strategy:
      matrix:
        linux-net8:
          vmImage: 'ubuntu-22.04'
          dotnetVersion: '8.0.x'
        linux-net9:
          vmImage: 'ubuntu-22.04'
          dotnetVersion: '9.0.x'
        windows-net8:
          vmImage: 'windows-2022'
          dotnetVersion: '8.0.x'
        windows-net9:
          vmImage: 'windows-2022'
          dotnetVersion: '9.0.x'
      maxParallel: 4    # Run all combinations concurrently
    pool:
      vmImage: $(vmImage)
    steps:
      - task: UseDotNet@2
        inputs:
          version: $(dotnetVersion)
      - script: dotnet test
```

### Example (Node.js Version Matrix)

```yaml
jobs:
  - job: Test
    strategy:
      matrix:
        node-18:
          nodeVersion: '18.x'
        node-20:
          nodeVersion: '20.x'
        node-22:
          nodeVersion: '22.x'
      maxParallel: 3
    pool:
      vmImage: 'ubuntu-22.04'
    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: $(nodeVersion)
      - script: npm ci && npm test
```

### Guidelines

- Use `maxParallel` to control concurrency (default is unlimited, which consumes all available agents)
- Keep matrix dimensions manageable; the total number of jobs is the product of all dimensions
- Name matrix entries descriptively so the UI clearly shows which combination is running

## 3. Caching

The `Cache@2` task stores and restores directories across pipeline runs to avoid redundant downloads.

### How Cache Keys Work

The cache key is a pipe-delimited string. If the exact key matches a cached entry, the directory is restored. If not, `restoreKeys` are tried in order (partial match, most recently created).

### Example (NuGet Cache)

```yaml
variables:
  NUGET_PACKAGES: $(Pipeline.Workspace)/.nuget/packages

steps:
  - task: Cache@2
    displayName: 'Cache NuGet packages'
    inputs:
      key: 'nuget | "$(Agent.OS)" | **/packages.lock.json'
      restoreKeys: |
        nuget | "$(Agent.OS)"
      path: $(NUGET_PACKAGES)

  - task: DotNetCoreCLI@2
    inputs:
      command: restore
      restoreArguments: '--locked-mode'
```

### Example (npm Cache)

```yaml
steps:
  - task: Cache@2
    displayName: 'Cache npm packages'
    inputs:
      key: 'npm | "$(Agent.OS)" | package-lock.json'
      restoreKeys: |
        npm | "$(Agent.OS)"
      path: $(Pipeline.Workspace)/.npm

  - script: npm ci --cache $(Pipeline.Workspace)/.npm
```

### Example (pip Cache)

```yaml
steps:
  - task: Cache@2
    displayName: 'Cache pip packages'
    inputs:
      key: 'pip | "$(Agent.OS)" | requirements.txt'
      restoreKeys: |
        pip | "$(Agent.OS)"
      path: $(Pipeline.Workspace)/.pip

  - script: pip install --cache-dir $(Pipeline.Workspace)/.pip -r requirements.txt
```

### Guidelines

- Always include `$(Agent.OS)` in the cache key because cached binaries are OS-specific
- Use `hashFiles`-style glob patterns (e.g., `**/packages.lock.json`) so the cache invalidates when dependencies change
- Use `restoreKeys` for partial matching -- a stale cache that needs a few updated packages is still faster than a clean restore
- Enable lock files in your package manager (NuGet `packages.lock.json`, npm `package-lock.json`) for deterministic caching

## 4. Shallow Clone

By default, `checkout: self` clones the full git history. For most build pipelines, only the current commit is needed.

```yaml
steps:
  - checkout: self
    fetchDepth: 1           # Shallow clone -- only the latest commit
    clean: true             # Clean the workspace before checkout
```

### When Not to Use Shallow Clone

- When you need git history for versioning (e.g., GitVersion, semantic-release)
- When the build process runs `git log`, `git diff`, or `git blame`
- When you use submodules that require history

In those cases, either omit `fetchDepth` (full clone) or set a specific depth that covers the needed history:

```yaml
steps:
  - checkout: self
    fetchDepth: 0    # Full clone for version computation
```

## 5. Docker Layer Caching

When building Docker images in a pipeline, caching layers avoids rebuilding unchanged layers.

### Example (Docker Build with Cache)

```yaml
steps:
  - task: Docker@2
    displayName: 'Build with cache'
    inputs:
      command: build
      dockerfile: 'Dockerfile'
      arguments: |
        --cache-from $(containerRegistry)/$(imageName):cache
        --build-arg BUILDKIT_INLINE_CACHE=1
      tags: |
        $(Build.BuildId)
        cache
    env:
      DOCKER_BUILDKIT: 1

  - task: Docker@2
    displayName: 'Push image and cache'
    inputs:
      command: push
      tags: |
        $(Build.BuildId)
        cache
```

### Guidelines

- Enable BuildKit (`DOCKER_BUILDKIT=1`) for better caching behavior
- Push a `cache` tag alongside the version tag; pull it as `--cache-from` in subsequent builds
- Order Dockerfile instructions so that frequently changing layers (source code) come after stable layers (dependencies)

## 6. Pipeline Resource Triggers

Use resource triggers to chain pipelines in an event-driven manner instead of polling or manual triggering.

### Example (Trigger Deployment on Build Completion)

**Build pipeline** (`build-pipeline.yml`):
```yaml
trigger:
  branches:
    include:
      - main

stages:
  - stage: Build
    jobs:
      - job: Build
        steps:
          - script: echo "Building..."
```

**Deployment pipeline** (`deploy-pipeline.yml`):
```yaml
trigger: none    # No CI trigger; this pipeline is triggered by the resource

resources:
  pipelines:
    - pipeline: buildPipeline
      source: 'Build Pipeline'    # Name of the build pipeline
      trigger:
        branches:
          include:
            - main

stages:
  - stage: Deploy
    jobs:
      - deployment: Deploy
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: buildPipeline
                  artifact: 'app'
                - script: echo "Deploying artifact from build pipeline..."
```

### Guidelines

- Set `trigger: none` on the downstream pipeline so it does not also trigger on code pushes
- Use `download:` to access artifacts from the triggering pipeline
- Specify branch filters in the resource trigger to control which builds trigger deployment
- This pattern cleanly separates build and deployment responsibilities into distinct pipelines

## 7. Artifact Management

### Guidelines

- Use `PublishPipelineArtifact@1` (pipeline artifacts) over `PublishBuildArtifacts@1` (build artifacts) -- pipeline artifacts are faster and support deduplication
- Set `retention-days` via pipeline settings or the REST API to avoid accumulating stale artifacts
- Include only what is needed in the artifact; exclude build intermediates, test results (publish those separately), and source code
- Use descriptive artifact names (`api-build`, `web-build`, `infrastructure-templates`) when publishing multiple artifacts

### Example (Multiple Artifacts)

```yaml
steps:
  - task: PublishPipelineArtifact@1
    displayName: 'Publish API artifact'
    inputs:
      targetPath: '$(Build.ArtifactStagingDirectory)/api'
      artifactName: 'api-build'

  - task: PublishPipelineArtifact@1
    displayName: 'Publish Web artifact'
    inputs:
      targetPath: '$(Build.ArtifactStagingDirectory)/web'
      artifactName: 'web-build'

  - task: PublishPipelineArtifact@1
    displayName: 'Publish IaC templates'
    inputs:
      targetPath: 'infra/'
      artifactName: 'infrastructure'
```
