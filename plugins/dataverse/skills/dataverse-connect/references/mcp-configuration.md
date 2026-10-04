# MCP Server Configuration

Register the Dataverse MCP server for **Claude Code** or **GitHub Copilot**, grant tenant consent,
allowlist the MCP client in the environment, and troubleshoot.

The environment URL should already be in `.env` as `DATAVERSE_URL` from the `dataverse-connect`
flow. If it is not, run Step 2 of `dataverse-connect` first. Derive every parameter from context or
`.env`; prompt only when it cannot be determined.

## Overview

| Step | Claude Code | GitHub Copilot |
|---|---|---|
| Client ID | `0c412cc3-0dd6-449b-987f-05b053db9457` | `aebc6443-996d-45c2-90f0-388ff96faa56` |
| Transport | stdio via `npx @microsoft/dataverse mcp` | HTTP to `/api/mcp` |
| Registration | `claude mcp add` (never edit config files) | JSON config file |
| Default scope | `project` | Global (`~/.copilot/mcp-config.json`) |
| Server name | `dataverse-{orgid}` | `DataverseMcp{orgid}` |

---

## 0. Determine the host

- Use the host the user named in the prompt.
- Otherwise infer it from context.
- Only if that is impossible, ask: "Configure the Dataverse MCP server for **Claude Code** or
  **GitHub Copilot**?"

Set `TOOL_TYPE` to `claude` or `copilot`, and make sure `MCP_CLIENT_ID` in `.env` matches:

| `TOOL_TYPE` | `MCP_CLIENT_ID` |
|---|---|
| `copilot` | `aebc6443-996d-45c2-90f0-388ff96faa56` |
| `claude` | `0c412cc3-0dd6-449b-987f-05b053db9457` (the `@microsoft/dataverse` stdio proxy app) |
| `claude` via the VS Code extension | Same value as `CLIENT_ID` if already set; otherwise offer to create a new app registration |

---

## 1. Determine the scope

Use the scope the user asked for; otherwise apply the default without asking.

**Claude Code** — set `CLAUDE_SCOPE`:

| Scope | Value | Availability |
|---|---|---|
| User | `user` | All projects for this user |
| Project (default) | `project` | This project, shared via `.mcp.json` |
| Local | `local` | This project directory, this user only |

**GitHub Copilot** — set `CONFIG_PATH`:

| Scope | `CONFIG_PATH` |
|---|---|
| Global (default) | `~/.copilot/mcp-config.json` |
| Project | `.mcp.json` in the current working directory |

---

## 2. Check for an existing registration

**Claude Code** — skip this step. Registration is managed by the CLI; `claude mcp list` shows what
is configured.

**GitHub Copilot** — read `CONFIG_PATH`. The file is JSON with either `mcpServers` or `servers` as the
top-level key:

```json
{
  "mcpServers": {
    "ServerName1": {
      "type": "http",
      "url": "https://example.com/api/mcp"
    }
  }
}
```

Collect every `url` value as `CONFIGURED_URLS` (for example
`["https://contoso.crm.dynamics.com/api/mcp"]`). A missing or empty file means `CONFIGURED_URLS` is
`[]` — this step must never block.

If the environment URL is already in `CONFIGURED_URLS`, the server is **already configured**. Ask
whether to re-register it (for example to switch endpoint) before continuing; otherwise stop.

---

## 3. Determine the environment URL

Use the URL from the prompt, or `DATAVERSE_URL` from `.env`. If neither exists, discover it in this
order and stop at the first that succeeds.

### 3a. PAC CLI (preferred)

```bash
pac                 # prints the version banner if installed
pac auth list
pac org who
pac env list
```

If PAC is authenticated and returns environments, present them:

> I found these Dataverse environments via PAC CLI. Which one should MCP use?
>
> 1. Contoso Dev — `https://contoso-dev.crm.dynamics.com`
> 2. Contoso Test — `https://contoso-test.crm.dynamics.com`
>
> Or type a URL.

If PAC is missing or not authenticated, fall back to 3b.

### 3b. Azure CLI (fallback)

1. Confirm `az` is installed (`where az` on Windows, `which az` elsewhere); if not, fall back to 3c.
2. Ensure the user is signed in:

   ```bash
   az account show || az login
   ```

3. Get a Power Apps API token:

   ```bash
   az account get-access-token --resource https://service.powerapps.com/ --query accessToken --output tsv
   ```

4. List environments:

   ```http
   GET https://api.powerapps.com/providers/Microsoft.PowerApps/environments?api-version=2016-11-01
   Authorization: Bearer {token}
   Accept: application/json
   ```

5. Keep entries where `properties.linkedEnvironmentMetadata.instanceUrl` is not null, and extract
   `properties.displayName` and `instanceUrl` (trailing slash removed):

   ```json
   [
     { "displayName": "Contoso (default)", "instanceUrl": "https://contoso.crm.dynamics.com" },
     { "displayName": "Contoso Dev", "instanceUrl": "https://contoso-dev.crm.dynamics.com" }
   ]
   ```

