#!/usr/bin/env python3
"""
auth.py - Acquire Microsoft Dataverse access tokens and SDK clients.

Credential chain (silent tiers first; an interactive prompt only happens when
every silent tier is unavailable):
  1. Service principal (CLIENT_ID + CLIENT_SECRET in .env). Terminal: when
     configured it is used exclusively, so unattended runs fail fast instead
     of hanging on a prompt.
  2. Certificate (CLIENT_ID + CLIENT_CERTIFICATE_PATH in .env). Terminal, for
     the same reason.
  3. Dataverse CLI shared token cache. Silent; populated by
     `dataverse auth create`. This is the same MSAL v3 cache the
     `@microsoft/dataverse` MCP proxy reads. It is probed against both the
     tenant-specific and the `organizations` authority so an authority
     mismatch falls through instead of failing.
  4. Azure CLI (`az login`). Silent, scoped to TENANT_ID; skipped when az is
     missing or not logged in.
  5. Interactive (last resort), chosen per host:
       - workspace-cache device code when a workspace token cache is in use
         (DATAVERSE_TOKEN_CACHE_DIR, or auto-enabled on a non-CI host without
         a display),
       - system-browser sign-in on a desktop host,
       - device code otherwise.
     Each persists its state so later processes refresh silently.

All public-client tiers use the Dataverse CLI app registration
(0c412cc3-0dd6-449b-987f-05b053db9457), so the CLI, the MCP proxy and these
scripts authenticate as one OAuth client and share a single sign-in.

Shared cache location (tier 3):
  Windows: %LOCALAPPDATA%\\Microsoft\\DataverseCli\\tokencache_msalv3.dat (DPAPI)
  macOS:   Keychain service `dataverse_cli_service` / account `dataverse_cli_account`
  Linux:   libsecret schema `com.microsoft.dataversecli` on desktops, otherwise a
           plaintext `tokencache_msalv3.dat` under `$XDG_DATA_HOME/Microsoft/DataverseCli`

Public API:
  load_env()             Load .env (or the user-level config) into os.environ.
  get_credential()       Return the process-wide azure-core TokenCredential.
  get_token(scope=None)  Return a raw access token string.
  get_client(**kwargs)   Return a PowerPlatform DataverseClient.

.env keys (searched in the parent of scripts/, then the current directory):
  DATAVERSE_URL                  required, e.g. https://contoso.crm.dynamics.com
  TENANT_ID                      required
  CLIENT_ID                      optional, enables service principal auth
  CLIENT_SECRET                  optional, enables service principal auth
  CLIENT_CERTIFICATE_PATH        optional, enables certificate auth (.pfx or .pem)
  CLIENT_CERTIFICATE_PASSWORD    optional, decrypts a password-protected certificate
  CLIENT_SEND_CERTIFICATE_CHAIN  optional, set to 1 for SNI authentication
  DATAVERSE_TOKEN_CACHE_DIR      optional, persist the device-code token cache in a
                                 workspace directory (for containers where $HOME does
                                 not survive between processes); set to `off` to
                                 always use the OS cache

When .env is missing, DATAVERSE_URL and TENANT_ID are read from the user-level
config at ~/.atc-dataverse/config.json (%LOCALAPPDATA%\\.atc-dataverse\\config.json
on Windows), which is written after a successful --check, --ping or --bootstrap.

Usage:
    python scripts/auth.py                    # print a bearer token
    python scripts/auth.py --check            # real data-plane call via the SDK
    python scripts/auth.py --ping             # stdlib-only reachability check
    python scripts/auth.py --diagnose         # show credential tiers, never prompts
    python scripts/auth.py --bootstrap URL    # discover tenant, write .env

    # From a project script:
    import os, sys
    sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
    from auth import get_client
    client = get_client()

    # Raw Web API calls (operations the SDK does not cover):
    from auth import get_token
    token = get_token()
    headers = {"Authorization": f"Bearer {token}", "OData-MaxVersion": "4.0",
               "OData-Version": "4.0", "Accept": "application/json"}

Third-party dependencies are imported lazily, so --help, --bootstrap and
--diagnose run with the standard library alone.
"""

import os
import re
import sys
import time
from pathlib import Path

# Dataverse CLI app registration. Matches the client ID the Dataverse CLI and
# the @microsoft/dataverse MCP proxy use, so tokens minted by
# `dataverse auth create` can be reused silently here.
_DATAVERSE_CLI_CLIENT_ID = "0c412cc3-0dd6-449b-987f-05b053db9457"

# AuthenticationRecord written by the azure-identity interactive tiers on first
# sign-in, so later processes can refresh silently without a new prompt.
_AUTH_RECORD_PATH = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / ".IdentityService" / "dataverse_cli_auth_record.json"

# User-level config so a returning user can skip workspace setup.
_USER_CONFIG_DIR = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / ".atc-dataverse"
_USER_CONFIG_PATH = _USER_CONFIG_DIR / "config.json"


