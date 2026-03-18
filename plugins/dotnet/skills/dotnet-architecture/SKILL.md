---
name: dotnet-architecture
description: >
  Best practices for .NET application architecture based on Domain-Driven Design (DDD), SOLID principles,
  and layered architecture. Covers aggregate design, value objects, domain events, bounded contexts,
  domain services, application services, repository patterns, specification patterns, and infrastructure
  concerns. Includes testing standards (unit, integration, acceptance) with minimum coverage targets,
  step-by-step implementation workflows, and financial domain considerations (monetary value handling,
  saga patterns, audit trails, regulatory compliance). Apply this skill whenever designing, building,
  reviewing, or refactoring .NET application architecture -- including when the user mentions domain
  models, aggregates, bounded contexts, domain events, layered architecture, SOLID violations,
  repository patterns, or DDD concepts, even if they do not explicitly say "architecture."
user-invocable: false
---

# .NET Architecture Best Practices

Apply these practices when designing, building, reviewing, or refactoring .NET applications that benefit from structured domain modeling and layered architecture.

## Core Principles

### Domain-Driven Design (DDD)

DDD aligns software design with business reality. The goal is to make the codebase a direct expression of business concepts, so domain experts and developers share a common vocabulary and the system remains adaptable as the business evolves.

- **Ubiquitous Language**: Use consistent business terminology throughout code, documentation, and conversation. When the business calls something an "Order," the code should use `Order` -- not `PurchaseRecord` or `TransactionItem`. This reduces translation errors and keeps the model honest.
- **Bounded Contexts**: Define clear service boundaries where a particular domain model applies. Each bounded context has its own ubiquitous language and data ownership. Communicate across boundaries through well-defined contracts (domain events, APIs), not shared databases.
- **Aggregates**: Design consistency boundaries that protect business invariants. Each aggregate has a root entity that controls access to its children and enforces rules within a single transaction. Keep aggregates small -- large aggregates cause contention and performance issues.
- **Domain Events**: Capture business-significant occurrences as first-class objects (e.g., `OrderPlaced`, `PaymentReceived`). Domain events decouple bounded contexts, enable audit trails, and support eventual consistency across service boundaries.
- **Rich Domain Models**: Place business logic in the domain layer, not in application services or controllers. Entities and value objects should enforce their own invariants, making invalid states unrepresentable.

For detailed patterns including aggregate design rules, value object implementation, and domain event handling, see [references/domain-layer.md](references/domain-layer.md).

### SOLID Principles

These principles guide class and module design toward code that is easier to understand, extend, and test.

- **Single Responsibility Principle (SRP)**: A class should have one reason to change. If a class handles both order validation and email notification, split it -- changes to email templates should not risk breaking validation logic.
- **Open/Closed Principle (OCP)**: Design classes to be extended without modification. Use abstractions (interfaces, base classes) and patterns like Strategy or Decorator so new behavior can be added by writing new code rather than editing existing code.
- **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types without altering program correctness. If `PremiumCustomer` extends `Customer`, any code that works with `Customer` should work identically with `PremiumCustomer`.
- **Interface Segregation Principle (ISP)**: Prefer small, focused interfaces over large ones. A class should not be forced to implement methods it does not use. Split `IOrderService` into `IOrderReader` and `IOrderWriter` if some consumers only need read access.
- **Dependency Inversion Principle (DIP)**: High-level modules should depend on abstractions, not concrete implementations. The domain layer defines interfaces; the infrastructure layer provides implementations. This keeps the domain portable and testable.

### .NET Good Practices

- **Async programming**: Use `async`/`await` throughout the stack. Avoid blocking calls (`.Result`, `.Wait()`) that risk deadlocks and thread pool starvation.
- **Dependency injection**: Register services in the DI container with appropriate lifetimes (`Scoped` for per-request, `Singleton` for stateless services, `Transient` for lightweight disposable objects).
- **LINQ**: Prefer LINQ for collection operations -- it is declarative and composable. Avoid materializing large collections unnecessarily; use `IQueryable<T>` to push filtering to the database.
- **Exception handling**: Throw domain-specific exceptions for business rule violations. Use middleware or filters for cross-cutting exception handling. Do not use exceptions for control flow.
- **Modern C# features**: Leverage records for immutable DTOs, primary constructors, pattern matching, nullable reference types, and `required` properties to reduce boilerplate and catch errors at compile time.

## Layered Architecture

Organize code into layers with clear dependency direction: outer layers depend on inner layers, never the reverse.

### Common Project Structure

A typical service repository contains:

```
src/
  MyService.Api/                 # Minimal API host, endpoints, middleware
  MyService.Domain/              # Business logic, aggregates, command handlers, processors
  MyService.Events/              # Domain event definitions (shared as NuGet package)
  MyService.Api.Contracts/       # API request/response DTOs (shared as NuGet package)
  MyService.Api.Client/          # Generated typed HTTP client for consumers
  MyService.Functions/           # Azure Functions for event-driven processing (optional)
  MyService.AppHost/             # Aspire orchestration (optional)
test/
  MyService.Domain.Tests/
  MyService.Api.Tests/
```