6. Present a numbered list. Mark an entry **(already configured)** when any URL in
   `CONFIGURED_URLS` starts with its `instanceUrl`. Re-registering an already-configured
   environment needs confirmation. If the user types "manual", or the call fails for any reason,
   explain what went wrong and fall back to 3c.

### 3c. Manual entry

> Please enter your Dataverse environment URL, for example `https://contoso.crm.dynamics.com`.
> You can find it in the Power Platform admin center under **Environments**.

### 3d. Normalize

Strip any trailing slash. The result is `USER_URL` for the rest of this reference.

---

## 4. Choose the endpoint

Default to GA unless the user asked for Preview:

| Endpoint | `MCP_URL` | `ENDPOINT_FLAG` (stdio proxy) |
|---|---|---|
| Generally Available (default) | `{USER_URL}/api/mcp` | *(omit)* |
| Preview | `{USER_URL}/api/mcp_preview` | `--preview` |

---

## 5. Register the server

**Server name** — take the subdomain of `USER_URL`
(`https://contoso.crm.dynamics.com` → `contoso`):

- Claude Code: `dataverse-{orgid}` in lowercase, e.g. `dataverse-contoso`
- GitHub Copilot: `DataverseMcp{orgid}`, e.g. `DataverseMcpcontoso`

### Claude Code

Run the CLI command — do **not** edit configuration files.

**Always use `-t stdio` with the `npx` proxy.** Never use `--transport http` or `--transport sse`:
the Dataverse MCP endpoint requires authentication that only the proxy handles, and direct HTTP fails
with connection errors.

macOS / Linux / WSL:

```bash
claude mcp add --scope {CLAUDE_SCOPE} {SERVER_NAME} -t stdio -- npx -y @microsoft/dataverse@latest mcp "{USER_URL}" {ENDPOINT_FLAG}
```

Windows without WSL — wrap `npx` in `cmd //c` and drop the quotes around the URL:

```bash
claude mcp add --scope {CLAUDE_SCOPE} {SERVER_NAME} -t stdio -- cmd //c "npx -y @microsoft/dataverse@latest mcp {USER_URL} {ENDPOINT_FLAG}"
```

Examples:

```bash
# GA, user scope
claude mcp add --scope user dataverse-contoso -t stdio -- npx -y @microsoft/dataverse@latest mcp "https://contoso.crm.dynamics.com"

# Preview, project scope
claude mcp add --scope project dataverse-contoso -t stdio -- npx -y @microsoft/dataverse@latest mcp "https://contoso.crm.dynamics.com" --preview

# GA, project scope, Windows
claude mcp add --scope project dataverse-contoso -t stdio -- cmd //c "npx -y @microsoft/dataverse@latest mcp https://contoso.crm.dynamics.com"
```

Keep the command as `CLAUDE_COMMAND` for Step 8.

### GitHub Copilot

1. Read `CONFIG_PATH`, or start from `{}` if it does not exist.
2. Use the `servers` key if the file already has it; otherwise use `mcpServers`.
3. Add or update the entry:

   ```json
   {
     "mcpServers": {
       "{SERVER_NAME}": {
         "type": "http",
         "url": "{MCP_URL}"
       }
     }
   }
   ```

4. Write the file back with 2-space indentation.

Rules:

- Never remove or overwrite other entries; preserve the existing structure.
- If `SERVER_NAME` already exists, update its `url`.

---

## 6. Tenant admin consent (one-time per tenant)

The MCP client app must have admin consent in the Entra ID tenant. This is a **one-time** action per
tenant and covers every environment in it. It requires a **Global Administrator** or **Privileged
Role Administrator**.

Summarize the chosen parameters (host, scope, environment URL, endpoint, `MCP_CLIENT_ID`), then ask
whether consent was already granted. If not:

> **Tenant-level admin consent** is required for the MCP client app. A Global Administrator or
> Privileged Role Administrator must open this URL and select **Accept**:
>
> ```text
> https://login.microsoftonline.com/{TENANT_ID}/adminconsent?client_id={MCP_CLIENT_ID}
> ```
>
> If you lack admin permissions, send the URL to your Entra ID administrator.

Wait for confirmation before continuing.

---

## 7. Allowlist the MCP client in the environment

Separately from tenant consent, each environment must allow the MCP client. This is **one-time** per
environment and needs only **Environment Admin** or **System Administrator** in the environment — no
Entra ID admin.

> **One sign-in for CLI, MCP, and Python.** `dataverse auth create` writes a token cache that the
> `@microsoft/dataverse` stdio proxy and `scripts/auth.py` both read silently, so the allowlisted
> client is exercised once per environment with no separate Python sign-in. If a script prompts for a
> device code, the shared cache is missing or stale — re-run
> `dataverse auth create --environment <url>`.

**Always try Method A first** and run it yourself. Use B or C only if A fails (CLI missing, or the
user lacks Dataverse admin rights).

### Method A (preferred): `dataverse mcp allow`

```bash
dataverse mcp allow {MCP_CLIENT_ID}
```

It targets the active auth profile's environment. Any of these outputs means success:

- `Client {MCP_CLIENT_ID} is already enabled. No changes needed.`
- `Client exists but is disabled. Enabling... Done.`
- `Client not found. Creating... Done.`

