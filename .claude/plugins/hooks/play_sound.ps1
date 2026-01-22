param([string]$Event = "stop")

$soundMap = @{
    "session_start" = "ready.mp3"
    "stop" = "finished.mp3"
    "permission" = "human-input.mp3"
}

$pluginRoot = $env:CLAUDE_PLUGIN_ROOT
if (-not $pluginRoot) { $pluginRoot = $PSScriptRoot }

$soundFile = $soundMap[$Event]
if (-not $soundFile) { $soundFile = "finished.mp3" }

$soundPath = Join-Path (Join-Path $pluginRoot "sounds") $soundFile

if (Test-Path $soundPath) {
    Add-Type -AssemblyName presentationCore
    $player = New-Object System.Windows.Media.MediaPlayer
    $player.Open([Uri]$soundPath)
    Start-Sleep -Milliseconds 300
    $player.Play()
    Start-Sleep -Seconds 2
}
