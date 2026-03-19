# Security Reference

Comprehensive guide to configuring authentication and authorization in generated APIs.

---

## Decision Tree

1. **Need authentication?** → Define security scheme in OpenAPI `components/securitySchemes`
2. **Need authorization?** → Apply `security` at operation or document level
3. **Need role-based access?** → Add `x-authorize-roles` extension
4. **Need scope-based access?** → Use OAuth2 scopes in `security` requirements

---

## Security Schemes

### JWT Bearer Authentication

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Apply to an operation:
```yaml
paths:
  /pets:
    get:
      security:
        - BearerAuth: []
```

### OAuth2 with Scopes

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            read:pets: Read pet data
            write:pets: Create and update pets
            admin: Full administrative access

paths:
  /pets:
    get:
      security:
        - OAuth2: [read:pets]
    post:
      security:
        - OAuth2: [write:pets]
```

### API Key Authentication

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

paths:
  /webhooks:
    post:
      security:
        - ApiKeyAuth: []
```

### OpenID Connect

```yaml
components:
  securitySchemes:
    OpenIdConnect:
      type: openIdConnect
      openIdConnectUrl: https://auth.example.com/.well-known/openid-configuration
```

---

## Role-Based Authorization

Use the `x-authorize-roles` extension on any operation:

```yaml
paths:
  /admin/settings:
    get:
      security:
        - BearerAuth: []
      x-authorize-roles: "Admin"

  /pets:
    get:
      security:
        - BearerAuth: []
      x-authorize-roles: "Admin,User,ReadOnly"

    delete:
      security:
        - BearerAuth: []
      x-authorize-roles: "Admin"
```

Multiple roles are comma-separated. The generated code adds `[Authorize(Roles = "...")]` or equivalent minimal API authorization.

---

## Generated Security Code

### With Atc.Rest.MinimalApi

When `useMinimalApiPackage` is `Auto` or `Enabled`, security is automatically wired:

```csharp
// Auto-generated endpoint registration
app.MapGet("/admin/settings", handler.ExecuteAsync)
   .RequireAuthorization(policy => policy.RequireRole("Admin"));

app.MapGet("/pets", handler.ExecuteAsync)
   .RequireAuthorization(policy => policy.RequireRole("Admin", "User", "ReadOnly"));
```

### Manual Configuration

When not using the MinimalApi package, configure in `Program.cs`:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.example.com";
        options.Audience = "my-api";
    });

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
```

---

## Error Handling

Authentication/authorization failures return RFC 7807 ProblemDetails:

```json
{
  "type": "https://tools.ietf.org/html/rfc7235#section-3.1",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Bearer token is missing or invalid"
}
```

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "User does not have the required role: Admin"
}
```

---

## Best Practices

1. **Apply security at the right level** — Use document-level `security` for default protection, override at operation level
2. **Use meaningful scope names** — `read:pets`, `write:pets` not `scope1`, `scope2`
3. **Separate authentication from authorization** — Security scheme = who you are; roles/scopes = what you can do
4. **Prefer role-based over endpoint-based** — Roles scale better than per-endpoint policies

## Anti-Patterns to Avoid

- Defining security schemes but never applying them
- Using API keys for user authentication (use for service-to-service only)
- Mixing authentication schemes without clear precedence
- Overly broad roles that grant too much access
