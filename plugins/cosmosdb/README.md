# Cosmos DB Plugin

Azure Cosmos DB skills: an interactive NoSQL data-modeling workflow, plus impact-ranked best-practice rules for partition keys, queries, SDK usage, indexing, throughput, global distribution, vector and full-text search, security, monitoring and tooling.

## Overview

Start a new design with `cosmosdb-data-modeling-workflow`. It walks you through your requirements and produces a data model. The other skills are focused rule sets that load when you work on that part of a Cosmos DB solution.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install cosmosdb --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install cosmosdb@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### cosmosdb-data-modeling-workflow

A step-by-step guide to designing a Cosmos DB NoSQL data model. It captures the application's requirements, access patterns, volumes and concurrency in `cosmosdb_requirements.md`. Then it writes an optimized data model, built on best practices and common patterns, to `cosmosdb_data_model.md`.

### cosmosdb-data-modeling

Document design: embedding vs referencing, document size limits, schema versioning, type discriminators, JSON serialization, denormalization and relationship patterns.

### cosmosdb-partition-key

Partition key design: high cardinality, avoiding hot partitions, hierarchical and synthetic keys, aligning with query patterns, immutability and logical partition size limits.

### cosmosdb-query-optimization

Queries: point reads, projections, pagination with continuation tokens, parameterized queries, filter order, avoiding cross-partition queries, and spotting analytical queries.

### cosmosdb-indexing

Indexing policy: excluding unused paths, composite indexes for `ORDER BY`, spatial indexes, index types, path syntax and indexing modes.

### cosmosdb-sdk

SDK usage for .NET, Java, Python, Spring Boot and LangChain: a singleton client, async APIs, connection modes, retry handling, diagnostics, serialization, emulator setup and ETags.

### cosmosdb-throughput

Throughput and scaling: autoscale, right-sizing provisioned throughput, serverless for dev/test, burst capacity, and container vs database throughput.

### cosmosdb-global-distribution

Multi-region setups: multi-region writes, consistency levels, conflict resolution, automatic failover, read regions and zone redundancy.

### cosmosdb-design-patterns

Larger patterns: change feed materialized views, efficient ranking, relationship hydration in a service layer, and agent patterns (LangGraph multi-agent orchestration, human-in-the-loop, checkpoints, chat history).

### cosmosdb-vector-search

Vector search: enabling the feature, embedding policies, vector indexes (`flat`, `quantizedFlat`, `diskANN`), normalizing embeddings, `VectorDistance` queries and repository patterns for RAG.

### cosmosdb-full-text-search

Full-text search: enabling the capability, `fullTextPolicy` and `fullTextIndexes`, `FullTextContains` keyword matching, BM25 ranking and hybrid queries.

### cosmosdb-security

Security: disabling key-based auth, managed identity with `DefaultAzureCredential`, network restrictions, least-privilege RBAC and continuous backup for point-in-time restore.

### cosmosdb-monitoring

Monitoring: RU consumption, P99 latency, throttling (429) alerts, Azure Monitor integration and diagnostic logs.

### cosmosdb-tooling

Developer tooling: the VS Code extension for inspecting and managing data, and the Cosmos DB Emulator for local development and testing.

## License

MIT
