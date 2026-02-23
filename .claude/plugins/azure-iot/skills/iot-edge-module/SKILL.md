---
name: iot-edge-module
description: Automates Azure IoT Edge module scaffolding, manifest configuration, and shared contract generation with intelligent project structure detection. Use when the user wants to create, scaffold, or set up a new IoT Edge module, or add a new module to an edge deployment.
---

# IoT Edge Module Scaffolding

## Prerequisites

Before scaffolding a module, gather the following information from the user:

1. **Module name** (PascalCase, e.g., "DataProcessorModule")
2. **Module description** (brief description of module purpose)

## Scaffolding Process

Follow these steps in order to scaffold a new IoT Edge module:

### Step 1: Detect or Load Project Structure

Run the project structure detection script to identify existing patterns:

```bash
python scripts/detect_project_structure.py --root .
```

### Step 1.5: Verify IoTEdgeModules Folder Structure

If `modules_base_path` wasn't found or doesn't exist, ask the user via AskUserQuestion:
- Option 1: Create at default `src/IoTEdgeModules/modules/`
- Option 2: Specify custom path
- Option 3: Cancel scaffolding

**Processing detection output:**

1. Parse the JSON output
2. If `config_source` is `"saved"`, use silently
3. If `config_source` is `"detected"`, present findings and ask for confirmation via AskUserQuestion:
   - "Yes, use it" / "Save and use" / "No, customize"
4. If "Save and use": run `python scripts/detect_project_structure.py --root . --save`
5. If "No, customize" or detection fails, prompt for: project namespace, container registry URL, modules base path, contracts project name/path

### Step 2: Gather Module-Specific Information

Ask the user for:

**Required:**

1. **Module name** (PascalCase)
2. **Module description**

**Optional Features:**

**A. Private NuGet Feed**

- Ask: "Does this project require a private NuGet feed? (Yes/No)"
- If Yes and not detected: Prompt for NuGet feed URL
- If Yes and detected: Confirm detected URL or allow override

**B. Shared Contracts Project**

- If contracts project was detected: Automatically use it for module constants (no prompt needed)
- If not detected: Ask "Do you have a shared contracts project? (Yes/No/Create standalone)"

### Step 3: Validate and Normalize Module Names

Convert the user-provided module name to required formats:

**ModuleName (PascalCase):**

- Remove "Module" suffix if present, then add it back
- Example: "DataProcessor" → "DataProcessorModule"
- Example: "DataProcessorModule" → "DataProcessorModule"

**modulename (lowercase):**

- Convert ModuleName to lowercase
- Example: "DataProcessorModule" → "dataprocessormodule"

**Confirm with user using AskUserQuestion tool:**

Present the module details and ask for confirmation:

- **Question**: "Proceed with creating this module?"
- **Header**: "Confirm Module"
- **Options**:
  - "Yes, create module" → Continue to Step 4
  - "No, use different name" → Go back to Step 2 (gather module name)

Display in the question description:

```
Module will be created as:
• C# class name: <ModuleName>
• Module ID: <modulename>
• Directory: <modules_base_path>/<modulename>/
```

**Do NOT assume "Yes" or proceed without using AskUserQuestion tool and getting explicit user confirmation**

### Step 4: Create Module Directory Structure

Create the module directory:

```
<modules_base_path>/<modulename>/
```

Check if directory already exists (MUST use this exact bash syntax):

```bash
test -d "<modules_base_path>/<modulename>" && echo "EXISTS" || echo "NOT_EXISTS"
```

**Note:** Do NOT use Windows CMD syntax like `if exist`. Always use Unix bash syntax as shown above.

- If EXISTS: Ask user "Module directory exists. Overwrite? (Yes/Rename/Cancel)"
- If Rename: Prompt for new name and restart from Step 3

### Step 5: Generate Module Files from Templates

Use the template files in `assets/` to generate module files with runtime substitutions. The skill generates 11 files total.

**Placeholder substitutions:**

| Placeholder | Value | Example |
|-------------|-------|---------|
| `{{ModuleName}}` | PascalCase module name | DataProcessorModule |
| `{{modulename}}` | Lowercase module name | dataprocessormodule |
| `{{ModuleDescription}}` | User-provided description | Processes sensor data |
| `{{CONTAINER_REGISTRY}}` | Detected or provided registry | myregistry.azurecr.io |
| `{{PROJECT_NAMESPACE}}` | Detected or provided namespace | Company.IoT.EdgeAPI |
| `{{MODULE_CSPROJ_PATH}}` | Calculated module csproj path: `<modules_base_path>/<modulename>/<ModuleName>.csproj` | src/IoTEdgeModules/modules/dataprocessormodule/DataProcessorModule.csproj |
| `{{MODULE_PUBLISH_PATH}}` | Calculated publish path | src/IoTEdgeModules/modules/dataprocessormodule |
| `{{CONTRACTS_PROJECT_REFERENCE}}` | Conditional contracts reference | See below |
| `{{CONTRACTS_CSPROJ_COPY}}` | Conditional Dockerfile COPY | See below |
| `{{NUGET_CONFIG_SECTION}}` | Conditional NuGet configuration | See below |