def _load_user_config():
    """Load DATAVERSE_URL and TENANT_ID from the user-level config when .env is absent."""
    if not _USER_CONFIG_PATH.exists():
        return
    try:
        import json
        cfg = json.loads(_USER_CONFIG_PATH.read_text(encoding="utf-8"))
        loaded = []
        for key in ("DATAVERSE_URL", "TENANT_ID"):
            val = cfg.get(key)
            if val and not os.environ.get(key):
                os.environ.setdefault(key, val)
                loaded.append(key)
        if loaded:
            print(
                f"NOTE: loaded {', '.join(loaded)} from {_USER_CONFIG_PATH} "
                f"(no .env found). Target: {cfg.get('DATAVERSE_URL', '?')}",
                flush=True,
            )
    except Exception:
        pass


def _save_user_config():
    """Persist URL and tenant to the user-level config for reuse across workspaces."""
    import json
    url = os.environ.get("DATAVERSE_URL")
    tenant = os.environ.get("TENANT_ID")
    if not url or not tenant:
        return
    try:
        _USER_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(_USER_CONFIG_DIR, 0o700)
        except Exception:
            pass
        _USER_CONFIG_PATH.write_text(
            json.dumps({"DATAVERSE_URL": url, "TENANT_ID": tenant}, indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass


def load_env():
    """Load key=value pairs from .env into os.environ (existing vars win).

    Searches two locations, first match wins:
      1. The project root (parent of the directory containing this script).
      2. The current working directory.
    So `cd scripts && python auth.py` behaves like `python scripts/auth.py`.

    Falls back to the user-level config (~/.atc-dataverse/config.json) when
    DATAVERSE_URL or TENANT_ID is still missing.
    """
    script_dir = Path(__file__).resolve().parent
    candidates = [script_dir.parent / ".env", Path(".env")]
    env_path = next((p for p in candidates if p.exists()), None)
    if env_path is not None:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())
    if not os.environ.get("DATAVERSE_URL") or not os.environ.get("TENANT_ID"):
        _load_user_config()


_credential = None


def _dataverse_scope():
    """Return the `{DATAVERSE_URL}/.default` OAuth scope, or None if unset."""
    url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    if not url:
        return None
    return f"{url}/.default"


def _shared_cache_persistences():
    """Return the platform-specific MSAL persistences for the Dataverse CLI cache,
    in the order to try them. Never raises; returns [] on any problem.

    On Linux this is libsecret first (desktop), then the plaintext MSAL v3 file,
    matching the Dataverse CLI's unprotected-file fallback.
    """
    persistences = []
    try:
        if sys.platform == "win32":
            from msal_extensions import FilePersistenceWithDataProtection
            cache_path = (
                Path(os.environ.get("LOCALAPPDATA", str(Path.home())))
                / "Microsoft" / "DataverseCli" / "tokencache_msalv3.dat"
            )
            if cache_path.exists():
                persistences.append(FilePersistenceWithDataProtection(str(cache_path)))
        elif sys.platform == "darwin":
            from msal_extensions import KeychainPersistence
            # msal-extensions requires a fallback file path, but it is unused on
            # macOS. Service and account names match the Dataverse CLI's Keychain
            # entries.
            fallback = str(Path.home() / ".dataverse_cli_msal_cache")
            persistences.append(
                KeychainPersistence(fallback, "dataverse_cli_service", "dataverse_cli_account")
            )
        else:
            fallback = str(Path.home() / ".dataverse_cli_msal_cache")
            try:
                from msal_extensions import LibsecretPersistence
                persistences.append(
                    LibsecretPersistence(
                        fallback,
                        schema_name="com.microsoft.dataversecli",
                        attributes={"Version": "1", "ProductGroup": "DataverseCli"},
                    )
                )
            except Exception:
                pass  # No libsecret backend on this host.
            from msal_extensions import FilePersistence
            xdg_data = os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
            plaintext_path = Path(xdg_data) / "Microsoft" / "DataverseCli" / "tokencache_msalv3.dat"
            if plaintext_path.exists():
                persistences.append(FilePersistence(str(plaintext_path)))
    except Exception:
        return []
    return persistences


def _build_shared_msal_cache():
    """Open the Dataverse CLI MSAL cache and probe it for a silent token.

    Returns `(msal.PublicClientApplication, accounts)` only when a silent token
    actually comes back. Both the tenant-specific and the `organizations`
    authority are probed, because `dataverse auth create` may have written the
    cache under a different authority than TENANT_ID. Returns None on any miss
    so the caller falls through to the next tier.
    """
    try:
        import msal
        from msal_extensions import PersistedTokenCache
    except ImportError:
        return None

    tenant_id = os.environ.get("TENANT_ID")
    if not tenant_id:
        return None

    scope = _dataverse_scope()
    authorities = [
        f"https://login.microsoftonline.com/{tenant_id}",
        "https://login.microsoftonline.com/organizations",
    ]
    for persistence in _shared_cache_persistences():
        for authority in authorities:
            try:
                app = msal.PublicClientApplication(
                    client_id=_DATAVERSE_CLI_CLIENT_ID,
                    authority=authority,
                    token_cache=PersistedTokenCache(persistence),
                )
                accounts = app.get_accounts()
                if not accounts:
                    continue
                if scope is None:
                    # No DATAVERSE_URL to probe with; trust account presence.
                    return app, accounts
                probe = app.acquire_token_silent([scope], account=accounts[0])
                if probe and "access_token" in probe:
                    return app, accounts
            except Exception:
                continue  # The shared-cache tier must never break auth.
    return None


class _MsalSharedCacheCredential:
    """azure-core TokenCredential adapter over an msal PublicClientApplication.

    Implements `get_token(*scopes, **kwargs)` returning an AccessToken, which
    is all DataverseClient and raw HTTP callers need.
    """

    def __init__(self, app, accounts):
        self._app = app
        self._accounts = accounts

    def get_token(self, *scopes, **kwargs):
        from azure.core.credentials import AccessToken
        from azure.identity import CredentialUnavailableError
        # With several cached accounts the first wins, which is deterministic and
        # matches the active account `dataverse auth select` would report.
        # A Conditional Access / CAE claims challenge is forwarded when present.
        result = self._app.acquire_token_silent(
            list(scopes), account=self._accounts[0],
            claims_challenge=kwargs.get("claims"),
        )
        if not result or "access_token" not in result:
            # A cached account can exist while silent acquisition fails (authority
            # mismatch, expired refresh token). Raise "unavailable" so the chain
            # moves on to the next tier instead of failing hard.
            raise CredentialUnavailableError(
                "Dataverse CLI cache present but silent token acquisition failed "
                "(often an authority mismatch or expired refresh token)."
            )
        expires_on = int(time.time()) + int(result.get("expires_in", 3600))
        return AccessToken(result["access_token"], expires_on)

    def close(self):  # pragma: no cover - parity with azure-identity credentials
        pass


# Workspace cache directory used when DATAVERSE_TOKEN_CACHE_DIR is unset on a
# non-CI host without a display (see _should_use_workspace_cache).
_DEFAULT_WORKSPACE_CACHE_DIRNAME = ".dataverse"

# DATAVERSE_TOKEN_CACHE_DIR values that opt out of the workspace cache and keep
# the OS default cache (no plaintext refresh token in the workspace).
_CACHE_DIR_OPT_OUT = frozenset({"off", "0", "false", "no", "none", "disable", "disabled"})


def _should_use_workspace_cache():
    """Decide (without I/O) whether the workspace token cache is used.

    Single source of truth for both _workspace_token_cache_path and
    _run_diagnose. Returns:
      "explicit"  DATAVERSE_TOKEN_CACHE_DIR is set to a usable path.
      "default"   unset on a non-CI host without a display; use <workspace>/.dataverse.
      None        keep the OS default cache (desktop, CI, or explicit opt-out).
    """
    cache_dir = os.environ.get("DATAVERSE_TOKEN_CACHE_DIR")
    if cache_dir is not None and cache_dir.strip().lower() in _CACHE_DIR_OPT_OUT:
        return None
    if cache_dir:
        return "explicit"
    # Desktop hosts keep their secure OS cache. CI never reaches an interactive
    # tier (a service principal is terminal earlier in the chain).
    if _host_has_browser() or _is_ci():
        return None
    return "default"


def _workspace_token_cache_path():
    """Return the MSAL v3 cache file that persists the device-code refresh token
    across Python processes, or None to keep the OS default cache.

    - DATAVERSE_TOKEN_CACHE_DIR set to a path: use it. A relative path is anchored
      to the project root, the same way load_env finds .env.
    - Opt-out value (off/false/0/no/none): None.
    - Unset on a non-CI host without a display (SSH session, container): default
      to `<workspace>/.dataverse`. The OS cache lives under $HOME, which some
      containers reset between processes, so without this every process would
      prompt for a new device code.
    - Unset on a desktop host: None (Windows DPAPI, macOS Keychain or the Linux
      desktop keyring).

    Security: outside Windows the file holds a PLAINTEXT refresh token. The
    directory is created owner-only (0700 on POSIX) and gets its own
    `.gitignore` (`*`) so the token is never committed. Set
    DATAVERSE_TOKEN_CACHE_DIR=off to always use the OS cache.
    """
    decision = _should_use_workspace_cache()
    if decision is None:
        return None
    cache_dir = (
        os.environ.get("DATAVERSE_TOKEN_CACHE_DIR")
        if decision == "explicit"
        else _DEFAULT_WORKSPACE_CACHE_DIRNAME
    )
    try:
        path = Path(cache_dir)
        if not path.is_absolute():
            # Anchor to the project root (<project>/scripts/auth.py), not the
            # current directory, so the location is stable wherever the process
            # is started from.
            path = Path(__file__).resolve().parent.parent / path
        path.mkdir(parents=True, exist_ok=True)
        # Keep the cache out of git even if the project .gitignore misses it.
        gitignore = path / ".gitignore"
        if not gitignore.exists():
            gitignore.write_text("*\n", encoding="utf-8")
        try:
            os.chmod(path, 0o700)  # Owner-only on POSIX; harmless on Windows.
        except Exception:
            pass
        return path / "tokencache_msalv3.dat"
    except Exception:
        return None


class _MsalDeviceCodeCredential:
    """TokenCredential over an msal app whose cache lives at an explicit path.

    Refreshes silently from the cache when possible and falls back to a
    device-code sign-in on a miss. Used with the workspace token cache so a
    refresh token survives across processes.
    """

    def __init__(self, app):
        self._app = app

    def get_token(self, *scopes, **kwargs):
        from azure.core.credentials import AccessToken
        scope_list = list(scopes)
        claims = kwargs.get("claims")  # Conditional Access / CAE challenge, if any.
        result = None
        accounts = self._app.get_accounts()
        if accounts:
            result = self._app.acquire_token_silent(
                scope_list, account=accounts[0], claims_challenge=claims,
            )
        if not result or "access_token" not in result:
            flow = self._app.initiate_device_flow(scopes=scope_list)
            if "user_code" not in flow:
                raise RuntimeError(
                    "Failed to start device-code flow: "
                    f"{flow.get('error_description', flow)}"
                )
            print(
                f"\nTo sign in, visit {flow['verification_uri']} and enter code: "
                f"{flow['user_code']}",
                flush=True,
            )
            expiry_min = max(1, int(flow.get("expires_in", 900)) // 60)
            print(
                f"(Waiting for you to complete the sign-in in your browser; "
                f"the code expires in ~{expiry_min} min...)\n",
                flush=True,
            )
            result = self._app.acquire_token_by_device_flow(
                flow, claims_challenge=claims,
            )  # Blocks until the user completes sign-in.
        if not result or "access_token" not in result:
            detail = result.get("error_description", result) if result else "no response"
            raise RuntimeError(f"Device-code authentication failed: {detail}")
        expires_on = int(time.time()) + int(result.get("expires_in", 3600))
        return AccessToken(result["access_token"], expires_on)

    def close(self):  # pragma: no cover
        pass


def _is_ci():
    """True on CI / build agents (GitHub Actions, Azure Pipelines), even on
    Windows or macOS. Only truthy values count, so CI=false is not CI.
    """
    def _flag(name):
        return os.environ.get(name, "").strip().lower() not in ("", "0", "false", "no")

    return _flag("CI") or _flag("GITHUB_ACTIONS") or _flag("TF_BUILD") or _flag("BUILD_BUILDID")


def _host_has_browser():
    """True if an interactive system browser is likely available.

    - CI / build agents: never (launching a browser without a user session fails).
    - Windows: a console or RDP session has one; a service or container has an
      empty or "Services" SESSIONNAME.
    - macOS: yes, unless connected over SSH.
    - Linux: only with a display server (DISPLAY or WAYLAND_DISPLAY).
    """
    if _is_ci():
        return False
    if sys.platform == "win32":
        session = os.environ.get("SESSIONNAME", "").strip().lower()
        return session not in ("", "services")
    if sys.platform == "darwin":
        if os.environ.get("SSH_CONNECTION") or os.environ.get("SSH_TTY"):
            return False
        return True
    return bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))


