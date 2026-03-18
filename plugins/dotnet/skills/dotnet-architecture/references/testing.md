# Testing Standards

Effective tests protect domain invariants, catch regressions early, and enable confident refactoring. Structure tests so their output reads like a specification of the system's behavior.

## Naming Convention

Use the naming convention established in the project. Common patterns include `Should_<Expected>_When_<Condition>` or `MethodName_Condition_ExpectedResult`:

```
Should_Apply_ChildDeviceAdded_When_ChildDevice_Not_Already_Added
Should_Not_Apply_ChildDeviceAdded_When_ChildDevice_Already_Added
Order_Submit_RaisesOrderSubmittedEvent
PricingService_CalculateDiscountedPrice_AppliesGoldTierDiscount
```

## Unit Tests

Unit tests verify domain logic in isolation. They are fast, deterministic, and independent of infrastructure.

### What to Test

- **Aggregate behavior**: invariant enforcement, state transitions, domain event generation
- **Value object rules**: equality, validation, arithmetic operations
- **Domain services**: business logic that spans multiple domain objects
- **Specifications**: that criteria correctly include/exclude domain objects

### Example: Testing an Aggregate

```csharp
public class OrderTests
{
    [Fact]
    public void Submit_RaisesOrderSubmittedEvent_WhenOrderHasLines()
    {
        // Arrange
        var order = CreateDraftOrder();
        order.AddLine(ProductId.New(), quantity: 2, new Money(25.00m, "USD"));

        // Act
        order.Submit();

        // Assert
        order.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<OrderSubmittedEvent>();
    }

    [Fact]
    public void Submit_Throws_WhenOrderHasNoLines()
    {
        // Arrange
        var order = CreateDraftOrder();

        // Act
        var act = () => order.Submit();

        // Assert
        act.Should().Throw<OrderDomainException>()
            .WithMessage("*no lines*");
    }

    [Fact]
    public void AddLine_IncreasesQuantity_WhenProductAlreadyExists()
    {
        // Arrange
        var order = CreateDraftOrder();
        var productId = ProductId.New();
        order.AddLine(productId, quantity: 2, new Money(10.00m, "USD"));

        // Act
        order.AddLine(productId, quantity: 3, new Money(10.00m, "USD"));

        // Assert
        order.Lines.Should().ContainSingle()
            .Which.Quantity.Should().Be(5);
    }

    private static Order CreateDraftOrder() =>
        new(OrderId.New(), CustomerId.New());
}
```

### Example: Testing Event-Sourced Command Handlers

For event-sourced systems, use the fluent `Given-When-Then` builder to set up event streams, execute commands, and verify emitted events:

```csharp
[Theory, AutoNSubstituteData]
public Task Should_Apply_ChildDeviceAdded_When_ChildDevice_Not_Already_Added(
    ChildDeviceAddedCommand command,
    ChildDeviceAddedCommandHandler sut,
    DeviceUpdated deviceUpdatedEvent,
    CancellationToken cancellationToken)
    => sut
        .GivenStreamContainingEvents(deviceUpdatedEvent with { DeviceId = command.DeviceId.Id })
        .WhenExecuting(command)
        .ThenExpectEvents(
            context =>
            {
                context.Events
                    .OfType<ChildDeviceAdded>()
                    .Should()
                    .HaveCount(1);
            },
            cancellationToken);
```

Key patterns:
- `[AutoNSubstituteData]` auto-generates test data and mocks via AutoFixture + NSubstitute
- `[Frozen]` pins a mock instance so it is shared across the SUT and test assertions
- `GivenStreamContainingEvents()` seeds the event store with prerequisite events
- `WhenExecuting()` runs the command handler
- `ThenExpectEvents()` asserts on the resulting domain events

### Example: Testing a Value Object

```csharp
public class MoneyTests
{
    [Fact]
    public void Addition_ReturnsCombinedAmount_WhenCurrenciesMatch()
    {
        // Arrange
        var a = new Money(10.00m, "USD");
        var b = new Money(25.50m, "USD");

        // Act
        var result = a + b;

        // Assert
        result.Amount.Should().Be(35.50m);
        result.Currency.Should().Be("USD");
    }

    [Fact]
    public void Addition_Throws_WhenCurrenciesDiffer()
    {
        // Arrange
        var usd = new Money(10.00m, "USD");
        var eur = new Money(10.00m, "EUR");

        // Act
        var act = () => usd + eur;

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*USD*EUR*");
    }
}
```

