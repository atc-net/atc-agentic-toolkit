# Core Design Philosophy

The core design philosophy is the default mode of thinking when getting started. After applying this default mode, apply relevant optimizations from the design-patterns.md reference.

## Understanding Aggregate-Oriented Design

Azure Cosmos DB NoSQL offers multiple levels of aggregation:

### 1. Multi-Document Container Aggregates

Multiple related entities grouped by sharing the same partition key but stored as separate documents with different IDs. This provides:

- Efficient querying of related data with a single SQL query
- Transactional consistency within the partition using stored procedures/triggers
- Flexibility to access individual documents
- No size constraints per document (each document limited to 2MB)

### 2. Single Document Aggregates

Multiple entities combined into a single Cosmos DB document. This provides:

- Atomic updates across all data in the aggregate
- Single point read retrieval for all data. Reference the document by id and partition key via API (example `ReadItemAsync<Order>(id: "order0103", partitionKey: new PartitionKey("TimS1234"));` instead of using a query with `SELECT * FROM c WHERE c.id = "order0103" AND c.partitionKey = "TimS1234"` for point reads)
- Subject to 2MB document size limit

When designing aggregates, consider both levels based on your requirements.

## Strategic Co-Location

Use multi-document containers to group data together that is frequently accessed as long as it can be operationally coupled. Cosmos DB provides container-level features like throughput provisioning, indexing policies, and change feed that function at the container level. Grouping too much data together couples it operationally and can limit optimization opportunities.

**Multi-Document Container Benefits:**

- **Single query efficiency**: Retrieve related data in one SQL query instead of multiple round trips
- **Cost optimization**: One query operation instead of multiple point reads
- **Latency reduction**: Eliminate network overhead of multiple database calls
- **Transactional consistency**: ACID transactions within the same partition
- **Natural data locality**: Related data is physically stored together for optimal performance

**When to Use Multi-Document Containers:**

- User and their Orders: partition key = user_id, documents for user and orders
- Product and its Reviews: partition key = product_id, documents for product and reviews
- Course and its Lessons: partition key = course_id, documents for course and lessons
- Team and its Members: partition key = team_id, documents for team and members

### Multi-Container vs Multi-Document Containers: The Right Balance

While multi-document containers are powerful, don't force unrelated data together. Use multiple containers when entities have:

**Different operational characteristics:**
- Independent throughput requirements
- Separate scaling patterns
- Different indexing needs
- Distinct change feed processing requirements

**Operational Benefits of Multiple Containers:**

- **Lower blast radius**: Container-level issues affect only related entities
- **Granular throughput management**: Allocate RU/s independently per business domain
- **Clear cost attribution**: Understand costs per business domain
- **Clean change feeds**: Change feed contains logically related events
- **Natural service boundaries**: Microservices can own domain-specific containers
- **Simplified analytics**: Each container's change feed contains only one entity type

### Avoid Complex Single-Container Patterns

Complex single-container design patterns that mix unrelated entities create operational overhead without meaningful benefits for most applications:

**Single-container anti-patterns:**

- Everything container - Complex filtering - Difficult analytics
- One throughput allocation for everything
- One change feed with mixed events requiring filtering
- Scaling affects all entities
- Complex indexing policies
- Difficult to maintain and onboard new developers

## Keep Relationships Simple and Explicit

One-to-One: Store the related ID in both documents

```json
// Users container
{ "id": "user_123", "partitionKey": "user_123", "profileId": "profile_456" }
// Profiles container
{ "id": "profile_456", "partitionKey": "profile_456", "userId": "user_123" }
```

One-to-Many: Use same partition key for parent-child relationship

```json
// Orders container with user_id as partition key
{ "id": "order_789", "partitionKey": "user_123", "type": "order" }
// Find orders for user: SELECT * FROM c WHERE c.partitionKey = "user_123" AND c.type = "order"
```

Many-to-Many: Use a separate relationship container

```json
// UserCourses container
{ "id": "user_123_course_ABC", "partitionKey": "user_123", "userId": "user_123", "courseId": "ABC" }
{ "id": "course_ABC_user_123", "partitionKey": "course_ABC", "userId": "user_123", "courseId": "ABC" }
```

Frequently accessed attributes: Denormalize sparingly

```json
// Orders document
{
  "id": "order_789",
  "partitionKey": "user_123",
  "customerId": "user_123",
  "customerName": "John Doe" // Include customer name to avoid lookup
}
```

These relationship patterns provide the initial foundation. Your specific access patterns should influence the implementation details within each container.

## From Entity Containers to Aggregate-Oriented Design

Starting with one container per entity is a good mental model, but your access patterns should drive how you optimize from there using aggregate-oriented design principles.

Aggregate-oriented design recognizes that data is naturally accessed in groups (aggregates), and these access patterns should determine your container structure, not entity boundaries. Cosmos DB provides multiple levels of aggregation:

1. Multi-Document Container Aggregates: Related entities share a partition key but remain separate documents
2. Single Document Aggregates: Multiple entities combined into one document for atomic access

The key insight: Let your access patterns reveal your natural aggregates, then design your containers around those aggregates rather than rigid entity structures.

