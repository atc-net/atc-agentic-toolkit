---
name: playwright-explore-website
description: Explore a website interactively using Playwright MCP to identify key functionalities, user flows, and UI elements for testing purposes. Use when the user wants to understand a website's structure, discover testable features, or prepare for writing tests.
---

# Website Exploration for Testing

Explore a website using the Playwright MCP server to identify key functionalities and generate test candidates.

## Workflow

1. **Get the target URL** — If not provided, ask the user for the URL to explore
2. **Navigate and orient** — Use `browser_navigate` to load the page, then `browser_snapshot` to capture the initial state
3. **Identify core features** — Explore 3-5 key user flows by interacting with navigation, forms, buttons, and dynamic elements
4. **Document findings** — For each feature record:
   - User interaction steps
   - Relevant UI elements and their locators (data-testid, role, text)
   - Expected outcomes and assertions
5. **Close browser** — Use `browser_close` when exploration is complete
6. **Summarize and propose tests** — Provide a concise summary of findings and propose test cases based on discovered flows

## Exploration Tips

- Start with the main navigation to understand site structure
- Look for forms, modals, dropdowns, and interactive elements
- Check responsive behavior if relevant
- Note any loading states, error states, or edge cases
- Prefer stable locators: `data-testid` > `role` > `text` > CSS selectors

## Output Format

For each discovered feature:

```
### Feature: [Name]
- **URL**: /path
- **Steps**: 1. Click X → 2. Fill Y → 3. Submit
- **Key elements**: [locator details]
- **Suggested test**: [brief test description]
```
