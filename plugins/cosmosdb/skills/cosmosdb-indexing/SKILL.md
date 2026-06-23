---
name: cosmosdb-indexing
description: >
  Azure Cosmos DB indexing strategy best practices: excluding unused paths,
  composite indexes for ORDER BY, spatial indexes, index types, path syntax,
  and indexing modes (consistent vs lazy).
  USE FOR: Cosmos DB indexing policy, exclude paths, composite index, spatial index,
  index path syntax /? /* /[], range vs hash index, lazy vs consistent indexing,
  index direction, write overhead reduction.
  DO NOT USE FOR: query optimization (use cosmosdb-query-optimization),
  full-text search indexes (use cosmosdb-full-text-search),
  vector indexes (use cosmosdb-vector-search).
---

# Azure Cosmos DB Indexing Strategies

Best practices for configuring indexing policies in Azure Cosmos DB.

## When to Apply

Reference these guidelines when:
- Configuring indexing policies
- Adding composite indexes for multi-field ORDER BY
- Optimizing write costs by excluding unused paths
- Setting up spatial indexes for geo queries

## Rules

- [index-exclude-unused](references/index-exclude-unused.md) - Exclude paths never queried
- [index-path-syntax](references/index-path-syntax.md) - Use correct path notation
- [index-composite](references/index-composite.md) - Use composite indexes for ORDER BY
- [index-composite-direction](references/index-composite-direction.md) - Match composite index directions
- [index-spatial](references/index-spatial.md) - Add spatial indexes for geo queries
- [index-range-vs-hash](references/index-range-vs-hash.md) - Choose appropriate index types
- [index-lazy-consistent](references/index-lazy-consistent.md) - Understand indexing modes
