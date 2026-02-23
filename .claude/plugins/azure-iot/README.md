# Azure IoT Plugin

Azure IoT services automation and scaffolding for IoT Edge modules, IoT Hub, and related services.

## Overview

This plugin provides tools and automation for working with Azure IoT services, with a focus on development efficiency and best practices.

## Skills

### iot-edge-module

Scaffolds new Azure IoT Edge modules with complete project structure, deployment manifests, and solution integration.

**Features:**

- Creates module with .NET project structure
- Generates Dockerfiles for development and production
- Adds module to deployment manifest
- Integrates with existing .NET solutions
- Supports first-module scenarios
- Includes logging, service patterns, and constants

**Usage:**

```markdown
Use the iot-edge-module skill to create a new module named [ModuleName]
```

The skill can also be invoked directly:

```
/azure-iot:iot-edge-module
```

## Requirements

- .NET SDK
- Python 3.x

## License

MIT
