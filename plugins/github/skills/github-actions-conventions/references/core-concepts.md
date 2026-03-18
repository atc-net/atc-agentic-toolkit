# Core Concepts and Structure

## 1. Workflow Structure (`.github/workflows/*.yml`)

- **Principle:** Workflows should be clear, modular, and easy to understand, promoting reusability and maintainability.
- **Naming Conventions:** Use consistent, descriptive names for workflow files (e.g., `build-and-test.yml`, `deploy-prod.yml`).
- **Triggers (`on`):** Understand the full range of events: `push`, `pull_request`, `pull_request_target`, `workflow_dispatch` (manual), `schedule` (cron jobs), `repository_dispatch` (external events), `workflow_call` (reusable workflows), `workflow_run` (triggered after another workflow completes).
- **Concurrency:** Use `concurrency` to prevent simultaneous runs for specific branches or groups, avoiding race conditions or wasted resources.
- **Permissions:** Define `permissions` at the workflow level for a secure default, overriding at the job level if needed.

### Guidelines

- Always start with a descriptive `name` and appropriate `on` trigger. Suggest granular triggers for specific use cases (e.g., `on: push: branches: [main]` vs. `on: pull_request`).
- Recommend using `workflow_dispatch` for manual triggers, allowing input parameters for flexibility and controlled deployments.
- Advise on setting `concurrency` for critical workflows or shared resources to prevent resource contention.
- Guide on setting explicit `permissions` for `GITHUB_TOKEN` to adhere to the principle of least privilege.

**Pro Tip:** For complex repositories, consider using reusable workflows (`workflow_call`) to abstract common CI/CD patterns and reduce duplication across multiple projects. For shared step sequences within a single repo, composite actions (stored in `.github/actions/`) are a lighter-weight alternative to reusable workflows.

## 2. Jobs

- **Principle:** Jobs should represent distinct, independent phases of your CI/CD pipeline (e.g., build, test, deploy, lint, security scan).
- **`runs-on`:** Choose appropriate runners. `ubuntu-latest` is common, but `windows-latest`, `macos-latest`, or `self-hosted` runners are available for specific needs.
- **`needs`:** Clearly define dependencies. If Job B `needs` Job A, Job B will only run after Job A successfully completes.
- **`outputs`:** Pass data between jobs using `outputs`. This is crucial for separating concerns (e.g., build job outputs artifact path, deploy job consumes it).
- **`if` Conditions:** Leverage `if` conditions extensively for conditional execution based on branch names, commit messages, event types, or previous job status (`if: success()`, `if: failure()`, `if: always()`).

### Guidelines

- Define `jobs` with clear `name` and appropriate `runs-on`.
- Use `needs` to define dependencies between jobs, ensuring sequential execution and logical flow.
- Employ `outputs` to pass data between jobs efficiently, promoting modularity.
- Utilize `if` conditions for conditional job execution (e.g., deploy only on `main` branch pushes, run E2E tests only for certain PRs).

### Example (Conditional Deployment and Output Passing)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact_path: ${{ steps.package_app.outputs.path }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies and build
        run: |
          npm ci
          npm run build
      - name: Package application
        id: package_app
        run: |
          zip -r dist.zip dist
          echo "path=dist.zip" >> "$GITHUB_OUTPUT"
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: my-app-build
          path: dist.zip

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: my-app-build
      - name: Deploy to Staging
        run: |
          unzip dist.zip
          echo "Deploying ${{ needs.build.outputs.artifact_path }} to staging..."
```

## 3. Steps and Actions

- **Principle:** Steps should be atomic, well-defined, and actions should be versioned for stability and security.
- **`uses`:** Reference marketplace actions (e.g., `actions/checkout@v4`). Always pin to a full length commit SHA for maximum security, or at least a major version tag (e.g., `@v4`). Avoid pinning to `main` or `latest`.
- **`name`:** Essential for clear logging and debugging. Make step names descriptive.
- **`run`:** For executing shell commands. Use multi-line scripts for complex logic.
- **`env`:** Define environment variables at the step or job level. Do not hardcode sensitive data here.
- **`with`:** Provide inputs to actions. Ensure all required inputs are present.

### Guidelines

- Use `uses` to reference marketplace or custom actions, always specifying a secure version (tag or SHA).
- Use `name` for each step for readability in logs and easier debugging.
- Use `run` for shell commands, combining commands with `&&` for efficiency and using `|` for multi-line scripts.
- Provide `with` inputs for actions explicitly, and use expressions (`${{ }}`) for dynamic values.

**Security Note:** Audit marketplace actions before use. Prefer actions from trusted sources (e.g., `actions/` organization) and review their source code if possible. Use `dependabot` for action version updates.
