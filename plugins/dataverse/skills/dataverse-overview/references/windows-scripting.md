# Windows Scripting Rules

Apply these when running on Windows. Claude Code defaults to Git Bash there; GitHub Copilot may use PowerShell — the same rules apply, adapting path and quoting syntax.

| Rule | Why | Do this |
| --- | --- | --- |
| **ASCII only in `.py` files** | Curly quotes, em dashes, and other non-ASCII characters cause `SyntaxError` | Use straight quotes and plain hyphens |
| **No multiline `python -c`** | Quoting differs between Git Bash, CMD, and PowerShell and breaks multiline one-liners | Write a `.py` file and run it |
| **PAC CLI may need a PowerShell wrapper** | `pac` can hang or fail under Git Bash | `powershell -Command "& pac.cmd <args>"` (see `dataverse-connect`) |
| **Generate GUIDs inside Python** | Shell backtick substitution is unreliable across shells | `str(uuid.uuid4())` inside the `.py` file |
| **Background output may be empty** | Background task runners on Windows can silently capture nothing | Use `python -u` and `print(..., flush=True)` in long-running scripts |

For foreground runs that need a log:

```bash
python -u scripts/import_data.py 2>&1 | tee ./out.txt
```

Never assume a background task succeeded just because it appeared to finish — check its output or verify the result with a query.
