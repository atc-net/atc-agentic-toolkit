# CI/CD Integration

Run `playwright-cli` automation in continuous integration pipelines.

## Headless Execution

By default, `playwright-cli` runs in headless mode (no visible browser window). This is the correct mode for CI. No special flags needed.

```bash
# Same commands work in CI as locally
playwright-cli open https://example.com
playwright-cli snapshot
playwright-cli close
```

To force headed mode locally for debugging:

```bash
playwright-cli open https://example.com --headed
```

## Exit Codes and Error Handling

`playwright-cli` returns non-zero exit codes on failure. Use standard shell error handling:

```bash
# Fail the pipeline on any error
set -e
playwright-cli open https://example.com
playwright-cli goto https://example.com/health
playwright-cli close

# Or check specific commands
if ! playwright-cli goto https://example.com/health; then
  echo "Health check page failed to load"
  playwright-cli screenshot --filename=failure.png
  playwright-cli close
  exit 1
fi
```

## GitHub Actions Example

```yaml
name: Browser Automation
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install playwright-cli
        run: npm install -g @playwright/cli@latest

      - name: Install browsers
        run: npx playwright install --with-deps chromium

      - name: Run automation
        run: |
          playwright-cli open https://staging.example.com
          playwright-cli snapshot --filename=home.yaml
          playwright-cli screenshot --filename=screenshots/home.png
          playwright-cli close

      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: browser-artifacts
          path: |
            screenshots/
            .playwright-cli/traces/
          retention-days: 7
```

## Running Playwright Tests in CI

```yaml
      - name: Run tests
        run: PLAYWRIGHT_HTML_OPEN=never npx playwright test
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

### Parallel Test Sharding

```yaml
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      # ...setup steps...
      - name: Run tests (shard ${{ matrix.shard }}/4)
        run: PLAYWRIGHT_HTML_OPEN=never npx playwright test --shard=${{ matrix.shard }}/4
```

## Docker

### Minimal Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app
COPY . .
RUN npm ci

# Run automation
CMD ["npx", "playwright-cli", "open", "https://example.com"]
```

### Docker Compose for Local CI Simulation

```yaml
services:
  browser-tests:
    image: mcr.microsoft.com/playwright:v1.52.0-noble
    working_dir: /app
    volumes:
      - .:/app
    command: npx playwright test
    environment:
      - CI=true
      - PLAYWRIGHT_HTML_OPEN=never
```

## Parallel Execution with Named Sessions

Run multiple automations concurrently in CI:

```bash
# Start multiple sessions in background
playwright-cli -s=flow1 open https://example.com/page1 &
playwright-cli -s=flow2 open https://example.com/page2 &
wait

# Interact with each
playwright-cli -s=flow1 snapshot --filename=page1.yaml
playwright-cli -s=flow2 snapshot --filename=page2.yaml

# Cleanup
playwright-cli close-all
```

## Artifact Collection

Save artifacts for debugging failed CI runs:

```bash
# Start tracing for detailed debugging artifacts
playwright-cli tracing-start

# Run your automation
playwright-cli open https://example.com
playwright-cli click e1
playwright-cli fill e2 "test"

# Save everything
playwright-cli screenshot --filename=artifacts/final-state.png
playwright-cli tracing-stop
# Traces saved to .playwright-cli/traces/

playwright-cli close
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_CLI_SESSION` | Default session name |
| `PLAYWRIGHT_BROWSERS_PATH` | Custom browser install location |
| `PLAYWRIGHT_HTML_OPEN` | Set to `never` to prevent report auto-open |
| `CI` | Detected by Playwright for CI-optimized defaults |

## Tips for CI

- Always install browser dependencies: `npx playwright install --with-deps chromium`
- Use `if: always()` on artifact upload steps so you get artifacts even on failure
- Set reasonable timeouts — CI can be slower than local machines
- Use `--shard` for parallel test execution across CI matrix jobs
- Pin the Playwright Docker image version to avoid unexpected breakage
