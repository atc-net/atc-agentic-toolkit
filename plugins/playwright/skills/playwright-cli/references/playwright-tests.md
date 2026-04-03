# Running Playwright Tests

To run Playwright tests, use the `npx playwright test` command, or a package manager script. To avoid opening the interactive html report, use `PLAYWRIGHT_HTML_OPEN=never` environment variable.

```bash
# Run all tests
PLAYWRIGHT_HTML_OPEN=never npx playwright test

# Run all tests through a custom npm script
PLAYWRIGHT_HTML_OPEN=never npm run special-test-command
```

# Debugging Playwright Tests

To debug a failing Playwright test, run it with `--debug=cli` option. This command will pause the test at the start and print the debugging instructions.

**IMPORTANT**: run the command in the background and check the output until "Debugging Instructions" is printed.

Once instructions containing a session name are printed, use `playwright-cli` to attach the session and explore the page.

```bash
# Run the test
PLAYWRIGHT_HTML_OPEN=never npx playwright test --debug=cli
# ...
# ... debugging instructions for "tw-abcdef" session ...
# ...

# Attach to the test
playwright-cli attach tw-abcdef
```

Keep the test running in the background while you explore and look for a fix.
The test is paused at the start, so you should step over or pause at a particular location
where the problem is most likely to be.

Every action you perform with `playwright-cli` generates corresponding Playwright TypeScript code.
This code appears in the output and can be copied directly into the test. Most of the time, a specific locator or an expectation should be updated, but it could also be a bug in the app. Use your judgement.

After fixing the test, stop the background test run. Rerun to check that test passes.

# Filtering and Organizing Tests

## Run by Tag or Pattern

```bash
# Run tests matching a grep pattern
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep "login"

# Run tests tagged with @smoke
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep "@smoke"

# Exclude tests matching a pattern
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep-invert "@slow"

# Run a specific test file
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/auth/login.spec.ts

# Run tests in a directory
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/checkout/
```

## Tagging Tests

```typescript
test('user login @smoke @auth', async ({ page }) => {
  // This test runs with --grep "@smoke" or --grep "@auth"
});
```

# Test Sharding for CI

Split tests across parallel CI jobs:

```bash
# Run shard 1 of 4
PLAYWRIGHT_HTML_OPEN=never npx playwright test --shard=1/4

# Run shard 2 of 4
PLAYWRIGHT_HTML_OPEN=never npx playwright test --shard=2/4
```

# Reporter Configuration

```bash
# JSON reporter (machine-readable, good for CI)
PLAYWRIGHT_HTML_OPEN=never npx playwright test --reporter=json

# List reporter (concise terminal output)
PLAYWRIGHT_HTML_OPEN=never npx playwright test --reporter=list

# Multiple reporters
PLAYWRIGHT_HTML_OPEN=never npx playwright test --reporter=list,json

# JUnit for CI integration
PLAYWRIGHT_HTML_OPEN=never npx playwright test --reporter=junit
```

# Test Retries

```bash
# Retry failed tests up to 2 times
PLAYWRIGHT_HTML_OPEN=never npx playwright test --retries=2

# Retry only in CI (set in playwright.config.ts)
# retries: process.env.CI ? 2 : 0
```

# Running in Specific Browsers

```bash
# Run only in Chromium
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=chromium

# Run in multiple browsers
PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=chromium --project=firefox
```
