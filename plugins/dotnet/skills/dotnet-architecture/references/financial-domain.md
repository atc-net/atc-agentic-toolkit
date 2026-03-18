# Financial Domain Considerations

Financial systems operate under stricter requirements than most business applications. Precision errors, missing audit trails, or compliance gaps can have serious legal and financial consequences. Apply these practices in addition to the general architecture guidance when working in a financial context.

## Monetary Value Handling

### Use Decimal, Not Floating Point

Always use `decimal` for monetary values. The `float` and `double` types use binary floating-point representation, which cannot exactly represent many decimal fractions (e.g., `0.1`). This leads to rounding errors that compound over thousands of transactions.

```csharp
// Correct
decimal price = 19.99m;
decimal tax = price * 0.08m; // 1.5992m -- exact

// Dangerous -- rounding errors accumulate
double price = 19.99;
double tax = price * 0.08; // 1.5992000000000002 -- imprecise
```

### Currency-Aware Value Objects

Model money as a value object that pairs an amount with a currency code. This prevents accidental arithmetic across currencies and makes the intent explicit in every method signature.

```csharp
public sealed record Money
{
    public decimal Amount { get; }
    public CurrencyCode Currency { get; }

    public Money(decimal amount, CurrencyCode currency)
    {
        Amount = decimal.Round(amount, currency.DecimalPlaces, MidpointRounding.ToEven);
        Currency = currency;
    }

    public static Money operator +(Money left, Money right)
    {
        if (left.Currency != right.Currency)
            throw new CurrencyMismatchException(left.Currency, right.Currency);
        return new Money(left.Amount + right.Amount, left.Currency);
    }
}
```

Key points:
- Round to the currency's standard decimal places (2 for USD/EUR, 0 for JPY, 3 for BHD)
- Use banker's rounding (`MidpointRounding.ToEven`) to minimize systematic bias
- Make currency comparison part of every arithmetic operation
- Consider supporting currency conversion as an explicit domain service with auditable exchange rates

## Distributed Transactions and Sagas

Financial workflows often span multiple aggregates or services (e.g., debit one account, credit another, record a ledger entry). Traditional distributed transactions (two-phase commit) are fragile and do not scale well in modern distributed systems.

### Saga Pattern

A saga coordinates a multi-step business process through a sequence of local transactions, each paired with a compensating action that undoes its effect if a later step fails.

```
PlaceOrder Saga:
1. Reserve inventory      -> Compensate: Release inventory
2. Authorize payment      -> Compensate: Void authorization
3. Confirm order          -> Compensate: Cancel order
4. Send confirmation      -> (no compensation needed)
```

Implementation approaches:
- **Choreography**: each service listens for domain events and acts independently. Simpler for short sagas but harder to reason about as the number of steps grows.
- **Orchestration**: a central saga orchestrator directs each step and handles compensations. Easier to follow and debug for complex workflows.

Guidelines:
- Design each step to be idempotent so retries are safe
- Log every step and compensation for auditability
- Set timeouts on each step to prevent sagas from hanging indefinitely
- Test compensation paths as thoroughly as the happy path -- they run when things go wrong, which is exactly when correctness matters most

## Audit Trails

Financial systems require a complete, immutable record of every state change. Domain events are a natural fit for this.

### Event-Sourced Audit Trail

```csharp
public record AccountDebitedEvent(
    AccountId AccountId,
    Money Amount,
    TransactionId TransactionId,
    string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

Principles:
- Every state change produces a domain event with enough context to explain what happened and why
- Events are append-only -- never update or delete audit records
- Store events with timestamps, actor identity (who initiated the change), and correlation IDs (to trace related events across services)
- Consider event sourcing for core financial aggregates (accounts, ledgers) where the full history of changes is as important as the current state

### Audit Requirements

At minimum, an audit trail should record:
- **What** changed (event type and payload)
- **When** it changed (timestamp, preferably UTC)
- **Who** initiated the change (user ID, service identity, or system process)
- **Why** it changed (transaction ID, business reason, or triggering event)
- **Correlation**: how this change relates to other changes in the same business process

## Regulatory Compliance

Design for compliance from the start. Retrofitting compliance requirements into an existing architecture is significantly more expensive and error-prone than building them in.

### PCI-DSS (Payment Card Industry Data Security Standard)

Applies when handling credit card data:
- Never store full card numbers, CVVs, or PINs after authorization
- Use tokenization: replace card data with tokens from your payment processor
- Encrypt cardholder data at rest and in transit
- Implement access controls -- only services that need card data should have access
- Log all access to cardholder data

### SOX (Sarbanes-Oxley Act)

Applies to financial reporting in publicly traded companies:
- Maintain immutable audit trails for all financial transactions
- Implement separation of duties (the person who initiates a transaction should not be the person who approves it)
- Ensure data integrity through checksums or cryptographic verification
- Retain records for the required period (typically 7 years)

### General Compliance Patterns

- **Separation of concerns**: isolate compliance-sensitive operations in dedicated bounded contexts with strict access controls
- **Encryption**: use platform-provided encryption (Azure Key Vault, AWS KMS, Data Protection APIs) rather than implementing custom cryptography
- **Data retention policies**: model retention rules as domain concepts and enforce them through automated processes
- **Testing compliance**: include compliance scenarios in acceptance tests (e.g., verify that audit events are produced for every financial transaction, verify that unauthorized access attempts are logged and rejected)
