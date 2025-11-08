# IoT Edge Module Structure Reference

This document describes the standard structure and files for IoT Edge modules in this project.

## Module Directory Structure

Each module follows this standard structure:

```
<modulename>/                           # Lowercase with "module" suffix
├── .dockerignore                       # Docker build exclusions
├── .gitignore                          # Git exclusions (bin/, obj/)
├── Dockerfile.amd64                    # Production build
├── Dockerfile.amd64.debug              # Debug build with vsdbg
├── module.json                         # IoT Edge module metadata
├── <ModuleName>.csproj                 # .NET 9.0 project file
├── Program.cs                          # Application entry point
├── GlobalUsings.cs                     # Global namespace imports
├── LoggingEventIdConstants.cs          # Logging event IDs
├── <ModuleName>Service.cs              # Main hosted service
├── <ModuleName>ServiceLoggerMessages.cs # Logging messages
├── Properties/
│   └── launchSettings.json             # Local debugging configuration
├── Services/                           # Optional: Business logic services
├── Contracts/                          # Optional: Module-specific contracts
├── Options/                            # Optional: Configuration option classes
├── Jobs/                               # Optional: Quartz scheduler jobs
└── [Other domain-specific folders]
```

## Required Files

### 1. module.json

**Purpose**: IoT Edge module metadata for build and deployment.

**Location**: `<modulename>/module.json`

**Schema**:
```json
{
  "$schema-version": "0.0.1",
  "description": "Module description",
  "image": {
    "repository": "yourregistry.azurecr.io/<modulename>",
    "tag": {
      "version": "0.0.${BUILD_BUILDID}",
      "platforms": {
        "amd64": "./Dockerfile.amd64",
        "amd64.debug": "./Dockerfile.amd64.debug"
      }
    },
    "buildOptions": [],
    "contextPath": "../../../"
  },
  "language": "csharp"
}
```

**Key fields**:
- `repository`: Azure Container Registry URL + lowercase module name
- `version`: Uses `${BUILD_BUILDID}` for CI/CD builds
- `platforms`: Maps platform to Dockerfile
- `contextPath`: Points to repo root (`../../../`) for multi-project Docker builds

### 2. .csproj

**Purpose**: .NET project configuration.

**Target framework**: `net9.0`
**Output type**: `Exe` (console application)
**Docker target OS**: `Linux`

**Required dependencies**:
- `Atc` - Common utilities
- `Atc.Azure.IoTEdge` - IoT Edge abstractions
- `Microsoft.Azure.Devices.Client` - IoT Hub SDK
- `Microsoft.Extensions.Hosting` - Generic Host

**Optional project reference**:
- Shared contracts project (e.g., `Company.ProjectName.Modules.Contracts`) - Shared constants and contracts across modules

### 3. Program.cs

**Purpose**: Application entry point using .NET Generic Host.

**Standard pattern**:
```csharp
using var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        services.AddLogging(builder =>
        {
            builder.AddModuleConsoleLogging();
        });

        if (hostContext.IsStandaloneMode())
        {
            services.AddSingleton<IModuleClientWrapper, MockModuleClientWrapper>();
        }
        else
        {
            services.AddModuleClientWrapper(TransportSettingsFactory.BuildMqttTransportSettings());
        }

        services.AddSingleton<IMethodResponseFactory, MethodResponseFactory>();

        // Add your service registrations here

        services.AddHostedService<YourModuleService>();
    })
    .UseConsoleLifetime()
    .Build();

await host.RunAsync();
```

**Key components**:
- `AddModuleConsoleLogging()` - Structured console logging
- `IsStandaloneMode()` - Detects local vs. edge runtime
- `AddModuleClientWrapper()` - IoT Hub connectivity with MQTT
- `AddHostedService<>()` - Main service registration

### 4. Main Service File

**Purpose**: Main module logic as a `BackgroundService`.

**Naming**: `<ModuleName>Service.cs`

**Responsibilities**:
- Open IoT Hub connection on startup
- Register direct method handlers
- Implement core module logic
- Handle graceful shutdown

### 5. GlobalUsings.cs

**Purpose**: Global namespace imports for cleaner code.

