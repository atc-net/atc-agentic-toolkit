---
name: powershell-conventions
description: >
  Best practices and conventions for PowerShell cmdlet development and scripting. Covers Verb-Noun
  naming with approved verbs, PascalCase parameter and variable naming, parameter design with
  validation attributes and tab completion, pipeline support via ValueFromPipeline and rich object
  output, error handling with ShouldProcess, ConfirmImpact, ErrorAction, try/catch, and message
  streams (Write-Verbose, Write-Warning, Write-Error), and documentation with comment-based help.
  Use this skill whenever writing, reviewing, or refactoring PowerShell scripts, modules, cmdlets,
  or advanced functions -- including when the user mentions .ps1 files, PowerShell parameters,
  pipeline input, ShouldProcess, cmdlet binding, approved verbs, or PowerShell formatting and
  style, even if they do not explicitly say "PowerShell best practices."
user-invocable: false
---

# PowerShell Cmdlet Development Best Practices

Apply these practices when writing, reviewing, or refactoring PowerShell scripts, modules, and advanced functions.

## Naming Conventions

PowerShell's discoverability depends on consistent naming. When every command follows the same pattern, users can guess names before they search for them.

### Commands

- Use the **Verb-Noun** format for all functions and cmdlets (e.g., `Get-UserProfile`, `Set-Configuration`)
- Use only **approved verbs** from `Get-Verb` -- this avoids import warnings and keeps the module discoverable. Common verbs: `Get`, `Set`, `New`, `Remove`, `Invoke`, `Start`, `Stop`, `Export`, `Import`, `Test`, `Update`
- Use **singular nouns** (`Get-Process`, not `Get-Processes`) -- even when the command returns multiple objects, the noun describes the type being retrieved
- Use **PascalCase** for both the verb and noun

### Parameters

- Use **PascalCase** for parameter names (e.g., `$ComputerName`, `$FilePath`)
- Make names **descriptive** and match well-known conventions (e.g., `$Path` not `$p`, `$Name` not `$n`)
- Use **singular names** unless the parameter always accepts multiple values as a collection
- Prefer standard parameter names that users already expect: `Path`, `LiteralPath`, `Name`, `Id`, `InputObject`, `Force`, `Credential`, `ComputerName`

### Variables and Aliases

- Use **PascalCase** for public/module-scoped variables
- Use **camelCase** for private/local variables within functions
- Always use **full cmdlet names** in scripts and modules -- never aliases. Write `Where-Object` not `?`, `ForEach-Object` not `%`, `Select-Object` not `select`. Aliases are fine for interactive use, but scripts must be explicit because aliases may not exist in all environments

## Parameter Design

Well-designed parameters make a function predictable and self-documenting. Users should be able to tab-complete their way through arguments without reading documentation.

### CmdletBinding and Parameter Attributes

Always declare `[CmdletBinding()]` to get common parameters (`-Verbose`, `-Debug`, `-ErrorAction`, etc.) for free:

```powershell
function Get-ServiceStatus {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromPipeline)]
        [ValidateNotNullOrEmpty()]
        [string[]]$ComputerName,

        [Parameter()]
        [ValidateSet('Running', 'Stopped', 'Paused')]
        [string]$Status = 'Running',

        [Parameter()]
        [switch]$IncludeDisabled
    )

    process {
        foreach ($computer in $ComputerName) {
            # Implementation
        }
    }
}
```

### Validation Attributes

Validation attributes catch bad input before the function body runs, producing clear error messages automatically:

- `[ValidateNotNullOrEmpty()]` -- reject null or empty strings
- `[ValidateSet('Option1', 'Option2')]` -- restrict to a fixed list (also enables tab completion)
- `[ValidateRange(1, 100)]` -- constrain numeric values
- `[ValidatePattern('^[a-zA-Z]+$')]` -- match a regex pattern
- `[ValidateScript({ Test-Path $_ })]` -- run arbitrary validation logic
- `[ValidateCount(1, 10)]` -- constrain array length

### Switch Parameters

Use `[switch]` for boolean flags instead of `[bool]`. Switches are idiomatic PowerShell -- users write `-Force` instead of `-Force $true`:

```powershell
[Parameter()]
[switch]$Force,

[Parameter()]
[switch]$PassThru
```

### Tab Completion

For dynamic values that cannot be expressed with `[ValidateSet()]`, use `[ArgumentCompleter()]`:

```powershell
[Parameter()]
[ArgumentCompleter({
    param($commandName, $parameterName, $wordToComplete, $commandAst, $fakeBoundParameters)
    Get-Service | Where-Object Name -like "$wordToComplete*" |
        ForEach-Object { $_.Name }
})]
[string]$ServiceName
```

