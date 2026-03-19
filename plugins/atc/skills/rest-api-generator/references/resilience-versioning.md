# Resilience & Versioning Reference

Configure client-side resilience patterns and server-side API versioning.

---

## Resilience (Client-Side)

Built on **Polly v8**. Configured via OpenAPI extensions on the client spec.

### OpenAPI Extensions

| Extension | Type | Description |
|---|---|---|
| `x-retry-policy` | string | Policy name (required to enable) |
| `x-retry-enabled` | bool | Enable/disable (default: true) |
| `x-retry-max-attempts` | int | Maximum retry attempts |
| `x-retry-delay-seconds` | number | Base delay between retries |
| `x-retry-backoff` | string | `constant`, `linear`, `exponential` |
| `x-retry-use-jitter` | bool | Add random jitter to delays |
| `x-retry-timeout-seconds` | int | Overall timeout |
| `x-retry-circuit-breaker` | bool | Enable circuit breaker |
| `x-retry-cb-failure-ratio` | number | Failure ratio to trip breaker (0.0-1.0) |
| `x-retry-cb-sampling-duration` | int | Sampling window in seconds |
| `x-retry-cb-minimum-throughput` | int | Min requests before breaker activates |
| `x-retry-cb-break-duration` | int | Break duration in seconds |
| `x-retry-handle-429` | bool | Automatically handle 429 Too Many Requests |

### Backoff Strategies

| Strategy | Behavior | Use When |
|---|---|---|
| `constant` | Same delay every retry | Simple retry scenarios |
| `linear` | Delay increases linearly (1s, 2s, 3s...) | Moderate backpressure |
| `exponential` | Delay doubles (1s, 2s, 4s, 8s...) | Service recovery scenarios |

Add `x-retry-use-jitter: true` to prevent thundering herd with exponential backoff.

### Configuration Examples

**Basic retry:**
```yaml
x-retry-policy: "standard"
x-retry-max-attempts: 3
x-retry-delay-seconds: 1
x-retry-backoff: exponential
x-retry-use-jitter: true
```

**With circuit breaker:**
```yaml
x-retry-policy: "resilient"
x-retry-max-attempts: 3
x-retry-delay-seconds: 1
x-retry-backoff: exponential
x-retry-use-jitter: true
x-retry-timeout-seconds: 30
x-retry-circuit-breaker: true
x-retry-cb-failure-ratio: 0.5
x-retry-cb-sampling-duration: 30
x-retry-cb-minimum-throughput: 10
x-retry-cb-break-duration: 30
x-retry-handle-429: true
```

### Circuit Breaker States

```
Closed → (failures exceed ratio) → Open → (break duration expires) → Half-Open → (probe succeeds) → Closed
                                                                    → (probe fails) → Open
```

- **Closed:** Normal operation, tracking failures
- **Open:** All requests fail fast, no calls to downstream
- **Half-Open:** One probe request allowed to test recovery

### Disabling Retry

For non-idempotent operations:
```yaml
paths:
  /payments:
    post:
      x-retry-enabled: false
```

**Idempotency guidelines:**
- GET, HEAD, OPTIONS, PUT, DELETE — generally safe to retry
- POST — disable retry unless the operation is idempotent

### Generated Code

The generator produces:
- `ResiliencePolicies` static class with policy definitions
- DI extension method for configuring `HttpClient` with resilience
- Integration with `Microsoft.Extensions.Http.Resilience`

---

## API Versioning (Server-Side)

Requires `Asp.Versioning.Http` package.

### Strategies

#### QueryString

```
GET /pets?api-version=1.0
```

Marker file:
```json
{
  "versioningStrategy": "QueryString",
  "defaultApiVersion": "1.0",
  "versionQueryParameterName": "api-version",
  "assumeDefaultVersionWhenUnspecified": true
}
```

#### UrlSegment

```
GET /v1/pets
```

Marker file:
```json
{
  "versioningStrategy": "UrlSegment",
  "defaultApiVersion": "1.0",
  "versionRouteSegmentTemplate": "v{version:apiVersion}"
}
```

**Important:** UrlSegment requires every path to include the version segment explicitly.

#### Header

```
GET /pets
X-Api-Version: 1.0
```

Marker file:
```json
{
  "versioningStrategy": "Header",
  "defaultApiVersion": "1.0",
  "versionHeaderName": "X-Api-Version",
  "assumeDefaultVersionWhenUnspecified": true
}
```

### Configuration Options

| Option | Default | Description |
|---|---|---|
| `versioningStrategy` | `None` | Strategy to use |
| `defaultApiVersion` | `"1.0"` | Default version |
| `versionQueryParameterName` | `"api-version"` | Query parameter name |
| `versionHeaderName` | `"X-Api-Version"` | Header name |
| `versionRouteSegmentTemplate` | `"v{version:apiVersion}"` | URL segment template |
| `reportApiVersions` | `true` | Report versions in response headers |
| `assumeDefaultVersionWhenUnspecified` | `true` | Use default when not specified |

### Response Headers

When `reportApiVersions: true`:

| Header | Description |
|---|---|
| `api-supported-versions` | All supported versions |
| `api-deprecated-versions` | Deprecated versions |

### Strategy Comparison

| Feature | QueryString | UrlSegment | Header |
|---|---|---|---|
| URL changes | No | Yes | No |
| Browser-friendly | Yes | Yes | No (needs client) |
| Default version | Supported | Not supported | Supported |
| Cache-friendly | Moderate | Excellent | Requires Vary header |
| Client complexity | Low | Low | Medium |