### Method B (fallback): Power Platform admin center

1. Open the [Power Platform admin center](https://admin.powerplatform.microsoft.com/).
2. Select **Environments**, then the environment matching `USER_URL`.
3. Select **Settings** → expand **Product** → **Features**.
4. In the **MCP Server** section, turn **Enable MCP Server** on.
5. Under **Allowed clients**, select **Add client**, paste `{MCP_CLIENT_ID}`, and **Save**.

### Method C (fallback): script

Run `scripts/enable_mcp_client.py` from the `dataverse-connect` skill's base directory (it is not
copied into the project), with the project root as the working directory so it finds `.env`:

```bash
python <skill-base-dir>/scripts/enable_mcp_client.py
```

It reads `MCP_CLIENT_ID` from `.env` and adds or enables the client in the allowed list through the
Dataverse API — useful where the Dataverse CLI is not installed.

### Validate

```bash
npx -y @microsoft/dataverse@latest mcp {USER_URL} --validate
```

For a GA registration, `GA endpoint is valid, but Preview endpoint is not configured` is
**success**. Revisit enablement only if the GA endpoint still returns **403 Forbidden** after
`mcp allow` reported success.

---

## 8. Confirm and hand off

MCP tools load only at startup. Pause after this step and do nothing else until the user has
restarted.

**Claude Code** — run `CLAUDE_COMMAND`, then tell the user:

> Dataverse MCP server registered. Restart Claude Code to enable the MCP tools — use
> `claude --continue` to resume this session without losing context.
>
> **On restart a browser window may open** to sign in to your Dataverse environment. That is the MCP
> proxy (`@microsoft/dataverse`) authenticating on your behalf. Use the same account as before; the
> token is cached afterwards.
>
> After that you can list tables, query records, create / update / delete records, and explore the
> schema and relationships.

**GitHub Copilot** — tell the user:

> Dataverse MCP server configured for GitHub Copilot at `{MCP_URL}`, saved to `{CONFIG_PATH}`.
>
> **Restart your editor (or reload the window) or Copilot CLI session** for the change to take
> effect. After that you can list tables, query records, create / update / delete records, and
> explore the schema and relationships.

Do not claim the MCP tools are callable in the current session. Do not start a separate
`npx @microsoft/dataverse mcp` proxy as a workaround, and if the user explicitly required MCP, do not
silently fall back to the SDK or Web API — surface the restart requirement.

---

## 9. Troubleshooting

### Reading `--validate` output

```bash
npx @microsoft/dataverse mcp {USER_URL} --validate
```

`--validate` performs a fresh auth handshake against two endpoints and reports detailed errors
(auth, allowlist, consent, reachability):

- **GA** — `{USER_URL}/api/mcp`, the endpoint used at runtime. **Read this result first.** If it
  passes, MCP works regardless of the Preview result.
- **Preview** — `{USER_URL}/api/mcp_preview`, opt-in per environment. A `403 Forbidden` here is
  expected on most environments and does not indicate a broken setup.

The validator exits `1` with a partial-success warning unless **both** endpoints pass, so ignore the
aggregate status and judge per endpoint. A GA failure is the real signal: auth, tenant consent,
environment allowlist, or reachability.

Use `--validate` only to diagnose a confirmed failure. On first-time setup the token cache is cold,
so it can fail with `MsalClientException` or `403` while real MCP calls succeed afterwards.

### Checklist

**Any host:**

- The URL has the form `https://<org>.<region>.dynamics.com` and matches the Power Platform admin
  center.
- The user has access to the environment.
- **Tenant admin consent** was granted (Step 6). Without it, authentication succeeds but the app is
  denied access.
- **Environment allowlist** contains the client (Step 7). Quickest fix:
  `dataverse mcp allow {MCP_CLIENT_ID}`. To check in the portal: Power Platform admin center →
  Environments → environment → Settings → Product → Features → **MCP Server** on, client listed under
  **Allowed clients**.
- `--validate` returns **403** on the GA endpoint → the client is not allowlisted yet; run Method A
  and re-validate.
- Using Preview → the Preview MCP endpoint must also be enabled on the same Features page.
- Repeated npm "blocked by your IT admin" prompts → see
  [tools-setup.md](tools-setup.md#corporate-managed-devices-package-registry).

**Claude Code:**

- `claude` must be on `PATH`; `npx` and `npm` must be installed (Node.js 18+).
- Restart Claude Code after `claude mcp add` (resume with `claude --continue`), then verify with
  `claude mcp list`.
- If the proxy seems outdated or misbehaves, clear the npx cache and retry:

  ```bash
  npx clear-npx-cache
  ```

- Validate authentication independently:

  ```bash
  npx -y @microsoft/dataverse@latest mcp "{USER_URL}" --validate
  ```

- On Windows, a server that fails to launch usually needs the `cmd //c` form from Step 5.

**GitHub Copilot:**

- Project scope: confirm `.mcp.json` was written in the working directory.
- Global scope: check write permissions on `~/.copilot/`.
- Confirm the entry sits under the same top-level key (`mcpServers` or `servers`) as the rest of the
  file.
