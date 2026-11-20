# Terminals — Authoring and Automating Aspire Terminals

Resource terminals (`WithTerminal`), database/cache REPLs (`WithRepl`), AppHost-owned terminals
(`TerminalService`), terminal prompts, and the `aspire terminal` CLI with VHS-style tapes. This covers
the rules of Microsoft's `aspire-terminals` skill. **Read this page before you answer any terminal
question**, even a read-only one; don't rely on memory of upstream VHS behavior.

Not for: generic shell commands, resource wiring ([Wiring](wiring.md)), lifecycle, logs, or Interaction
Service prompts that don't involve a terminal.

---

## 1. Check capabilities first

Read the AppHost's real package versions — don't upgrade packages just to make an example compile.

| Version | What exists |
|---|---|
| 13.5 | `WithTerminal()` / `withTerminal()` (C# experimental `ASPIRETERMINAL001`); the `aspire terminal` CLI needs `aspire config set features.terminalCommandsEnabled true --non-interactive` |
| 13.6 | + `TerminalService` (AppHost-owned terminals), terminal prompts, headless terminals, tapes (`aspire terminal tape play`), six `WithRepl()` REPLs; CLI needs no flag; types in `Aspire.Hosting.ApplicationModel` |
| 17.0 | `WithTerminal`/`TerminalOptions` no longer need `ASPIRETERMINAL001` (`TerminalService` and automation APIs still do); `TerminalOptions.ShowTerminalHost` removed (terminal hosts always hidden); TS `withTerminal` takes a columns/rows callback; `attach`/`tape play` resolve exact instance IDs (`--replica`/`-r` hidden but works); dedicated dashboard Terminals page; disconnects keep the last screen |

TypeScript exposes only `withTerminal()` and `withRepl()` — `TerminalService`, prompts, and automation are
C#-only. Check `aspire --version` and `aspire terminal --help` for the CLI side.

## 2. Pick the model

| Need | Use | Who owns the process |
|---|---|---|
| The resource's own process should be interactive (a REPL, a TUI app) | `WithTerminal()` on the resource | The resource (lives and dies with it) |
| A database/cache client shell | `WithRepl()` on PostgreSQL, MySQL, MongoDB, SQL Server, Redis, Valkey | The dashboard dock tab |
| An auxiliary shell the AppHost opens (e.g. from a resource command) that outlives its command | `TerminalService` with placement **Dock** | The AppHost |
| A focused setup/auth flow in a dialog | `TerminalService` with placement **Dialog** + `PromptTerminalAsync` | The caller |
| Scripted, invisible terminal I/O | `TerminalService` with placement **None** (headless) | The caller |

## 3. Non-negotiable rules

- Terminal types live in `Aspire.Hosting.ApplicationModel` (13.6+). Resolve `TerminalService` from
  services (`context.Services` / DI).
- **Dock terminals:** a command that opens one calls `Start()` and `Show()` and returns success — no
  `await using` (the dock owns it after the command returns). **Dialog/None:** use `await using`.
- `Start()` doesn't block. Observe the cancellation token on every wait; there's no public exit code or
  `WaitForExitAsync`.
- Check `IInteractionService.IsAvailable` before launching a prompt-owned process (it's `false` during
  `BeforeStartEvent` in 17.0). `PromptTerminalAsync` needs the exact registered Dialog terminal instance.
  Placement `ResourceView` is rejected.
- With a `Work` delegate, success closes the dialog and cancellation joins `Work`; without `Work`, the process
  exiting doesn't close the prompt. Prompt completion doesn't dispose the terminal.
- When asserting output, wait for a **fresh** marker you just caused — not text that may already be on screen.
  Don't retry non-idempotent input.
- Screens and tapes can contain secrets — treat them as sensitive. `Hide` in a tape is not redaction.
  `--viewer` is not read-only authorization.
- Guard AppHost terminal commands with `builder.ExecutionContext.IsRunMode`. Pass arguments as lists, never
  shell-concatenated strings.

## 4. Resource terminals and REPLs

```csharp
builder.AddContainer("tool", "my/tui-image")
    .WithTerminal(options => { options.Columns = 132; options.Rows = 50; });   // 13.6 default 132×50
```

```typescript
await builder.addContainer('tool', 'my/tui-image').withTerminal();   // 13.x: no options
// 17.0: withTerminal also accepts a callback that sets columns and rows — confirm the generated
// signature in .aspire/modules/aspire.mts (or `aspire docs api search withTerminal --language typescript`).
```

- Each replica gets its own terminal; detaching doesn't stop the workload. A PTY-executed resource can't
  also take the IDE debugger path.
- `TerminalOptions` has `Columns` and `Rows` only (no `Shell` since 13.5, no `ShowTerminalHost` since 17.0).
- REPLs: `psql` (PostgreSQL), `mysql`, `mongosh`, `sqlcmd` (SQL Server — 17.0 launches
  `/opt/mssql-tools18/bin/sqlcmd`; older images need
  `WithRepl(o => o.Command = SqlServerReplCommand.Version17)`), `redis-cli`, `valkey-cli`. `WithRepl()` opens an
  authenticated client in the dock (credentials via env vars, never args). Its command is disabled until the
  resource is Running; it's run-mode only and opt-in — enable it only for trusted dashboard users. Quit the
  client before closing the tab.

## 5. AppHost-owned terminals (`TerminalService`, C#, experimental `ASPIRETERMINAL001`)

`TerminalLaunchOptions`: `Title` and `Executable` are required; `Arguments` is a list;
`EnvironmentVariables` overrides; `WorkingDirectory` defaults to the AppHost directory; `Columns`/`Rows`
default 80×24; placement defaults to Dock (`Dialog` and `None` are valid; `ResourceView` isn't).

Dock recipe (shape only — confirm member names with `aspire docs api search TerminalService --language csharp`
before writing it, these APIs are experimental and still moving):

```csharp
#pragma warning disable ASPIRETERMINAL001
builder.AddContainer("db-tools", "my/tools").WithCommand("open-shell", "Open shell", async context =>
{
    var terminals = context.Services.GetRequiredService<TerminalService>();
    var terminal = terminals.CreateTerminal(new TerminalLaunchOptions
    {
        Title = "Tools shell",
        Executable = "bash",
        Arguments = ["-l"],
    });
    terminal.Start();
    terminal.Show();
    return CommandResults.Success();        // dock owns it now — no await using
});
#pragma warning restore ASPIRETERMINAL001
```

Automation surface: `Start()`, `Show()`, `SendTextAsync(text)` (no implicit Enter), `SendKeyAsync(key)`
(`AspireTerminalKey.Enter`, `AspireTerminalKey.Ctrl('c')`, …), `WaitForTextAsync(text)` (literal, not regex;
default timeout 30 s), `GetScreenText()`, `DisposeAsync()` (the owner stops the process; a resource
automation peer just disconnects). `TryGetTerminal(id, out terminal)` looks one up — don't synthesize IDs;
there's no public resource/replica lookup.

Automated dialog prompt: check `IsAvailable`, then `PromptTerminalAsync` with `TerminalInteractionOptions`
(its `PrimaryButtonText` labels the *cancel* button) and a `Work` delegate that does
`WaitForTextAsync` → `SendTextAsync` → `SendKeyAsync(AspireTerminalKey.Enter)` with timeouts and the
cancellation token.

## 6. CLI

```bash
aspire terminal ps --format Json --verbose --apphost <path> --non-interactive
#   owner-discriminated array: resource terminals and apphost terminals
aspire terminal attach <resource> --apphost <path>
#   for humans — Ctrl+B D detaches, Ctrl+B T takes control
aspire terminal tape play <resource> --tape-file <path.tape> --apphost <path> --timeout 60 --non-interactive
#   default timeout 120 s; stdout is the final screen — check the exit status
```

Discovery is owner-aware; `attach` and `tape play` target resource names, not arbitrary AppHost terminal IDs.
Run `aspire describe` and `aspire wait <resource>` before sending input. In 17.0 they resolve an exact
resource instance ID; the hidden `--replica`/`-r` still selects a replica index.

## 7. Tapes (supported VHS subset)

Supported: comments; `Type "text"` (no implicit Enter); `Set TypingSpeed`, `Type@50ms "…"`; named keys
(`Enter`, `Space`, `Tab`, `Escape`, `Backspace`, `Delete`, `Insert`, arrows, `PageUp`, `PageDown`) with
repeat counts; chords (`Ctrl+a`, `Shift+Tab`, `Alt+x`); `Set WaitPattern`, `Wait`, `Wait+Line`, `Wait+Screen`,
`Set WaitTimeout`; `Sleep`; `Source` (other `.tape` files, root-relative, no cycles); one `Output` to `.txt`
or `.ascii` (never overwritten); `Hide` / `Show`. Simple regex only. Player defaults: 50 ms typing, 15 s
waits, wait pattern `>$`.

Not supported (fails preflight): GIF/MP4/WebM/PNG/`.cast` output, `Copy`, `Paste`, `Require`, `Env`,
`Set Shell`, dimensions, fonts, themes, `ScrollUp`/`ScrollDown`.

```text
# verify-shell.tape
Type "echo READY-$RANDOM"
Enter
Wait+Line /READY-\d+/
Output out/verify.txt
```
