# Rate Limiting & Caching Reference

Configure rate limiting and caching via OpenAPI extensions at document, path, or operation level.

---

## Rate Limiting

### OpenAPI Extensions

| Extension | Type | Description |
|---|---|---|
| `x-ratelimit-policy` | string | Policy name (required to enable) |
| `x-ratelimit-enabled` | bool | Enable/disable (default: true) |
| `x-ratelimit-permit-limit` | int | Max requests per window |
| `x-ratelimit-window-seconds` | int | Window duration |
| `x-ratelimit-queue-limit` | int | Max queued requests |
| `x-ratelimit-algorithm` | string | `fixed`, `sliding`, `token-bucket`, `concurrency` |

### Algorithms

| Algorithm | Best For | Behavior |
|---|---|---|
| `fixed` | Simple rate limiting | Resets counter at fixed intervals |
| `sliding` | Smooth traffic | Rolling window, no burst spikes |
| `token-bucket` | Burst-tolerant | Allows bursts up to bucket size, refills at steady rate |
| `concurrency` | Resource protection | Limits concurrent requests, no time window |

### Configuration at Different Levels

**Document level** (applies to all operations):
```yaml
x-ratelimit-policy: "global"
x-ratelimit-permit-limit: 1000
x-ratelimit-window-seconds: 60
x-ratelimit-algorithm: sliding
```

**Path level:**
```yaml
paths:
  /pets:
    x-ratelimit-policy: "standard"
    x-ratelimit-permit-limit: 100
    x-ratelimit-window-seconds: 60
```

**Operation level:**
```yaml
paths:
  /pets:
    post:
      x-ratelimit-policy: "write-limit"
      x-ratelimit-permit-limit: 10
      x-ratelimit-window-seconds: 60
      x-ratelimit-algorithm: fixed
```

### Disabling Rate Limiting

```yaml
paths:
  /health:
    get:
      x-ratelimit-enabled: false
```

### Generated Code

The generator produces:
- `RateLimitPolicies` static class with policy definitions
- DI extension method for registering policies
- Endpoint mapping with `.RequireRateLimiting()` calls

### Response Headers

| Header | Description |
|---|---|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Seconds until window resets |
| `Retry-After` | Seconds to wait (when rate limited) |

---

## Caching

### Two Approaches

| Approach | Best For | Package |
|---|---|---|
| **Output Caching** | Full HTTP response caching, CDN-like | Built-in ASP.NET Core |
| **HybridCache** | Fine-grained data caching, L1+L2 | `Microsoft.Extensions.Caching.Hybrid` |

### Decision Guide

- **Output Caching:** Cache entire HTTP responses. Best for GET endpoints returning identical data for same URL. Supports `Vary` by query, header, route.
- **HybridCache:** Cache data objects. Best for computed/aggregated data. Supports L1 (in-memory) + L2 (distributed Redis/SQL). Supports sliding expiration.

### OpenAPI Extensions — Core

| Extension | Type | Description |
|---|---|---|
| `x-cache-type` | string | `output` or `hybrid` |
| `x-cache-policy` | string | Policy name |
| `x-cache-enabled` | bool | Enable/disable (default: true) |
| `x-cache-expiration-seconds` | int | Absolute expiration |
| `x-cache-tags` | string[] | Tags for grouped invalidation |
| `x-cache-vary-by-query` | string[] | Vary by query parameters |
| `x-cache-vary-by-header` | string[] | Vary by request headers |

### Output Caching Extensions

| Extension | Type | Description |
|---|---|---|
| `x-cache-vary-by-route` | string[] | Vary by route values |

### HybridCache Extensions

| Extension | Type | Description |
|---|---|---|
| `x-cache-mode` | string | `l1` (memory), `l2` (distributed), `l1l2` (hybrid) |
| `x-cache-sliding-expiration-seconds` | int | Sliding expiration |
| `x-cache-key-prefix` | string | Cache key prefix |

### Output Caching Example

```yaml
paths:
  /pets:
    get:
      x-cache-type: output
      x-cache-policy: "pets-cache"
      x-cache-expiration-seconds: 300
      x-cache-tags: ["pets"]
      x-cache-vary-by-query: ["status", "pageSize"]
```

### HybridCache Example

```yaml
paths:
  /reports/summary:
    get:
      x-cache-type: hybrid
      x-cache-policy: "reports-cache"
      x-cache-expiration-seconds: 600
      x-cache-sliding-expiration-seconds: 120
      x-cache-mode: l1l2
      x-cache-key-prefix: "report"
      x-cache-tags: ["reports"]
```

### Cache Invalidation

**By tags:**
```csharp
// Auto-generated invalidation helper
await cacheInvalidator.InvalidateByTagAsync("pets");
```

**Programmatic:**
```csharp
// In handler, after mutation
await outputCacheStore.EvictByTagAsync("pets", cancellationToken);
```

### Disabling Caching

```yaml
paths:
  /pets/{petId}:
    put:
      x-cache-enabled: false
```