class _SilentChain:
    """Try each silent tier in order, skipping any that is unavailable or errors,
    so a convenience tier (for example az CLI logged into another tenant) never
    blocks the fall-through to the interactive tier. Raises
    CredentialUnavailableError only when every tier is exhausted.
    """

    def __init__(self, tiers):
        self._tiers = tiers  # list[(name, credential)]
        self.last_reasons = []  # Why each tier was skipped, reported before a prompt.

    def get_token(self, *scopes, **kwargs):
        from azure.identity import CredentialUnavailableError
        reasons = []
        for tier_name, cred in self._tiers:
            try:
                return cred.get_token(*scopes, **kwargs)
            except CredentialUnavailableError:
                reasons.append(f"{tier_name}: unavailable")
            except Exception as e:  # noqa: BLE001 - a silent tier must never break the chain
                reasons.append(f"{tier_name}: {type(e).__name__}")
        self.last_reasons = reasons
        raise CredentialUnavailableError(
            "no silent credential available (" + "; ".join(reasons) + ")"
        )

    def close(self):  # pragma: no cover
        pass


class _FallbackCredential:
    """Silent tiers first; if all are unavailable, build the host-appropriate
    interactive tier on demand. A prompt therefore only appears when no silent
    path works.
    """

    def __init__(self, silent, interactive_builder):
        self._silent = silent
        self._interactive_builder = interactive_builder
        self._interactive = None

    def get_token(self, *scopes, **kwargs):
        from azure.identity import CredentialUnavailableError
        if self._silent is not None:
            try:
                return self._silent.get_token(*scopes, **kwargs)
            except CredentialUnavailableError as e:
                # Explain why every silent tier was skipped, so the prompt that
                # follows is not a surprise.
                reasons = getattr(self._silent, "last_reasons", None)
                detail = "; ".join(reasons) if reasons else str(e)
                print(
                    f"No silent credential available ({detail}); "
                    f"falling back to interactive sign-in.",
                    flush=True,
                )
        if self._interactive is None:
            self._interactive = self._interactive_builder()
        return self._interactive.get_token(*scopes, **kwargs)

    def close(self):  # pragma: no cover
        pass


