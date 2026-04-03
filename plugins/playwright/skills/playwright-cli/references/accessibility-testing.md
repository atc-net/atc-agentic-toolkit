# Accessibility Testing

Audit web pages for accessibility issues using `playwright-cli` commands and `eval` patterns.

## ARIA Audit

### Check Interactive Elements for Labels

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, input, select, textarea, [role]');
    const issues = [];
    for (const el of interactive) {
      const label = el.getAttribute('aria-label')
        || el.getAttribute('aria-labelledby')
        || el.textContent?.trim()
        || el.getAttribute('title')
        || el.getAttribute('placeholder');
      if (!label) {
        issues.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          id: el.id || null,
          classes: el.className || null
        });
      }
    }
    return { total: interactive.length, unlabeled: issues };
  });
}"
```

### Check ARIA Attributes on a Specific Element

```bash
playwright-cli eval "el => ({
  role: el.getAttribute('role'),
  label: el.getAttribute('aria-label'),
  labelledby: el.getAttribute('aria-labelledby'),
  describedby: el.getAttribute('aria-describedby'),
  expanded: el.getAttribute('aria-expanded'),
  hidden: el.getAttribute('aria-hidden'),
  live: el.getAttribute('aria-live'),
  required: el.getAttribute('aria-required'),
  invalid: el.getAttribute('aria-invalid')
})" e5
```

## Heading Hierarchy

Validate that headings follow a logical order (h1 > h2 > h3, no skipped levels).

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const issues = [];
    let prevLevel = 0;
    for (const h of headings) {
      const level = parseInt(h.tagName[1]);
      if (level - prevLevel > 1 && prevLevel !== 0) {
        issues.push({ skipped: \`h\${prevLevel} -> h\${level}\`, text: h.textContent.trim().slice(0, 50) });
      }
      prevLevel = level;
    }
    return {
      structure: headings.map(h => ({ level: h.tagName, text: h.textContent.trim().slice(0, 50) })),
      issues
    };
  });
}"
```

## Image Alt Text

Find images missing alt text.

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const missing = [];
    for (const img of images) {
      const alt = img.getAttribute('alt');
      if (alt === null || alt === undefined) {
        missing.push({ src: img.src.slice(-60), width: img.width, height: img.height });
      }
    }
    return { total: images.length, missingAlt: missing };
  });
}"
```

## Keyboard Navigation Testing

### Tab Through Elements and Check Focus Order

```bash
# Start at the top of the page
playwright-cli run-code "async page => {
  await page.keyboard.press('Tab');
}"
playwright-cli snapshot
# Check which element has focus

# Continue tabbing
playwright-cli press Tab
playwright-cli snapshot
# Repeat to trace the full tab order
```

### Get Current Focused Element

```bash
playwright-cli eval "() => {
  const el = document.activeElement;
  return {
    tag: el.tagName,
    role: el.getAttribute('role'),
    text: el.textContent?.trim().slice(0, 50),
    tabIndex: el.tabIndex,
    id: el.id
  };
}"
```

### Check Focus Visibility

```bash
playwright-cli eval "() => {
  const el = document.activeElement;
  const style = getComputedStyle(el);
  return {
    outline: style.outline,
    outlineOffset: style.outlineOffset,
    boxShadow: style.boxShadow,
    border: style.border
  };
}"
```

### Audit All Focusable Elements

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const focusable = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
    );
    return [...focusable].map(el => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
      tabIndex: el.tabIndex,
      disabled: el.disabled || false,
      visible: el.offsetParent !== null
    }));
  });
}"
```

## Color Contrast

Extract foreground and background colors for manual verification.

```bash
playwright-cli eval "el => {
  const style = getComputedStyle(el);
  return {
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight
  };
}" e5
```

### Bulk Check Text Elements

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const textEls = document.querySelectorAll('p, span, a, button, label, h1, h2, h3, h4, h5, h6, li, td, th');
    const results = [];
    for (const el of [...textEls].slice(0, 30)) {
      const style = getComputedStyle(el);
      if (el.textContent.trim()) {
        results.push({
          text: el.textContent.trim().slice(0, 30),
          color: style.color,
          bg: style.backgroundColor,
          fontSize: style.fontSize
        });
      }
    }
    return results;
  });
}"
```

## Form Accessibility

### Check Label Associations

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, select, textarea');
    const issues = [];
    for (const input of inputs) {
      const hasLabel = input.id && document.querySelector(\`label[for=\"\${input.id}\"]\`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledby = input.getAttribute('aria-labelledby');
      const wrappedInLabel = input.closest('label');
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && !wrappedInLabel) {
        issues.push({
          tag: input.tagName.toLowerCase(),
          type: input.type || null,
          name: input.name || null,
          id: input.id || null
        });
      }
    }
    return { total: inputs.length, unlabeled: issues };
  });
}"
```

### Check Error Message Associations

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const inputs = document.querySelectorAll('[aria-invalid=\"true\"]');
    return [...inputs].map(input => ({
      name: input.name || input.id,
      hasErrorMessage: !!input.getAttribute('aria-errormessage'),
      hasDescribedby: !!input.getAttribute('aria-describedby')
    }));
  });
}"
```

## Complete Audit Workflow

```bash
# Open the page
playwright-cli open https://example.com

# 1. Check heading structure
playwright-cli run-code "async page => { ... }"  # heading hierarchy check

# 2. Find missing alt text
playwright-cli run-code "async page => { ... }"  # image alt audit

# 3. Check form labels
playwright-cli run-code "async page => { ... }"  # label association check

# 4. Check ARIA on interactive elements
playwright-cli run-code "async page => { ... }"  # ARIA audit

# 5. Test keyboard navigation
playwright-cli press Tab
playwright-cli snapshot
# Repeat, checking focus order and visibility

# 6. Spot-check color contrast on key elements
playwright-cli eval "el => { ... }" e5  # contrast check

playwright-cli close
```