This structure separates publishable contracts (Events, Api.Contracts, Api.Client) from internal implementation (Domain, Api). Other services depend on the contracts packages, not the implementation.

### Domain Layer (innermost)

The heart of the application. Contains business logic with zero dependencies on infrastructure or frameworks.

- **Aggregates and Entities**: enforce business invariants
- **Value Objects**: immutable, equality by value (use records: `Money`, `EmailAddress`)
- **Domain Services and Processors**: logic that processes events or commands
- **Domain Events**: business-significant occurrences defined as records
- **Command Handlers**: CQRS command handling within the domain layer

For detailed domain layer patterns, see [references/domain-layer.md](references/domain-layer.md).

### Application / API Layer

Thin orchestration layer that wires up the domain and exposes it via HTTP:

- **Minimal APIs**: prefer `app.MapEndpoints()` over MVC controllers
- **DTOs / Contracts**: separate projects for API contracts, shared as NuGet packages
- **Input Validation**: validate inputs at the boundary using FluentValidation
- **DI Registration**: fluent extension method chains on `IServiceCollection`

For detailed application and infrastructure patterns, see [references/application-infrastructure.md](references/application-infrastructure.md).

### Infrastructure Concerns

Concrete implementations injected via DI:

- **Data Access**: `ICosmosReader<T>` / `ICosmosWriter<T>` for Cosmos DB (via Atc.Cosmos), or EF Core repositories for relational databases
- **Event Store**: Atc.Cosmos.EventStore for event-sourced aggregates
- **Event Bus**: Event Hub / Service Bus processors for cross-service communication
- **External Service Adapters**: typed HTTP clients behind domain-defined interfaces

For detailed infrastructure patterns, see [references/application-infrastructure.md](references/application-infrastructure.md).

## Event Sourcing and CQRS

Many .NET services use event sourcing with CQRS as their core architectural pattern:

- **Events as source of truth**: all state changes captured as immutable domain events stored in Cosmos DB
- **Projections / Views**: read models built by projecting event streams (e.g., `DeviceView` from device events)
- **Command handlers**: process commands, validate business rules, and emit events
- **Command processor factory**: `ICommandProcessorFactory` dispatches commands to the correct handler without MediatR
- **Separate Events project**: domain events are published as NuGet packages so other services can consume them without coupling to the domain implementation

## Testing Standards

Well-structured tests protect domain invariants and enable confident refactoring. Use the test naming convention established in the project — common patterns include `Should_<Expected>_When_<Condition>` or `MethodName_Condition_ExpectedResult`.

- **Unit Tests**: Isolate domain logic. Test command handlers, aggregates, processors, and value objects. Use `[AutoNSubstituteData]` (from Atc.Test) with `[Frozen]` for automatic mock injection. Use FluentAssertions for assertions.
- **Integration Tests**: Verify persistence, event projection, and cross-layer interactions.
- **Acceptance Tests**: Validate end-to-end user scenarios through the application layer.
- **Coverage Target**: Aim for a minimum of 85% code coverage in the domain and application layers.

For detailed testing guidance, see [references/testing.md](references/testing.md).

## Implementation Workflow

When building or refactoring a feature, follow this sequence to ensure architectural alignment.

### 1. Domain Analysis
- Identify domain concepts, entities, and value objects
- Define aggregate boundaries (what must be consistent within a single transaction?)
- Establish ubiquitous language with stakeholders
- Document business rules and invariants

### 2. Architecture Review
- Verify layer responsibilities are respected (no business logic in controllers, no infrastructure in the domain)
- Check SOLID adherence across the design
- Identify domain events needed for cross-boundary communication
- Review security boundaries and data access patterns

### 3. Implementation Planning
- List files to create or modify, organized by layer
- Define test cases for each aggregate and application service
- Plan error handling strategy (domain exceptions, validation errors, infrastructure failures)
- Consider performance implications (query patterns, caching, lazy loading)

### 4. Execution
- Start with the domain model: entities, value objects, aggregate roots
- Build aggregates with invariant enforcement
- Implement application services that orchestrate domain operations
- Write tests alongside implementation (not after)
- Wire up domain events and handlers

### 5. Post-Implementation Review
- Verify all business invariants are enforced by aggregates
- Confirm no domain logic has leaked into application or infrastructure layers
- Check that all public APIs use DTOs rather than domain entities
- Validate test coverage meets the 85% target for domain and application layers
- Review for SOLID violations introduced during implementation

## Financial Domain Considerations

Financial systems have stricter requirements around precision, auditability, and compliance. When working in a financial context, apply these additional practices.

For detailed financial domain guidance, see [references/financial-domain.md](references/financial-domain.md).

Key points:
- Use `decimal` for all monetary values -- never `float` or `double`, which introduce rounding errors
- Model money as a currency-aware value object (amount + currency code) to prevent accidental arithmetic across currencies
- Use the Saga pattern for distributed transactions that span multiple aggregates or services
- Maintain immutable audit trails via domain events -- every state change should be traceable
- Design for regulatory compliance (PCI-DSS for payment data, SOX for financial reporting) from the start, not as an afterthought
