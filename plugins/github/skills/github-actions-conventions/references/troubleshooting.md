# Troubleshooting Common GitHub Actions Issues

## 1. Workflow Not Triggering or Jobs Skipping

**Root Causes:** Mismatched `on` triggers, incorrect `paths`/`branches` filters, erroneous `if` conditions, or `concurrency` limitations.

### Actionable Steps

- **Verify Triggers:** Check the `on` block for exact match with the event. Ensure `branches`, `tags`, or `paths` filters are correctly defined. Remember `paths-ignore` and `branches-ignore` take precedence.
- **Inspect `if` Conditions:** Review all `if` conditions at workflow, job, and step levels. Use `always()` on a debug step to print context variables (`${{ toJson(github) }}`) to understand state during evaluation.
- **Check `concurrency`:** Verify if a previous run is blocking a new one for the same group.
- **Branch Protection Rules:** Ensure no rules are preventing workflows from running.

## 2. Permissions Errors

**Root Causes:** `GITHUB_TOKEN` lacking permissions, incorrect environment secrets access, or insufficient permissions for actions.

### Actionable Steps

- **`GITHUB_TOKEN` Permissions:** Review the `permissions` block at workflow and job levels. Default to `contents: read` globally.
- **Secret Access:** Verify secrets are configured in repository, organization, or environment settings. Check for pending manual approvals on environments.
- **OIDC Configuration:** Double-check trust policy configuration in your cloud provider. Verify the assigned role has necessary permissions.

## 3. Caching Issues

**Root Causes:** Incorrect cache key logic, `path` mismatch, cache size limits, or frequent invalidation.

### Actionable Steps

- **Validate Cache Keys:** Verify `key` and `restore-keys` are correct and change only when dependencies change. A key that is too dynamic always results in a miss.
- **Check `path`:** Ensure the `path` matches exactly where dependencies are installed.
- **Debug:** Use `actions/cache/restore` with `lookup-only: true` to inspect what keys are tried and why misses occur.
- **Limits:** Be aware of GitHub Actions cache size limits per repository.

## 4. Long Running Workflows or Timeouts

**Root Causes:** Inefficient steps, lack of parallelism, large dependencies, unoptimized Docker builds, or resource bottlenecks.

### Actionable Steps

- **Profile Execution Times:** Use workflow run summary to identify longest-running jobs and steps.
- **Optimize Steps:** Combine `run` commands with `&&`; clean up temporary files; install only necessary dependencies.
- **Leverage Caching:** Ensure `actions/cache` is optimally configured.
- **Parallelize:** Use `strategy.matrix` for concurrent execution.
- **Runner Selection:** Consider larger runners for resource-intensive tasks.
- **Break Down Workflows:** Split complex workflows into smaller, independent ones.

## 5. Flaky Tests in CI

**Root Causes:** Non-deterministic tests, race conditions, environmental inconsistencies, reliance on external services, or poor test isolation.

### Actionable Steps

- **Ensure Test Isolation:** Each test must be independent. Clean up resources after each test.
- **Eliminate Race Conditions:** Use explicit waits instead of arbitrary `sleep` commands. Implement retries for transient failures.
- **Standardize Environments:** Ensure CI environment matches local development. Use Docker `services` for consistent dependencies.
- **Robust Selectors (E2E):** Use `data-testid` attributes instead of brittle CSS classes.
- **Debugging:** Configure E2E frameworks to capture screenshots and video on failure.

## 6. Deployment Failures

**Root Causes:** Configuration drift, environmental differences, missing runtime dependencies, application errors, or network issues.

### Actionable Steps

- **Log Review:** Review deployment logs for errors and warnings.
- **Configuration Validation:** Verify environment variables, ConfigMaps, Secrets match target environment requirements.
- **Dependency Check:** Confirm all runtime dependencies are correctly bundled.
- **Post-Deployment Health Checks:** Implement automated smoke tests after deployment. Trigger rollbacks if they fail.
- **Network Connectivity:** Check connectivity between deployed components. Review firewall rules and network policies.
- **Rollback Immediately:** If production deployment fails, trigger rollback immediately. Diagnose in non-production.
