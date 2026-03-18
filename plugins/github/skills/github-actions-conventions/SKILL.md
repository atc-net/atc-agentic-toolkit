---
name: github-actions-conventions
description: 'Best practices and conventions for GitHub Actions CI/CD workflows. Covers workflow structure, jobs, steps, triggers, environment variables, secret management, OIDC authentication, caching strategies, matrix builds, reusable and composite actions, testing integration (unit, integration, E2E, performance), deployment strategies (blue/green, canary, rolling), rollback procedures, and security hardening. Apply this skill whenever creating, reviewing, modifying, or troubleshooting files in .github/workflows/, composite actions in .github/actions/, or any GitHub Actions YAML configuration. Also apply when the user asks about CI/CD pipelines, build automation, automated testing in CI, deployment workflows, GitHub Actions permissions, workflow concurrency, or action version pinning -- even if they do not mention "GitHub Actions" by name.'
user-invocable: false
---

# GitHub Actions CI/CD Best Practices

Follow these conventions when creating or modifying GitHub Actions workflows to ensure they are secure, maintainable, and performant.

## Core Concepts

### Workflow Structure
- Use consistent, descriptive names for workflow files (e.g., `build-and-test.yml`, `deploy-prod.yml`)
- Choose appropriate triggers: `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, `schedule`, `repository_dispatch`, `workflow_call`, `workflow_run`
- Use `concurrency` to prevent simultaneous runs for shared resources
- Define `permissions` at workflow level for least privilege (default to `contents: read`)
- Leverage reusable workflows (`workflow_call`) and composite actions to reduce duplication

For detailed guidance and examples, see [references/core-concepts.md](references/core-concepts.md).

### Jobs
- Name jobs clearly representing distinct phases (build, test, deploy, lint, security scan)
- Use `needs` for dependencies between jobs
- Use `outputs` to pass data between jobs
- Use `if` conditions for conditional execution based on branch, event type, or previous job status
- Set `timeout-minutes` on every job to prevent runaway costs

### Steps and Actions
- Pin actions to full commit SHA for maximum security, or at minimum a major version tag (`@v4`) -- never `main` or `latest`
- Use descriptive `name` for each step for readability in logs
- Audit marketplace actions before use; prefer actions from trusted sources (`actions/` org)
- Keep action versions current (e.g., `actions/checkout@v4`, `actions/cache@v4`, `actions/upload-artifact@v4`)

## Security

- **Secrets**: Use GitHub Secrets exclusively -- never hardcode, never expose in logs
- **OIDC**: Use OpenID Connect for cloud authentication (AWS, Azure, GCP) instead of long-lived credentials
- **GITHUB_TOKEN**: Restrict to minimum permissions; start with `contents: read`
- **Dependency Review**: Integrate SCA tools (`dependency-review-action`, Snyk, Trivy)
- **SAST**: Integrate CodeQL or SonarQube; block builds on critical vulnerabilities
- **Secret Scanning**: Enable GitHub secret scanning; use pre-commit hooks for local prevention
- **Image Signing**: Use Notary or Cosign for container image verification
- **Fork Safety**: Use `pull_request_target` with caution; never check out untrusted PR code in a privileged context

For detailed guidance, OIDC examples, and permission mapping, see [references/security.md](references/security.md).

## Optimization

- **Caching**: Use `actions/cache@v4` with `hashFiles`-based keys for dependency caching
- **Matrix Strategies**: Use `strategy.matrix` for parallel testing across OS/version/browser combinations
- **Fast Checkout**: Use `fetch-depth: 1` when full history is not required
- **Artifacts**: Use `actions/upload-artifact@v4`/`download-artifact@v4` for inter-job data; set `retention-days`
- **Self-Hosted Runners**: Consider for specialized hardware, private network access, or cost optimization

For detailed examples including monorepo caching and matrix configurations, see [references/optimization.md](references/optimization.md).

## Testing

- **Unit Tests**: Run on every push/PR; collect coverage; enforce minimum thresholds
- **Integration Tests**: Use `services` for database/queue dependencies; run after unit tests
- **E2E Tests**: Run against staging with Cypress/Playwright; capture screenshots/video on failure
- **Performance Tests**: Integrate k6/Locust/JMeter for regression detection; define clear thresholds
- **Reporting**: Publish results as artifacts and GitHub Checks/Annotations; add status badges

For detailed testing integration patterns, see [references/testing.md](references/testing.md).

## Deployment

- **Staging**: Deploy automatically on merges to develop/release branches with environment protection rules
- **Production**: Require manual approvals, strict branch protections, and post-deployment health checks
- **Strategies**: Choose appropriate type -- rolling, blue/green, canary, dark launch, or A/B testing
- **Rollback**: Maintain versioned artifacts; implement automated rollback on health check failures
- **Emergency**: Have expedited hotfix pipelines that maintain security checks

For detailed deployment patterns and rollback strategies, see [references/deployment.md](references/deployment.md).

## Workflow Review Checklist

Use this checklist when creating or reviewing workflow files.

### General Structure
- [ ] Workflow `name` is clear, descriptive, and unique
- [ ] `on` triggers are appropriate with effective path/branch filters
- [ ] `concurrency` is used for critical workflows
- [ ] Global `permissions` set to least privilege (`contents: read` default)
- [ ] Reusable workflows or composite actions leveraged for common patterns

### Jobs and Steps
- [ ] Jobs clearly named representing distinct phases
- [ ] `needs` dependencies correctly defined
- [ ] `outputs` used for inter-job communication
- [ ] `if` conditions used for conditional execution
- [ ] All actions pinned to commit SHA or major version tag
- [ ] `run` commands are efficient (combined with `&&`, temp files cleaned)
- [ ] `timeout-minutes` set on all jobs

### Security
- [ ] Sensitive data accessed exclusively via `secrets` context
- [ ] OIDC used for cloud authentication where possible
- [ ] `GITHUB_TOKEN` permissions explicitly limited
- [ ] SCA tools integrated for dependency scanning
- [ ] SAST tools integrated with critical findings blocking builds
- [ ] Secret scanning enabled; pre-commit hooks recommended
- [ ] No untrusted code checked out in privileged `pull_request_target` workflows

### Optimization
- [ ] Caching configured for package manager dependencies and build outputs
- [ ] Cache keys use `hashFiles` for optimal hit rates
- [ ] Matrix strategies used for parallel testing
- [ ] `fetch-depth: 1` used where full history not required
- [ ] Artifact `retention-days` configured appropriately

### Testing
- [ ] Unit tests run early in pipeline with coverage tracking
- [ ] Integration tests use `services` for dependencies
- [ ] E2E tests included with flakiness mitigation
- [ ] Test reports published as artifacts and Checks/Annotations

### Deployment
- [ ] Staging and production use `environment` protection rules
- [ ] Manual approvals configured for production
- [ ] Rollback strategy tested and automated where possible
- [ ] Post-deployment health checks and smoke tests implemented

## Troubleshooting

For common issues including workflow triggers, permission errors, caching problems, timeout optimization, flaky tests, and deployment failures, see [references/troubleshooting.md](references/troubleshooting.md).
