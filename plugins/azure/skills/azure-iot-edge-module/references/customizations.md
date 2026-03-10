# Customizations, Error Handling & Configuration

## Table of Contents

- [Common Customizations](#common-customizations)
- [Error Handling](#error-handling)
- [Configuration File Format](#configuration-file-format)
- [Notes](#notes)

## Common Customizations

After scaffolding, users may want to:

**1. Add Quartz scheduler support:**

- Add NuGet package `Quartz`
- Register: `services.AddQuartz()`
- Create `Jobs/` folder with `IJob` implementations

**2. Add configuration options:**

- Create `Options/` folder
- Define option classes
- Register: `services.Configure<MyOptions>(hostContext.Configuration)`
- Set via env vars in deployment manifest

**3. Add module-to-module routing:**

- Update route in deployment manifest:
  ```json
  "route": "FROM /messages/modules/source/* INTO BrokeredEndpoint(\"/modules/target/inputs/input1\")"
  ```

**4. Add host binds (replace volume mounts):**

- Update deployment manifest `createOptions`:
  ```json
  "Binds": ["/host/path/:/container/path/"]
  ```

**5. Add privileged access (for device access like TPM):**

- Update deployment manifest `createOptions.HostConfig`:
  ```json
  "Privileged": true
  ```

**6. Remove volume mount (for stateless modules):**

- Delete `Mounts` section from deployment manifest

## Error Handling

**Module directory exists:**

- Prompt: "Overwrite/Rename/Cancel"
- If Overwrite: Delete existing directory first
- If Rename: Go back to Step 3 with new name

**Manifest update fails:**

- Show error from Python script
- Provide manual update instructions
- Continue with other manifests

**Detection fails:**

- Fall back to manual prompts for each value
- Offer to save configuration for future runs

**Missing Python:**

- If Python not available, provide manual instructions for all steps
- Skip automated manifest updates, provide JSON templates

## Configuration File Format

Saved configuration (`.claude/.iot-edge-module-config.json`):

```json
{
  "config_source": "detected",
  "modules_base_path": "src/IoTEdgeModules/modules",
  "contracts_project_path": "src/Company.Modules.Contracts",
  "contracts_project_name": "Company.Modules.Contracts",
  "manifests_base_path": "src/IoTEdgeModules",
  "project_namespace": "Company.IoT.EdgeAPI",
  "container_registry": "myregistry.azurecr.io",
  "nuget_feed_url": null,
  "has_contracts_project": true,
  "has_nuget_feed": false
}
```

Users can manually edit this file to override auto-detection.

## Notes

- Module directory names: lowercase with "module" suffix (e.g., `dataprocessormodule`)
- C# class names: PascalCase with "Module" suffix (e.g., `DataProcessorModule`)
- Namespaces: PascalCase, no "module" suffix (e.g., `namespace DataProcessorModule;`)
- All modules use non-root user (moduleuser, UID 2000) for security
- Build context is repo root (`contextPath: "../../../"`)
- Log rotation: 10MB max size, 10 files
- Default route: Module outputs → `$upstream` (IoT Hub)