**Conditional placeholder handling:**

**A. Contracts Project Reference (`{{CONTRACTS_PROJECT_REFERENCE}}`)**

**Calculate relative path from module directory to contracts directory:**

Example:

- Module at: `src/IoTEdgeModules/modules/mydemomodule/`
- Contracts at: `src/Company.IoT.Modules.Contracts/`
- Relative path: `../../../Company.IoT.Modules.Contracts`
  - Go up 3 levels: `mydemomodule/` → `modules/` → `IoTEdgeModules/` → `src/`
  - Then down to: `Company.IoT.Modules.Contracts/`

If using shared contracts:

```xml
  <ItemGroup>
    <ProjectReference Include="<relative-path-to-contracts>/<contracts_project_name>.csproj" />
  </ItemGroup>
```

If NOT using shared contracts:

```xml
  <!-- No shared contracts project -->
```

**B. Contracts Dockerfile COPY (`{{CONTRACTS_CSPROJ_COPY}}`)**

If using shared contracts:

```dockerfile
COPY <contracts_project_path>/*.csproj ./src/
```

If NOT using shared contracts:
```
(empty - no COPY line)
```

**C. NuGet Configuration (`{{NUGET_CONFIG_SECTION}}`)**

If using private NuGet feed:

```dockerfile
ENV VSS_NUGET_EXTERNAL_FEED_ENDPOINTS="{\"endpointCredentials\": [{\"endpoint\":\"<nuget_feed_url>\", \"username\":\"docker\", \"password\":\"${FEED_ACCESSTOKEN}\"}]}"

```

If NOT using private NuGet feed:

```
(empty - no ENV line)
```

**Template file mappings:**

| Template File | Target File | Notes |
|---------------|-------------|-------|
| `template.csproj` | `<ModuleName>.csproj` | Rename to match ModuleName |
| `template-module.json` | `module.json` | - |
| `template-Program.cs` | `Program.cs` | - |
| `template-Service.cs` | `<ModuleName>Service.cs` | Rename to match ModuleName |
| `template-GlobalUsings.cs` | `GlobalUsings.cs` | - |
| `template-ServiceLoggerMessages.cs` | `<ModuleName>ServiceLoggerMessages.cs` | Rename to match ModuleName |
| `template-Dockerfile.amd64` | `Dockerfile.amd64` | - |
| `template-Dockerfile.amd64.debug` | `Dockerfile.amd64.debug` | - |
| `template-.dockerignore` | `.dockerignore` | - |
| `template-.gitignore` | `.gitignore` | - |
| `template-launchSettings.json` | `Properties/launchSettings.json` | Create Properties/ first |

**Processing workflow:**

For each template file listed in the table above, process sequentially:

1. Read the template file from `assets/`
2. Replace all placeholders with calculated values
3. Write to target location in module directory using the target filename from the table
4. Report progress: "✓ Created <filename>"

Process all 11 files one at a time before proceeding to Step 6.

### Step 6: Create Shared Contract Constants (Conditional)

**If using shared contracts project:**

**Directory:** `<contracts_project_path>/<ModuleName>/`

**File:** `<ModuleName>Constants.cs`

**Process:**

1. Create directory if it doesn't exist
2. Read `template-ModuleConstants.cs`
3. Replace placeholders
4. Write to contracts project location

**If NOT using shared contracts:**

**Directory:** `<modules_base_path>/<modulename>/Contracts/`

**File:** `<ModuleName>Constants.cs`

**Process:**

1. Create `Contracts/` folder in module directory
2. Read `template-ModuleConstants.cs`
3. Replace `{{PROJECT_NAMESPACE}}.Modules.Contracts` with just `{{ModuleName}}.Contracts`
4. Write to module's Contracts folder

### Step 6.5: Create LoggingBuilderExtensions (First Module Only)

This extension method is required for `AddModuleConsoleLogging()` in Program.cs.

**If using shared contracts project:**

Check if `<contracts_project_path>/Extensions/LoggingBuilderExtensions.cs` exists:

- If file exists: Skip this step (already created by previous module)
- If file does NOT exist: Create it

**Directory:** `<contracts_project_path>/Extensions/`

**File:** `LoggingBuilderExtensions.cs`

**Process:**

