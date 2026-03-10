#!/usr/bin/env python3
"""
Detect IoT Edge project structure by scanning for existing patterns.

This script auto-detects:
- Modules base path
- Contracts project path and name
- Deployment manifests location
- Project namespace
- Container registry (from existing manifests)
- NuGet feed URL (from existing Dockerfiles)

Returns JSON with detected configuration or empty fields if not found.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional, Dict, Any


def find_files_recursive(root_path: Path, pattern: str) -> list[Path]:
    """Find files matching glob pattern recursively, excluding test directories."""
    files = list(root_path.rglob(pattern))

    # Always filter out test directories
    files = [f for f in files if not any(part.lower().startswith('test') for part in f.parts)]

    return files


def find_modules_base_path(root_path: Path) -> Optional[str]:
    """
    Find modules base path by looking for existing modules.
    Expected pattern: **/modules/*/Program.cs
    """
    module_programs = find_files_recursive(root_path, "modules/*/Program.cs")

    if module_programs:
        # Extract the modules directory path
        # E.g., /path/to/src/IoTEdgeModules/modules/foo/Program.cs -> src/IoTEdgeModules/modules
        first_match = module_programs[0]
        modules_dir = first_match.parent.parent  # Go up from /foo/Program.cs to /modules
        relative_path = modules_dir.relative_to(root_path)
        return str(relative_path).replace('\\', '/')

    return None


def find_contracts_project(root_path: Path) -> Optional[Dict[str, str]]:
    """
    Find contracts project by looking for *Modules.Contracts*.csproj or *Contracts*.csproj
    Returns dict with path and name, or None if not found.
    """
    # Try specific pattern first
    contracts_projects = find_files_recursive(root_path, "*Modules.Contracts*.csproj")

    # Fallback to generic contracts pattern
    if not contracts_projects:
        contracts_projects = find_files_recursive(root_path, "*Contracts*.csproj")

    if contracts_projects:
        first_match = contracts_projects[0]
        project_dir = first_match.parent
        project_name = first_match.stem  # Filename without .csproj
        relative_path = project_dir.relative_to(root_path)

        return {
            "path": str(relative_path).replace('\\', '/'),
            "name": project_name
        }

    return None


def find_deployment_manifests(root_path: Path) -> list[str]:
    """
    Find all deployment manifest files (*.deployment.manifest.json).
    Returns list of relative paths.
    """
    manifests = find_files_recursive(root_path, "*.deployment.manifest.json")
    return [str(m.relative_to(root_path)).replace('\\', '/') for m in manifests]


def extract_namespace_from_csharp(root_path: Path, contracts_path: Optional[str] = None) -> Optional[str]:
    """
    Extract project namespace by:
    1. Reading a C# file from contracts project (if available)
    2. Finding pattern: namespace <Something>.Modules.Contracts.<ModuleName>
    3. Extracting base: <Something>
    """
    cs_files = []

    # Try contracts project first
    if contracts_path:
        contracts_full_path = root_path / contracts_path
        cs_files = list(contracts_full_path.rglob("*.cs"))

    # Fallback: scan any .cs file in project
    if not cs_files:
        cs_files = list(root_path.rglob("modules/*/*.cs"))[:10]  # Sample first 10

    # Pattern to match: namespace <Something>.Modules.Contracts.<ModuleName> or similar
    namespace_pattern = re.compile(r'namespace\s+([A-Za-z0-9.]+?)\.Modules(?:\.Contracts)?(?:\.[A-Za-z0-9]+)?;')

    for cs_file in cs_files:
        try:
            content = cs_file.read_text(encoding='utf-8')
            match = namespace_pattern.search(content)
            if match:
                # Extract the base namespace before .Modules
                return match.group(1)
        except Exception:
            continue

    return None


def extract_container_registry(root_path: Path, manifest_paths: list[str]) -> Optional[str]:
    """
    Extract container registry URL from existing module.json or deployment manifests.
    Looks for "repository": "registry.azurecr.io/modulename" pattern.
    """
    registry_pattern = re.compile(r'"repository":\s*"([^/"]+)/[^"]+"')

    # First try module.json files (more reliable)
    module_jsons = find_files_recursive(root_path, "modules/*/module.json")
    for module_json in module_jsons[:5]:  # Check first 5
        try:
            content = module_json.read_text(encoding='utf-8')
            match = registry_pattern.search(content)
            if match:
                return match.group(1)
        except Exception:
            continue

    # Fallback to deployment manifests
    for manifest_path in manifest_paths:
        try:
            full_path = root_path / manifest_path
            content = full_path.read_text(encoding='utf-8')
            match = registry_pattern.search(content)
            if match:
                return match.group(1)
        except Exception:
            continue

    return None