def _build_workspace_device_code_credential(cache_path, tenant_id):
    """Build the workspace-cache device-code credential, or None if msal is
    not installed. The MSAL cache (including the refresh token) lives at
    cache_path, so the user signs in once rather than once per process.
    """
    try:
        import msal
        from msal_extensions import PersistedTokenCache
        if sys.platform == "win32":
            from msal_extensions import FilePersistenceWithDataProtection
            persistence = FilePersistenceWithDataProtection(str(cache_path))
        else:
            from msal_extensions import FilePersistence
            persistence = FilePersistence(str(cache_path))
        app = msal.PublicClientApplication(
            client_id=_DATAVERSE_CLI_CLIENT_ID,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            token_cache=PersistedTokenCache(persistence),
        )
        return _MsalDeviceCodeCredential(app)
    except ImportError:
        return None


def _build_interactive_tier(tenant_id):
    """Build `(credential, kind)` for the single interactive tier this host uses.

    kind is `workspace-device-code`, `interactive-browser` or `device-code`:
      - workspace token cache in use -> workspace-cache device code.
      - desktop host with a browser  -> InteractiveBrowserCredential.
      - anything else                -> DeviceCodeCredential.
    The azure-identity tiers persist an AuthenticationRecord on first sign-in so
    later processes refresh silently. Called only after every silent tier is
    exhausted, so the first-sign-in prompt here is never premature.
    """
    # On CI no interactive tier can succeed: there is no browser, and a device
    # code would block for ~15 minutes in a log nobody reads. A configured
    # service principal returns earlier, so reaching this point on CI means none
    # is set. Fail fast with an actionable message.
    if _is_ci():
        raise RuntimeError(
            "CI host detected with no working silent credential (service "
            "principal, Dataverse CLI cache, or az login). Interactive sign-in "
            "cannot succeed here. Set CLIENT_ID + CLIENT_SECRET for a service "
            "principal, or run `python scripts/auth.py --diagnose` to see which "
            "tier failed."
        )
    workspace_cache = _workspace_token_cache_path()
    if workspace_cache is not None:
        cred = _build_workspace_device_code_credential(workspace_cache, tenant_id)
        if cred is not None:
            return cred, "workspace-device-code"

    from azure.identity import (
        AuthenticationRecord,
        DeviceCodeCredential,
        InteractiveBrowserCredential,
        TokenCachePersistenceOptions,
    )

    cache_opts = TokenCachePersistenceOptions(
        name="dataverse_cli", allow_unencrypted_storage=True
    )
    record = None
    if _AUTH_RECORD_PATH.exists():
        try:
            record = AuthenticationRecord.deserialize(
                _AUTH_RECORD_PATH.read_text(encoding="utf-8")
            )
        except Exception:
            record = None  # Corrupt or stale record; sign in again.

    if _host_has_browser():
        # System browser rather than the MSAL broker: works where Conditional
        # Access blocks device code, and avoids broker issues on macOS.
        cred = InteractiveBrowserCredential(
            tenant_id=tenant_id,
            client_id=_DATAVERSE_CLI_CLIENT_ID,
            cache_persistence_options=cache_opts,
            authentication_record=record,
        )
        kind = "interactive-browser"
    else:
        def _prompt_callback(verification_uri, user_code, _expires_on):
            print(f"\nTo sign in, visit {verification_uri} and enter code: {user_code}", flush=True)
            print("(Waiting for you to complete the sign-in in your browser...)\n", flush=True)

        cred = DeviceCodeCredential(
            tenant_id=tenant_id,
            client_id=_DATAVERSE_CLI_CLIENT_ID,
            prompt_callback=_prompt_callback,
            cache_persistence_options=cache_opts,
            authentication_record=record,
        )
        kind = "device-code"

    # First sign-in: run the interactive flow once and persist the
    # AuthenticationRecord so later processes refresh silently.
    if record is None:
        try:
            scope = _dataverse_scope()
            new_record = cred.authenticate(scopes=[scope] if scope else None)
            _AUTH_RECORD_PATH.parent.mkdir(parents=True, exist_ok=True)
            _AUTH_RECORD_PATH.write_text(new_record.serialize(), encoding="utf-8")
        except KeyboardInterrupt:
            raise  # The user cancelled; do not start a second prompt.
        except Exception as e:  # noqa: BLE001 - non-fatal, get_token still works
            print(
                f"NOTE: first interactive sign-in did not persist a record "
                f"({type(e).__name__}); a later token request may prompt again.",
                flush=True,
            )

    return cred, kind


