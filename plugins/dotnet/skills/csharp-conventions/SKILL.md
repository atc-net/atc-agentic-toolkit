---
name: csharp-conventions
description: >
  General C# coding conventions covering latest language features (C# 13), nullable reference types,
  naming conventions, formatting rules, exception handling, project structure, data access patterns,
  validation, and structured logging. Apply this skill whenever writing, reviewing, or refactoring
  C# code -- including when the user works with C# classes, interfaces, records, enums, or any .NET
  code that should follow modern C# idioms and best practices, even if they do not explicitly ask
  for "conventions" or "best practices." This does NOT cover async/await patterns (see csharp-async)
  or XML documentation specifics (see csharp-docs).
user-invocable: false
---

# C# Coding Conventions

Apply these conventions when writing, reviewing, or refactoring C# code. They reflect modern C# (up to C# 13) and current .NET idioms. For async/await-specific guidance, defer to the **csharp-async** skill. For XML documentation details, defer to **csharp-docs**.

## Modern Language Features

Prefer the latest language features where they improve clarity and reduce boilerplate. A shorter file that expresses the same intent is easier to review, easier to maintain, and produces fewer merge conflicts.

### File-Scoped Namespaces

Use file-scoped namespaces to eliminate one level of indentation across the entire file:

```csharp
namespace MyApp.Services;

public class OrderService { }
```

### Primary Constructors

Use primary constructors for classes and structs whose constructor simply captures dependencies or parameters. This avoids repetitive field assignments:

```csharp
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)
{
    public async Task<Order?> GetAsync(int id, CancellationToken ct)
        => await repository.FindByIdAsync(id, ct);
}
```

Reserve traditional constructors for cases that require validation logic, overloads, or complex initialization.

### Records and Immutable Data

Use `record` (or `record struct`) for immutable data transfer objects, value objects, and similar types where value equality is the natural semantic:

```csharp
public record OrderSummary(int Id, decimal Total, DateTimeOffset CreatedAt);
```

Records give you value equality, `ToString()`, deconstruction, and `with` expressions for free. Use `with` to create modified copies of records without mutation:

```csharp
var updated = original with { Status = OrderStatus.Shipped };
```

### Collection Expressions

