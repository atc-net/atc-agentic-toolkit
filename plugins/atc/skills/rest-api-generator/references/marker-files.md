# Marker Files Reference

Marker files are JSON configuration files placed in the project root that control what the source generator produces.

---

## `.atc-rest-api-server` — Server Contracts

Generates models, endpoints, and type-safe result types.

### Base Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generate` | bool | `true` | Enable/disable generation |
| `validateSpecificationStrategy` | enum | `"Strict"` | Validation level: `None`, `Standard`, `Strict` |
| `includeDeprecated` | bool | `false` | Include deprecated operations |
| `namespace` | string | null | Override root namespace |
| `useServersBasePath` | bool | `true` | Extract base path from OpenAPI `servers` |
| `removeNamespaceGroupSeparatorInGlobalUsings` | bool | `false` | Simplify global using directives |

### Organization Options

| Option | Type | Default | Description |
|---|---|---|---|
| `subFolderStrategy` | enum | `"FirstPathSegment"` | Code organization: `None`, `FirstPathSegment`, `OpenApiTag` |

### Package Integration

| Option | Type | Default | Description |
|---|---|---|---|
| `useMinimalApiPackage` | enum | `"Auto"` | Use Atc.Rest.MinimalApi: `Auto`, `Enabled`, `Disabled` |
| `useValidationFilter` | enum | `"Auto"` | Validation filter middleware: `Auto`, `Enabled`, `Disabled` |
| `useGlobalErrorHandler` | enum | `"Auto"` | Global exception handler: `Auto`, `Enabled`, `Disabled` |

### Versioning Options

| Option | Type | Default | Description |
|---|---|---|---|
| `versioningStrategy` | enum | `"None"` | `None`, `QueryString`, `UrlSegment`, `Header` |
| `defaultApiVersion` | string | `"1.0"` | Default API version |
| `versionQueryParameterName` | string | `"api-version"` | Query parameter name |
| `versionHeaderName` | string | `"X-Api-Version"` | Header name |
| `versionRouteSegmentTemplate` | string | `"v{version:apiVersion}"` | URL segment template |
| `reportApiVersions` | bool | `true` | Include version info in response headers |
| `assumeDefaultVersionWhenUnspecified` | bool | `true` | Fall back to default version |

### Advanced Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generatePartialModels` | bool | `false` | Generate models as partial classes |
| `generateWebhooks` | bool | `false` | Generate webhook endpoints |
| `webhookBasePath` | string | `"/webhooks"` | Base path for webhook endpoints |
| `multiPartConfiguration` | object | null | Multi-file spec merging config |

### Full Example

```json
{
  "generate": true,
  "validateSpecificationStrategy": "Strict",
  "useServersBasePath": true,
  "subFolderStrategy": "FirstPathSegment",
  "useMinimalApiPackage": "Auto",
  "useValidationFilter": "Auto",
  "useGlobalErrorHandler": "Auto",
  "versioningStrategy": "QueryString",
  "defaultApiVersion": "1.0",
  "reportApiVersions": true,
  "assumeDefaultVersionWhenUnspecified": true,
  "generatePartialModels": false,
  "generateWebhooks": false
}
```

---

## `.atc-rest-api-server-handlers` — Handler Scaffolds

Generates handler implementations that process requests.

### Base Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generate` | bool | `true` | Enable/disable generation |
| `validateSpecificationStrategy` | enum | `"Strict"` | Validation level |
| `includeDeprecated` | bool | `false` | Include deprecated operations |
| `namespace` | string | null | Override namespace |
| `contractsNamespace` | string | null | Namespace of server contracts |
| `removeNamespaceGroupSeparatorInGlobalUsings` | bool | `false` | Simplify global usings |

### Handler Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generateHandlersOutput` | string | `"ApiHandlers"` | Output subfolder for handlers |
| `subFolderStrategy` | enum | `"FirstPathSegment"` | Code organization strategy |
| `handlerSuffix` | string | `"Handler"` | Suffix for handler class names |
| `stubImplementation` | enum | `"throw-not-implemented"` | Stub type: `throw-not-implemented`, `error-501`, `default-value` |

### Full Example

```json
{
  "generate": true,
  "validateSpecificationStrategy": "Strict",
  "namespace": "MyApi.Domain",
  "contractsNamespace": "MyApi.Contracts",
  "subFolderStrategy": "FirstPathSegment",
  "handlerSuffix": "Handler",
  "stubImplementation": "throw-not-implemented"
}
```

---

## `.atc-rest-api-client` — Client Contracts

Generates typed C# HTTP client code.

### Base Options

Same as server base options (`generate`, `validateSpecificationStrategy`, `includeDeprecated`, `namespace`, `useServersBasePath`, `removeNamespaceGroupSeparatorInGlobalUsings`).

### Client Options

| Option | Type | Default | Description |
|---|---|---|---|
| `generationMode` | enum | `"TypedClient"` | `TypedClient` (single class) or `EndpointPerOperation` (interface per endpoint) |
| `clientSuffix` | string | `"Client"` | Suffix for client class names |
| `httpClientName` | string | auto | Named HttpClient for DI |
| `generateOAuthTokenManagement` | bool | `false` | Auto-generate OAuth token handling |
| `generatePartialModels` | bool | `false` | Generate models as partial classes |
| `errorResponseFormat` | enum | `"ProblemDetails"` | Error format: `ProblemDetails`, `PlainText`, `PlainTextOnly`, `Custom` |
| `customErrorResponseModel` | string | null | Custom error model type (when format is `Custom`) |
| `multiPartConfiguration` | object | null | Multi-file spec merging config |

### Full Example

```json
{
  "generate": true,
  "validateSpecificationStrategy": "Strict",
  "generationMode": "TypedClient",
  "clientSuffix": "Client",
  "generateOAuthTokenManagement": true,
  "errorResponseFormat": "ProblemDetails"
}
```

---

## Enum Reference

### ValidateSpecificationStrategy
- `None` — No validation
- `Standard` — Basic validation
- `Strict` — Full validation with naming conventions, title requirements

### SubFolderStrategy
- `None` — Flat structure
- `FirstPathSegment` — Group by first path segment (e.g., `/pets/...` → `Pets/`)
- `OpenApiTag` — Group by OpenAPI tag

### PackageMode (useMinimalApiPackage, useValidationFilter, useGlobalErrorHandler)
- `Auto` — Detect based on project references
- `Enabled` — Force enable
- `Disabled` — Force disable

### GenerationMode
- `TypedClient` — Single client class with all endpoints as methods
- `EndpointPerOperation` — One interface per endpoint (requires `Atc.Rest.Client`)

### StubImplementation
- `throw-not-implemented` — `throw new NotImplementedException()`
- `error-501` — Return 501 Not Implemented result
- `default-value` — Return default success result
