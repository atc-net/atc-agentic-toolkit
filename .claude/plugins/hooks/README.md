# Hooks Plugin

Audio notification hooks for Claude Code events.

## Features

Plays notification sounds for Claude Code lifecycle events:

| Event | Sound | Description |
|-------|-------|-------------|
| **SessionStart** | ready.mp3 | Session begins |
| **Stop** | finished.mp3 | Claude finishes responding |
| **PermissionRequest** | human-input.mp3 | Permission prompt appears |

## Installation

Install via the atc-net marketplace:

```bash
/plugin install hooks@atc-net
```

## Requirements

- Python 3.x
- Windows, macOS, or Linux

### Platform-specific requirements

**Windows:** PowerShell (included)

**macOS:** `afplay` (included)

**Linux:** `paplay` (PulseAudio) or `aplay` (ALSA)

## Customizing Sounds

Replace the `.mp3` files in the `sounds/` folder:

```
sounds/
├── ready.mp3        # SessionStart
├── finished.mp3     # Stop
└── human-input.mp3  # PermissionRequest
```

## Technical Notes

This plugin uses Python to read `CLAUDE_PLUGIN_ROOT` from the environment variable and call a PowerShell script for sound playback. This approach works around a Windows path escaping bug where backslashes get stripped when passed to bash.

## License

MIT

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/atc-net/atc-agentic-toolkit) for contribution guidelines.
