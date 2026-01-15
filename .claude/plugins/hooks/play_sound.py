#!/usr/bin/env python3
"""
Cross-platform sound player for Claude Code hooks.
Plays Age of Empires II sounds for different events.
"""

import os
import sys
import platform
import subprocess

# Map event types to sound files
SOUND_MAP = {
    'session_start': 'claude_startup.wav',
    'stop': 'villager_training_complete.wav',
    'permission': 'priest_convert_wololo5.wav',
    'session_end': 'soldier_death1.wav',
}

def get_sound_path(event_type: str) -> str:
    """Get the full path to the sound file for the given event."""
    plugin_root = os.environ.get('CLAUDE_PLUGIN_ROOT', os.path.dirname(os.path.abspath(__file__)))
    sound_file = SOUND_MAP.get(event_type, 'villager_training_complete.wav')
    return os.path.join(plugin_root, 'sounds', sound_file)

def play_sound_windows(sound_path: str) -> None:
    """Play sound on Windows using winsound or PowerShell fallback."""
    try:
        import winsound
        winsound.PlaySound(sound_path, winsound.SND_FILENAME)
    except Exception:
        # Fallback to PowerShell
        subprocess.run([
            'powershell.exe', '-c',
            f"(New-Object Media.SoundPlayer '{sound_path}').PlaySync()"
        ], capture_output=True)

def play_sound_macos(sound_path: str) -> None:
    """Play sound on macOS using afplay."""
    subprocess.run(['afplay', sound_path], capture_output=True)

def play_sound_linux(sound_path: str) -> None:
    """Play sound on Linux using paplay or aplay."""
    try:
        subprocess.run(['paplay', sound_path], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        try:
            subprocess.run(['aplay', sound_path], capture_output=True)
        except FileNotFoundError:
            pass  # No audio player available

def play_sound(event_type: str) -> None:
    """Play the appropriate sound for the given event type."""
    sound_path = get_sound_path(event_type)

    if not os.path.exists(sound_path):
        return  # Sound file not found, fail silently

    system = platform.system()

    if system == 'Windows':
        play_sound_windows(sound_path)
    elif system == 'Darwin':
        play_sound_macos(sound_path)
    else:  # Linux and others
        play_sound_linux(sound_path)

def main() -> None:
    """Main entry point."""
    event_type = sys.argv[1] if len(sys.argv) > 1 else 'stop'

    try:
        play_sound(event_type)
    except Exception:
        pass  # Never block Claude Code

    sys.exit(0)

if __name__ == '__main__':
    main()
