# Test Generation

Generate Playwright test code automatically as you interact with the browser.

## How It Works

Every action you perform with `playwright-cli` generates corresponding Playwright TypeScript code.
This code appears in the output and can be copied directly into your test files.

## Example Workflow

```bash
# Start a session
playwright-cli open https://example.com/login

# Take a snapshot to see elements
playwright-cli snapshot
# Output shows: e1 [textbox "Email"], e2 [textbox "Password"], e3 [button "Sign In"]

# Fill form fields - generates code automatically
playwright-cli fill e1 "user@example.com"
# Ran Playwright code:
# await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

playwright-cli fill e2 "password123"
# Ran Playwright code:
# await page.getByRole('textbox', { name: 'Password' }).fill('password123');

playwright-cli click e3
# Ran Playwright code:
# await page.getByRole('button', { name: 'Sign In' }).click();
```

## Building a Test File

Collect the generated code into a Playwright test:

```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  // Generated code from playwright-cli session:
  await page.goto('https://example.com/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Add assertions
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Best Practices

### 1. Use Semantic Locators

The generated code uses role-based locators when possible, which are more resilient:

```typescript
// Generated (good - semantic)
await page.getByRole('button', { name: 'Submit' }).click();

// Avoid (fragile - CSS selectors)
await page.locator('#submit-btn').click();
```

### 2. Explore Before Recording

Take snapshots to understand the page structure before recording actions:

```bash
playwright-cli open https://example.com
playwright-cli snapshot
# Review the element structure
playwright-cli click e5
```

### 3. Add Assertions Manually

Generated code captures actions but not assertions. Add expectations in your test:

```typescript
// Generated action
await page.getByRole('button', { name: 'Submit' }).click();

// Manual assertion
await expect(page.getByText('Success')).toBeVisible();
```

## Test File Organization

### Where to Put Tests

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   ├── checkout/
│   │   ├── cart.spec.ts
│   │   └── payment.spec.ts
│   └── navigation.spec.ts
├── fixtures/
│   └── auth.fixture.ts
└── playwright.config.ts
```

### Naming Conventions

```typescript
// File: feature-name.spec.ts
// Test: describe what the user does, not what the code does

test('user can add item to cart and proceed to checkout', async ({ page }) => {
  // ...
});

test('displays error when submitting empty form', async ({ page }) => {
  // ...
});
```

## Page Object Model

Extract generated locators into reusable page objects:

```typescript
// pages/login.page.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators extracted from playwright-cli interactions
  get emailInput() { return this.page.getByRole('textbox', { name: 'Email' }); }
  get passwordInput() { return this.page.getByRole('textbox', { name: 'Password' }); }
  get submitButton() { return this.page.getByRole('button', { name: 'Sign In' }); }
  get errorMessage() { return this.page.getByRole('alert'); }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('successful login redirects to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login('user@example.com', 'password123');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Assertion Patterns Catalog

Common assertions to add after generated actions:

```typescript
// Visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByRole('alert')).toBeHidden();

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/.*\/dashboard.*/);

// Page title
await expect(page).toHaveTitle('Dashboard - My App');
await expect(page).toHaveTitle(/Dashboard/);

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome Back');
await expect(page.getByRole('heading')).toContainText('Welcome');

// Input values
await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com');

// Element attributes
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('checkbox')).toBeChecked();
await expect(page.getByRole('link')).toHaveAttribute('href', '/about');

// Element count
await expect(page.getByRole('listitem')).toHaveCount(5);

// CSS
await expect(page.getByRole('alert')).toHaveCSS('color', 'rgb(255, 0, 0)');

// Screenshot comparison
await expect(page).toHaveScreenshot('dashboard.png');
await expect(page.getByRole('navigation')).toHaveScreenshot('nav.png');
```
