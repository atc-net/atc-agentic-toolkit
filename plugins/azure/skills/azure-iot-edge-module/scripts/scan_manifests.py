#!/usr/bin/env python3
"""
Scan for IoT Edge deployment manifest files.

Finds all *.deployment.manifest.json files in the project and returns
metadata about each manifest.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List


def extract_manifest_metadata(manifest_path: Path) -> Dict[str, Any]:
    """
    Extract metadata from a deployment manifest file.

    Args:
        manifest_path: Path to the manifest file

    Returns:
        Dictionary with manifest metadata
    """
    try:
        content = manifest_path.read_text(encoding='utf-8')
        manifest_data = json.loads(content)

        # Extract module count from $edgeAgent
        modules_count = 0
        module_names = []
        edge_agent = manifest_data.get("modulesContent", {}).get("$edgeAgent", {})

        # Navigate the nested JSON structure correctly
        for key in edge_agent.keys():
            if key.startswith("properties.desired.modules."):
                modules_count += 1
                # Extract module name from key like "properties.desired.modules.modulename"
                module_name = key.replace("properties.desired.modules.", "")
                module_names.append(module_name)

        # Extract route count from $edgeHub
        routes_count = 0
        edge_hub = manifest_data.get("modulesContent", {}).get("$edgeHub", {})
        for key in edge_hub.keys():
            if key.startswith("properties.desired.routes."):
                routes_count += 1

        return {
            "valid": True,
            "modules_count": modules_count,
            "module_names": module_names,
            "routes_count": routes_count
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }


def scan_manifests(root_path: Path) -> List[Dict[str, Any]]:
    """
    Scan for all deployment manifest files, excluding test directories.

    Args:
        root_path: Root directory of the project

    Returns:
        List of dictionaries with manifest information
    """
    manifests = list(root_path.rglob("*.deployment.manifest.json"))

    # Always exclude test directories
    manifests = [m for m in manifests if not any(part.lower().startswith('test') for part in m.parts)]

    results = []
    for manifest_path in manifests:
        relative_path = manifest_path.relative_to(root_path)
        metadata = extract_manifest_metadata(manifest_path)

        result = {
            "path": str(relative_path).replace('\\', '/'),
            "name": manifest_path.name,
            "basename": manifest_path.stem.replace('.deployment.manifest', ''),
            "absolute_path": str(manifest_path),
            **metadata
        }

        results.append(result)

    # Sort by path for consistent ordering
    results.sort(key=lambda x: x["path"])

    return results


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Scan for IoT Edge deployment manifest files"
    )
    parser.add_argument(
        "--root",
        type=str,
        default=".",
        help="Root directory of the project (default: current directory)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Include detailed metadata for each manifest"
    )

    args = parser.parse_args()

    root_path = Path(args.root).resolve()

    if not root_path.exists():
        print(json.dumps({"error": f"Path does not exist: {root_path}"}))
        sys.exit(1)

    # Scan for manifests
    manifests = scan_manifests(root_path)

    # Output as JSON
    output = {
        "manifests_found": len(manifests),
        "manifests": manifests
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
