---
name: cosmosdb-data-modeling
description: >
  Azure Cosmos DB data modeling best practices: embedding vs referencing,
  document size limits, schema versioning, type discriminators, JSON serialization,
  denormalization, and relationship patterns.
  USE FOR: Cosmos DB document design, embedding related data, referencing large data,
  2MB item limit, nesting depth, numeric precision, denormalize reads, schema versions,
  type discriminator, polymorphic containers, JSON serialization, relationship references.
  DO NOT USE FOR: partition key design (use cosmosdb-partition-key), query optimization
  (use cosmosdb-query-optimization), SDK client code (use cosmosdb-sdk).
---

# Azure Cosmos DB Data Modeling

Best practices for designing document schemas in Azure Cosmos DB, prioritized by impact.

## When to Apply

Reference these guidelines when:
- Designing document schemas for Cosmos DB containers
- Deciding between embedding and referencing related data
- Handling polymorphic data in shared containers
- Planning schema evolution and versioning
- Configuring JSON serialization for Cosmos DB documents

## Rules

- [model-embed-related](references/model-embed-related.md) - Embed related data retrieved together
- [model-reference-large](references/model-reference-large.md) - Reference data when items get too large
- [model-avoid-2mb-limit](references/model-avoid-2mb-limit.md) - Keep items well under 2MB limit
- [model-id-constraints](references/model-id-constraints.md) - Follow ID value length and character constraints
- [model-nesting-depth](references/model-nesting-depth.md) - Stay within 128-level nesting depth limit
- [model-numeric-precision](references/model-numeric-precision.md) - Understand IEEE 754 numeric precision limits
- [model-denormalize-reads](references/model-denormalize-reads.md) - Denormalize for read-heavy workloads
- [model-schema-versioning](references/model-schema-versioning.md) - Version your document schemas
- [model-type-discriminator](references/model-type-discriminator.md) - Use type discriminators for polymorphic data
- [model-json-serialization](references/model-json-serialization.md) - Handle JSON serialization correctly
- [model-relationship-references](references/model-relationship-references.md) - Use ID references with transient hydration
