# Running Custom Playwright Code

Use `run-code` to execute arbitrary Playwright code for advanced scenarios not covered by CLI commands.

## Syntax

```bash
playwright-cli run-code "async page => {
  // Your Playwright code here
  // Access page.context() for browser context operations
}"
```

## Geolocation

```bash
# Grant geolocation permission and set location
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
}"

# Set location to London
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 51.5074, longitude: -0.1278 });
}"

# Clear geolocation override
playwright-cli run-code "async page => {
  await page.context().clearPermissions();
}"
```

## Permissions

```bash
# Grant multiple permissions
playwright-cli run-code "async page => {
  await page.context().grantPermissions([
    'geolocation',
    'notifications',
    'camera',
    'microphone'
  ]);
}"

# Grant permissions for specific origin
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['clipboard-read'], {
    origin: 'https://example.com'
  });
}"
```

## Media Emulation

```bash
# Emulate dark color scheme
playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'dark' });
}"

# Emulate light color scheme
playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'light' });
}"

# Emulate reduced motion
playwright-cli run-code "async page => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}"

# Emulate print media
playwright-cli run-code "async page => {
  await page.emulateMedia({ media: 'print' });
}"
```

## Wait Strategies

```bash
# Wait for network idle
playwright-cli run-code "async page => {
  await page.waitForLoadState('networkidle');
}"

# Wait for specific element
playwright-cli run-code "async page => {
  await page.locator('.loading').waitFor({ state: 'hidden' });
}"

# Wait for function to return true
playwright-cli run-code "async page => {
  await page.waitForFunction(() => window.appReady === true);
}"

# Wait with timeout
playwright-cli run-code "async page => {
  await page.locator('.result').waitFor({ timeout: 10000 });
}"
```

## Frames and Iframes

```bash
# Work with iframe
playwright-cli run-code "async page => {
  const frame = page.locator('iframe#my-iframe').contentFrame();
  await frame.locator('button').click();
}"

# Get all frames
playwright-cli run-code "async page => {
  const frames = page.frames();
  return frames.map(f => f.url());
}"
```

## File Downloads

```bash
# Handle file download
playwright-cli run-code "async page => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download = await downloadPromise;
  await download.saveAs('./downloaded-file.pdf');
  return download.suggestedFilename();
}"
```

## Clipboard

```bash
# Read clipboard (requires permission)
playwright-cli run-code "async page => {
  await page.context().grantPermissions(['clipboard-read']);
  return await page.evaluate(() => navigator.clipboard.readText());
}"

# Write to clipboard
playwright-cli run-code "async page => {
  await page.evaluate(text => navigator.clipboard.writeText(text), 'Hello clipboard!');
}"
```

## Page Information

```bash
# Get page title
playwright-cli run-code "async page => {
  return await page.title();
}"

# Get current URL
playwright-cli run-code "async page => {
  return page.url();
}"

# Get page content
playwright-cli run-code "async page => {
  return await page.content();
}"

# Get viewport size
playwright-cli run-code "async page => {
  return page.viewportSize();
}"
```

## JavaScript Execution

```bash
# Execute JavaScript and return result
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled
    };
  });
}"

# Pass arguments to evaluate
playwright-cli run-code "async page => {
  const multiplier = 5;
  return await page.evaluate(m => document.querySelectorAll('li').length * m, multiplier);
}"
```

## Shadow DOM

Interact with elements inside shadow DOM trees:

```bash
# Click a button inside a shadow root
playwright-cli run-code "async page => {
  const host = page.locator('my-component');
  await host.locator('button.internal').click();
}"

# Query inside nested shadow DOMs
playwright-cli run-code "async page => {
  const outer = page.locator('outer-component');
  const inner = outer.locator('inner-component');
  return await inner.locator('.content').textContent();
}"

# Use eval for deep shadow DOM access
playwright-cli eval "() => {
  const host = document.querySelector('my-component');
  const shadow = host.shadowRoot;
  return shadow.querySelector('.internal-text').textContent;
}"
```

## Error Handling and Retry

```bash
# Try-catch in run-code
playwright-cli run-code "async page => {
  try {
    await page.getByRole('button', { name: 'Submit' }).click({ timeout: 1000 });
    return 'clicked';
  } catch (e) {
    return 'element not found';
  }
}"
```

### Retry with Backoff

```bash
playwright-cli run-code "async page => {
  async function retry(fn, { maxAttempts = 3, delay = 1000 } = {}) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (e) {
        if (attempt === maxAttempts) throw e;
        await new Promise(r => setTimeout(r, delay * attempt));
      }
    }
  }

  return await retry(async () => {
    await page.getByRole('button', { name: 'Load More' }).click();
    await page.locator('.results').waitFor({ state: 'visible', timeout: 3000 });
    return 'loaded';
  });
}"
```

### Wait for Stable State

```bash
playwright-cli run-code "async page => {
  // Wait until no network requests are pending
  await page.waitForLoadState('networkidle');

  // Or wait for a specific condition
  await page.waitForFunction(() => {
    return !document.querySelector('.spinner') && document.querySelector('.content');
  }, { timeout: 10000 });

  return 'page stable';
}"
```

## Performance Measurement

### Core Web Vitals

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    return new Promise(resolve => {
      const metrics = {};

      // LCP
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        metrics.lcp = entries[entries.length - 1].startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      let clsValue = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        metrics.cls = clsValue;
      }).observe({ type: 'layout-shift', buffered: true });

      // FCP
      new PerformanceObserver(list => {
        metrics.fcp = list.getEntries()[0].startTime;
      }).observe({ type: 'paint', buffered: true });

      setTimeout(() => resolve(metrics), 3000);
    });
  });
}"
```

### Navigation Timing

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const t = performance.getEntriesByType('navigation')[0];
    return {
      dns: Math.round(t.domainLookupEnd - t.domainLookupStart),
      tcp: Math.round(t.connectEnd - t.connectStart),
      ttfb: Math.round(t.responseStart - t.requestStart),
      download: Math.round(t.responseEnd - t.responseStart),
      domInteractive: Math.round(t.domInteractive),
      domComplete: Math.round(t.domComplete),
      loadEvent: Math.round(t.loadEventEnd)
    };
  });
}"
```

### Resource Timing

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return resources
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(r => ({
        name: r.name.split('/').pop(),
        type: r.initiatorType,
        duration: Math.round(r.duration),
        size: r.transferSize
      }));
  });
}"
```

## Complex Workflows

```bash
# Login and save state
playwright-cli run-code "async page => {
  await page.goto('https://example.com/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.context().storageState({ path: 'auth.json' });
  return 'Login successful';
}"

# Scrape data from multiple pages
playwright-cli run-code "async page => {
  const results = [];
  for (let i = 1; i <= 3; i++) {
    await page.goto(\`https://example.com/page/\${i}\`);
    const items = await page.locator('.item').allTextContents();
    results.push(...items);
  }
  return results;
}"
```
