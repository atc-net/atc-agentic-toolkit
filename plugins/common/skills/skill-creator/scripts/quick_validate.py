#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version
"""

import sys
import os
import re
import yaml
from pathlib import Path

def validate_skill(skill_path, strict=False):
    """Basic validation of a skill.

    strict: accept only the Agent Skills standard's frontmatter fields, as a claude.ai upload
    or the Skills API does. Otherwise the fields Claude Code adds are accepted too.
    """
    skill_path = Path(skill_path)

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    # Read and validate frontmatter
    content = skill_md.read_text(encoding="utf-8")
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)

    # Parse YAML frontmatter
    try:
        frontmatter = yaml.safe_load(frontmatter_text)
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except yaml.YAMLError as e:
        return False, f"Invalid YAML in frontmatter: {e}"

    # Define allowed properties: the Agent Skills standard's, plus the ones Claude Code adds
    # (https://code.claude.com/docs/en/skills).
    STANDARD_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'}
    CLAUDE_CODE_PROPERTIES = {
        'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable',
        'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell',
    }
    ALLOWED_PROPERTIES = STANDARD_PROPERTIES if strict else STANDARD_PROPERTIES | CLAUDE_CODE_PROPERTIES

    # Check for unexpected properties (excluding nested keys under metadata)
    unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
    if unexpected_keys:
        claude_only = sorted(unexpected_keys & CLAUDE_CODE_PROPERTIES)
        if strict and claude_only:
            return False, (
                f"Claude Code-only key(s) in SKILL.md frontmatter: {', '.join(claude_only)}. "
                "A claude.ai upload and the Skills API accept only the Agent Skills standard's fields "
                f"({', '.join(sorted(STANDARD_PROPERTIES))}). Remove them for an upload; "
                "Claude Code reads the skill as it is."
            )
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {', '.join(sorted(unexpected_keys))}. "
            f"Allowed properties are: {', '.join(sorted(ALLOWED_PROPERTIES))}. "
            "Put anything else under 'metadata'."
        )

    # Check required fields
    if 'name' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Extract name for validation
    name = frontmatter.get('name', '')
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"
    name = name.strip()
    if name:
        # Check naming convention (kebab-case: lowercase with hyphens)
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' should be kebab-case (lowercase letters, digits, and hyphens only)"
        if name.startswith('-') or name.endswith('-') or '--' in name:
            return False, f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
        # Check name length (max 64 characters per spec)
        if len(name) > 64:
            return False, f"Name is too long ({len(name)} characters). Maximum is 64 characters."

    # Extract and validate description
    description = frontmatter.get('description', '')
    if not isinstance(description, str):
        return False, f"Description must be a string, got {type(description).__name__}"
    description = description.strip()
    if description:
        # Check for angle brackets
        if '<' in description or '>' in description:
            return False, "Description cannot contain angle brackets (< or >)"
        # Check description length (max 1024 characters per spec)
        if len(description) > 1024:
            return False, f"Description is too long ({len(description)} characters). Maximum is 1024 characters."

    # Validate compatibility field if present (optional)
    compatibility = frontmatter.get('compatibility', '')
    if compatibility:
        if not isinstance(compatibility, str):
            return False, f"Compatibility must be a string, got {type(compatibility).__name__}"
        if len(compatibility) > 500:
            return False, f"Compatibility is too long ({len(compatibility)} characters). Maximum is 500 characters."

    return True, "Skill is valid!"

if __name__ == "__main__":
    folders = [a for a in sys.argv[1:] if a != "--strict"]
    if not folders:
        print("Usage: python quick_validate.py <skill_directory>... [--strict]")
        print("  --strict  only the Agent Skills standard's fields, as a claude.ai upload needs")
        sys.exit(1)

    strict = "--strict" in sys.argv[1:]
    if len(folders) == 1:
        valid, message = validate_skill(folders[0], strict=strict)
        print(message)
        sys.exit(0 if valid else 1)

    # Several folders: one line for each that fails, then a count.
    failed = 0
    for folder in folders:
        valid, message = validate_skill(folder, strict=strict)
        if not valid:
            failed += 1
            print(f"{folder}: {message}")
    print(f"{len(folders) - failed} of {len(folders)} skills are valid.")
    sys.exit(1 if failed else 0)