Use collection expressions (C# 12+) for concise initialization:

```csharp
int[] numbers = [1, 2, 3];
List<string> names = ["Alice", "Bob"];
List<string> empty = [];                      // prefer [] over new List<string>()

// Spread operator to combine collections
List<string> all = [.. names, .. otherNames];
```

### Expression-Bodied Members

Use expression-bodied members for single-expression methods, properties, and indexers:

```csharp
public string FullName => $"{FirstName} {LastName}";
public override string ToString() => FullName;
```

### Pattern Matching

Use `is null` and `is not null` instead of `== null` and `!= null`. Pattern matching is more idiomatic, avoids accidental operator overload issues, and reads naturally:

```csharp
if (order is null)
    throw new ArgumentNullException(nameof(order));

if (result is not null)
    Process(result);
```

Use switch expressions for multi-branch logic when each arm is a simple mapping:

```csharp
var discount = customer.Tier switch
{
    CustomerTier.Gold => 0.15m,
    CustomerTier.Silver => 0.10m,
    CustomerTier.Bronze => 0.05m,
    _ => 0m,
};
```

### Init-Only Properties

Use `init` setters for properties that should be set only during object initialization:

```csharp
public class OrderOptions
{
    public required string ConnectionString { get; init; }
    public int MaxRetries { get; init; } = 3;
}
```

### Global Using Directives

Place global usings in a single file (e.g., `GlobalUsings.cs` or via `<Using>` in the project file) to reduce repetitive `using` statements across the codebase:

```csharp
global using System.Collections.Immutable;
global using Microsoft.Extensions.Logging;
```

### Default Interface Implementations

Use default interface implementations to add behavior to interfaces without breaking existing implementors. This is useful for evolving contracts in library code:

```csharp
public interface INotificationService
{
    Task SendAsync(string message, CancellationToken ct);
    Task SendBatchAsync(IEnumerable<string> messages, CancellationToken ct)
    {
        return Task.WhenAll(messages.Select(m => SendAsync(m, ct)));
    }
}
```

### Sealed Classes

Mark services, handlers, and test classes as `sealed` to communicate intent and enable devirtualization. Base classes, domain entities, and types designed for inheritance should not be sealed:

```csharp
public sealed class OrderProcessor(ILogger<OrderProcessor> logger) { }
public sealed class OrderProcessorTests { }
```

### Type Inference with var

Use `var` consistently — most projects enforce `var` everywhere via `.editorconfig` (`csharp_style_var_for_built_in_types = true`, `csharp_style_var_elsewhere = true`). This keeps code concise and reduces noise when types change during refactoring:

```csharp
var orders = new List<Order>();
var stream = File.OpenRead(path);
var client = CreateClient();
```

## Nullable Reference Types

Enable nullable reference types project-wide (`<Nullable>enable</Nullable>`). The goal is to make nullability part of the type system so the compiler catches null-related bugs at build time.

- Declare variables and parameters as non-nullable by default. Only use `T?` when null is a valid, meaningful state.
- Validate nullable inputs at public API entry points (constructors, public methods) and throw `ArgumentNullException` with `nameof`:

```csharp
public OrderService(IOrderRepository repository)
{
    ArgumentNullException.ThrowIfNull(repository);
    _repository = repository;
}
```

- Trust null annotations on types you consume. If a method returns `string` (non-nullable), do not add a redundant null check -- it clutters the code and undermines the annotation system.
- Use the null-forgiving operator (`!`) sparingly and only when you can guarantee non-null through external knowledge the compiler cannot see (e.g., a test assertion). Always add a comment explaining why.

## Naming Conventions

Consistent naming reduces cognitive load and makes code navigable without documentation.

| Element | Convention | Example |
|---|---|---|
| Namespace | PascalCase, matching folder structure | `MyApp.Services.Orders` |
| Class, Record, Struct | PascalCase | `OrderService`, `OrderSummary` |
| Interface | "I" + PascalCase | `IOrderRepository` |
| Public method | PascalCase | `CalculateTotal` |
| Public property | PascalCase | `OrderDate` |
| Private field | _camelCase (underscore prefix) | `_repository` |
| Local variable | camelCase | `orderCount` |
| Parameter | camelCase | `customerId` |
| Constant | PascalCase | `MaxRetryCount` |
| Enum member | PascalCase | `OrderStatus.Pending` |
| Type parameter | "T" + PascalCase | `TEntity`, `TResult` |

- Boolean properties and variables should read as questions: `IsActive`, `HasPermission`, `CanExecute`.
- Avoid abbreviations except widely recognized ones (`Id`, `Url`, `Http`).
- Use `nameof()` instead of string literals when referencing member names -- this survives refactoring and produces compile-time errors when names change.

## Formatting

Follow the project's `.editorconfig` when one exists. When establishing new formatting rules, adopt these defaults:

- **File-scoped namespaces** and single-line `using` directives at the top.
- **Newline before opening braces** (Allman style):

```csharp
public class OrderService
{
    public void Process()
    {
    }
}
```

- **Four-space indentation**, no tabs.
- **One class per file**; the file name matches the type name.
- Order members within a class consistently: constants, fields, constructors, properties, public methods, private methods.
- Use trailing commas in multi-line initializers and switch expressions to reduce diff noise.

## Exception Handling

Exceptions are for exceptional situations, not control flow. Throwing and catching exceptions is expensive and obscures the normal code path.

- Throw meaningful exceptions that follow .NET conventions (`ArgumentNullException`, `ArgumentOutOfRangeException`, `InvalidOperationException`, `NotSupportedException`).
- Always include the parameter name via `nameof`:

```csharp
if (quantity <= 0)
    throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be positive.");
```

- Use a dedicated exception for code paths that should never execute (e.g., a default case in an exhaustive switch). This signals intent and provides a clear diagnostic if the assumption is violated. Common choices include `SwitchCaseDefaultException` (from the Atc library ecosystem) or the built-in `UnreachableException`:

```csharp
_ => throw new SwitchCaseDefaultException(status)
```

- Catch specific exception types, not bare `Exception`, unless you are at a top-level boundary (API middleware, hosted service entry point).
- Never swallow exceptions silently. Log and rethrow (`throw;`, not `throw ex;`) or convert to a domain-specific error.
- Never use exceptions for expected conditions like "item not found" -- return `null`, a `bool` try-pattern, or a result type instead.

## Project Structure

Organize solutions to reflect bounded contexts and keep dependencies flowing inward:

```
src/
  MyApp.Domain/           # Entities, value objects, domain interfaces
  MyApp.Application/      # Use cases, DTOs, application interfaces
  MyApp.Infrastructure/   # EF Core, external service clients, file I/O
  MyApp.Api/              # Controllers, middleware, startup
test/
  MyApp.Domain.Tests/
  MyApp.Application.Tests/
  MyApp.Infrastructure.Tests/
  MyApp.Api.Tests/
```

- Namespace structure should mirror the folder structure.
- Keep the domain layer free of framework dependencies (no EF Core attributes, no ASP.NET references).
- Reference inward: `Api -> Application -> Domain`; `Infrastructure -> Application -> Domain`.

### API Style

Prefer **Minimal APIs** over MVC controllers for new projects. Use extension methods to group endpoints:

```csharp
var app = builder.Build();
app.MapEndpoints();
app.MapGet("/", () => TypedResults.Text("OK", "text/plain")).ShortCircuit();
```

### Service Registration

Use fluent extension method chains on `IServiceCollection` to organize DI registration by concern:

```csharp
services
    .ConfigureObservability(builder.Configuration)
    .ConfigureSecurity(builder.Configuration)
    .ConfigureRequestHandling()
    .ConfigureApiVersioning();
```

## Data Access

Encapsulate data access behind interfaces so domain and application layers remain independent of the underlying store:

- Define reader/writer interfaces in the domain layer (e.g., `ICosmosReader<T>`, `ICosmosWriter<T>`, or generic repository interfaces).
- Implement those interfaces in the infrastructure layer with the concrete data technology (Cosmos DB, EF Core, etc.).
- Never leak query abstractions (like `IQueryable<T>`) to upper layers — materialize data before returning from the repository.
- For Cosmos DB projects using the Atc library ecosystem, use `ICosmosReader<T>` / `ICosmosWriter<T>` for typed reads and writes against containers.
- For Entity Framework Core projects, configure entities with `IEntityTypeConfiguration<T>`, use `AsNoTracking()` for read-only queries, and apply server-side pagination.
- Keep data access concerns out of the domain layer — no ORM attributes, no database-specific types.

## Validation

Choose the right validation strategy for the context:

- **DataAnnotations** for simple DTO validation in ASP.NET model binding (`[Required]`, `[StringLength]`, `[Range]`).
- **FluentValidation** for complex business rules, cross-property validation, or conditional logic that is awkward to express with attributes.
- Return **RFC 7807 Problem Details** from APIs for validation errors. ASP.NET Core has built-in support via `AddProblemDetails()` and the `ValidationProblemDetails` class:

```csharp
builder.Services.AddProblemDetails();
```

- Validate at the boundary (API controllers, message handlers) and trust validated data in inner layers.

## Structured Logging

Use structured logging via `ILogger<T>` (from `Microsoft.Extensions.Logging`) so log entries are machine-parsable and searchable. The logging abstraction decouples application code from any specific provider (Application Insights, Seq, console, etc.).

- Use **source-generated logging** (the `[LoggerMessage]` attribute) for high-performance, allocation-free log calls. Place logger message methods in a dedicated partial class alongside the consuming service:

```csharp
public sealed partial class OrderProcessor(ILogger<OrderProcessor> logger)
{
    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "{CallerMethodName}({CallerLineNumber}) - Order {OrderId} placed")]
    private partial void LogOrderPlaced(
        int orderId,
        [CallerMemberName] string callerMethodName = "",
        [CallerLineNumber] int callerLineNumber = 0);
}
```

- Use centralized **event ID constants** to keep log event IDs organized and unique:

```csharp
public static class LoggingEventIdConstants
{
    public static class OrderProcessor
    {
        public const int OrderPlaced = 1001;
        public const int OrderFailed = 1002;
    }
}
```

- Use semantic property names in message templates (`{OrderId}`, not `{0}` or `{id}`).
- Never interpolate strings into log messages (`logger.LogInformation($"Order {id}")`) — this defeats structured logging and allocates on every call regardless of log level.
- Log at appropriate levels: `Trace`/`Debug` for diagnostics, `Information` for business events, `Warning` for recoverable issues, `Error`/`Critical` for failures requiring attention.

## Observability

- Use **OpenTelemetry** for distributed tracing. Create activity sources and tag spans with relevant domain data:

```csharp
using var activity = DiagnosticSource.StartActivity("ProcessOrder");
activity?.SetTag("order.id", orderId);
activity?.SetTag("order.items.count", items.Count);
```

- Expose health check endpoints for orchestration systems:

```csharp
app.MapHealthChecks("/health");
app.MapHealthChecks("/health-extended", HealthCheckOptionsFactory.CreateJson());
```

## General Principles

- **Clarity over cleverness.** Choose clear, descriptive names that make comments unnecessary. If a method needs a comment to explain *what* it does, rename it. Reserve comments for explaining *why* a non-obvious decision was made.
- **Never remove TODO comments.** They represent intentional technical debt or planned work. Only the author or team lead should decide when a TODO is resolved.
- **Handle edge cases.** Consider null inputs, empty collections, boundary values, and concurrent access scenarios.
- **Keep changes focused.** When reviewing or refactoring, make high-confidence suggestions. Avoid speculative changes that alter behavior without clear justification.
- **Prefer composition over inheritance.** Use interfaces, delegation, and dependency injection to compose behavior rather than building deep class hierarchies.