1. Create `Extensions/` directory if it doesn't exist
2. Read `template-LoggingBuilderExtensions.cs`
3. Replace `{{PROJECT_NAMESPACE}}` placeholder
4. Write to contracts project Extensions folder
5. Report to user: "✓ Created LoggingBuilderExtensions.cs in shared contracts project"

**If NOT using shared contracts:**

**Directory:** `<modules_base_path>/<modulename>/Extensions/`

**File:** `LoggingBuilderExtensions.cs`

**Process:**

1. Create `Extensions/` folder in module directory
2. Read `template-LoggingBuilderExtensions.cs`
3. Replace `{{PROJECT_NAMESPACE}}.Modules.Contracts` with `{{ModuleName}}`
4. Write to module's Extensions folder

### Step 7: Scan and Select Deployment Manifests

Run the manifest scanning script:

```bash
python scripts/scan_manifests.py --root .
```

**Process the output:**

1. Parse JSON to get list of manifest files
2. If 0 manifests found: Go to Step 7.5 (create base manifest)
3. If 1 manifest found: Ask "Add module to <manifest_name>? (Yes/No)"
4. If multiple manifests found: Present selection list

### Step 7.5: Handle "No Manifests Found" Scenario

If 0 manifests found, ask user to create a base manifest or skip:

- **If Yes**: Prompt for manifest name (default: "base"), create from `assets/template-base.deployment.manifest.json` at `<manifests_base_path>/{name}.deployment.manifest.json`, then add module via the update script
- **If No**: Skip to Step 9

**Multi-manifest selection**: If multiple manifests found, present list with module counts and let user pick which to update (comma-separated numbers, 'all', or 'none').

### Step 8: Update Deployment Manifests (Automated)

For each selected manifest, run the update script:

```bash
python scripts/update_deployment_manifest.py \
  "<manifest_path>" \
  "<modulename>" \
  --registry "<container_registry>"
```

**Process the output:**

1. Check for `"success": true` in JSON output
2. Report to user: "✓ Added <modulename> to <manifest_name> (startup order: <startup_order>)"
3. If error: Report error and provide manual fallback instructions

If the script fails, show the error and provide manual fallback instructions from `references/deployment-manifests.md`.

### Step 9: Update README.md (Optional)

Search for "Solution project overview" or "IoTEdge modules" section in README.md:

**If section exists:**

- Add entry: `- **<modulename>** (\`<module_path>\`) - <ModuleDescription>`
- Insert alphabetically

**If section doesn't exist:**

- Ask user: "README.md section not found. Create it? (Yes/No)"

### Step 9.5: Add Module to Solution File

**Detect solution file:**

Run the solution detection script:

```bash
python scripts/manage_solution.py --root . --detect
```

**Process detection results:**

**If .slnx file found:**

Automatically add module to solution:

```bash
python scripts/manage_solution.py \
  --root . \
  --add-module "<module_csproj_path>" \
  --module-name "<ModuleName>"
```

- Parse JSON output
- If `action: "added"`: Report "✓ Added to solution at position <insertion_index>"
- If `action: "already_exists"`: Report "Module already in solution"
- If `action: "error"`: Show error and continue

**If .sln file found:**

- Run manual instruction generator:
  ```bash
  python scripts/manage_solution.py \
    --root . \
    --add-module "<module_csproj_path>" \
    --module-name "<ModuleName>"
  ```
- Parse JSON output and display `instructions` field to user
- Recommend using: `dotnet sln add "<module_csproj_path>"`

**If no solution file found:**

- Skip this step
- Inform user: "No solution file found. Module created successfully without solution integration."

### Step 10: Provide Summary and Next Steps

**Summary of created files:**
```
✓ Module scaffolding complete!

Created:
• Module directory: <module_full_path>/ (11 files)
• Constants file: <constants_full_path>
• LoggingBuilderExtensions: <"Created" or "Already exists - skipped">
• Updated manifests: <manifest_count> manifest(s) [or "Created base manifest" if first module]
• Solution integration: <"Added to .slnx" or "Manual instructions provided" or "Skipped">

Configuration:
• Container registry: <container_registry>
• Project namespace: <project_namespace>
• NuGet feed: <nuget_feed_url or "None">
• Shared contracts: <"Yes" or "No">
```

**Next steps for the user:**

1. Implement business logic in `<ModuleName>Service.cs` → `ExecuteAsync()`
2. Test locally: `dotnet run --project <module_path>` (uses mock IoT Hub client)
3. Build Docker image, push to registry, deploy manifest to IoT Hub

For post-scaffolding customizations (Quartz, config options, routing, direct methods, etc.), see `references/customizations.md`.

## Reference Documentation

- `references/module-structure.md` - Module structure, naming conventions, and notes
- `references/deployment-manifests.md` - Deployment manifest configuration
- `references/customizations.md` - Post-scaffolding customizations, error handling, and config file format
