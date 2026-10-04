---
name: dataverse-connect
description: >
  One-step, idempotent setup and connection diagnostics for a Microsoft Dataverse environment:
  installs tools, authenticates the Dataverse CLI and PAC CLI, writes `.env`, copies the Python
  auth helper into the project, registers the Dataverse MCP server, and verifies the connection.
  USE FOR: connect to Dataverse, set up a new Dataverse project, switch environment, fix Dataverse
  authentication, dataverse auth create, pac auth create, register Dataverse MCP server, MCP not
  working, allowlist MCP client, dataverse mcp allow, scripts/auth.py --check, privilege preflight.
  DO NOT USE FOR: creating tables or columns (use dataverse-metadata), reading or writing records
  (use dataverse-data), querying data (use dataverse-query), solution export or import
  (use dataverse-solution), environment settings (use dataverse-admin).
---

# Dataverse Connect

One-step, idempotent connection to a Microsoft Dataverse environment. Every step checks whether it
is already done and skips if so.

> **Environment-first rule** — metadata and plug-in registrations are created **in the environment**
> via API or scripts, then pulled into the repo. Never hand-write solution XML to create components.

Execute the steps in order. Step 0 may short-circuit the flow when the workspace is already set up.

## When to use

- Starting a new Dataverse project or onboarding an existing repo
- Switching to another environment or tenant
- Authentication prompts, expired caches, or `NOT REACHABLE` results
- The Dataverse MCP server is missing, not connected, or returns 403

## Bundled files