def get_credential():
    """Return the process-wide TokenCredential, creating it on first call.

    Resolution order: service principal or certificate (terminal), then the
    silent chain (Dataverse CLI cache, then az CLI), then a single host-specific
    interactive tier used only when every silent tier is unavailable.
    """
    global _credential
    if _credential is not None:
        return _credential

    load_env()

    tenant_id = os.environ.get("TENANT_ID")
    dataverse_url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    client_id = os.environ.get("CLIENT_ID")
    client_secret = os.environ.get("CLIENT_SECRET")
    certificate_path = os.environ.get("CLIENT_CERTIFICATE_PATH")
    certificate_password = os.environ.get("CLIENT_CERTIFICATE_PASSWORD")

    if not tenant_id or not dataverse_url:
        missing = [k for k, v in [("TENANT_ID", tenant_id), ("DATAVERSE_URL", dataverse_url)] if not v]
        print(f"ERROR: .env is missing required values: {', '.join(missing)}", flush=True)
        print("  Run `python scripts/auth.py --bootstrap <url>` or the dataverse-connect skill to create it.", flush=True)
        sys.exit(1)

    try:
        from azure.identity import (
            AzureCliCredential,
            CertificateCredential,
            ClientSecretCredential,
        )
    except ImportError:
        print("ERROR: azure-identity not installed. Run: pip install --upgrade azure-identity", flush=True)
        sys.exit(1)

    # Tier 1: service principal. Terminal, so CI fails fast instead of hanging
    # on an interactive prompt.
    if client_id and client_secret:
        _credential = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret,
        )
        return _credential

    # Tier 2: certificate-based service principal. Terminal for the same reason.
    if client_id and certificate_path:
        path = Path(certificate_path)
        if not path.exists():
            print(
                f"ERROR: CLIENT_CERTIFICATE_PATH does not exist: {certificate_path}",
                flush=True,
            )
            sys.exit(1)
        if not path.is_file() or not os.access(path, os.R_OK):
            print(
                f"ERROR: CLIENT_CERTIFICATE_PATH is not a readable file: {certificate_path}",
                flush=True,
            )
            sys.exit(1)

        try:
            _credential = CertificateCredential(
                tenant_id=tenant_id,
                client_id=client_id,
                certificate_path=str(path),
                password=certificate_password,
                send_certificate_chain=(
                    os.environ.get("CLIENT_SEND_CERTIFICATE_CHAIN") == "1"
                ),
            )
        except ValueError as exc:
            print(
                "ERROR: Could not load CLIENT_CERTIFICATE_PATH. Verify the "
                "certificate format and CLIENT_CERTIFICATE_PASSWORD.",
                flush=True,
            )
            print(f"  {exc}", flush=True)
            sys.exit(1)
        return _credential

    if client_id and not client_secret and not certificate_path:
        print(
            "WARNING: CLIENT_ID is set without CLIENT_SECRET or "
            "CLIENT_CERTIFICATE_PATH.",
            flush=True,
        )
        print("  Falling back to the Dataverse CLI cache / interactive sign-in.", flush=True)

    if not client_id and (client_secret or certificate_path):
        configured = "CLIENT_SECRET" if client_secret else "CLIENT_CERTIFICATE_PATH"
        print(f"WARNING: {configured} is set without CLIENT_ID.", flush=True)
        print("  Falling back to the Dataverse CLI cache / interactive sign-in.", flush=True)

    silent_tiers = []

    # Tier 3: Dataverse CLI shared MSAL cache (populated by `dataverse auth
    # create`). Only added when the build-time probe actually yields a token.
    shared = _build_shared_msal_cache()
    if shared is not None:
        app, accounts = shared
        silent_tiers.append(("shared-cache", _MsalSharedCacheCredential(app, accounts)))

    # Tier 4: Azure CLI. AzureCliCredential raises CredentialUnavailableError
    # when az is missing or not logged in, so it costs nothing when unused.
    silent_tiers.append(("azure-cli", AzureCliCredential(tenant_id=tenant_id)))

    silent = _SilentChain(silent_tiers)

    def _interactive_builder():
        cred, _kind = _build_interactive_tier(tenant_id)
        return cred

    # Tier 5: interactive, built on demand only.
    _credential = _FallbackCredential(silent, _interactive_builder)
    return _credential


