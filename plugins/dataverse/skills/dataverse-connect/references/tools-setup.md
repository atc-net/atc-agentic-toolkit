# Tool Installation and Authentication

Install commands, CLI authentication, the `scripts/auth.py` credential chain, and the privilege
preflight used by `dataverse-connect`.

## Required tools

Check all tools in parallel and install any that are missing.

| Tool | Check | Install |
|---|---|---|
| PAC CLI | `pac` (prints a version banner; `pac --version` is invalid and returns non-zero) | `winget install Microsoft.PowerAppsCLI` |
| GitHub CLI | `gh --version` | `winget install GitHub.cli` |
| Azure CLI | `az --version` | `winget install Microsoft.AzureCLI` |
| .NET SDK | `dotnet --version` | `winget install Microsoft.DotNet.SDK.9` |
| Python 3 | `python --version` | `winget install Python.Python.3.12` |
| Node.js | `node --version` | `winget install OpenJS.NodeJS.LTS` |
| Dataverse CLI | `npm list -g @microsoft/dataverse` (shows `@microsoft/dataverse@<version>`, or `(empty)`) | `npm install -g @microsoft/dataverse@latest` |
| Git | `git --version` | `winget install Git.Git` |

Install the Dataverse CLI **only when missing** and upgrade it explicitly. Each `@latest` fetch hits
the npm registry, which managed-device policy may block with a security prompt.

After a `winget` install the tool may not be on `PATH` until the shell restarts. If a tool is not
found right after install, ask the user to close and reopen the terminal. In Claude Code, remind them
to resume with `claude --continue` so the session keeps its context.

### If winget is unavailable

| Tool | Alternative |
|---|---|
| PAC CLI | `dotnet tool install --global Microsoft.PowerApps.CLI.Tool` |
| GitHub CLI | Download from <https://cli.github.com> |
| Azure CLI | Download from <https://aka.ms/installazurecliwindows> |

On macOS / Linux use the platform package manager (`brew`, `apt`, etc.) for Python, Node.js, Git,
.NET, and the Azure CLI; PAC CLI installs via `dotnet tool install --global`.

### Python dependencies

Install from the requirements file shipped in the `dataverse-connect` skill's base directory:

```bash
pip install -r <skill-base-dir>/scripts/requirements.txt
```

Once Step 4 has copied it into the project, `pip install -r scripts/requirements.txt` works too. It
lists `PowerPlatform-Dataverse-Client>=1.0.0`, `azure-identity`, `azure-core`, `msal`,
`msal-extensions`, `requests`, and `pandas`.

---

## PAC CLI on Windows

### Git Bash

PAC CLI is a `.cmd` wrapper. In Git Bash, `pac` alone may fail or hang. Call it through PowerShell:

```bash
powershell -Command "& 'C:\Users\$USER\AppData\Local\Microsoft\PowerAppsCLI\pac.cmd' help"
```

If installed with `dotnet tool install --global`:

```bash
powershell -Command "& pac help"
```

To avoid repeating the wrapper, add an alias:

```bash
echo 'alias pac="powershell -Command \"& pac.cmd\""' >> ~/.bashrc
source ~/.bashrc
```

Skip the wrapper when `pac` already works directly in the shell.

### PAC CLI PATH setup

If `pac` is not on `PATH`, check the known install locations in order (fastest first). Do not use
`find` or a recursive search — the locations are known.

```bash
# 1. winget install location (most common)
ls "/c/Users/$USER/AppData/Local/Microsoft/PowerAppsCLI/pac.exe" 2>/dev/null

# 2. dotnet tool install location
ls "/c/Users/$USER/.dotnet/tools/pac.exe" 2>/dev/null

# 3. NuGet global packages (Microsoft.PowerApps.CLI package)
ls /c/Users/$USER/.nuget/packages/microsoft.powerapps.cli/*/tools/pac.exe 2>/dev/null
```

Once found, add the directory to `PATH` in `~/.bashrc`:

```bash
echo 'export PATH="$PATH:/c/Users/$USER/AppData/Local/Microsoft/PowerAppsCLI"' >> ~/.bashrc
source ~/.bashrc
```

### PAC version mismatch from Python