This skill ships the following files in its own base directory. They are copied into the user's
project in Step 4. `<skill-base-dir>` below means the directory that contains this `SKILL.md`
(the host announces it when the skill loads; otherwise locate it, e.g. under the installed
`dataverse` plugin's `skills/dataverse-connect/` folder).

| File | Purpose |
|---|---|
| `scripts/auth.py` | Credential chain + `get_client()` / `get_token()` for Python scripts; CLI flags `--check`, `--ping`, `--diagnose`, `--bootstrap URL` |
| `scripts/requirements.txt` | Python dependencies (Dataverse SDK, `azure-identity`, `msal`, `msal-extensions`, `requests`, `pandas`) |
| `scripts/enable_mcp_client.py` | Programmatic MCP client allowlisting (fallback, see [mcp-configuration.md](references/mcp-configuration.md#7-allowlist-the-mcp-client-in-the-environment)) |
| `assets/CLAUDE.md.template` | Project-level agent instructions with `{{DATAVERSE_URL}}`, `{{SOLUTION_NAME}}`, `{{PUBLISHER_PREFIX}}` placeholders |

---

## Step 0: Detect existing setup

Re-running setup on a configured workspace overwrites `.env`, re-registers MCP, and wastes time.
Run these checks first. If **all four pass**, skip to Step 7.

1. **`.env` is complete** — exists at the workspace root with non-empty `DATAVERSE_URL`, `TENANT_ID`,
   and `MCP_CLIENT_ID`.
2. **MCP is registered** — the host's MCP list has a `dataverse-*` (Claude Code) or
   `DataverseMcp*` (GitHub Copilot) entry pointing at `DATAVERSE_URL`.
3. **Both auth surfaces match `.env`** — `dataverse auth who` shows a profile whose
   `Environment Url` equals `DATAVERSE_URL`, and `pac org who` succeeds against a PAC profile for
   the same URL. Dataverse CLI auth covers connect / data / query / metadata / MCP / Python; PAC auth
   covers `dataverse-solution` and `dataverse-admin`. Both are front-loaded here so neither prompts
   later.
4. **Python SDK is importable and current**:

   ```bash
   python -c "from PowerPlatform.Dataverse.client import DataverseClient; import pandas; from importlib.metadata import version; v=version('PowerPlatform-Dataverse-Client'); assert int(v.split('.')[0])>=1, f'SDK {v} is outdated, need >=1.0.0'"
   ```

**All pass:** confirm the detected setup (URL, profile, MCP server) and jump to Step 7. Do not
rewrite `.env`, re-register MCP, or re-run `pip install`.

**Any fail:** run Steps 1–7 but honor each step's skip condition. A partially configured workspace
does not need a full redo — if only `.env` and MCP are missing, start at Step 3.

---

## Step 1: Ensure tools are installed

Check every tool independently and report all missing tools at once. Install commands are in
[tools-setup.md](references/tools-setup.md).

| Tool | Check | Needed for |
|---|---|---|
| Python 3 | `python --version` | `scripts/auth.py`, SDK scripts |
| Git | `git --version` | Source control |
| Node.js | `node --version` | Dataverse CLI and MCP stdio proxy |
| Dataverse CLI | `npm list -g @microsoft/dataverse` | Auth, MCP proxy, scripted data-plane calls |
| PAC CLI | `pac` (prints a version banner; `pac --version` is invalid) | Solutions, admin |
| .NET SDK | `dotnet --version` | PAC CLI (not the Dataverse CLI — it bundles its runtime) |
| Azure CLI | `az --version` | Fallback environment discovery, CI/CD |

If `winget` installs a tool that is not yet on `PATH`, ask the user to restart the terminal. If
`pac` is not found, see [tools-setup.md](references/tools-setup.md#pac-cli-path-setup).

**Python dependencies** — check before installing:

```bash
python -c "from PowerPlatform.Dataverse.client import DataverseClient; import azure.identity, msal, msal_extensions, requests, pandas; print('OK')"
```

If it does not print `OK`, install from this skill's base directory:

```bash
pip install -r <skill-base-dir>/scripts/requirements.txt
```

`msal` + `msal-extensions` let `scripts/auth.py` reuse the `dataverse auth create` token cache —
one sign-in for CLI, MCP, and Python.

**Dataverse CLI** — install **only if missing**. On managed devices each `@latest` fetch can trigger
npm-registry security prompts (see
[tools-setup.md](references/tools-setup.md#corporate-managed-devices-package-registry)):

```bash
npm install -g @microsoft/dataverse@latest
```

**Skip condition:** all tools present and the Python check prints `OK`.

---

## Step 2: Discover the environment and authenticate

Two tools, two Entra ID apps, two token caches — front-load both now:

1. **`dataverse auth create`** (app `0c412cc3-0dd6-449b-987f-05b053db9457`) covers Dataverse CLI,
   MCP, and Python.
2. **`pac auth create`** (PAC's own app) covers `dataverse-solution` and `dataverse-admin`.

Look for existing profiles before asking for a URL:

```bash
dataverse auth list
dataverse auth who
pac auth list        # still useful for environment discovery (pac org list / pac env list)
```

- **A Dataverse CLI profile matches the target** → reuse it; take `DATAVERSE_URL` and `TENANT_ID`
  from the profile.
- **No profile, or it points elsewhere** → ask: "Connect to an existing environment or create a new
  one?"

If the target URL is in a different tenant or region than the current profile, create a new profile
rather than reusing the old one:

```bash
dataverse auth create --environment <url>               # interactive (WAM broker on Windows, no browser tab)
dataverse auth create --environment <url> --deviceCode  # remote / SSH / no browser
```

On an admin-consent error the CLI prints the correct consent URL to share with a tenant admin — do
not construct one yourself.

Switch between existing profiles:

```bash
dataverse auth select --name <profile-name>
```

Create a new environment (requires admin permissions):

```bash
pac admin create --name "<name>" --type "<type>" --region "<region>"
```

On a permissions error, send the user to the
[Power Platform admin center](https://admin.powerplatform.microsoft.com/) to create it, then connect.

**Confirm and extract values:**

```bash
dataverse auth who
dataverse org who
```

Parse `DATAVERSE_URL` and `TENANT_ID` from the output. If no tenant ID is shown, read it from the
`WWW-Authenticate` challenge:

```bash
curl -sI https://<org>.crm.dynamics.com/api/data/v9.2/ \
  | grep -i "WWW-Authenticate" \
  | sed -n 's|.*login\.microsoftonline\.com/\([^/]*\).*|\1|p'
```

### Step 2b: Front-load PAC CLI auth

PAC uses its own app, so it needs a separate sign-in. Use the same account as Step 2.

```bash
pac auth list                                                  # skip if a profile for DATAVERSE_URL exists
pac auth create --name <orgid> --environment <DATAVERSE_URL>
```

If PAC CLI is not installed, skip with a note that `dataverse-solution` / `dataverse-admin` will need
it later.

---

## Step 3: Write `.env`

Offer the authentication options:

> How would you like to authenticate with Dataverse?
>
> 1. **Interactive login (recommended)** — sign in via browser. No app registration needed; the token
>    stays cached across sessions.
> 2. **CI/CD service principal** — `CLIENT_ID` + `CLIENT_SECRET` or `CLIENT_CERTIFICATE_PATH`.

Write `.env` yourself — do not ask the user to create it. `MCP_CLIENT_ID` depends on the host:

| Host | `MCP_CLIENT_ID` |
|---|---|
| GitHub Copilot | `aebc6443-996d-45c2-90f0-388ff96faa56` |
| Claude Code | `0c412cc3-0dd6-449b-987f-05b053db9457` |

```python
tool_type = "<copilot | claude>"
mcp_client_id = (
    "aebc6443-996d-45c2-90f0-388ff96faa56"
    if tool_type == "copilot"
    else "0c412cc3-0dd6-449b-987f-05b053db9457"
)

with open(".env", "w") as f:
    f.write(f"DATAVERSE_URL={dataverse_url}\n")
    f.write(f"TENANT_ID={tenant_id}\n")
    f.write(f"MCP_CLIENT_ID={mcp_client_id}\n")
    f.write(f"SOLUTION_NAME={solution_name}\n")
    f.write("PUBLISHER_PREFIX=\n")  # filled in when the solution is created
    f.write("PAC_AUTH_PROFILE=nonprod\n")
    if client_id:
        f.write(f"CLIENT_ID={client_id}\n")
    if client_secret:
        f.write(f"CLIENT_SECRET={client_secret}\n")
```

Ensure secrets and build output are git-ignored:

```python
import os

GITIGNORE_ENTRIES = [
    ".env", ".vscode/settings.json", ".claude/mcp_settings.json",
    ".token_cache.bin", ".dataverse/", "*.snk", "__pycache__/", "*.pyc",
    "solutions/*.zip", "plugins/**/bin/", "plugins/**/obj/",
]
gitignore = open(".gitignore").read() if os.path.exists(".gitignore") else ""
missing = [e for e in GITIGNORE_ENTRIES if e not in gitignore]
if missing:
    with open(".gitignore", "a") as f:
        f.write("\n" + "\n".join(missing) + "\n")
```

**Skip condition:** `.env` exists with all required values.

---

## Step 4: Set up the project structure

For a new project (no `scripts/` folder):

```bash
mkdir -p solutions plugins scripts
cp <skill-base-dir>/scripts/auth.py scripts/
cp <skill-base-dir>/scripts/requirements.txt scripts/
```

If the project root has no `CLAUDE.md`, copy `<skill-base-dir>/assets/CLAUDE.md.template` to
`CLAUDE.md` and replace `{{DATAVERSE_URL}}`, `{{SOLUTION_NAME}}`, and `{{PUBLISHER_PREFIX}}` with
the values from `.env`. Never overwrite an existing `CLAUDE.md`.

Every Python script in the project then imports the helper the same way:

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

**Skip condition:** `scripts/auth.py` exists.

---

## Step 5: Verify the connection

```bash
dataverse auth who
pac org who
python scripts/auth.py --check
```

All three must resolve the same user and environment — that proves the Dataverse CLI cache, the PAC
profile, and Python's reuse of the shared cache are wired together.

`scripts/auth.py` flags:

| Flag | What it does | Exit codes |
|---|---|---|
| `--check` | Makes a **real data-plane call** and prints `REACHABLE: ... N non-private tables` or `NOT REACHABLE: ...`. A token can be minted while the org domain is blocked, so this is the only proof of a working connection. | 0 reachable, 2 not reachable |
| `--ping` | Lightweight check using only stdlib + `msal` (no SDK import). Also writes `.env` and copies `auth.py` to `scripts/` if missing. | 0 reachable, 1 no config / no token, 2 org unreachable |
| `--diagnose` | Prints which credential tiers are available and which one the next call will use, **without prompting**. | 0 |
| `--bootstrap URL` | One-shot setup shortcut: probes the URL for the tenant, writes `.env`, copies `auth.py` to `scripts/`, saves user-level config. Does not authenticate — run `--check` after `pip install`. | 0 |

**On failure:**

| Symptom | Fix |
|---|---|
| `dataverse auth who` fails | Re-run Step 2 |
| `pac org who` fails | Re-run Step 2b |
| `--check` prints a device-code URL | The browser/WAM cache has no Python-reusable token. Re-run `dataverse auth create --environment <url> --deviceCode`, then retry. Still prompting → check `pip show msal msal-extensions`. |
| `--check` prints `NOT REACHABLE` with a connection or timeout error | A network, proxy, or firewall blocks the org domain — not an auth problem. Ask the user to allow `*.dynamics.com`. Do not report success. |
| Auth hangs or picks the wrong identity | Run `python scripts/auth.py --diagnose` (see [tools-setup.md](references/tools-setup.md#credential-chain-and---diagnose)) |
| Other Python error | Check the SDK install and `.env` |

Before metadata work, confirm the account holds the needed customization privileges — see
[tools-setup.md](references/tools-setup.md#privilege-preflight).

---

## Step 6: Configure the MCP server

**Skip** when the host's MCP list or config already contains a Dataverse server for the selected
URL (`claude mcp list` for Claude Code; `~/.copilot/mcp-config.json` or `.mcp.json` for GitHub
Copilot).

Otherwise follow [mcp-configuration.md](references/mcp-configuration.md):

1. Detect the host (Claude Code or GitHub Copilot) from context.
2. Confirm `MCP_CLIENT_ID` in `.env` matches the host (Step 3 table).
3. Take the environment URL from `.env`.
4. Default to the GA endpoint (`/api/mcp`).
5. Register the server for the host.
6. Handle tenant admin consent and the environment allowlist — prefer
   `dataverse mcp allow <MCP_CLIENT_ID>` over the portal (one-time per tenant / environment).

MCP configuration only takes effect after a restart:

- **Claude Code** — run the `claude mcp add` command, then tell the user:
  > Dataverse MCP server registered. Restart Claude Code to enable the MCP tools — use
  > `claude --continue` to resume this session without losing context. On restart a browser window
  > may open to sign in; that is the MCP proxy authenticating on your behalf.
- **GitHub Copilot** — write the JSON config, then tell the user:
  > Dataverse MCP server configured. Restart your editor (or Copilot CLI session) for the change to
  > take effect.

Pause until the user has restarted.

---

## Step 7: Final verification

After the restart, **both** checks must pass before declaring setup complete.

1. **The MCP server is connected** — Claude Code: `claude mcp list` shows the `dataverse-*` server
   as connected. GitHub Copilot: the server appears in the MCP tool list. This proves the server
   starts, not that data operations work.
2. **The agent lists tables via `describe` / `search` and returns data** — ask:
   "List the tables in my Dataverse environment." This proves auth, tenant consent, environment
   allowlist, and endpoint reachability end to end.

**Reading failures:**

- Check 1 fails → the server cannot start. Re-run Step 6; confirm Node.js / `npx` are installed and
  the registration succeeded.
- Check 1 passes, Check 2 fails → the server speaks MCP but cannot reach or read Dataverse. Run
  `npx @microsoft/dataverse mcp <DATAVERSE_URL> --validate` and judge by the **GA** (`/api/mcp`)
  result only — see
  [mcp-configuration.md](references/mcp-configuration.md#reading---validate-output).

Do **not** use `--validate` as a success gate on first-time setup — with a cold token cache it can
fail with `MsalClientException` or `403` while MCP works on the next real call.

For what MCP can and cannot do versus the SDK / Web API, see the Tool Capabilities matrix in
`dataverse-overview`.

When both checks pass, tell the user:

> Connected to Dataverse at `<DATAVERSE_URL>`. Tools installed, authenticated, MCP live.
>
> Next steps:
>
> - Create tables, columns, and relationships (`dataverse-metadata`)
> - Write and import data (`dataverse-data`)
> - Query and analyze data (`dataverse-query`)
> - Export and promote solutions (`dataverse-solution`)
>
> To load sample data, ask: "Load demo data into my Dataverse environment."

---

## Safety rules

- **Confirm the target environment** before any write: show `dataverse auth who` / `pac org who`
  output and get the user's confirmation. Never assume the active profile is correct.
- **No fabrication** — report only counts and rows actually returned, anchored to something
  verifiable (org URL, a metadata GUID, the real number). If a call fails, say what failed.
- **MCP tools exist only after a restart.** Do not claim they are callable in the session that
  registered them, do not spin up a side `npx @microsoft/dataverse mcp` proxy as a workaround, and if
  the user explicitly asked for MCP, do not silently fall back to the SDK or Web API — surface the
  restart requirement instead.
- **Least privilege** — grant System Customizer for customization work, not System Administrator.
- **Never commit secrets** — `.env`, token caches, and `.dataverse/` stay git-ignored.

## References

| Reference | When to load |
|---|---|
| [tools-setup.md](references/tools-setup.md) | Installing tools, PAC CLI on Git Bash / `PATH`, managed-device npm registry, PAC / GitHub / Azure CLI auth, credential chain, privilege preflight |
| [mcp-configuration.md](references/mcp-configuration.md) | Registering the MCP server for Claude Code or GitHub Copilot, admin consent, allowlisting, MCP troubleshooting |