def extract_nuget_feed_url(root_path: Path, modules_base_path: Optional[str]) -> Optional[str]:
    """
    Extract NuGet feed URL from existing Dockerfiles.
    Looks for VSS_NUGET_EXTERNAL_FEED_ENDPOINTS pattern.
    """
    dockerfiles = find_files_recursive(root_path, "modules/*/Dockerfile*")

    # Match both regular and escaped quotes: "endpoint":"url" or \"endpoint\":\"url\"
    nuget_pattern = re.compile(r'endpoint\\?":\\s*\\?"(https://[^"\\]+/nuget/v3/index\.json)\\?"')

    for dockerfile in dockerfiles[:10]:  # Check first 10
        try:
            content = dockerfile.read_text(encoding='utf-8')
            match = nuget_pattern.search(content)
            if match:
                return match.group(1)
        except Exception:
            continue

    return None


def load_saved_config(root_path: Path) -> Optional[Dict[str, Any]]:
    """Load saved project configuration if it exists."""
    config_path = root_path / ".claude" / ".iot-edge-module-config.json"

    if config_path.exists():
        try:
            return json.loads(config_path.read_text(encoding='utf-8'))
        except Exception:
            return None

    return None


def save_project_config(root_path: Path, config: Dict[str, Any]) -> bool:
    """Save project configuration for future runs."""
    config_path = root_path / ".claude" / ".iot-edge-module-config.json"

    try:
        config_path.parent.mkdir(parents=True, exist_ok=True)
        config_path.write_text(json.dumps(config, indent=2), encoding='utf-8')
        return True
    except Exception as e:
        print(f"Warning: Could not save config: {e}", file=sys.stderr)
        return False


def detect_project_structure(root_path: Path, force_detect: bool = False) -> Dict[str, Any]:
    """
    Detect project structure by scanning for patterns.

    Args:
        root_path: Root directory of the project
        force_detect: If True, ignore saved config and re-detect

    Returns:
        Dictionary with detected configuration
    """
    # Try to load saved config first
    if not force_detect:
        saved_config = load_saved_config(root_path)
        if saved_config:
            saved_config["config_source"] = "saved"
            return saved_config

    # Perform detection
    modules_base_path = find_modules_base_path(root_path)
    contracts_project = find_contracts_project(root_path)
    manifest_paths = find_deployment_manifests(root_path)

    contracts_path = contracts_project["path"] if contracts_project else None
    project_namespace = extract_namespace_from_csharp(root_path, contracts_path)
    container_registry = extract_container_registry(root_path, manifest_paths)
    nuget_feed_url = extract_nuget_feed_url(root_path, modules_base_path)

    config = {
        "config_source": "detected",
        "modules_base_path": modules_base_path,
        "contracts_project_path": contracts_path,
        "contracts_project_name": contracts_project["name"] if contracts_project else None,
        "manifests_found": manifest_paths,
        "manifests_base_path": os.path.dirname(manifest_paths[0]) if manifest_paths else None,
        "project_namespace": project_namespace,
        "container_registry": container_registry,
        "nuget_feed_url": nuget_feed_url,
        "has_contracts_project": contracts_project is not None,
        "has_nuget_feed": nuget_feed_url is not None
    }

    return config


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Detect IoT Edge project structure"
    )
    parser.add_argument(
        "--root",
        type=str,
        default=".",
        help="Root directory of the project (default: current directory)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-detection, ignore saved config"
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save detected configuration for future runs"
    )

    args = parser.parse_args()

    root_path = Path(args.root).resolve()

    if not root_path.exists():
        print(json.dumps({"error": f"Path does not exist: {root_path}"}))
        sys.exit(1)

    # Detect structure
    config = detect_project_structure(root_path, force_detect=args.force)

    # Save if requested
    if args.save and config["config_source"] == "detected":
        if save_project_config(root_path, config):
            config["config_saved"] = True

    # Output as JSON
    print(json.dumps(config, indent=2))


if __name__ == "__main__":
    main()
