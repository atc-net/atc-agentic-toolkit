# Domain Layer Patterns

The domain layer is the core of the application. It contains all business logic and has no dependencies on infrastructure, frameworks, or external services. Everything in this layer should be expressible in terms the business understands.

## Aggregates

An aggregate is a cluster of domain objects treated as a single unit for data consistency. Every aggregate has a root entity that serves as the sole entry point for external interactions.

### Design Rules

- **Access through the root only**: External code should never directly modify child entities. The aggregate root exposes methods that enforce invariants before allowing state changes.
- **One transaction per aggregate**: A single database transaction should modify only one aggregate. If a use case needs to update multiple aggregates, use domain events and eventual consistency.
- **Keep aggregates small**: Include only what is required to enforce invariants within a single transaction. Large aggregates cause lock contention, increase merge conflicts, and slow down persistence.
- **Reference other aggregates by identity**: Store the ID of a related aggregate rather than a direct object reference. This keeps aggregates independently loadable and prevents unintended cascading changes.

### Example: Order Aggregate

```csharp
public class Order : AggregateRoot
{
    private readonly List<OrderLine> _lines = new();

    public OrderId Id { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public IReadOnlyCollection<OrderLine> Lines => _lines.AsReadOnly();

    public void AddLine(ProductId productId, int quantity, Money unitPrice)
    {
        if (Status != OrderStatus.Draft)
            throw new OrderDomainException("Cannot modify a submitted order.");

        if (quantity <= 0)
            throw new OrderDomainException("Quantity must be positive.");

        var existing = _lines.FirstOrDefault(l => l.ProductId == productId);
        if (existing is not null)
        {
            existing.IncreaseQuantity(quantity);
        }
        else
        {
            _lines.Add(new OrderLine(productId, quantity, unitPrice));
        }
    }

    public void Submit()
    {
        if (_lines.Count == 0)
            throw new OrderDomainException("Cannot submit an order with no lines.");

        Status = OrderStatus.Submitted;
        AddDomainEvent(new OrderSubmittedEvent(Id, CustomerId, CalculateTotal()));
    }

    public Money CalculateTotal() =>
        _lines.Aggregate(Money.Zero(_lines[0].UnitPrice.Currency),
            (sum, line) => sum + line.UnitPrice * line.Quantity);
}
```

Key observations:
- The `Order` root controls all mutations to `OrderLine` children
- Business rules (`quantity > 0`, `status == Draft`) are enforced inside the aggregate
- `Submit()` raises a domain event for cross-boundary communication
- Other aggregates (Customer, Product) are referenced by ID only

## Value Objects

Value objects are immutable types defined by their attributes rather than an identity. Two value objects with the same properties are considered equal. They are excellent for modeling concepts like money, addresses, email addresses, and date ranges.

### Implementation Pattern

```csharp
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.", nameof(currency));

        Amount = amount;
        Currency = currency.ToUpperInvariant();
    }

    public static Money Zero(string currency) => new(0m, currency);

    public static Money operator +(Money left, Money right)
    {
        EnsureSameCurrency(left, right);
        return new Money(left.Amount + right.Amount, left.Currency);
    }

    public static Money operator *(Money money, int quantity) =>
        new(money.Amount * quantity, money.Currency);

    private static void EnsureSameCurrency(Money left, Money right)
    {
        if (left.Currency != right.Currency)
            throw new InvalidOperationException(
                $"Cannot combine {left.Currency} with {right.Currency}.");
    }
}
```

Benefits of value objects:
- **Self-validating**: invalid states are impossible after construction
- **Type safety**: the compiler prevents passing a raw `decimal` where a `Money` is expected
- **Encapsulated logic**: currency arithmetic rules live with the data they govern
- **Immutability**: no accidental mutation, safe to share across threads

### When to Use Value Objects

Use a value object when:
- The concept is defined by its attributes, not by an identity (you would never ask "which $10 is this?")
- Equality means "same value" rather than "same instance"
- The concept has validation rules or arithmetic operations
- You want to prevent primitive obsession (replacing raw `string`, `decimal`, `int` with meaningful types)

## Domain Services

Some business logic does not naturally belong to a single entity or value object. Domain services handle operations that span multiple aggregates or require external domain knowledge.

```csharp
public class PricingService
{
    private readonly IDiscountPolicy _discountPolicy;

    public PricingService(IDiscountPolicy discountPolicy)
    {
        _discountPolicy = discountPolicy ?? throw new ArgumentNullException(nameof(discountPolicy));
    }

    public Money CalculateDiscountedPrice(Order order, Customer customer)
    {
        var total = order.CalculateTotal();
        var discount = _discountPolicy.CalculateDiscount(customer.Tier, total);
        return total - discount;
    }
}
```

Guidelines:
- Domain services are stateless -- they operate on domain objects passed as arguments
- They live in the domain layer, not the application layer
- They depend on domain interfaces (e.g., `IDiscountPolicy`), not infrastructure
- If the logic clearly belongs to an entity, put it there instead

## Domain Events

Domain events record that something meaningful happened in the domain. They serve three purposes:

1. **Decoupling**: bounded contexts communicate through events rather than direct calls
2. **Audit trails**: events form a natural history of what happened and when
3. **Eventual consistency**: events enable async workflows across aggregate boundaries

### Defining Events

```csharp
public record OrderSubmittedEvent(
    OrderId OrderId,
    CustomerId CustomerId,
    Money Total) : IDomainEvent;
```

Events should be:
- **Named in past tense**: they describe something that already happened
- **Immutable**: once raised, an event's data should not change
- **Self-contained**: include enough data for handlers to act without querying back

### Raising and Handling Events

Aggregates collect events internally. The application layer (or a middleware) dispatches them after the transaction commits, ensuring events are only published for successfully persisted state changes.

```csharp
// In the aggregate base class
public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(IDomainEvent domainEvent) =>
        _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

## Specifications

The Specification pattern encapsulates query criteria as reusable, composable objects. This keeps query logic in the domain layer rather than scattering it across repositories or application services.

```csharp
public class ActiveOrdersForCustomerSpec : Specification<Order>
{
    private readonly CustomerId _customerId;

    public ActiveOrdersForCustomerSpec(CustomerId customerId) =>
        _customerId = customerId;

    public override Expression<Func<Order, bool>> ToExpression() =>
        order => order.CustomerId == _customerId
              && order.Status != OrderStatus.Cancelled
              && order.Status != OrderStatus.Completed;
}

// Usage in a repository
var activeOrders = await repository.ListAsync(
    new ActiveOrdersForCustomerSpec(customerId), cancellationToken);
```

Benefits:
- Specifications are testable in isolation (pass in a domain object, check if it satisfies the spec)
- They compose: `spec1.And(spec2)`, `spec1.Or(spec2)`
- Query logic stays in the domain vocabulary rather than leaking SQL/LINQ details into application services
