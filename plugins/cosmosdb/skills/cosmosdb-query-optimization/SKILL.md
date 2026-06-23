---
name: cosmosdb-query-optimization
description: >
  Azure Cosmos DB query optimization best practices: point reads, projections,
  pagination with continuation tokens, parameterized queries, filter ordering,
  cross-partition query avoidance, and analytical query detection.
  USE FOR: Cosmos DB queries, point reads vs queries, SELECT projections,
  continuation tokens, parameterized queries, avoid cross-partition, avoid scans,
  filter selectivity, TOP literal, ORDER BY, latest by timestamp, OLAP detection,
  aggregate queries, DISTINCT keyword.
  DO NOT USE FOR: indexing (use cosmosdb-indexing), data modeling (use cosmosdb-data-modeling),
  SDK client code (use cosmosdb-sdk).
---

# Azure Cosmos DB Query Optimization

Best practices for writing efficient queries against Azure Cosmos DB.

## When to Apply

Reference these guidelines when:
- Writing or optimizing Cosmos DB queries
- Implementing pagination
- Choosing between point reads and queries
- Reducing RU consumption on read operations
- Handling aggregations and sorting

## Rules

- [query-point-reads](references/query-point-reads.md) - Use point reads when id and partition key are known
- [query-aggregate-single-pass](references/query-aggregate-single-pass.md) - Compute min/max/avg with one scoped aggregate query
- [query-avoid-cross-partition](references/query-avoid-cross-partition.md) - Minimize cross-partition queries
- [query-use-projections](references/query-use-projections.md) - Project only needed fields
- [query-pagination](references/query-pagination.md) - Use continuation tokens for pagination
- [query-avoid-scans](references/query-avoid-scans.md) - Avoid full container scans
- [query-parameterize](references/query-parameterize.md) - Use parameterized queries
- [query-order-filters](references/query-order-filters.md) - Order filters by selectivity
- [query-top-literal](references/query-top-literal.md) - Use literal integers for TOP
- [query-latest-by-timestamp](references/query-latest-by-timestamp.md) - Query latest documents with ORDER BY and TOP 1
- [query-olap-detection](references/query-olap-detection.md) - Detect and redirect analytical queries
- [query-distinct-keyword](references/query-distinct-keyword.md) - Use DISTINCT keyword correctly
