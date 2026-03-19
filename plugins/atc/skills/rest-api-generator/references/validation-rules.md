# Validation & Analyzer Rules Reference

---

## Input Validation

### Three Approaches

| Approach | Method | Best For |
|---|---|---|
| **DataAnnotations** | Auto-generated from OpenAPI constraints | Simple constraints (required, length, range) |
| **FluentValidation** | Manual validators with Atc.Rest.MinimalApi | Complex business rules |
| **Combined** (recommended) | Both DataAnnotations + FluentValidation | Production applications |

### DataAnnotations Auto-Generation

OpenAPI constraints automatically generate C# validation attributes:

| OpenAPI Constraint | C# Attribute |
|---|---|
| `required` | `[Required]` |
| `minLength` / `maxLength` | `[StringLength(max, MinimumLength = min)]` |
| `minimum` / `maximum` | `[Range(min, max)]` |
| `pattern` | `[RegularExpression("...")]` |
| `minItems` / `maxItems` | `[MinLength(n)]` / `[MaxLength(n)]` |

### FluentValidation Setup

1. Install packages:
```xml
<PackageReference Include="FluentValidation" Version="*" />
<PackageReference Include="Atc.Rest.MinimalApi" Version="*" />
```

2. Create validators:
```csharp
public class CreatePetRequestValidator : AbstractValidator<CreatePetRequest>
{
    public CreatePetRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Status).IsInEnum();
    }
}
```

3. Register in DI:
```csharp
builder.Services.AddValidatorsFromAssemblyContaining<CreatePetRequestValidator>();
```

4. Enable validation filter in marker file:
```json
{
  "useValidationFilter": "Enabled"
}
```

### Validation Error Response

Returns RFC 7807 `ValidationProblemDetails`:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Name": ["'Name' must not be empty."],
    "Status": ["'Status' has a range of values which does not include '99'."]
  }
}
```

---

## Analyzer Rules Reference

Rule ID format: `ATC_API_[CATEGORY][NUMBER]`

### Generation Rules (GEN)

| Rule | Severity | Description |
|---|---|---|
| GEN001 | Error | Code generation failed |
| GEN002 | Warning | Generation skipped (disabled in marker file) |
| GEN003 | Warning | No operations found in specification |
| GEN004 | Info | Generation completed successfully |
| GEN005 | Warning | Partial generation (some operations skipped) |
| GEN006 | Error | Invalid marker file configuration |
| GEN007 | Warning | Duplicate operation IDs detected |
| GEN008 | Warning | Missing specification file |
| GEN009 | Error | Unsupported OpenAPI version |

### Dependency Rules (DEP)

| Rule | Severity | Description |
|---|---|---|
| DEP001 | Warning | Missing recommended package |
| DEP002 | Error | Required package not installed |
| DEP003 | Info | Package version update available |
| DEP004 | Warning | Conflicting package versions |
| DEP005 | Warning | Deprecated package reference |
| DEP006 | Info | Optional package would enable feature |
| DEP007 | Warning | Package compatibility issue |

### Naming Rules (NAM)

| Rule | Severity | Description |
|---|---|---|
| NAM001 | Warning | Operation ID not PascalCase |
| NAM002 | Warning | Schema name not PascalCase |
| NAM003 | Warning | Parameter name not camelCase |
| NAM004 | Warning | Property name not camelCase |
| NAM005 | Info | Enum value naming suggestion |
| NAM006 | Warning | Path segment not kebab-case |

### Security Rules (SEC)

| Rule | Severity | Description |
|---|---|---|
| SEC001 | Warning | Security scheme defined but never used |
| SEC002 | Info | Operation has no security requirement |
| SEC003 | Warning | OAuth2 scope defined but never referenced |
| SEC004 | Warning | API Key in query parameter (prefer header) |
| SEC005 | Info | Consider adding rate limiting |
| SEC006 | Warning | Missing HTTPS in server URL |
| SEC007 | Warning | Bearer format not specified |
| SEC008 | Info | Consider adding CORS configuration |
| SEC009 | Warning | Overly permissive security scheme |
| SEC010 | Warning | x-authorize-roles with empty value |

### Schema Rules (SCH)

| Rule | Severity | Description |
|---|---|---|
| SCH001 | Warning | Schema missing description |
| SCH002 | Warning | Property missing type |
| SCH003 | Warning | Enum missing values |
| SCH004 | Info | Consider using $ref instead of inline schema |
| SCH005 | Warning | Circular reference detected |
| SCH006 | Warning | Unused schema definition |
| SCH007 | Warning | Missing required properties |
| SCH008 | Info | Large schema (consider splitting) |
| SCH009 | Warning | oneOf/anyOf without discriminator |
| SCH010 | Warning | Nullable without explicit default |
| SCH011 | Warning | String without maxLength |
| SCH012 | Warning | Array without maxItems |
| SCH013 | Warning | Number without range constraints |

### Operation Rules (OPR)

| Rule | Severity | Description |
|---|---|---|
| OPR001 | Error | Missing operationId |
| OPR002 | Warning | Missing operation summary/description |
| OPR003 | Warning | Missing response description |
| OPR004 | Warning | DELETE should return 204 or 200 |
| OPR005 | Warning | POST should return 201 |
| OPR006 | Warning | Missing error responses (400, 404, 500) |
| OPR007-025 | Various | Additional operation conventions |

### Rule Suppression

**Pragma:**
```csharp
#pragma warning disable ATC_API_NAM001
```

**.editorconfig:**
```ini
[*.cs]
dotnet_diagnostic.ATC_API_NAM001.severity = none
```

**Project file:**
```xml
<PropertyGroup>
  <NoWarn>ATC_API_NAM001;ATC_API_SCH001</NoWarn>
</PropertyGroup>
```
