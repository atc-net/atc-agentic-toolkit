---
name: fix-trailing-newlines
description: This skill should be used when the user wants to fix SA1518 StyleCop violations by removing trailing newlines from files. It targets projects where .editorconfig has insert_final_newline = false, ensuring files do not end with trailing newline characters.
---

# Fix Trailing Newlines (SA1518)

Remove trailing newline characters from the end of source files to fix SA1518 StyleCop violations.

## When to Use This Skill

Trigger this skill when the user:

- Mentions SA1518 violations or trailing newline issues
- Wants to fix "file may not end with a newline character" warnings
- Asks to remove trailing newlines from project files
- Needs to enforce `insert_final_newline = false` from `.editorconfig`
- Says "fix trailing newlines", "SA1518", "remove final newlines", or similar

## What This Fixes

**SA1518: File may not end with a newline character.**

When `.editorconfig` has `insert_final_newline = false`, files must NOT end with trailing `\r\n` or `\n` characters. This skill scans all relevant files and strips any trailing newline bytes.

## Target File Types

| Extension | Description |
|-----------|-------------|
| `.cs` | C# source files |
| `.xaml` | XAML markup files |
| `.axaml` | Avalonia XAML files |
| `.csproj` | C# project files |
| `.props` | MSBuild property files |
| `.targets` | MSBuild target files |
| `.editorconfig` | Editor configuration files |

## Excluded Directories

The following directories are always skipped:
- `bin` - Build output
- `obj` - Intermediate build output
- `.vs` - Visual Studio metadata
- `.git` - Git repository data
- `node_modules` - Node.js dependencies

## Execution Steps

### Step 1: Verify .editorconfig Setting

Before running, confirm the project uses `insert_final_newline = false`:

```bash
grep -r "insert_final_newline" .editorconfig
```

If `insert_final_newline = true` or not set, warn the user that removing trailing newlines may conflict with their editor configuration.

### Step 2: Run the Fix Script

Execute the bundled Python script to scan and fix all files:

```bash
python scripts/fix_trailing_newlines.py [directory]
```

- If no directory is specified, defaults to the current working directory
- The script reports each fixed file and provides a summary

### Step 3: Review Results

The script outputs:
- Each file that was fixed (relative path)
- Total files scanned and fixed

### Step 4: Verify Build

After fixing, run:

```bash
dotnet build
```

Ensure the build succeeds and SA1518 warnings are resolved.

## Manual Alternative

If the Python script is unavailable, perform the fix manually:

1. Find all files with target extensions in the repository
2. For each file, check if it ends with `\n` or `\r\n`
3. If it does, remove all trailing newline characters from the end
4. Save the file with binary write to avoid editors re-adding newlines

## Guidelines

- Always check `.editorconfig` before running to confirm `insert_final_newline = false`
- The script preserves all file content except trailing newline bytes
- Empty files are skipped (no modification needed)
- The fix is idempotent - running it multiple times produces the same result
