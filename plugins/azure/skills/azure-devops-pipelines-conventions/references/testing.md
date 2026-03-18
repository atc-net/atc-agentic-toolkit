# Testing Integration

## 1. Unit Tests

Run unit tests as early as possible in the pipeline to provide fast feedback. Failed unit tests should halt the pipeline immediately.

### Guidelines

- Run unit tests in the Build stage, immediately after compilation
- Publish results in a standard format so they appear in the Azure DevOps test tab
- Set `failTaskOnFailedTests: true` to fail the build on any test failure
- Collect code coverage alongside test results

### Example (.NET Unit Tests with Coverage)

```yaml
steps:
  - task: DotNetCoreCLI@2
    displayName: 'Run unit tests'
    inputs:
      command: test
      projects: '**/*Tests.csproj'
      arguments: >-
        --configuration $(buildConfiguration)
        --no-build
        --collect:"XPlat Code Coverage"
        --logger trx
        --results-directory $(Agent.TempDirectory)/TestResults
      publishTestResults: true

  - task: PublishCodeCoverageResults@2
    displayName: 'Publish code coverage'
    inputs:
      summaryFileLocation: '$(Agent.TempDirectory)/**/coverage.cobertura.xml'
```

### Example (JavaScript/Node.js Tests)

```yaml
steps:
  - task: Npm@1
    displayName: 'Run tests'
    inputs:
      command: custom
      customCommand: 'test -- --ci --coverage --reporters=jest-junit'

  - task: PublishTestResults@2
    displayName: 'Publish test results'
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: '**/junit.xml'
      failTaskOnFailedTests: true

  - task: PublishCodeCoverageResults@2
    displayName: 'Publish code coverage'
    inputs:
      summaryFileLocation: '**/coverage/cobertura-coverage.xml'
```

## 2. Publishing Test Results

Azure DevOps supports several test result formats:

| Format | Common Use | `testResultsFormat` Value |
|---|---|---|
| JUnit XML | Java, JavaScript, Python, cross-platform | `JUnit` |
| VSTest TRX | .NET, Visual Studio | `VSTest` |
| NUnit | .NET (NUnit framework) | `NUnit` |
| xUnit | .NET (xUnit framework) | `XUnit` |
| CTest | C/C++ | `CTest` |

### Guidelines

- Choose the format that matches your test runner
- Use `PublishTestResults@2` with `mergeTestResults: true` when multiple test result files are produced
- Set `testRunTitle` for easy identification in the test tab
- Always set `failTaskOnFailedTests: true` unless there is a specific reason to allow failures (and document that reason)

### Example (Multiple Test Result Files)

```yaml
- task: PublishTestResults@2
  displayName: 'Publish all test results'
  inputs:
    testResultsFormat: 'VSTest'
    testResultsFiles: '**/*.trx'
    mergeTestResults: true
    testRunTitle: 'Unit Tests - $(Build.BuildNumber)'
    failTaskOnFailedTests: true
```

## 3. Code Coverage

Code coverage helps identify untested code paths. Publish coverage results so they appear in the Azure DevOps coverage tab.

### Guidelines

- Use the `PublishCodeCoverageResults@2` task (v2 supports Cobertura format natively)
- For .NET, use `--collect:"XPlat Code Coverage"` with `dotnet test` to generate Cobertura XML
- For JavaScript, configure your test runner (Jest, Vitest, Istanbul) to output Cobertura format
- Consider enforcing a minimum coverage threshold in a script step (fail the build if coverage drops below an acceptable level)

### Example (Coverage Threshold Enforcement)

```yaml
steps:
  - script: |
      COVERAGE=$(python -c "
      import xml.etree.ElementTree as ET
      tree = ET.parse('$(Agent.TempDirectory)/coverage.cobertura.xml')
      root = tree.getroot()
      print(root.attrib.get('line-rate', '0'))
      ")
      echo "Line coverage: $COVERAGE"
      if (( $(echo "$COVERAGE < 0.80" | bc -l) )); then
        echo "##vso[task.logissue type=error]Code coverage ($COVERAGE) is below the 80% threshold"
        exit 1
      fi
    displayName: 'Enforce 80% coverage threshold'
```