**Standard imports**:
```csharp
global using Microsoft.Extensions.DependencyInjection;
global using Microsoft.Extensions.Hosting;
global using Microsoft.Extensions.Logging;
```

### 6. LoggingEventIdConstants.cs

**Purpose**: Centralized logging event IDs.

**Standard event IDs**:
- `1000` - ModuleStarting
- `1001` - ModuleStarted
- `1002` - ModuleStopping
- `1003` - ModuleStopped

### 7. ServiceLoggerMessages.cs

**Purpose**: Compile-time logging using source generators.

**Pattern**:
```csharp
internal static partial class YourModuleServiceLoggerMessages
{
    [LoggerMessage(
        EventId = LoggingEventIdConstants.ModuleStarting,
        Level = LogLevel.Information,
        Message = "Module is starting")]
    internal static partial void LogModuleStarting(this ILogger logger);
}
```

### 8. Dockerfile.amd64

**Purpose**: Production Docker image build.

**Multi-stage build**:
1. **Build stage**: .NET SDK 9.0, restore dependencies, publish release build
2. **Runtime stage**: .NET Runtime 9.0, non-root user, security hardening

**Security features**:
- Non-root user (`moduleuser`, UID 2000)
- TPM access group (GID 3000)
- Minimal runtime image

### 9. Dockerfile.amd64.debug

**Purpose**: Debug Docker image with remote debugging support.

**Additional features**:
- vsdbg debugger installation
- Debug build configuration

### 10. .dockerignore

**Purpose**: Exclude files from Docker build context.

**Excludes**: bin/, obj/, .git, .vs, node_modules, etc.

### 11. .gitignore

**Purpose**: Exclude build artifacts from Git.

**Excludes**: bin/, obj/

### 12. Properties/launchSettings.json

**Purpose**: Local debugging configuration.

**Required environment variables**:
- `IOTEDGE_MODULEID` - Module identifier
- `EdgeHubConnectionString` - Local connection string for standalone mode
- `EdgeModuleCACertificateFile` - Certificate file path (can be empty)

## Shared Contracts

### Module Constants

**Location**: `<contracts-project-path>/<ModuleName>/<ModuleName>Constants.cs`

**Purpose**: Shared constants for module identification and direct methods.

**Structure**:
```csharp
namespace Company.ProjectName.Modules.Contracts.<ModuleName>;

public static class <ModuleName>Constants
{
    public const string ModuleId = "<modulename>";

    // Direct method names
    public const string DirectMethodExample = "ExampleMethod";
}
```

## Naming Conventions

- **Module directory**: Lowercase with "module" suffix (e.g., `mynewmodule`)
- **C# classes**: PascalCase without "module" suffix (e.g., `MyNewModule`)
- **Namespace**: PascalCase matching class name (e.g., `namespace MyNewModule;`)
- **Constants file**: `<ModuleName>Constants.cs` in shared contracts
- **Dockerfile**: `Dockerfile.amd64` and `Dockerfile.amd64.debug`

## Configuration Pattern

Modules use `IOptions<T>` for configuration:

1. **Define options class**:
   ```csharp
   public class MyModuleOptions
   {
       public string Setting { get; set; }
   }
   ```

2. **Register in DI**:
   ```csharp
   services.Configure<MyModuleOptions>(hostContext.Configuration);
   ```

3. **Inject options**:
   ```csharp
   public MyService(IOptions<MyModuleOptions> options)
   ```

4. **Set via environment variables** in deployment manifest:
   ```json
   "env": {
       "MyModuleOptions__Setting": {
           "value": "value"
       }
   }
   ```

## Optional Folders

- `Services/` - Business logic and integration services
- `Contracts/` - Module-specific data contracts (not shared)
- `Options/` - Configuration option classes
- `Jobs/` - Quartz scheduler job definitions (requires `AddQuartz()`)
- `Filters/` - Domain-specific filtering logic
- `Providers/` - Factory patterns, client providers
- `Publishers/` - Message publishers
- `Scrapers/` - Data scraping logic

## README.md Documentation

When creating a new module, update `README.md` in the repository root:

**Section**: "Solution project overview for IoTEdge modules"

Add your module to the list with a brief description of its purpose.
