# Authentication Patterns

Common patterns for handling login, OAuth, MFA, and session management in browser automation.

## Skip Login via Token Injection

The fastest approach: inject auth cookies or tokens directly, bypassing the login UI entirely.

```bash
# Set an auth cookie
playwright-cli cookie-set session_token abc123def --domain=app.example.com --httpOnly --secure --sameSite=Lax

# Set a JWT in localStorage
playwright-cli localstorage-set auth_token "eyJhbGciOiJIUzI1NiIs..."

# Navigate — you're already authenticated
playwright-cli goto https://app.example.com/dashboard
playwright-cli snapshot
```

### Set Multiple Auth Cookies at Once

```bash
playwright-cli run-code "async page => {
  await page.context().addCookies([
    { name: 'session_id', value: 'sess_abc', domain: 'app.example.com', path: '/', httpOnly: true, secure: true },
    { name: 'csrf_token', value: 'csrf_xyz', domain: 'app.example.com', path: '/' },
    { name: '_auth', value: 'bearer_token', domain: '.example.com', path: '/' }
  ]);
}"
playwright-cli goto https://app.example.com/dashboard
```

## Login Once, Reuse State

Log in through the UI once, save the state, and load it in future sessions:

```bash
# Session 1: Log in and save state
playwright-cli open https://app.example.com/login
playwright-cli snapshot
playwright-cli fill e1 "user@example.com"
playwright-cli fill e2 "password123"
playwright-cli click e3
# Wait for redirect to dashboard
playwright-cli snapshot
playwright-cli state-save auth-state.json

playwright-cli close

# Session 2 (later): Load state and skip login
playwright-cli open https://app.example.com
playwright-cli state-load auth-state.json
playwright-cli goto https://app.example.com/dashboard
# Already authenticated
```

## OAuth / SSO Redirect Flows

Handle OAuth providers that redirect to a third-party login page and back.

```bash
# Click the OAuth login button
playwright-cli open https://app.example.com/login
playwright-cli snapshot
playwright-cli click e5  # "Sign in with Google" button

# The page redirects to the OAuth provider
playwright-cli snapshot  # Now on accounts.google.com or similar

# Complete the OAuth form
playwright-cli fill e1 "user@gmail.com"
playwright-cli click e2  # "Next"
playwright-cli fill e3 "password"
playwright-cli click e4  # "Sign in"

# Wait for redirect back to your app
playwright-cli run-code "async page => {
  await page.waitForURL('**/app.example.com/**', { timeout: 15000 });
  return page.url();
}"
playwright-cli snapshot
```

### Handle OAuth Popup Windows

Some OAuth flows open a popup instead of redirecting:

```bash
playwright-cli run-code "async page => {
  // Listen for the popup
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
  const popup = await popupPromise;

  // Interact with the popup
  await popup.waitForLoadState();
  await popup.getByRole('textbox', { name: 'Username' }).fill('myuser');
  await popup.getByRole('textbox', { name: 'Password' }).fill('mypassword');
  await popup.getByRole('button', { name: 'Sign in' }).click();

  // Popup closes automatically, main page redirects
  await page.waitForURL('**/dashboard');
  return page.url();
}"
```

## MFA / TOTP Handling

Generate TOTP codes for two-factor authentication using a shared secret.

```bash
playwright-cli run-code "async page => {
  // TOTP generation (RFC 6238)
  const secret = 'JBSWY3DPEHPK3PXP';  // Base32-encoded secret

  // Decode base32
  const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret) bits += base32.indexOf(c).toString(2).padStart(5, '0');
  const key = new Uint8Array(bits.match(/.{8}/g).map(b => parseInt(b, 2)));

  // HMAC-SHA1 (using SubtleCrypto)
  const counter = Math.floor(Date.now() / 30000);
  const counterBytes = new Uint8Array(8);
  new DataView(counterBytes.buffer).setUint32(4, counter);

  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, counterBytes));
  const offset = sig[sig.length - 1] & 0xf;
  const code = ((sig[offset] & 0x7f) << 24 | sig[offset+1] << 16 | sig[offset+2] << 8 | sig[offset+3]) % 1000000;

  return code.toString().padStart(6, '0');
}"

# Use the returned code to fill the MFA field
playwright-cli fill e1 "123456"  # replace with actual TOTP code from above
playwright-cli click e2  # "Verify" button
```

## Multi-User Testing

Use named sessions to test different user roles simultaneously:

```bash
# Admin session
playwright-cli -s=admin open https://app.example.com/login
playwright-cli -s=admin fill e1 "admin@example.com"
playwright-cli -s=admin fill e2 "admin-pass"
playwright-cli -s=admin click e3

# Regular user session
playwright-cli -s=user open https://app.example.com/login
playwright-cli -s=user fill e1 "user@example.com"
playwright-cli -s=user fill e2 "user-pass"
playwright-cli -s=user click e3

# Compare what each sees
playwright-cli -s=admin goto https://app.example.com/settings
playwright-cli -s=admin snapshot  # Should see admin panel

playwright-cli -s=user goto https://app.example.com/settings
playwright-cli -s=user snapshot  # Should see limited settings

# Cleanup
playwright-cli close-all
```

## Detecting Expired Sessions

Check if the current session is still valid:

```bash
playwright-cli run-code "async page => {
  const response = await page.evaluate(async () => {
    const r = await fetch('/api/me', { credentials: 'include' });
    return { status: r.status, ok: r.ok };
  });
  return response;
}"
# If status is 401/403, re-authenticate
```

### Auto-Refresh Pattern

```bash
playwright-cli run-code "async page => {
  const response = await page.goto('https://app.example.com/dashboard');
  if (response.url().includes('/login')) {
    // Session expired, redirected to login
    return 'SESSION_EXPIRED';
  }
  return 'AUTHENTICATED';
}"
```

## Security Reminders

- Never commit auth state files — add `*.auth-state.json` to `.gitignore`
- Use environment variables for credentials, not hardcoded values
- Delete state files after automation completes
- Use `--persistent` profiles carefully — they store real auth data on disk
