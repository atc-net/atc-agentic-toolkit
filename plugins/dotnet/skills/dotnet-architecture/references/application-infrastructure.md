# Application and Infrastructure Layer Patterns

## Application Layer

The application layer orchestrates use cases. It coordinates domain objects, manages transactions, and translates between the outside world (APIs, UI) and the domain. It should be thin -- business logic belongs in the domain layer, not here.

### Application Services

An application service represents a use case. It loads aggregates, calls domain methods, persists changes, and publishes domain events.

```csharp
public class SubmitOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDomainEventDispatcher _eventDispatcher;

    public SubmitOrderService(
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        IDomainEventDispatcher eventDispatcher)
    {
        _orderRepository = orderRepository ?? throw new ArgumentNullException(nameof(orderRepository));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _eventDispatcher = eventDispatcher ?? throw new ArgumentNullException(nameof(eventDispatcher));
    }

    public async Task<SubmitOrderResult> ExecuteAsync(
        SubmitOrderCommand command,
        CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken)
            ?? throw new OrderNotFoundException(command.OrderId);

        order.Submit();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _eventDispatcher.DispatchAsync(order.DomainEvents, cancellationToken);
        order.ClearDomainEvents();

        return new SubmitOrderResult(order.Id, order.Status);
    }
}
```

Guidelines:
- One application service per use case (or a small group of related use cases)
- Application services do not contain business logic -- they call domain methods that do
- They manage the unit of work boundary (begin/commit/rollback)
- They dispatch domain events after successful persistence
- They return DTOs, not domain entities

### DTOs (Data Transfer Objects)

DTOs define the shape of data crossing application boundaries. They decouple the API contract from the domain model, allowing each to evolve independently.

```csharp
public record SubmitOrderCommand(OrderId OrderId);

public record SubmitOrderResult(OrderId OrderId, OrderStatus Status);

public record OrderDto(
    Guid Id,
    string CustomerName,
    decimal Total,
    string Currency,
    string Status,
    IReadOnlyList<OrderLineDto> Lines);

public record OrderLineDto(
    string ProductName,
    int Quantity,
    decimal UnitPrice);
```

Principles:
- Never expose domain entities through an API -- always map to DTOs
- Use records for immutability and concise syntax
- Include only the fields the consumer needs (avoid "god DTOs" that mirror the entire aggregate)
- Keep mapping logic in dedicated mapper classes or use a library like Mapster or AutoMapper

### Input Validation

Validate command and query inputs at the application boundary before they reach the domain. This catches obviously invalid data early and provides clear error messages to the caller.

```csharp
public class SubmitOrderCommandValidator : AbstractValidator<SubmitOrderCommand>
{
    public SubmitOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("Order ID is required.");
    }
}
```

Validation layers:
- **Input validation** (application layer): format, presence, range -- "is this a valid GUID?"
- **Business rule validation** (domain layer): invariants -- "can this order be submitted?"

These are complementary. Input validation prevents garbage from reaching the domain; domain validation enforces business rules regardless of the entry point.

### Dependency Injection Registration

Register services with appropriate lifetimes in the composition root (typically `Program.cs` or a `ServiceCollectionExtensions` class).

```csharp
public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services)
    {
        services.AddScoped<SubmitOrderService>();
        services.AddScoped<IDomainEventDispatcher, MediatREventDispatcher>();

        services.AddValidatorsFromAssemblyContaining<SubmitOrderCommandValidator>();

        return services;
    }
}
```

Lifetime guidance:
- **Scoped**: per-request services (application services, repositories, unit of work, DbContext)
- **Singleton**: stateless services, configuration objects, caches
- **Transient**: lightweight, short-lived objects with no shared state

---

## Infrastructure Layer

The infrastructure layer provides concrete implementations of the abstractions defined in the domain and application layers. It handles persistence, messaging, external API calls, and other technical concerns.

### Repository Pattern

Repositories abstract data access behind a domain-defined interface. The domain layer declares the interface; the infrastructure layer implements it.

```csharp
// Domain layer
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Order>> ListAsync(Specification<Order> spec, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
}

// Infrastructure layer
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken) =>
        await _context.Orders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Order>> ListAsync(
        Specification<Order> spec,
        CancellationToken cancellationToken) =>
        await _context.Orders
            .Where(spec.ToExpression())
            .ToListAsync(cancellationToken);

    public async Task AddAsync(Order order, CancellationToken cancellationToken) =>
        await _context.Orders.AddAsync(order, cancellationToken);
}
```

Repository guidelines:
- One repository per aggregate root (not per entity)
- Repository interfaces live in the domain layer; implementations in infrastructure
- Return domain objects, not DTOs or EF entities
- Accept `CancellationToken` in every async method
- Use specifications for complex queries rather than exposing `IQueryable<T>`

### Unit of Work

The Unit of Work pattern coordinates writes across multiple repositories within a single transaction.

```csharp
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

// EF Core's DbContext already implements this pattern
public class AppDbContext : DbContext, IUnitOfWork
{
    public DbSet<Order> Orders => Set<Order>();

    // SaveChangesAsync is inherited from DbContext
}
```

### Event Bus

Publish domain events to in-process handlers or external message brokers.

```csharp
public interface IDomainEventDispatcher
{
    Task DispatchAsync(
        IEnumerable<IDomainEvent> events,
        CancellationToken cancellationToken);
}

public class MediatREventDispatcher : IDomainEventDispatcher
{
    private readonly IMediator _mediator;

    public MediatREventDispatcher(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    public async Task DispatchAsync(
        IEnumerable<IDomainEvent> events,
        CancellationToken cancellationToken)
    {
        foreach (var domainEvent in events)
        {
            await _mediator.Publish(domainEvent, cancellationToken);
        }
    }
}
```

For events that cross service boundaries, consider:
- **In-process**: MediatR, custom dispatcher -- suitable for monoliths
- **Message broker**: Azure Service Bus, RabbitMQ, Kafka -- for distributed systems
- **Outbox pattern**: persist events alongside the aggregate in the same transaction, then relay them to the broker asynchronously to guarantee at-least-once delivery

### External Service Adapters

Wrap third-party APIs behind domain-defined interfaces so the domain remains independent of external service details.

```csharp
// Domain layer defines the contract
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(Money amount, PaymentMethod method, CancellationToken cancellationToken);
}

// Infrastructure layer implements it
public class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeClient _client;

    public StripePaymentGateway(StripeClient client)
    {
        _client = client ?? throw new ArgumentNullException(nameof(client));
    }

    public async Task<PaymentResult> ChargeAsync(
        Money amount,
        PaymentMethod method,
        CancellationToken cancellationToken)
    {
        var options = new ChargeCreateOptions
        {
            Amount = (long)(amount.Amount * 100), // Stripe uses cents
            Currency = amount.Currency.ToLowerInvariant(),
            Source = method.Token,
        };

        var charge = await _client.ChargeService.CreateAsync(options, cancellationToken: cancellationToken);

        return charge.Status == "succeeded"
            ? PaymentResult.Success(charge.Id)
            : PaymentResult.Failure(charge.FailureMessage);
    }
}
```

This adapter pattern means:
- Switching payment providers requires only a new adapter, not domain changes
- The domain tests can mock `IPaymentGateway` without any Stripe dependencies
- Stripe-specific details (cents conversion, status strings) are contained in one place

### Infrastructure Registration

```csharp
public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Default")));

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPaymentGateway, StripePaymentGateway>();

        return services;
    }
}
```
