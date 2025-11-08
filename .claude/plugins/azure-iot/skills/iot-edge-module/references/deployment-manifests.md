# IoT Edge Deployment Manifests Reference

This document provides reference information for the deployment manifest structure used in this project.

## Manifest Types

Projects typically use one or more deployment manifests to organize modules:

### Example: Base Deployment Manifest

**Naming pattern**: `*.deployment.manifest.json` (e.g., `base.deployment.manifest.json`)

**Purpose**: Contains modules that should be deployed to all or specific edge devices.

**Example modules**:
- Metric collector modules - Collects operational metrics
- Telemetry transformation modules - Enriches raw telemetry
- Custom business logic modules

**Routing**:
- Modules typically route to `$upstream` (IoT Hub) or to other modules via BrokeredEndpoint

## Deployment Manifest Structure

### Top-Level Structure

```json
{
  "modulesContent": {
    "$edgeAgent": { ... },
    "$edgeHub": { ... }
  }
}
```

### Module Definition ($edgeAgent)

Each module is defined under `$edgeAgent` with the following structure:

```json
"properties.desired.modules.<modulename>": {
  "version": "1.0",
  "type": "docker",
  "status": "running",
  "restartPolicy": "always",
  "startupOrder": <number>,
  "settings": {
    "image": "${MODULES.<modulename>}",
    "createOptions": {
      "HostConfig": {
        "LogConfig": {
          "Type": "json-file",
          "Config": {
            "max-size": "10m",
            "max-file": "10"
          }
        },
        "Binds": [
          // Optional host volume binds
        ],
        "Mounts": [
          // Optional volume mounts
        ]
      }
    }
  },
  "env": {
    // Optional environment variables
  }
}
```

**Key fields**:
- `version`: Module version (typically "1.0")
- `type`: Always "docker"
- `status`: Desired status ("running")
- `restartPolicy`: Restart behavior ("always")
- `startupOrder`: Module startup sequence (lower starts first, system modules use 0)
- `image`: Container image (use variable substitution: `${MODULES.<modulename>}`)
- `createOptions`: Docker container creation options
  - `LogConfig`: Log rotation settings (10m max size, 10 files)
  - `Binds`: Host path bindings for persistent storage
  - `Mounts`: Named volume mounts
- `env`: Environment variables (use variable substitution for secrets)

### Routing Configuration ($edgeHub)

Each route is defined under `$edgeHub`:

```json
"properties.desired.routes.<routename>": {
  "route": "<route expression>",
  "priority": 0,
  "timeToLiveSecs": 86400
}
```

**Common route patterns**:

1. **Module to IoT Hub (upstream)**:
   ```json
   "route": "FROM /messages/modules/<modulename>/outputs/* INTO $upstream"
   ```

2. **Module to module (BrokeredEndpoint)**:
   ```json
   "route": "FROM /messages/modules/<sourcemodule>/* INTO BrokeredEndpoint(\"/modules/<targetmodule>/inputs/<inputname>\")"
   ```

**Key fields**:
- `route`: Route expression using IoT Edge routing syntax
- `priority`: Route priority (0 = normal)
- `timeToLiveSecs`: Message TTL (86400 = 24 hours)

### Variable Substitution

Manifests use variable substitution for dynamic values:

- `${MODULES.<modulename>}` - Module container image URI
- `${ContainerRegistryUserName}` - Registry username
- `${ContainerRegistryPassword}` - Registry password
- `${ContainerRegistryLoginServer}` - Registry server URL
- `${LogAnalyticsWorkspaceId}` - Log Analytics workspace ID
- `${LogAnalyticsWorkspaceSharedKey}` - Log Analytics shared key
- `${IotHubResourceId}` - IoT Hub resource ID

## Module-Specific Patterns

### Modules with Volume Mounts

Use named volumes for module-specific storage:

```json
"Mounts": [
  {
    "Type": "volume",
    "Target": "/app/data/",
    "Source": "<modulename>"
  }
]
```

### Modules with Host Binds

Use host binds for shared storage or device access:

```json
"Binds": [
  "/srv/aziotedge/opc/opcpublisher/:/app/opc/opcpublisher/",
  "/dev/tpm0:/dev/tpm0"
]
```

### Modules with Privileged Access

For modules requiring device access (e.g., TPM):

```json
"Privileged": true
```

### Modules with Environment Variables

Configure modules via environment variables:

```json
"env": {
  "OptionsClass__PropertyName": {
    "value": "value or ${VariableSubstitution}"
  }
}
```

## Adding a New Module to a Manifest

To add a new module to a deployment manifest:

1. **Add module definition to `$edgeAgent`**:
   - Use `properties.desired.modules.<modulename>` as the key
   - Set appropriate `startupOrder` (consider dependencies)
   - Set `image` to `${MODULES.<modulename>}`
   - Configure `createOptions` (log rotation, binds, mounts)
   - Add environment variables if needed

2. **Add routing to `$edgeHub`**:
   - Use descriptive route name: `properties.desired.routes.<modulename>ToIoTHub`
   - Set route expression based on message flow
   - Use standard priority (0) and TTL (86400)

3. **Update system properties** (only if needed):
   - System modules (`edgeAgent`, `edgeHub`) are defined once
   - Runtime registry credentials are shared across manifests

## Example: Adding a New Module

```json
{
  "modulesContent": {
    "$edgeAgent": {
      "properties.desired.modules.mynewmodule": {
        "version": "1.0",
        "type": "docker",
        "status": "running",
        "restartPolicy": "always",
        "startupOrder": 5,
        "settings": {
          "image": "${MODULES.mynewmodule}",
          "createOptions": {
            "HostConfig": {
              "LogConfig": {
                "Type": "json-file",
                "Config": {
                  "max-size": "10m",
                  "max-file": "10"
                }
              },
              "Mounts": [
                {
                  "Type": "volume",
                  "Target": "/app/data/",
                  "Source": "mynewmodule"
                }
              ]
            }
          }
        }
      }
    },
    "$edgeHub": {
      "properties.desired.routes.mynewmoduleToIoTHub": {
        "route": "FROM /messages/modules/mynewmodule/outputs/* INTO $upstream",
        "priority": 0,
        "timeToLiveSecs": 86400
      }
    }
  }
}
```