A Python `subprocess` can resolve a **different `pac` executable** than the interactive shell — for
example an old `pac.exe` (2.4.1) on `PATH` while the shell uses the current `.cmd` shim (2.9.3). The
old binary lacks newer commands (`pac model create`), so a script fails with "unknown command" even
though `pac` works in the terminal.

Fix: run PAC through `cmd.exe /c pac ...` (or resolve `shutil.which("pac.cmd")`) so the subprocess
uses the same shim, and check the version banner before relying on newer subcommands.

---

## Corporate-managed devices: package registry

On managed devices, the public npm registry (and sometimes PyPI) may be blocked by policy. Symptom:
repeated **"This content is blocked by your IT admin"** popups during `npm install` or `npx`. Two
things touch the registry:

- the one-time `npm install -g @microsoft/dataverse` at connect time
- the MCP proxy's `npx @microsoft/dataverse@latest mcp` resolution, once per session when the stdio
  server launches (not per tool call)

The tooling honors the user's `.npmrc` and never overrides the registry. The fix is device-level —
point npm at the organization's approved feed:

1. Check the current registry:

   ```bash
   npm config get registry
   ```

2. If it shows the public `registry.npmjs.org` and the organization blocks it, set the approved
   internal feed (get the URL from IT / the package-management policy):

   ```bash
   npm config set registry <your-org-approved-feed-url>
   ```

   Also remove any explicit `registry=https://registry.npmjs.org/` line in `~/.npmrc` that shadows
   the managed default.

3. `npx` follows npm's registry config. If it still resolves a stale package, clear its cache
   (`npm-cache/_npx`) and retry.

---

## Authentication

> **Multiple environments** — developers usually work across dev, test, staging, and prod with one
> named PAC profile per environment. Before any environment operation, run `pac auth list` and
> `pac org who`, show the output, and ask which environment the user intends to target. Never
> assume the active profile is correct.

### Identify the tenant ID first

When working in a non-production or separate tenant, get that tenant's ID before authenticating:

```bash
# If PAC CLI is already authenticated to any environment in the tenant
pac org who

# Or, after az login, read the tenantId field
az account show
```

The tenant ID is a GUID (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). Set it in `.env` as `TENANT_ID`
before running any scripts.

### PAC CLI

**Service principal (recommended for non-prod / separate tenants, never needs a browser):**

```bash
pac auth create \
  --name nonprod \
  --applicationId <CLIENT_ID> \
  --clientSecret <CLIENT_SECRET> \
  --tenant <TENANT_ID>
```

Record `CLIENT_ID`, `CLIENT_SECRET`, and `TENANT_ID` in `.env`.

For certificate-based SDK authentication, set `CLIENT_ID` and `CLIENT_CERTIFICATE_PATH` instead of
`CLIENT_SECRET`. Optionally set `CLIENT_CERTIFICATE_PASSWORD` for an encrypted PFX and
`CLIENT_SEND_CERTIFICATE_CHAIN=1` for subject name / issuer (SNI) authentication.

**Interactive user (corporate tenant, or no service principal yet):**

```bash
pac auth create --name dev
```

This opens a browser. For a non-corporate tenant, sign out of the corporate Microsoft account first
(or use an InPrivate / Incognito window) — otherwise the browser auto-completes with corporate
credentials.

Verify and switch profiles:

```bash
pac auth list
pac org who
pac auth activate --name <profile-name>
```

Name profiles after the environment they target (`dev`, `staging`, `prod`, `contoso-dev`).

**Before any deployment task:** run `pac auth list` and `pac org who`, show the output, and confirm
the environment with the user.

### GitHub CLI

```bash
gh auth status
gh auth login                 # if not authenticated
gh api user --jq .login       # confirm the right account when several are configured
```

### Azure CLI (CI/CD setup only — skip until needed)

Always pass the tenant explicitly for a non-prod or separate tenant:

```bash
az login --tenant <TENANT_ID>
az account show --query '{tenant:tenantId, subscription:name}' -o table
```

Confirm the tenant ID matches the dev tenant before proceeding.

---

## Credential chain and `--diagnose`

`scripts/auth.py` resolves credentials as a **silent-first fall-through chain**, so a stale or
authority-mismatched cache does not strand the user:

| Order | Tier | Notes |
|---|---|---|
| 1 | Service principal | `CLIENT_ID` + `CLIENT_SECRET` in `.env`. Terminal: when configured it is used exclusively, so unattended runs fail fast instead of hanging on a prompt. |
| 2 | Certificate | `CLIENT_ID` + `CLIENT_CERTIFICATE_PATH` in `.env`. Terminal, for the same reason. |
| 3 | Shared Dataverse CLI cache | The cache written by `dataverse auth create` and read by the MCP proxy, probed against both the tenant and the `organizations` authority. |
| 4 | Azure CLI | Silent when the user is `az login`-ed to `TENANT_ID`; skipped otherwise. |
| 5 | Interactive | System-browser sign-in on a desktop; device code otherwise. Runs **only** when every silent tier is unavailable. |

All public-client tiers use the Dataverse CLI app (`0c412cc3-0dd6-449b-987f-05b053db9457`), so the
CLI, the MCP proxy, and Python scripts share one sign-in.

When `.env` is missing, `DATAVERSE_URL` and `TENANT_ID` are read from the user-level config at
`~/.atc-dataverse/config.json` (Windows: `%LOCALAPPDATA%\.atc-dataverse\config.json`), written after
a successful `--check`, `--ping`, or `--bootstrap`.

When auth hangs, prompts unexpectedly, or uses the wrong identity, run:

```bash
python scripts/auth.py --diagnose
```

It prints which tiers are available and which one the next call will use, **without prompting**. On
a Conditional Access–hardened tenant where device code is blocked, `az login` (tier 4) or a desktop
browser sign-in is the way through.

**Workspace token cache.** On a non-CI host without a display (SSH session, container), `auth.py`
stores the device-code token cache in `<workspace>/.dataverse/` by default, because some containers
reset `$HOME` between processes and would otherwise prompt every run. `DATAVERSE_TOKEN_CACHE_DIR`
overrides the location; set it to `off` to always use the OS cache. Outside Windows the file holds a
**plaintext refresh token** — the directory is created owner-only with its own `.gitignore`, but keep
`.dataverse/` git-ignored at the repo root too and prefer a service principal for unattended use.

---

## Privilege preflight

A valid token proves *identity*, not *customization rights*. Check the **effective privilege for the
specific operation** up front instead of failing on the first `create`.

**Do not preflight by listing role names.** Role-name listing misses privileges granted through
**team roles** or **custom roles**. Use `RetrieveUserSetOfPrivilegesByNames` bound to the
`systemuser` — it returns the privileges the user actually holds through roles and team membership,
in one call:

```bash
# 1. Who am I? (returns UserId)
dataverse api request --target dataverse --method GET \
  --path "/api/data/v9.2/WhoAmI" --environment <DATAVERSE_URL>

# 2. Check EFFECTIVE privileges for the operations about to run (includes team-inherited
#    privileges). Pass only the privileges the task needs. Single-quote --path so the JSON
#    array's quotes survive the shell.
dataverse api request --target dataverse --method GET \
  --path '/api/data/v9.2/systemusers(<UserId>)/Microsoft.Dynamics.CRM.RetrieveUserSetOfPrivilegesByNames(PrivilegeNames=@p)?@p=["prvCreateEntity","prvCreateAttribute"]' \
  --environment <DATAVERSE_URL>
```

A privilege is granted when it appears in the returned set. If it is absent, the operation will fail
on the first write — stop and surface a least-privilege fix.

**Privileges are per operation — `prvCreateEntity` covers tables only:**

| Operation | Privilege(s) to check |
|---|---|
| Create table | `prvCreateEntity` |
| Create column | `prvCreateAttribute` |
| Create form | `prvCreateSystemForm` |
| Create view | `prvCreateSavedQuery` |
| Register plug-in assembly | `prvCreatePluginAssembly` |
| Register plug-in step | `prvCreateSdkMessageProcessingStep` |

**Least privilege:** these customization privileges come from **System Customizer**, the minimal
built-in role for metadata and plug-in work. Do not grant System Administrator just to create tables;
reserve it for sessions that also need security or org-admin operations (role assignment, org
settings). To assign System Customizer (or a custom role that grants the privilege), use the
`dataverse-security` skill.

> Listing `systemuserroles_association` is for **confirming that a specific direct role assignment
> landed** (see `dataverse-security`), not for privilege preflight — it cannot see team- or
> custom-role-granted privileges.
