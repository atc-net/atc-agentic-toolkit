---
name: playwright-generate-test
description: Generate Playwright TypeScript tests based on a scenario using Playwright MCP for real browser interaction. Use when the user wants to create an end-to-end test, generate a test from a user story, or automate a test scenario with Playwright.
---

# Test Generation with Playwright MCP

Generate a Playwright TypeScript test by first interacting with the real application via the Playwright MCP server, then producing a verified test file.

## Workflow

1. **Get the scenario** — If not provided, ask the user to describe the test scenario (URL, steps, expected outcomes)
2. **Navigate to the application** — Use `browser_navigate` to load the target page
3. **Execute the scenario step by step** — Walk through each interaction using MCP tools:
   - `browser_click` for clicks
   - `browser_type` for text input
   - `browser_select_option` for dropdowns
   - `browser_snapshot` to observe state between steps
4. **Capture locators and assertions** — Note the actual locators and expected states observed during execution
5. **Generate the test** — Write a Playwright TypeScript test using `@playwright/test` based on the real interactions observed:

```typescript
import { test, expect } from '@playwright/test';

test('descriptive test name', async ({ page }) => {
  await page.goto('URL');
  // Steps based on actual MCP interactions
});
```

6. **Save the test** — Write the file to the project's tests directory
7. **Run and iterate** — Execute the test and fix any failures until it passes

## Guidelines

- Never generate test code before completing the MCP interaction steps
- Use stable locators observed during exploration (`data-testid` > `getByRole` > `getByText`)
- Add meaningful assertions after key interactions
- Keep tests focused on a single user flow
- Use descriptive test names that explain the scenario