### Parameter Sets

Use parameter sets when a function supports mutually exclusive modes of operation:

```powershell
function Get-Item {
    [CmdletBinding(DefaultParameterSetName = 'ByName')]
    param(
        [Parameter(Mandatory, ParameterSetName = 'ByName')]
        [string]$Name,

        [Parameter(Mandatory, ParameterSetName = 'ById')]
        [int]$Id
    )
}
```

## Pipeline and Output

PowerShell's pipeline is its most distinctive feature. Functions that support pipeline input and produce well-structured output compose naturally with the rest of the ecosystem.

### Pipeline Input

Declare `ValueFromPipeline` or `ValueFromPipelineByPropertyName` so objects can be piped in:

```powershell
function Stop-CustomService {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory, ValueFromPipelineByPropertyName)]
        [string]$Name,

        [Parameter(ValueFromPipelineByPropertyName)]
        [string]$ComputerName = $env:COMPUTERNAME
    )

    process {
        if ($PSCmdlet.ShouldProcess("$Name on $ComputerName", 'Stop')) {
            # Stop the service -- process block runs once per pipeline object
        }
    }
}
```

- `ValueFromPipeline` -- binds the entire piped object to the parameter
- `ValueFromPipelineByPropertyName` -- matches pipeline object properties by name to parameters

### Begin/Process/End Blocks

Use these blocks when the function accepts pipeline input. This structure is what makes streaming work -- `process` runs once per input object rather than collecting everything into memory first:

```powershell
function ConvertTo-UpperCase {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$InputString
    )

    begin {
        # Runs once before any pipeline input -- use for setup
        $count = 0
    }

    process {
        # Runs once per pipeline object -- emit output here
        $count++
        $InputString.ToUpper()
    }

    end {
        # Runs once after all pipeline input -- use for cleanup or summary
        Write-Verbose "Processed $count strings"
    }
}
```

### Output

- **Return rich objects**, not formatted text. Emit `[PSCustomObject]` instances so downstream commands can filter, sort, and format:

```powershell
[PSCustomObject]@{
    ComputerName = $computer
    ServiceName  = $service.Name
    Status       = $service.Status
    StartType    = $service.StartType
    Memory       = $process.WorkingSet64
}
```

- **Stream one object at a time** in the `process` block -- do not accumulate results in an array and return them all at the end, because that breaks pipeline streaming and increases memory usage
- **Do not use `Write-Host`** for data output -- it writes directly to the console and cannot be captured, redirected, or piped. Use `Write-Host` only for user-facing interactive display (progress messages, colored status indicators)

### The PassThru Pattern

For commands that perform an action (create, update, delete), return nothing by default but offer a `-PassThru` switch that emits the affected object:

```powershell
function Set-UserDisplayName {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$UserId,

        [Parameter(Mandatory)]
        [string]$DisplayName,

        [switch]$PassThru
    )

    process {
        if ($PSCmdlet.ShouldProcess($UserId, "Set display name to '$DisplayName'")) {
            $user = Update-UserRecord -Id $UserId -DisplayName $DisplayName

            if ($PassThru) {
                $user
            }
        }
    }
}
```

## Error Handling and Safety

### ShouldProcess and ConfirmImpact

Any function that modifies state (files, services, registry, remote systems) should support `-WhatIf` and `-Confirm` through `ShouldProcess`. This lets users preview destructive operations before they happen:

```powershell
function Remove-TempFile {
    [CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$Path
    )

    process {
        if ($PSCmdlet.ShouldProcess($Path, 'Remove file')) {
            Remove-Item -Path $Path -Force
        }
    }
}
```

`ConfirmImpact` levels control when the system prompts for confirmation automatically:
- `Low` -- informational changes (never auto-prompts)
- `Medium` (default) -- standard modifications (prompts when `$ConfirmPreference` is Medium or lower)
- `High` -- destructive or irreversible operations (prompts by default)

### Message Streams

PowerShell has dedicated streams for different types of output. Using the correct stream means messages can be filtered, redirected, and suppressed independently:

- `Write-Verbose` -- detailed progress and diagnostic information, visible only with `-Verbose`
- `Write-Warning` -- potential issues that do not prevent execution
- `Write-Error` -- non-terminating errors (the function continues processing remaining input)
- `throw` -- terminating errors (the function stops immediately)
- `Write-Debug` -- developer-level diagnostics, visible only with `-Debug`
- `Write-Information` -- structured informational messages (captured via `-InformationVariable` or the 6 stream)

### ErrorAction and try/catch

Use `try`/`catch` for operations that might fail, and set `-ErrorAction Stop` on cmdlet calls inside the `try` block to convert non-terminating errors into catchable terminating errors:

```powershell
function Get-RemoteConfig {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string]$ComputerName
    )

    process {
        try {
            $config = Invoke-Command -ComputerName $ComputerName -ScriptBlock {
                Get-Content -Path 'C:\Config\app.json' -ErrorAction Stop
            } -ErrorAction Stop

            $config | ConvertFrom-Json
        }
        catch [System.Management.Automation.Remoting.PSRemotingTransportException] {
            Write-Error "Cannot connect to $ComputerName : $_"
        }
        catch {
            Write-Error "Unexpected error reading config from $ComputerName : $_"
        }
    }
}
```

### Non-Interactive Design

Scripts and functions should not prompt for input at runtime because they may run unattended in CI/CD, scheduled tasks, or remote sessions:

- Never use `Read-Host` in scripts -- accept all input through parameters
- Use `ShouldProcess` instead of manual confirmation prompts
- Provide `-Force` switches to suppress confirmation when needed for automation
- Default parameter values should produce safe behavior without user intervention

## Documentation

### Comment-Based Help

Every public function should include comment-based help so `Get-Help` works out of the box. Place the help block inside the function, immediately before `[CmdletBinding()]`:

```powershell
function Get-DiskSpace {
    <#
    .SYNOPSIS
        Gets disk space information for local or remote computers.

    .DESCRIPTION
        Retrieves free space, total size, and usage percentage for all fixed
        drives on the specified computers. Returns structured objects suitable
        for pipeline processing, filtering, and export.

    .PARAMETER ComputerName
        One or more computer names or IP addresses to query. Defaults to the
        local machine. Accepts pipeline input by property name.

    .PARAMETER Credential
        Credential to use for remote connections. Not required for the local
        machine.

    .EXAMPLE
        Get-DiskSpace -ComputerName 'Server01', 'Server02'

        Gets disk space for Server01 and Server02.

    .EXAMPLE
        Get-ADComputer -Filter * | Get-DiskSpace | Where-Object UsagePercent -gt 90

        Finds all AD computers with drives over 90% full.

    .OUTPUTS
        PSCustomObject with properties: ComputerName, Drive, FreeGB, TotalGB, UsagePercent
    #>
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipelineByPropertyName)]
        [Alias('CN', 'Server')]
        [string[]]$ComputerName = $env:COMPUTERNAME,

        [Parameter()]
        [pscredential]$Credential
    )

    begin {
        Write-Verbose "Starting disk space check"
    }

    process {
        foreach ($computer in $ComputerName) {
            Write-Verbose "Querying $computer"
            # Implementation
        }
    }
}
```

### Formatting and Style

- Use **4-space indentation** (no tabs)
- Place **opening braces on the same line** as the statement (`if ($condition) {`, not on a new line)
- Use **one blank line** between logical sections within a function
- Keep lines under **120 characters** where practical
- Use **splatting** for calls with many parameters to improve readability:

```powershell
$params = @{
    ComputerName = $server
    Credential   = $cred
    ScriptBlock  = { Get-Process }
    ErrorAction  = 'Stop'
}
Invoke-Command @params
```

## Review Checklist

Use this checklist when creating or reviewing PowerShell functions.

### Naming
- [ ] Function uses Verb-Noun format with an approved verb (`Get-Verb`)
- [ ] Noun is singular and PascalCase
- [ ] Parameters use PascalCase with descriptive, standard names
- [ ] Full cmdlet names used throughout (no aliases)

### Parameters
- [ ] `[CmdletBinding()]` declared
- [ ] Mandatory parameters marked, positional parameters assigned where intuitive
- [ ] Appropriate validation attributes applied
- [ ] Switch parameters used for boolean flags
- [ ] Standard parameter names used where applicable (`Path`, `Name`, `Force`, `Credential`)

### Pipeline
- [ ] `ValueFromPipeline` or `ValueFromPipelineByPropertyName` on input parameters
- [ ] `Begin`/`Process`/`End` blocks used for pipeline functions
- [ ] Output is `[PSCustomObject]`, not formatted text
- [ ] Objects streamed one at a time in `process` block
- [ ] `PassThru` offered for action commands

### Error Handling
- [ ] `SupportsShouldProcess` declared for state-changing functions
- [ ] `ConfirmImpact` set appropriately
- [ ] `try`/`catch` around operations that may fail
- [ ] `-ErrorAction Stop` used inside `try` blocks
- [ ] No use of `Read-Host` -- all input via parameters

### Documentation
- [ ] Comment-based help with `.SYNOPSIS`, `.DESCRIPTION`, `.PARAMETER`, `.EXAMPLE`
- [ ] `Write-Verbose` messages for diagnostic tracing
- [ ] 4-space indentation, same-line braces, lines under 120 characters
