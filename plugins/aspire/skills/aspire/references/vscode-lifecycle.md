# VS Code Lifecycle Tools — `aspire_apphost_start` / `aspire_apphost_stop`

The Aspire VS Code extension can expose AppHost lifecycle tools to the agent host (for example
GitHub Copilot in VS Code). This page applies **only when those tools are present** in your tool list.
They come from the editor, not the Aspire CLI, so they can't be verified with `aspire --help` —
treat tool names and result values as reported by the host. In terminal-only hosts (Claude Code CLI,
Copilot CLI) use the CLI workflow in [SKILL.md](../SKILL.md).

---

## Precedence

1. If `aspire_apphost_start` / `aspire_apphost_stop` are exposed, use them **before** the CLI for
   starting and stopping AppHosts. They keep the session editor-owned (debugging, dashboard, status UI).
2. If they are listed as **deferred** tools, load them first — an unloaded deferred tool is not an
   unavailable tool.
3. Start in **`run`** mode unless the user asks to debug / attach a debugger. A `run`-mode session is
   still editor-owned, so the stop tool can stop it.
4. Readiness, inspection, and resource operations still use the CLI: `aspire wait`, `aspire describe`,
   `aspire logs`, `aspire otel`, `aspire resource <r> <command>`.

## Exceptions — use the CLI

- **Git worktrees / isolation:** the start tool can't request isolation. Use
  `aspire start --non-interactive --isolated --apphost <filesystem-path>`.
- **Allowed fallbacks** from the stop-result table below.

## AppHost paths

- One exact target per call. With several AppHosts and no clear choice, ask once and take no action.
- In multi-root workspaces the tool's `appHostPath` can be a **workspace selector** such as
  `repo-a~1/MyApp.AppHost/MyApp.AppHost.csproj`. `--apphost` doesn't understand selectors — resolve it
  to a real filesystem path before any CLI fallback. A plain workspace-relative path can be reused as is.

## Stop results

Rows are mutually exclusive — never offer a command from another row as a workaround.

| Tool result | Action | CLI stop allowed? |
|---|---|---|
| `stopped`, `notRunning` | Report it; no further stop action. | No |
| `alreadyStopping` (controller `editor`) | Report that the editor stop is in progress. | No |
| `alreadyStarting` (controller `editor`) | Retry the stop tool once; if it repeats, report that startup is still in progress. | No |
| `notEditorOwned` (controller `external`, e.g. started from a terminal) | If the user asked to stop that exact AppHost: `aspire stop --non-interactive --apphost <filesystem-path>`. | Yes |
| `failed` (controller `unknown`) | Retry the tool once; if the same result repeats, use the exact-target CLI stop above. | Only after the retry |
| `ambiguousSession` | Stop nothing; have the user disambiguate in the editor. **Terminal refusal** — don't run, offer, or ask about a CLI fallback, even if the user confirms. | Never |
| Any other refusal/failure | Resolve or report it; don't switch mechanisms. | No |

Act only on the current result and re-evaluate only after a new tool result.

The general stop rules still apply: stop only when the user asked for cleanup, locks/ports need
freeing, or you started an instance the user didn't ask to keep; `--force` / `--volumes` need explicit
approval.

## If the agent started the AppHost with `dotnet run`

Stop that foreground run cleanly (Ctrl+C / terminate the process it owns), then restart through the
lifecycle tool or `aspire start`. Don't leave it running alongside a new session.
