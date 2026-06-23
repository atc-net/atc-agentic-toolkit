---
name: cosmosdb-vector-search
description: >
  Azure Cosmos DB vector search best practices: enabling the feature, defining
  embedding policies, configuring vector indexes (flat, quantizedFlat, diskANN),
  normalizing embeddings, VectorDistance queries, and repository patterns for RAG.
  USE FOR: Cosmos DB vector search, vector embedding policy, vector index,
  flat index, quantizedFlat, diskANN, VectorDistance, cosine similarity,
  embedding normalization, RAG, retrieval augmented generation, semantic search,
  vector repository pattern, AI search.
  DO NOT USE FOR: full-text search (use cosmosdb-full-text-search),
  LangChain integration (use cosmosdb-sdk or cosmosdb-design-patterns).
---

# Azure Cosmos DB Vector Search

Best practices for configuring and using vector search in Azure Cosmos DB for AI-powered semantic search and RAG.

## When to Apply

Reference these guidelines when:
- Enabling vector search on a Cosmos DB account
- Defining vector embedding policies
- Choosing vector index types (flat, quantizedFlat, diskANN)
- Writing vector similarity queries
- Implementing RAG patterns with Cosmos DB

## Rules

- [vector-enable-feature](references/vector-enable-feature.md) - Enable vector search on the account
- [vector-embedding-policy](references/vector-embedding-policy.md) - Define vector embedding policy
- [vector-index-type](references/vector-index-type.md) - Configure vector indexes in indexing policy
- [vector-normalize-embeddings](references/vector-normalize-embeddings.md) - Normalize embeddings for cosine similarity
- [vector-distance-query](references/vector-distance-query.md) - Use VectorDistance for similarity search
- [vector-repository-pattern](references/vector-repository-pattern.md) - Implement repository pattern for vector search