## 4. Integration Tests

Integration tests verify that components work together correctly. They typically require external dependencies (databases, message queues, APIs).

### Guidelines

- Run integration tests in a dedicated stage after the Build stage
- Provision test dependencies within the pipeline (Docker containers, Azure resources) or target a persistent test environment
- Use a dedicated service connection with limited permissions for the test environment
- Set longer `timeoutInMinutes` for integration test jobs -- they are inherently slower than unit tests
- Tear down test-specific resources after the tests complete to avoid resource leaks

### Example (Integration Tests with Docker Services)

```yaml
stages:
  - stage: IntegrationTests
    displayName: 'Integration Tests'
    dependsOn: Build
    jobs:
      - job: IntegrationTests
        displayName: 'Run integration tests'
        pool:
          vmImage: 'ubuntu-22.04'
        timeoutInMinutes: 60
        services:
          sqlserver:
            image: mcr.microsoft.com/mssql/server:2022-latest
            ports:
              - 1433:1433
            env:
              ACCEPT_EULA: Y
              SA_PASSWORD: $(testDbPassword)
        steps:
          - task: DotNetCoreCLI@2
            displayName: 'Run integration tests'
            inputs:
              command: test
              projects: '**/*IntegrationTests.csproj'
              arguments: '--configuration Release'
            env:
              ConnectionStrings__TestDb: 'Server=localhost;Database=TestDb;User=sa;Password=$(testDbPassword);TrustServerCertificate=true'

          - task: PublishTestResults@2
            displayName: 'Publish integration test results'
            inputs:
              testResultsFormat: 'VSTest'
              testResultsFiles: '**/*.trx'
              testRunTitle: 'Integration Tests'
              failTaskOnFailedTests: true
```

## 5. End-to-End (E2E) Tests

E2E tests validate the full application flow from the user's perspective. They run against a deployed environment.

### Guidelines

- Run E2E tests after deploying to a staging or QA environment
- Use `dependsOn` to ensure the deployment stage completed successfully
- Capture screenshots, traces, or video on failure for debugging
- Implement retry logic for known-flaky network-dependent tests, but track flakiness and fix root causes
- Keep E2E test suites focused on critical user flows; avoid duplicating unit test coverage

### Example (E2E Tests After Staging Deployment)

```yaml
stages:
  - stage: E2ETests
    displayName: 'E2E Tests'
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - job: E2ETests
        displayName: 'Run E2E tests'
        pool:
          vmImage: 'ubuntu-22.04'
        timeoutInMinutes: 60
        steps:
          - task: Npm@1
            displayName: 'Install Playwright'
            inputs:
              command: ci
              workingDir: 'tests/e2e'

          - script: npx playwright install --with-deps chromium
            displayName: 'Install browser'
            workingDirectory: 'tests/e2e'

          - script: npx playwright test --reporter=junit
            displayName: 'Run Playwright tests'
            workingDirectory: 'tests/e2e'
            env:
              BASE_URL: $(stagingUrl)

          - task: PublishTestResults@2
            displayName: 'Publish E2E results'
            condition: always()
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/results.xml'
              testRunTitle: 'E2E Tests'
              failTaskOnFailedTests: true

          - task: PublishPipelineArtifact@1
            displayName: 'Publish test traces on failure'
            condition: failed()
            inputs:
              targetPath: 'tests/e2e/test-results'
              artifactName: 'e2e-traces'
```

## 6. Test Strategy by Stage

| Stage | Test Type | Fail Behavior | Typical Timeout |
|---|---|---|---|
| Build | Unit tests | Fail immediately | 15-30 min |
| Build | Static analysis / linting | Fail immediately | 10-15 min |
| Post-Deploy (Dev/QA) | Integration tests | Fail the stage | 30-60 min |
| Post-Deploy (Staging) | E2E tests | Fail the stage | 30-60 min |
| Post-Deploy (Production) | Smoke tests | Trigger rollback | 5-10 min |
