# Security Best Practices

## 1. Azure Key Vault Integration

Azure Key Vault is the recommended way to manage secrets in Azure DevOps Pipelines. It keeps secrets out of YAML files and source control, provides auditing, and supports rotation.

### Guidelines

- Store all secrets (connection strings, API keys, certificates) in Azure Key Vault
- Use the `AzureKeyVault@2` task to fetch secrets into pipeline variables at runtime
- Limit which secrets are fetched using `SecretsFilter` rather than fetching all (`*`)
- Ensure the service connection used to access Key Vault has only `Get` and `List` permissions on secrets

### Example (Fetching Secrets from Key Vault)

```yaml
steps:
  - task: AzureKeyVault@2
    displayName: 'Fetch secrets from Key Vault'
    inputs:
      azureSubscription: 'my-service-connection'
      KeyVaultName: 'kv-myapp-prod'
      SecretsFilter: 'DbConnectionString,ApiKey,StorageAccountKey'
      RunAsPreJob: true

  - script: |
      echo "Deploying with fetched secrets..."
      # Secrets are available as variables: $(DbConnectionString), $(ApiKey), $(StorageAccountKey)
      # Azure DevOps automatically masks these in logs
    displayName: 'Deploy with secrets'
```

## 2. Variable Groups and Secret Management

Variable groups provide centralized configuration management. When linked to Key Vault, they automatically sync secrets.

### Guidelines

- Use variable groups for configuration shared across multiple pipelines
- Link variable groups to Key Vault for automatic secret synchronization
- Mark sensitive variables as `isSecret: true` when not using Key Vault linkage
- Restrict access to variable groups using pipeline permissions (only authorized pipelines can use them)
- Use separate variable groups per environment (e.g., `app-settings-dev`, `app-settings-prod`)

### Example (Variable Groups in Pipeline)

```yaml
variables:
  - group: app-settings-common      # Shared non-secret configuration
  - group: app-settings-$(env)      # Environment-specific (linked to Key Vault)
  - name: buildConfiguration
    value: 'Release'
```

### Example (Secret Variable in Variable Group)

When defining variables inline (not linked to Key Vault), mark secrets explicitly:

```yaml
variables:
  - name: apiKey
    value: $(ApiKey)    # Referenced from a secret variable group
  - name: publicSetting
    value: 'not-a-secret'
```

In the Azure DevOps UI, mark the variable as secret (lock icon) so it is encrypted at rest and masked in logs.

## 3. Service Connection Permissions

Service connections authenticate pipelines to external services (Azure subscriptions, container registries, Kubernetes clusters).

### Guidelines

- Follow least privilege: scope service connections to specific resource groups, not entire subscriptions
- Prefer **Workload Identity Federation** (OIDC) over service principal with client secret -- it eliminates long-lived credentials
- Prefer **managed identities** when the pipeline agent runs on Azure infrastructure (self-hosted agents on VMs or VMSS)
- Review and audit service connections periodically; remove unused ones
- Restrict which pipelines can use a service connection via pipeline permissions

### Example (Workload Identity Federation Setup)

Azure DevOps supports Workload Identity Federation for Azure Resource Manager service connections. This uses OIDC tokens instead of client secrets:

1. Create a service connection of type "Azure Resource Manager" with "Workload Identity Federation (automatic)" or "(manual)"
2. Azure DevOps configures a federated credential on the app registration
3. No client secret is stored; authentication uses short-lived OIDC tokens

```yaml
# Pipeline uses the service connection as usual -- no change in YAML
steps:
  - task: AzureCLI@2
    displayName: 'Run Azure CLI commands'
    inputs:
      azureSubscription: 'my-workload-identity-connection'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az group list --output table
```

## 4. Security Scanning

Integrate security scanning into the pipeline to catch vulnerabilities before they reach production.

### Dependency Scanning

Check third-party dependencies for known vulnerabilities.

```yaml
steps:
  # .NET dependency scanning
  - script: |
      dotnet list package --vulnerable --include-transitive 2>&1 | tee vulnerability-report.txt
      if grep -q "has the following vulnerable packages" vulnerability-report.txt; then
        echo "##vso[task.logissue type=error]Vulnerable packages detected"
        exit 1
      fi
    displayName: 'Check for vulnerable NuGet packages'

  # npm audit for JavaScript
  - script: npm audit --audit-level=high
    displayName: 'Check for vulnerable npm packages'
```

### Static Analysis (SAST)

Analyze source code for security flaws, code smells, and bugs.

```yaml
steps:
  - task: SonarQubePrepare@5
    displayName: 'Prepare SonarQube analysis'
    inputs:
      SonarQube: 'sonarqube-connection'
      scannerMode: 'MSBuild'
      projectKey: 'my-project'
      extraProperties: |
        sonar.cs.opencover.reportsPaths=$(Agent.TempDirectory)/**/coverage.opencover.xml

  # Build and test steps here...

  - task: SonarQubeAnalyze@5
    displayName: 'Run SonarQube analysis'

  - task: SonarQubePublish@5
    displayName: 'Publish quality gate result'

  - task: sonar-buildbreaker@8
    displayName: 'Break build on quality gate failure'
    inputs:
      SonarQube: 'sonarqube-connection'
```

### Container Image Scanning

Scan container images for OS and library vulnerabilities before pushing to a registry.

```yaml
steps:
  - task: Docker@2
    displayName: 'Build container image'
    inputs:
      command: build
      dockerfile: 'Dockerfile'
      tags: '$(Build.BuildId)'

  - script: |
      docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy:latest image \
        --exit-code 1 \
        --severity HIGH,CRITICAL \
        myapp:$(Build.BuildId)
    displayName: 'Scan container image for vulnerabilities'
```

## 5. Environment Approvals and Checks

Azure DevOps environments support approval gates and automated checks that prevent unauthorized deployments.

### Guidelines

- Configure manual approvals for production and staging environments
- Use branch control checks to restrict which branches can deploy to an environment
- Add business hours checks if deployments should only happen during work hours
- Consider adding an "invoke Azure Function" or "invoke REST API" check for automated validation
- Set approval timeouts to prevent stale approvals

### Configuration Steps (UI)

1. Navigate to Pipelines > Environments > select the environment
2. Click the three-dot menu > Approvals and checks
3. Add approvals: specify approvers, set minimum number of approvals, configure timeout
4. Add branch control: restrict to `refs/heads/main` or `refs/heads/release/*`
5. Optionally add business hours, exclusive lock, or custom function checks

### Example (Deployment Job Targeting Environment)

```yaml
stages:
  - stage: DeployProd
    displayName: 'Deploy to Production'
    jobs:
      - deployment: DeployProd
        displayName: 'Production Deployment'
        environment: 'production'    # Approvals and checks configured on this environment
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to production..."
```

When the pipeline reaches the `DeployProd` stage, it pauses and waits for the configured approvals and checks to pass before proceeding.

## 6. Security Checklist

- [ ] All secrets stored in Azure Key Vault or secret-marked variable groups
- [ ] No secrets hardcoded in YAML, scripts, or configuration files
- [ ] Service connections scoped to minimum required permissions
- [ ] Workload Identity Federation or managed identities used where possible
- [ ] Dependency scanning integrated and blocking on high/critical vulnerabilities
- [ ] Static analysis (SAST) integrated with quality gate enforcement
- [ ] Container images scanned before registry push
- [ ] Production environments have manual approval gates
- [ ] Branch control checks restrict deployment to approved branches
- [ ] Pipeline permissions restrict which pipelines can use service connections and variable groups
- [ ] Audit logs reviewed periodically for anomalous activity