Reality check: If completing a user's primary workflow (like "browse products - add to cart - checkout") requires cross-partition queries across multiple containers, your entities might actually form aggregates that should be restructured together.

## Aggregate Boundaries Based on Access Patterns

When deciding aggregate boundaries, use this decision framework:

**Step 1: Analyze Access Correlation**

- 90% accessed together - Strong single document aggregate candidate
- 50-90% accessed together - Multi-document container aggregate candidate
- <50% accessed together - Separate aggregates/containers

**Step 2: Check Constraints**

- Size: Will combined size exceed 1MB? Force multi-document or separate
- Updates: Different update frequencies? Consider multi-document
- Atomicity: Need transactional updates? Favor same partition

**Step 3: Choose Aggregate Type**

Based on Steps 1 and 2, select:

- **Single Document Aggregate**: Embed everything in one document
- **Multi-Document Container Aggregate**: Same partition key, different documents
- **Separate Aggregates**: Different containers or different partition keys

### Example Aggregate Analyses

**Order + OrderItems:**

Access Analysis:
- Fetch order without items: 5% (just checking status)
- Fetch order with all items: 95% (normal flow)
- Update patterns: Items rarely change independently
- Combined size: ~50KB average, max 200KB

Decision: Single Document Aggregate
- partition key: order_id, id: order_id
- OrderItems embedded as array property
- Benefits: Atomic updates, single point read operation

**Product + Reviews:**

Access Analysis:
- View product without reviews: 70%
- View product with reviews: 30%
- Update patterns: Reviews added independently
- Size: Product 5KB, could have 1000s of reviews

Decision: Multi-Document Container Aggregate
- partition key: product_id, id: product_id (for product)
- partition key: product_id, id: review_id (for each review)
- Benefits: Flexible access, unbounded reviews, transactional consistency

**Customer + Orders:**

Access Analysis:
- View customer profile only: 85%
- View customer with order history: 15%
- Update patterns: Completely independent
- Size: Could have thousands of orders

Decision: Separate Aggregates (different containers)
- Customers container: partition key: customer_id
- Orders container: partition key: order_id, with customer_id property
- Benefits: Independent scaling, clear boundaries

## Natural Keys Over Generic Identifiers

Your keys should describe what they identify:
- user_id, order_id, product_sku - Clear, purposeful
- PK, SK, GSI1PK - Obscure, requires documentation
- OrdersByCustomer, ProductsByCategory - Self-documenting queries
- Query1, Query2 - Meaningless names

This clarity becomes critical as your application grows and new developers join.

## Optimize Indexing for Your Queries

Index only properties your access patterns actually query, not everything convenient. Use selective indexing by excluding unused paths to reduce RU consumption and storage costs. Include composite indexes for complex ORDER BY and filter operations. Automatic indexing on all properties increases write RUs and storage costs regardless of usage. Validation: List specific properties each access pattern filters or sorts by. If most queries use only 2-3 properties, use selective indexing; if they use most properties, consider automatic indexing.

## Design For Scale

### Partition Key Design

Use the property you most frequently lookup as your partition key (like user_id for user lookups). Simple selections sometimes create hot partitions through low variety or uneven access. Cosmos DB distributes load across partitions, but each logical partition has a 10,000 RU/s limit. Hot partitions overload single partitions with too many requests.

Low cardinality creates hot partitions when partition keys have too few distinct values. subscription_tier (basic/premium/enterprise) creates only three partitions, forcing all traffic to few keys. Use high cardinality keys like user_id or order_id.

Popularity skew creates hot partitions when keys have variety but some values get dramatically more traffic. user_id provides millions of values, but popular users create hot partitions during viral moments with 10,000+ RU/s.

Choose partition keys that distribute load evenly across many values while aligning with frequent lookups. Composite keys solve both problems by distributing load across partitions while maintaining query efficiency. device_id alone might overwhelm partitions, but device_id#hour spreads readings across time-based partitions.

### Consider the Index Overhead

Index overhead increases RU costs and storage. It occurs when documents have many indexed properties or frequent updates to indexed properties. Each indexed property consumes additional RUs on writes and storage space. Depending on query patterns, this overhead might be acceptable for read-heavy workloads.

IMPORTANT: If you're OK with the added costs, confirm the increased RU consumption will not exceed your container's provisioned throughput. Do back of the envelope math to be safe.

### Workload-Driven Cost Optimization

When making aggregate design decisions:

- Calculate read cost = frequency x RUs per operation
- Calculate write cost = frequency x RUs per operation
- Total cost = sum(read costs) + sum(write costs)
- Choose the design with lower total cost

Example cost analysis:

Option 1 - Denormalized Order+Customer:
- Read cost: 1000 RPS x 1 RU = 1000 RU/s
- Write cost: 50 order updates x 5 RU + 10 customer updates x 50 orders x 5 RU = 2750 RU/s
- Total: 3750 RU/s

Option 2 - Normalized with separate query:
- Read cost: 1000 RPS x (1 RU + 3 RU) = 4000 RU/s
- Write cost: 50 order updates x 5 RU + 10 customer updates x 5 RU = 300 RU/s
- Total: 4300 RU/s

Decision: Option 1 better for this case due to lower total RU consumption
