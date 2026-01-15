# Hooks Plugin

Age of Empires II sound effects for Claude Code events. Inspired by [age-of-claude](https://github.com/kylesnowschwartz/age-of-claude).

## Features

Plays classic Age of Empires II sounds for Claude Code lifecycle events:

| Event | Sound | Description |
|-------|-------|-------------|
| **SessionStart** | Startup music | Session begins |
| **Stop** | Villager training complete | Claude finishes responding |
| **PermissionRequest** | WOLOLO! (Priest convert) | Permission prompt appears |
| **SessionEnd** | Soldier death | Session ends |

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

Replace the `.wav` files in the `sounds/` folder:

```
sounds/
├── claude_startup.wav          # SessionStart
├── villager_training_complete.wav  # Stop
├── priest_convert_wololo5.wav  # PermissionRequest
└── soldier_death1.wav          # SessionEnd
```

## Technical Notes

This plugin uses inline Python commands that read `CLAUDE_PLUGIN_ROOT` from the environment variable (not command string substitution) to work around a Windows path escaping bug where backslashes get stripped when passed to bash.

## License

MIT

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/atc-net/atc-agentic-toolkit) for contribution guidelines.
