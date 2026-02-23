#!/usr/bin/env python3
"""
Fix SA1518: File may not end with a newline character.

When .editorconfig has insert_final_newline = false, files must NOT end
with a trailing newline (\\r\\n or \\n).

Usage:
    python fix_trailing_newlines.py [directory]

Defaults to the current working directory if no directory is specified.
"""

import os
import sys

EXTENSIONS = {
    ".cs", ".xaml", ".axaml", ".csproj", ".props", ".targets", ".editorconfig",
}

EXCLUDE_DIRS = {
    "bin", "obj", ".vs", ".git", "node_modules",
}


def enumerate_files(root: str):
    """Recursively enumerate files with matching extensions, skipping excluded directories."""
    stack = [root]
    while stack:
        current_dir = stack.pop()
        try:
            entries = os.listdir(current_dir)
        except PermissionError:
            continue

        for entry in entries:
            full_path = os.path.join(current_dir, entry)
            if os.path.isfile(full_path):
                _, ext = os.path.splitext(entry)
                if ext.lower() in EXTENSIONS:
                    yield full_path
            elif os.path.isdir(full_path):
                if entry.lower() not in {d.lower() for d in EXCLUDE_DIRS}:
                    stack.append(full_path)


def trim_trailing_newlines(data: bytes) -> bytes:
    """Remove all trailing \\r and \\n bytes from the end of the data."""
    end = len(data)
    while end > 0 and data[end - 1] in (ord("\n"), ord("\r")):
        end -= 1
    if end == len(data):
        return data
    return data[:end]


def main():
    directory = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    directory = os.path.abspath(directory)

    if not os.path.isdir(directory):
        print(f"Directory not found: {directory}", file=sys.stderr)
        sys.exit(1)

    fixed_count = 0
    scanned_count = 0

    for file_path in enumerate_files(directory):
        scanned_count += 1
        with open(file_path, "rb") as f:
            data = f.read()

        if len(data) == 0:
            continue

        trimmed = trim_trailing_newlines(data)

        if len(trimmed) != len(data):
            with open(file_path, "wb") as f:
                f.write(trimmed)
            relative = os.path.relpath(file_path, directory)
            print(f"  Fixed: {relative}")
            fixed_count += 1

    print()
    print(f"Scanned {scanned_count} files, fixed {fixed_count}.")


if __name__ == "__main__":
    main()
