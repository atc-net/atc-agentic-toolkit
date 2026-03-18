# Security Best Practices in GitHub Actions

## 1. Secret Management

- **Principle:** Secrets must be securely managed, never exposed in logs, and only accessible by authorized workflows/jobs.
- **GitHub Secrets:** The primary mechanism for storing sensitive information. Encrypted at rest and only decrypted when passed to a runner.
- **Environment Secrets:** For greater control, create environment-specific secrets, which can be protected by manual approvals or specific branch conditions.
- **Secret Masking:** GitHub Actions automatically masks secrets in logs, but avoid printing them directly.
- **Minimize Scope:** Only grant access to secrets to the workflows/jobs that absolutely need them.

### Guidelines

- Always use GitHub Secrets for sensitive information (API keys, passwords, cloud credentials, tokens).
- Access secrets via `secrets.<SECRET_NAME>` in workflows.
- Use environment-specific secrets for deployment environments to enforce stricter access controls.
- Never construct secrets dynamically or print them to logs.

### Example (Environment Secrets with Approval)

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://prod.example.com
    steps:
      - name: Deploy to production
        env:
          PROD_API_KEY: ${{ secrets.PROD_API_KEY }}
        run: ./deploy-script.sh
```

## 2. OpenID Connect (OIDC) for Cloud Authentication

- **Principle:** Use OIDC for secure, credential-less authentication with cloud providers (AWS, Azure, GCP), eliminating long-lived static credentials.
- **Short-Lived Credentials:** OIDC exchanges a JWT token for temporary cloud credentials, significantly reducing the attack surface.
- **Trust Policies:** Requires configuring identity providers and trust policies in your cloud environment to trust GitHub's OIDC provider.

### Guidelines

- Strongly recommend OIDC for authenticating with AWS, Azure, GCP instead of storing long-lived access keys as secrets.
- Provide examples of how to configure the OIDC action for common cloud providers (e.g., `aws-actions/configure-aws-credentials@v4`).
- OIDC is a fundamental shift towards more secure cloud deployments and should be prioritized whenever possible.

## 3. Least Privilege for `GITHUB_TOKEN`

- **Principle:** Grant only the necessary permissions to the `GITHUB_TOKEN`, reducing the blast radius in case of compromise.
- **Default Permissions:** By default, the `GITHUB_TOKEN` has broad permissions. This should be explicitly restricted.
- **Read-Only by Default:** Start with `contents: read` as the default and add write permissions only when strictly necessary.

### Example (Least Privilege)

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  lint:
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
```

## 4. Dependency Review and Software Composition Analysis (SCA)

- **Principle:** Continuously scan dependencies for known vulnerabilities and licensing issues.
- **Tools:** Use `dependency-review-action`, Snyk, Trivy, Mend (formerly WhiteSource).
- Integrate SCA tools early in the CI pipeline to catch issues before deployment.
- Maintain up-to-date dependency lists and understand transitive dependencies.

## 5. Static Application Security Testing (SAST)

- **Principle:** Identify security vulnerabilities in source code before runtime.
- **Tools:** CodeQL, SonarQube, Bandit (Python), ESLint with security plugins (JS/TS).
- Configure SAST to break builds or block PRs if critical vulnerabilities are found.
- Add security linters to pre-commit hooks for earlier feedback.

## 6. Secret Scanning and Credential Leak Prevention

- **Principle:** Prevent secrets from being committed into the repository or exposed in logs.
- **GitHub Secret Scanning:** Built-in feature to detect secrets in your repository.
- **Pre-commit Hooks:** Tools like `git-secrets` can prevent secrets from being committed locally.
- Secrets should only be passed to the environment where they are needed at runtime, never in the build artifact.

## 7. Fork Safety and `pull_request_target`

- **Principle:** Workflows triggered by `pull_request_target` run in the context of the base branch with access to secrets. Checking out untrusted PR code in this context can lead to secret exfiltration.
- **Safe Pattern:** Use `pull_request_target` only for labeling, commenting, or other operations that do not execute code from the PR. If you need to build or test PR code with secrets, use a two-workflow approach: `pull_request` for untrusted code (no secrets), then `workflow_run` to perform privileged operations after the first workflow completes.
- **Never** use `actions/checkout` with `ref: ${{ github.event.pull_request.head.sha }}` inside a `pull_request_target` workflow that has access to secrets.

## 8. Immutable Infrastructure & Image Signing

- **Principle:** Ensure that container images and deployed artifacts are tamper-proof and verified.
- **Reproducible Builds:** Ensure building the same code always results in the same image.
- **Image Signing:** Use Notary or Cosign to cryptographically sign container images.
- Enforce that only signed images can be deployed to production environments.
