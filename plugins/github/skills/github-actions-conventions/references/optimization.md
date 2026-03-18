# Optimization and Performance

## 1. Caching GitHub Actions

- **Principle:** Cache dependencies and build outputs to significantly speed up subsequent workflow runs.
- **Cache Hit Ratio:** Aim for a high cache hit ratio by designing effective cache keys.
- **Cache Keys:** Use unique keys based on file hashes (e.g., `hashFiles('**/package-lock.json')`) to invalidate the cache only when dependencies change.
- **Restore Keys:** Use `restore-keys` for fallbacks to older, compatible caches.
- **Cache Scope:** Caches are scoped to the repository and branch.

### Guidelines

- Use `actions/cache@v4` for caching common package manager dependencies and build artifacts.
- Design highly effective cache keys using `hashFiles` for optimal hit rates.
- Use `restore-keys` to gracefully fall back to previous caches.

### Example (Advanced Caching for Monorepo)

```yaml
- name: Cache Node.js modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ./node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}-${{ github.run_id }}
    restore-keys: |
      ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-node-
```

## 2. Matrix Strategies for Parallelization

- **Principle:** Run jobs in parallel across multiple configurations to accelerate testing and builds.
- **`strategy.matrix`:** Define a matrix of variables.
- **`include`/`exclude`:** Fine-tune combinations.
- **`fail-fast`:** Control whether job failures stop the entire strategy.

### Example (Multi-version, Multi-OS Test Matrix)

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [16.x, 18.x, 20.x]
        browser: [chromium, firefox]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install Playwright browsers
        run: npx playwright install ${{ matrix.browser }}
      - name: Run tests
        run: npm test
```

## 3. Self-Hosted Runners

- **Principle:** Use self-hosted runners for specialized hardware, network access to private resources, or cost optimization.
- **Custom Environments:** Ideal for large build caches, specific hardware (GPUs), or access to on-premise resources.
- **Security Considerations:** Requires securing and maintaining your own infrastructure. Includes hardening runner machines, managing access controls, and ensuring timely patching.
- **Scalability:** Plan for how self-hosted runners will scale with demand.

### Guidelines

- Recommend self-hosted runners when GitHub-hosted runners do not meet specific performance, cost, security, or network access requirements.
- Emphasize the user's responsibility for securing, maintaining, and scaling self-hosted runners.
- Use runner groups to organize and manage self-hosted runners efficiently.

## 4. Fast Checkout and Shallow Clones

- **Principle:** Optimize repository checkout time, especially for large repositories.
- **`fetch-depth`:** Use `1` for most CI/CD builds. Use `0` only when full history is needed (release tagging, deep commit analysis).
- **`submodules`:** Avoid checking out submodules if not required.
- **`lfs`:** Set `lfs: false` if Git LFS files are not needed.

### Guidelines

- Use `actions/checkout@v4` with `fetch-depth: 1` as the default.
- Only use `fetch-depth: 0` if the workflow explicitly requires full Git history.
- Avoid checking out submodules (`submodules: false`) if not necessary.

## 5. Artifacts for Inter-Job Communication

- **Principle:** Store and retrieve build outputs efficiently to pass data between jobs.
- **`actions/upload-artifact`:** Upload files produced by a job. Automatically compressed.
- **`actions/download-artifact`:** Download artifacts in subsequent jobs.
- **`retention-days`:** Set appropriate retention based on artifact importance and regulatory requirements.
- **Use Cases:** Build outputs, test reports, coverage reports, security scan results, Docker images, documentation.

### Guidelines

- Use `actions/upload-artifact@v4` and `actions/download-artifact@v4` for inter-job data transfer.
- Set appropriate `retention-days` to manage storage costs.
- Upload test reports, coverage reports, and security scan results as artifacts for historical analysis.