def get_token(scope=None):
    """Acquire a raw access token string for the Dataverse environment.

    Uses the credential chain from get_credential(). Exits with status 1 and an
    actionable message when no token can be acquired.

    :param scope: OAuth2 scope. Defaults to "{DATAVERSE_URL}/.default".
    :returns: Access token string for a Bearer Authorization header.
    """
    load_env()
    dataverse_url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    if not scope:
        scope = f"{dataverse_url}/.default"

    credential = get_credential()

    try:
        token = credential.get_token(scope)
    except Exception as e:
        print(f"ERROR: Failed to acquire access token: {e}", flush=True)
        print("  Check your network connection, credentials, and .env configuration.", flush=True)
        print("  Tip: run `python scripts/auth.py --diagnose` to see which credential", flush=True)
        print("  tiers are available, or `dataverse auth create --environment "
              f"{dataverse_url}` to populate the Dataverse CLI token cache.", flush=True)
        sys.exit(1)

    return token.token


def get_client(**kwargs):
    """Return a PowerPlatform DataverseClient for DATAVERSE_URL.

    :param kwargs: Extra keyword arguments forwarded to DataverseClient.
    :returns: Configured DataverseClient instance.
    """
    load_env()
    from PowerPlatform.Dataverse.client import DataverseClient
    return DataverseClient(
        base_url=os.environ["DATAVERSE_URL"],
        credential=get_credential(),
        **kwargs,
    )


