#!/usr/bin/env python3
"""
Update IoT Edge deployment manifest with a new module.

This script:
1. Parses the deployment manifest JSON
2. Finds the highest startupOrder in $edgeAgent.modules
3. Inserts a new module definition with calculated startupOrder
4. Adds a default route to $edgeHub
5. Validates and saves the updated JSON
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional


def find_highest_startup_order(manifest_data: Dict[str, Any]) -> int:
    """
    Find the highest startupOrder value in existing modules.

    Args:
        manifest_data: Parsed manifest JSON

    Returns:
        Highest startupOrder value, or 0 if no modules found
    """
    edge_agent = manifest_data.get("modulesContent", {}).get("$edgeAgent", {})

    # Find all keys that start with "properties.desired.modules."
    modules = {}
    for key, value in edge_agent.items():
        if key.startswith("properties.desired.modules."):
            modules[key] = value

    highest_order = 0
    for module_config in modules.values():
        startup_order = module_config.get("startupOrder", 0)
        highest_order = max(highest_order, startup_order)

    return highest_order


def create_module_definition(
    module_name: str,
    container_registry: str,
    with_volume: bool = True
) -> Dict[str, Any]:
    """
    Create a standard module definition for $edgeAgent.

    Args:
        module_name: Lowercase module name
        container_registry: Container registry URL
        with_volume: Whether to include volume mount

    Returns:
        Module definition dictionary
    """
    create_options = {
        "HostConfig": {
            "LogConfig": {
                "Type": "json-file",
                "Config": {
                    "max-size": "10m",
                    "max-file": "10"
                }
            }
        }
    }

    # Add volume mount if requested
    if with_volume:
        create_options["HostConfig"]["Mounts"] = [
            {
                "Type": "volume",
                "Target": "/app/data/",
                "Source": module_name
            }
        ]

    module_def = {
        "version": "1.0",
        "type": "docker",
        "status": "running",
        "restartPolicy": "always",
        "startupOrder": 1,
        "settings": {
            "image": f"${{MODULES.{module_name}}}",
            "createOptions": create_options
        }
    }

    return module_def


def create_default_route(module_name: str) -> Dict[str, Any]:
    """
    Create a default route for the module to IoT Hub.

    Args:
        module_name: Lowercase module name

    Returns:
        Route definition dictionary
    """
    return {
        "route": f"FROM /messages/modules/{module_name}/outputs/* INTO $upstream",
        "priority": 0,
        "timeToLiveSecs": 86400
    }


def module_exists(manifest_data: Dict[str, Any], module_name: str) -> bool:
    """
    Check if a module already exists in the manifest.

    Args:
        manifest_data: Parsed manifest JSON
        module_name: Module name to check

    Returns:
        True if module exists, False otherwise
    """
    edge_agent = manifest_data.get("modulesContent", {}).get("$edgeAgent", {})
    module_key = f"properties.desired.modules.{module_name}"
    return module_key in edge_agent


def add_module_to_manifest(
    manifest_data: Dict[str, Any],
    module_name: str,
    container_registry: str,
    with_volume: bool = True
) -> Dict[str, Any]:
    """
    Add a new module to the deployment manifest.

    Args:
        manifest_data: Parsed manifest JSON
        module_name: Lowercase module name
        container_registry: Container registry URL
        with_volume: Whether to include volume mount

    Returns:
        Updated manifest data with module added

    Raises:
        ValueError: If module already exists
    """
    # Check if module already exists
    if module_exists(manifest_data, module_name):
        raise ValueError(f"Module '{module_name}' already exists in manifest")

    # Create module definition with startupOrder = 1
    module_def = create_module_definition(
        module_name,
        container_registry,
        with_volume
    )

    # Add to $edgeAgent using dotted key (Azure IoT Edge format)
    if "modulesContent" not in manifest_data:
        manifest_data["modulesContent"] = {}
    if "$edgeAgent" not in manifest_data["modulesContent"]:
        manifest_data["modulesContent"]["$edgeAgent"] = {}

    module_key = f"properties.desired.modules.{module_name}"
    manifest_data["modulesContent"]["$edgeAgent"][module_key] = module_def

    # Create and add route to $edgeHub using dotted key (Azure IoT Edge format)
    route_name = f"{module_name}ToIoTHub"
    route_def = create_default_route(module_name)

    if "$edgeHub" not in manifest_data["modulesContent"]:
        manifest_data["modulesContent"]["$edgeHub"] = {}

    route_key = f"properties.desired.routes.{route_name}"
    manifest_data["modulesContent"]["$edgeHub"][route_key] = route_def

    return manifest_data


def update_manifest_file(
    manifest_path: Path,
    module_name: str,
    container_registry: str,
    with_volume: bool = True
) -> Dict[str, Any]:
    """
    Update a deployment manifest file with a new module.

    Args:
        manifest_path: Path to manifest file
        module_name: Lowercase module name
        container_registry: Container registry URL
        with_volume: Whether to include volume mount

    Returns:
        Dictionary with operation result

    Raises:
        FileNotFoundError: If manifest file doesn't exist
        json.JSONDecodeError: If manifest is invalid JSON
        ValueError: If module already exists
    """
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest file not found: {manifest_path}")

    # Read and parse manifest
    content = manifest_path.read_text(encoding='utf-8')
    manifest_data = json.loads(content)

    # Store original for comparison
    edge_agent = manifest_data.get("modulesContent", {}).get("$edgeAgent", {})
    original_module_count = len([k for k in edge_agent.keys() if k.startswith("properties.desired.modules.")])

    # Add module
    updated_manifest = add_module_to_manifest(
        manifest_data,
        module_name,
        container_registry,
        with_volume
    )

    # Write back to file
    updated_content = json.dumps(updated_manifest, indent=2)
    manifest_path.write_text(updated_content, encoding='utf-8')

    edge_agent_updated = updated_manifest.get("modulesContent", {}).get("$edgeAgent", {})
    new_module_count = len([k for k in edge_agent_updated.keys() if k.startswith("properties.desired.modules.")])

    return {
        "success": True,
        "manifest_path": str(manifest_path),
        "module_name": module_name,
        "startup_order": 1,
        "modules_before": original_module_count,
        "modules_after": new_module_count,
        "route_added": f"{module_name}ToIoTHub"
    }


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Update IoT Edge deployment manifest with a new module"
    )
    parser.add_argument(
        "manifest_path",
        type=str,
        help="Path to deployment manifest file"
    )
    parser.add_argument(
        "module_name",
        type=str,
        help="Lowercase module name"
    )
    parser.add_argument(
        "--registry",
        type=str,
        required=True,
        help="Container registry URL (e.g., myregistry.azurecr.io)"
    )
    parser.add_argument(
        "--no-volume",
        action="store_true",
        help="Don't add volume mount to module"
    )

    args = parser.parse_args()

    manifest_path = Path(args.manifest_path)

    try:
        result = update_manifest_file(
            manifest_path,
            args.module_name,
            args.registry,
            with_volume=not args.no_volume
        )

        print(json.dumps(result, indent=2))

    except FileNotFoundError as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON: {e}"}), file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Unexpected error: {e}"}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
