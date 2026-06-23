---
name: cosmosdb-design-patterns
description: >
  Azure Cosmos DB design patterns: change feed materialized views, efficient
  ranking, service layer relationship hydration, LangGraph multi-agent orchestration,
  human-in-the-loop interrupts, checkpoint resumption, agent routing, FastAPI startup,
  chat history separation, background task writes, async Cosmos DB routing, and
  agent name attribution.
  USE FOR: Cosmos DB change feed, materialized views, CQRS, event sourcing,
  ranking patterns, service layer, relationship hydration, LangGraph, multi-agent,
  human-in-the-loop, interrupt, checkpoint, agent routing, FastAPI startup,
  chat history, background tasks, async routing, agent attribution, AI grounding.
  DO NOT USE FOR: SDK configuration (use cosmosdb-sdk), data modeling (use cosmosdb-data-modeling).
---

# Azure Cosmos DB Design Patterns

Architecture and integration patterns for Azure Cosmos DB applications, including AI agent orchestration with LangGraph.

## When to Apply

Reference these guidelines when:
- Implementing materialized views with change feed
- Building ranking or leaderboard features
- Hydrating document references across containers
- Building LangGraph multi-agent applications with Cosmos DB
- Implementing human-in-the-loop flows
- Managing chat history and agent routing

## Rules

- [pattern-change-feed-materialized-views](references/pattern-change-feed-materialized-views.md) - Use Change Feed for cross-partition query optimization
- [pattern-efficient-ranking](references/pattern-efficient-ranking.md) - Efficient ranking approaches
- [pattern-service-layer-relationships](references/pattern-service-layer-relationships.md) - Service layer for relationship hydration
- [pattern-langgraph-multi-agent](references/pattern-langgraph-multi-agent.md) - StateGraph with conditional edges for multi-agent routing
- [pattern-langgraph-interrupt-human](references/pattern-langgraph-interrupt-human.md) - LangGraph interrupt for human-in-the-loop
- [pattern-langgraph-resume-checkpoint](references/pattern-langgraph-resume-checkpoint.md) - Resume from checkpoint after interrupt
- [pattern-langgraph-agent-routing-cosmosdb](references/pattern-langgraph-agent-routing-cosmosdb.md) - Persist active agent in Cosmos DB
- [pattern-langgraph-fastapi-startup](references/pattern-langgraph-fastapi-startup.md) - Initialize LangGraph agents in FastAPI
- [pattern-langgraph-chat-history-separate](references/pattern-langgraph-chat-history-separate.md) - Store chat history in dedicated container
- [pattern-background-task-writes](references/pattern-background-task-writes.md) - FastAPI background tasks for non-blocking writes
- [pattern-langgraph-async-cosmos-routing](references/pattern-langgraph-async-cosmos-routing.md) - Async Cosmos DB calls in LangGraph routing
- [pattern-langgraph-async-cosmos-writes](references/pattern-langgraph-async-cosmos-writes.md) - Async active agent writes
- [pattern-langgraph-agent-name-attribution](references/pattern-langgraph-agent-name-attribution.md) - Tag AI messages with agent name
- [pattern-ai-grounding-access](references/pattern-ai-grounding-access.md) - AI grounding access patterns
