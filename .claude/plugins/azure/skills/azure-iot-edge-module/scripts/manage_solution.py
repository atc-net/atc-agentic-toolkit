#!/usr/bin/env python3
"""
Solution File Manager for IoT Edge Module Scaffolding

Manages adding newly created modules to solution files.
Supports:
- .slnx (XML-based, modern format) - auto-add capability
- .sln (legacy format with GUIDs) - manual instructions only
"""

import argparse
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def find_solution_file(root_path: Path) -> dict:
    """
    Find solution file in project root.

    Returns:
        dict with keys:
        - type: "slnx", "sln", or "none"
        - path: Path to solution file or None
        - name: Solution file name or None
    """
    # Always exclude test directories
    def is_test_dir(path: Path) -> bool:
        return any(part.lower().startswith('test') for part in path.parts)

    # Look for .slnx first (modern format)
    slnx_files = [f for f in root_path.rglob("*.slnx") if not is_test_dir(f)]
    if slnx_files:
        # Use the first one found, preferring root directory
        slnx_files.sort(key=lambda p: (len(p.parts), p))
        return {
            "type": "slnx",
            "path": slnx_files[0],
            "name": slnx_files[0].name
        }

    # Fall back to .sln (legacy format)
    sln_files = [f for f in root_path.rglob("*.sln") if not is_test_dir(f)]
    if sln_files:
        sln_files.sort(key=lambda p: (len(p.parts), p))
        return {
            "type": "sln",
            "path": sln_files[0],
            "name": sln_files[0].name
        }

    return {
        "type": "none",
        "path": None,
        "name": None
    }


def add_module_to_slnx(slnx_path: Path, module_csproj_path: str) -> dict:
    """
    Add module to .slnx solution file.

    Args:
        slnx_path: Path to .slnx file
        module_csproj_path: Relative path to module .csproj (e.g., "src/IoTEdgeModules/modules/mymodule/MyModule.csproj")

    Returns:
        dict with keys:
        - success: bool
        - message: str
        - action: "added", "already_exists", or "error"
    """
    try:
        # Parse XML
        tree = ET.parse(slnx_path)
        root = tree.getroot()

        # Find or create /modules/ folder
        modules_folder = None
        for folder in root.findall("Folder"):
            if folder.get("Name") == "/modules/":
                modules_folder = folder
                break

        if modules_folder is None:
            # Create /modules/ folder if it doesn't exist
            modules_folder = ET.SubElement(root, "Folder")
            modules_folder.set("Name", "/modules/")

        # Check if module already exists
        for project in modules_folder.findall("Project"):
            if project.get("Path") == module_csproj_path:
                return {
                    "success": True,
                    "message": f"Module already exists in solution: {module_csproj_path}",
                    "action": "already_exists"
                }

        # Get all existing project paths for alphabetical insertion
        existing_projects = [(p.get("Path"), p) for p in modules_folder.findall("Project")]
        existing_paths = [path for path, _ in existing_projects]

        # Find insertion point (alphabetical order)
        insertion_index = 0
        for i, existing_path in enumerate(existing_paths):
            if module_csproj_path.lower() < existing_path.lower():
                insertion_index = i
                break
            insertion_index = i + 1

        # Create new project element
        new_project = ET.Element("Project")
        new_project.set("Path", module_csproj_path)

        # Insert at the calculated position
        modules_folder.insert(insertion_index, new_project)

        # Write back to file with proper formatting
        # Add indentation
        indent_xml(root)
        tree.write(slnx_path, encoding="utf-8", xml_declaration=False)

        return {
            "success": True,
            "message": f"Added module to solution at position {insertion_index + 1} of {len(existing_paths) + 1}",
            "action": "added",
            "insertion_index": insertion_index,
            "total_modules": len(existing_paths) + 1
        }

    except ET.ParseError as e:
        return {
            "success": False,
            "message": f"Failed to parse .slnx file: {e}",
            "action": "error"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error adding module to .slnx: {e}",
            "action": "error"
        }


def indent_xml(elem, level=0):
    """
    Recursively add indentation to an XML element and its children for pretty printing.

    Args:
        elem: xml.etree.ElementTree.Element
            The XML element to indent.
        level: int, optional
            The current indentation level (default is 0).

    Returns:
        None. The function modifies the XML element in place.
    """
    indent = "\n" + "  " * level
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = indent + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = indent
        for child in elem:
            indent_xml(child, level + 1)
        if not child.tail or not child.tail.strip():
            child.tail = indent
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = indent


def get_sln_manual_instructions(module_csproj_path: str, module_name: str) -> str:
    """
    Generate manual instructions for adding module to .sln file.

    .sln files require GUIDs which are complex to generate correctly,
    so we provide manual instructions instead.
    """
    instructions = f"""
Manual instructions for adding module to .sln file:

.sln files require project GUIDs which must be generated. The easiest way is to use Visual Studio or the dotnet CLI:

Option 1: Using dotnet CLI (recommended):
    dotnet sln add "{module_csproj_path}"

Option 2: Using Visual Studio:
    1. Open the solution in Visual Studio
    2. Right-click on the solution in Solution Explorer
    3. Select "Add" → "Existing Project"
    4. Navigate to and select: {module_csproj_path}

Option 3: Manual editing (advanced):
    1. Open the .sln file in a text editor
    2. Generate a new GUID (use online generator or PowerShell: [guid]::NewGuid())
    3. Add project entry:

       Project("{{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}}") = "{module_name}", "{module_csproj_path}", "{{YOUR-NEW-GUID}}"
       EndProject

    4. Add to solution configuration platforms section (match existing patterns)

Note: The dotnet CLI approach is recommended as it handles all GUID generation automatically.
"""
    return instructions


def main():
    parser = argparse.ArgumentParser(
        description="Manage solution file updates for IoT Edge modules"
    )
    parser.add_argument(
        "--root",
        type=str,
        default=".",
        help="Root directory to search for solution file (default: current directory)"
    )
    parser.add_argument(
        "--detect",
        action="store_true",
        help="Detect solution file type and location"
    )
    parser.add_argument(
        "--add-module",
        type=str,
        help="Relative path to module .csproj to add to solution"
    )
    parser.add_argument(
        "--module-name",
        type=str,
        help="Module name (for manual instructions)"
    )

    args = parser.parse_args()
    root_path = Path(args.root).resolve()

    # Detect solution file
    solution_info = find_solution_file(root_path)

    if args.detect:
        # Just output detection results
        print(json.dumps(solution_info, indent=2, default=str))
        return 0

    if args.add_module:
        if solution_info["type"] == "none":
            result = {
                "success": False,
                "message": "No solution file found",
                "action": "error"
            }
            print(json.dumps(result, indent=2))
            return 1

        if solution_info["type"] == "slnx":
            # Auto-add to .slnx
            result = add_module_to_slnx(
                solution_info["path"],
                args.add_module
            )
            print(json.dumps(result, indent=2))
            return 0 if result["success"] else 1

        elif solution_info["type"] == "sln":
            # Provide manual instructions for .sln
            module_name = args.module_name or Path(args.add_module).stem
            instructions = get_sln_manual_instructions(args.add_module, module_name)
            result = {
                "success": True,
                "message": "Manual instructions generated for .sln file",
                "action": "manual_instructions",
                "instructions": instructions,
                "solution_path": str(solution_info["path"])
            }
            print(json.dumps(result, indent=2))
            return 0

    # No action specified
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