## Integration Tests

Integration tests verify that components work correctly together, particularly at boundaries where the domain meets infrastructure.

### What to Test

- **Repository persistence**: aggregates can be saved and loaded with all children intact
- **Query specifications**: specifications produce correct SQL/queries when translated by EF Core
- **Event dispatch**: domain events are published and handled after persistence
- **Transaction boundaries**: unit of work commits and rollbacks behave correctly

### Example: Repository Integration Test

```csharp
public class OrderRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly OrderRepository _repository;

    public OrderRepositoryTests(DatabaseFixture fixture)
    {
        _context = fixture.CreateContext();
        _repository = new OrderRepository(_context);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsOrderWithLines_WhenOrderExists()
    {
        // Arrange
        var order = new Order(OrderId.New(), CustomerId.New());
        order.AddLine(ProductId.New(), 2, new Money(15.00m, "USD"));
        await _repository.AddAsync(order, CancellationToken.None);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var loaded = await _repository.GetByIdAsync(order.Id, CancellationToken.None);

        // Assert
        loaded.Should().NotBeNull();
        loaded!.Lines.Should().HaveCount(1);
        loaded.Lines.First().Quantity.Should().Be(2);
    }
}
```

Tips:
- Use `ChangeTracker.Clear()` between save and load to ensure you are reading from the database, not the EF cache
- Use test containers (e.g., Testcontainers for .NET) for realistic database behavior
- Clean up test data between tests or use transactions that roll back

## Acceptance Tests

Acceptance tests validate end-to-end user scenarios through the application layer. They confirm the system delivers business value as specified by stakeholders.

### What to Test

- Complete workflows (e.g., "customer places an order and receives confirmation")
- Cross-aggregate interactions mediated by domain events
- Error scenarios from the user's perspective

### Example: Acceptance Test

```csharp
public class PlaceOrderAcceptanceTests : IClassFixture<ApplicationFixture>
{
    private readonly ApplicationFixture _app;

    public PlaceOrderAcceptanceTests(ApplicationFixture app) => _app = app;

    [Fact]
    public async Task PlaceOrder_CompletesSuccessfully_WhenCartHasItems()
    {
        // Arrange
        var createCommand = new CreateOrderCommand(CustomerId: _app.TestCustomerId);
        var createService = _app.GetService<CreateOrderService>();
        var orderResult = await createService.ExecuteAsync(createCommand, CancellationToken.None);

        var addLineCommand = new AddOrderLineCommand(
            OrderId: orderResult.OrderId,
            ProductId: _app.TestProductId,
            Quantity: 3);
        var addLineService = _app.GetService<AddOrderLineService>();
        await addLineService.ExecuteAsync(addLineCommand, CancellationToken.None);

        // Act
        var submitService = _app.GetService<SubmitOrderService>();
        var submitResult = await submitService.ExecuteAsync(
            new SubmitOrderCommand(orderResult.OrderId),
            CancellationToken.None);

        // Assert
        submitResult.Status.Should().Be(OrderStatus.Submitted);

        var orderQuery = _app.GetService<IOrderRepository>();
        var order = await orderQuery.GetByIdAsync(orderResult.OrderId, CancellationToken.None);
        order.Should().NotBeNull();
        order!.Lines.Should().HaveCount(1);
    }
}
```

## Coverage Targets

- **Domain layer**: 85% minimum. This is where business logic lives and correctness matters most.
- **Application layer**: 85% minimum. Use cases should be thoroughly verified.
- **Infrastructure layer**: Cover critical paths (repository implementations, event dispatchers). Some infrastructure code (EF configurations, startup registration) may not warrant dedicated tests.
- **API/presentation layer**: Cover input validation and error mapping. Controller logic should be thin enough that application-layer tests provide most of the coverage.

Coverage is a useful signal but not a goal in itself. Focus on testing behavior that matters -- invariant enforcement, state transitions, error paths -- rather than chasing a number by testing trivial property getters.
