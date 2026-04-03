# Responsive Testing

Test responsive layouts, mobile viewports, and device-specific behavior.

## Device Viewport Presets

Common device dimensions for testing:

```bash
# Mobile
playwright-cli resize 375 667    # iPhone SE
playwright-cli resize 390 844    # iPhone 14
playwright-cli resize 412 915    # Pixel 7

# Tablet
playwright-cli resize 768 1024   # iPad Mini
playwright-cli resize 820 1180   # iPad Air
playwright-cli resize 1024 1366  # iPad Pro 12.9

# Desktop
playwright-cli resize 1280 720   # HD
playwright-cli resize 1920 1080  # Full HD
playwright-cli resize 2560 1440  # QHD
```

## Breakpoint Testing Workflow

Screenshot at each common breakpoint to compare layouts:

```bash
playwright-cli open https://example.com

# Mobile
playwright-cli resize 375 667
playwright-cli snapshot
playwright-cli screenshot --filename=mobile-375.png

# Tablet
playwright-cli resize 768 1024
playwright-cli snapshot
playwright-cli screenshot --filename=tablet-768.png

# Desktop
playwright-cli resize 1280 720
playwright-cli snapshot
playwright-cli screenshot --filename=desktop-1280.png

# Wide
playwright-cli resize 1920 1080
playwright-cli snapshot
playwright-cli screenshot --filename=desktop-1920.png

playwright-cli close
```

## Device Emulation

Full device emulation including touch, user agent, and device scale factor:

```bash
playwright-cli run-code "async page => {
  const context = page.context();
  // iPhone 14-like emulation
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
  });
  await page.setViewportSize({ width: 390, height: 844 });
}"
```

### Open with Specific Browser and Viewport

```bash
# Open with specific viewport via config
playwright-cli open https://example.com --config=mobile-config.json
```

Mobile config file (`mobile-config.json`):
```json
{
  "viewport": { "width": 390, "height": 844 },
  "deviceScaleFactor": 3,
  "isMobile": true,
  "hasTouch": true,
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
}
```

## Touch Interactions

Simulate touch events for mobile testing:

```bash
# Tap (equivalent to touch)
playwright-cli click e5

# Swipe simulation
playwright-cli run-code "async page => {
  await page.touchscreen.tap(200, 400);
}"

# Scroll via touch
playwright-cli run-code "async page => {
  await page.evaluate(() => window.scrollBy(0, 300));
}"

# Pinch zoom (not natively supported, simulate via scroll)
playwright-cli mousewheel 0 -200
```

## Responsive Navigation Testing

Test hamburger menu / mobile nav behavior:

```bash
# Start at mobile viewport
playwright-cli open https://example.com
playwright-cli resize 375 667
playwright-cli snapshot

# Verify hamburger menu is visible
playwright-cli eval "el => getComputedStyle(el).display" e3  # menu toggle button

# Open mobile menu
playwright-cli click e3
playwright-cli snapshot

# Verify nav links are visible
playwright-cli eval "el => getComputedStyle(el).display" e7  # nav container

# Resize to desktop — verify hamburger hides, nav shows inline
playwright-cli resize 1280 720
playwright-cli snapshot
playwright-cli eval "el => getComputedStyle(el).display" e3  # should be 'none'

playwright-cli close
```

## Media Query Detection

Check which media queries are active:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const queries = [
      '(max-width: 480px)',
      '(max-width: 768px)',
      '(max-width: 1024px)',
      '(max-width: 1280px)',
      '(prefers-color-scheme: dark)',
      '(prefers-reduced-motion: reduce)',
      '(hover: none)',
      '(pointer: coarse)'
    ];
    return queries.map(q => ({ query: q, matches: window.matchMedia(q).matches }));
  });
}"
```

## Emulate Media Features

```bash
# Dark mode
playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'dark' });
}"

# Light mode
playwright-cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'light' });
}"

# Reduced motion
playwright-cli run-code "async page => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}"

# Print layout
playwright-cli run-code "async page => {
  await page.emulateMedia({ media: 'print' });
}"
```