def _run_diagnose():
    """Print which credential tiers are available, without ever prompting, and
    which tier would serve the next call.
    """
    load_env()
    tenant_id = os.environ.get("TENANT_ID")
    url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    scope = _dataverse_scope()
    client_id = os.environ.get("CLIENT_ID")
    client_secret = os.environ.get("CLIENT_SECRET")
    certificate_path = os.environ.get("CLIENT_CERTIFICATE_PATH")
    workspace_cache = _should_use_workspace_cache()

    print(f"Dataverse auth diagnosis for {url or '<DATAVERSE_URL unset>'}")
    print(
        f"  tenant={tenant_id or '<TENANT_ID unset>'}  host={sys.platform}  "
        f"browser={_host_has_browser()}  ci={_is_ci()}  "
        f"workspace-cache={workspace_cache or 'off'}"
    )
    print("")

    rows = []  # (tier, status, detail)

    if client_id and (client_secret or certificate_path):
        kind = "secret" if client_secret else "certificate"
        rows.append(("service-principal", "CONFIGURED", f"{kind}; terminal, used exclusively with no interactive fallback"))
    else:
        rows.append(("service-principal", "not set", "set CLIENT_ID + CLIENT_SECRET (or CLIENT_CERTIFICATE_PATH) for unattended auth"))

    try:
        shared = _build_shared_msal_cache()
        if shared is not None:
            rows.append(("shared-cache", "AVAILABLE", "`dataverse auth create` cache yields a silent token"))
        else:
            rows.append(("shared-cache", "unavailable", "no cache, no account or silent miss; run `dataverse auth create`"))
    except Exception as e:  # noqa: BLE001
        rows.append(("shared-cache", "error", type(e).__name__))

    try:
        from azure.identity import AzureCliCredential, CredentialUnavailableError
        try:
            cred = AzureCliCredential(tenant_id=tenant_id)
            if scope:
                cred.get_token(scope)
                rows.append(("azure-cli", "AVAILABLE", "`az login` yields a silent token for this tenant"))
            else:
                rows.append(("azure-cli", "unknown", "DATAVERSE_URL unset; cannot probe"))
        except CredentialUnavailableError:
            rows.append(("azure-cli", "unavailable", "az not installed or not logged in; run `az login`"))
        except Exception as e:  # noqa: BLE001
            rows.append(("azure-cli", "skipped", type(e).__name__))
    except ImportError:
        rows.append(("azure-cli", "n/a", "azure-identity not installed"))

    if _is_ci():
        kind = "none (CI)"
    elif workspace_cache is not None:
        kind = "workspace-device-code"
    elif _host_has_browser():
        kind = "interactive-browser"
    else:
        kind = "device-code"
    rows.append(("interactive", kind, "used only if every silent tier above is unavailable"))

    width = max(len(t) for t, _, _ in rows)
    for tier, status, detail in rows:
        print(f"  {tier.ljust(width)}  {status.ljust(12)}  {detail}")

    # rows[:3] are service principal, shared cache and az CLI.
    silent_ok = any(s in ("CONFIGURED", "AVAILABLE") for _, s, _ in rows[:3])
    print("")
    if silent_ok:
        print("Result: a silent tier is available; normal calls will not prompt.")
    else:
        print(f"Result: no silent tier; the next call uses the '{kind}' interactive tier.")


def _prepare_workspace(url, tenant_id, overwrite_env):
    """Write .env, copy this file to scripts/auth.py and update .gitignore in
    the current directory. Returns the .env path.
    """
    import shutil

    workspace = Path.cwd()
    env_path = workspace / ".env"
    if overwrite_env or not env_path.exists():
        env_path.write_text(f"DATAVERSE_URL={url}\nTENANT_ID={tenant_id}\n", encoding="utf-8")

    dest = workspace / "scripts" / "auth.py"
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(Path(__file__).resolve(), dest)

    gitignore = workspace / ".gitignore"
    existing = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    missing = [e for e in (".env", ".dataverse/") if e not in existing]
    if missing:
        with open(gitignore, "a", encoding="utf-8") as f:
            f.write("\n" + "\n".join(missing) + "\n")

    return env_path


def _run_ping():
    """Lightweight reachability check: one token and one WhoAmI call over
    urllib, without importing the Dataverse SDK.

    On success also prepares the workspace (.env, scripts/auth.py, .gitignore)
    if missing and saves the user-level config.
    """
    from urllib.error import HTTPError, URLError
    from urllib.request import Request, urlopen

    load_env()
    url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    tenant_id = os.environ.get("TENANT_ID")

    if not url or not tenant_id:
        print("PING FAILED: no DATAVERSE_URL or TENANT_ID (no .env, no user-level config).", flush=True)
        sys.exit(1)

    try:
        token = get_token()
    except SystemExit:
        print("PING FAILED: could not acquire a token (is azure-identity installed?).", flush=True)
        sys.exit(1)

    try:
        req = Request(f"{url}/api/data/v9.2/WhoAmI")
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Accept", "application/json")
        resp = urlopen(req, timeout=20)
        resp.read()
    except HTTPError as e:
        print(f"PING FAILED: {url} returned HTTP {e.code}.", flush=True)
        sys.exit(2)
    except (URLError, OSError) as e:
        reason = getattr(e, "reason", e)
        print(f"PING FAILED: {url} unreachable ({reason}).", flush=True)
        sys.exit(2)

    _prepare_workspace(url, tenant_id, overwrite_env=False)
    _save_user_config()
    print(f"REACHABLE: {url}", flush=True)


def _run_bootstrap(url):
    """One-command workspace setup from a Dataverse org URL.

    Discovers the tenant ID from the WWW-Authenticate header of an
    unauthenticated request, writes .env, copies auth.py to scripts/ and saves
    the user-level config. Standard library only, so it works before pip install.
    """
    from urllib.error import HTTPError, URLError
    from urllib.request import Request, urlopen

    url = url.rstrip("/")
    if not url.startswith("https://"):
        print(f"ERROR: URL must start with https:// (got: {url})", flush=True)
        sys.exit(1)

    print(f"Probing {url} for tenant ID...", flush=True)
    www_auth = ""
    try:
        req = Request(f"{url}/api/data/v9.2/", method="GET")
        req.add_header("Accept", "application/json")
        urlopen(req, timeout=20)
        print("ERROR: Unexpected 200 from unauthenticated probe.", flush=True)
        sys.exit(1)
    except HTTPError as e:
        www_auth = e.headers.get("WWW-Authenticate", "")
    except URLError as e:
        print(f"ERROR: Cannot reach {url}: {e.reason}", flush=True)
        sys.exit(1)

    match = re.search(r"login\.microsoftonline\.com/([^/,\s]+)", www_auth)
    if not match:
        print(f"ERROR: Could not discover tenant from {url}", flush=True)
        print(f"  WWW-Authenticate: {www_auth[:200]}", flush=True)
        sys.exit(1)
    tenant_id = match.group(1)

    env_path = _prepare_workspace(url, tenant_id, overwrite_env=True)

    os.environ["DATAVERSE_URL"] = url
    os.environ["TENANT_ID"] = tenant_id
    _save_user_config()

    print(f"BOOTSTRAPPED: {url} (tenant {tenant_id})", flush=True)
    print(f"  .env: {env_path}", flush=True)
    print(f"  user config: {_USER_CONFIG_PATH}", flush=True)
    print("  Next: install the Python dependencies (if needed), then: python scripts/auth.py --check", flush=True)


def _run_check():
    """Make a real data-plane call through the SDK and report reachability.

    A token alone does not prove a connection: sign-in traffic goes to
    login.microsoftonline.com while the org's data plane (*.dynamics.com) may
    be blocked by a proxy or network egress allowlist. The wait is bounded so a
    blocked domain fails fast instead of hanging.
    """
    import socket

    socket.setdefaulttimeout(30)
    load_env()
    url = os.environ.get("DATAVERSE_URL", "").rstrip("/")
    try:
        client = get_client()
        tables = client.tables.list(select=["LogicalName"])
        print(f"REACHABLE: {url} -- {len(tables)} non-private tables")
        _save_user_config()
        sys.exit(0)
    except Exception as e:
        print(f"NOT REACHABLE: {url} -- {type(e).__name__}: {e}", flush=True)
        print(
            "If this is a connection or timeout error, the org domain is blocked by "
            "a proxy or network egress allowlist: auth works, the data plane does not. "
            "Do NOT report a table count or query result; nothing was retrieved.",
            flush=True,
        )
        sys.exit(2)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Acquire a Dataverse access token, or verify the environment is reachable. "
        "With no flags, prints a bearer token."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Make a real data-plane call through the SDK and report reachability instead of "
        "printing a token. Exit 0 = reachable, 2 = not reachable.",
    )
    parser.add_argument(
        "--ping",
        action="store_true",
        help="Lightweight reachability check without the SDK: acquire a token and call WhoAmI. "
        "Exit 0 = reachable, 1 = no config or no token, 2 = token OK but org unreachable. "
        "Also writes .env and copies auth.py to scripts/ if missing.",
    )
    parser.add_argument(
        "--diagnose",
        action="store_true",
        help="Show which credential tiers (service principal, Dataverse CLI cache, az CLI, "
        "interactive) are available, without prompting.",
    )
    parser.add_argument(
        "--bootstrap", metavar="URL",
        help="One-shot setup: discover the tenant from URL, write .env, copy auth.py to "
        "scripts/ and save the user-level config. Does not authenticate; run --check next.",
    )
    args = parser.parse_args()

    if args.diagnose:
        _run_diagnose()
        sys.exit(0)

    if args.bootstrap:
        _run_bootstrap(args.bootstrap)
        sys.exit(0)

    if args.ping:
        _run_ping()
        sys.exit(0)

    if args.check:
        _run_check()

    print(get_token())
