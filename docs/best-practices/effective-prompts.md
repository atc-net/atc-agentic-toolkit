# Effective Prompts

Master the art of communicating with Claude Code for optimal results.

## Table of Contents

- [Core Principles](#core-principles)
- [Prompt Structure](#prompt-structure)
- [Providing Context](#providing-context)
- [Breaking Down Tasks](#breaking-down-tasks)
- [Explore Before Implementing](#explore-before-implementing)
- [Common Patterns](#common-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Advanced Techniques](#advanced-techniques)

---

## Core Principles

### 1. Be Precise and Specific

**Quality output = Quality input**

**❌ Vague:**

```
Help me with the API
```

**✅ Specific:**

```
Create a new REST API endpoint in UserController that accepts a POST request with email and password, validates the credentials, and returns a JWT token
```

### 2. Provide Relevant Context

Give Claude what it needs to understand your request.

**❌ Missing context:**

```
Add authentication
```

**✅ With context:**

```
Add JWT-based authentication to our ASP.NET Core API. We're using .NET 6, Entity Framework Core with a User table, and the API follows RESTful conventions. The auth should support login and token refresh.
```

### 3. Break Complex Tasks into Steps

**❌ Too complex:**

```
Build a complete user management system with authentication, authorization, email verification, password reset, and admin dashboard
```

**✅ Broken down:**

```
Let's build a user management system in phases:
Phase 1: Basic user registration and login with JWT authentication
Phase 2: Email verification workflow
Phase 3: Password reset functionality
Phase 4: Authorization with role-based access
Phase 5: Admin dashboard

Let's start with Phase 1. Create the user registration endpoint that accepts email and password, hashes the password with BCrypt, stores the user in our PostgreSQL database via Entity Framework Core, and returns a JWT token.
```

### 4. Set Clear Expectations

Define what "done" looks like.

**❌ Open-ended:**

```
Make the code better
```

**✅ Clear expectations:**

```
Refactor the UserService class to:
1. Extract database logic into a repository pattern
2. Add async/await for all database operations
3. Implement proper error handling with try-catch
4. Add XML documentation comments for all public methods
5. Follow SOLID principles, especially Single Responsibility
```

### 5. Ask for Trade-offs

Get Claude's reasoning, not just output.

**Good prompts:**

```
What are the pros and cons of using Redis vs. in-memory caching for session storage in our scenario?

Compare approach A (microservices) vs. approach B (monolith) for our IoT telemetry processing system. Consider scalability, complexity, and maintenance.

Should we use SignalR or polling for real-time updates? What factors should influence this decision?
```

---

## Prompt Structure

### The Effective Prompt Template

```
[Context] + [Task] + [Expectations] + [Constraints]
```

**Example:**

**Context:** We have an ASP.NET Core Web API with Entity Framework Core and PostgreSQL. The project follows clean architecture with Controllers, Services, and Repositories.

**Task:** Create a new feature to export user data to CSV format.

**Expectations:**

- Create an ExportService with a method ExportUsersToCsv()
- Include all user fields except password
- Use CsvHelper library for CSV generation
- Add XML documentation
- Follow existing project patterns

**Constraints:**

- Limit exports to 10,000 users per file for performance
- Only allow admin users to export (check role)
- Log export actions for audit trail

### Short Prompts vs. Detailed Prompts

**When to use short prompts:**

- Simple, straightforward tasks
- Working within an established context
- Iterating on previous work

Example:

```
Add a validation rule to ensure email is unique
```

**When to use detailed prompts:**

- Starting a new feature or module
- Complex requirements
- Multiple stakeholders or considerations
- First interaction on a topic

Example:

```
Create a comprehensive email validation system for user registration:
- Check email format (RFC 5322 compliance)
- Verify email doesn't already exist in database
- Send verification email with token
- Token expires after 24 hours
- User account is inactive until email is verified
- Follow our existing validation pattern in UserValidator.cs
```

---

## Providing Context

### Types of Context

#### 1. Technical Context

What technologies, frameworks, and tools are you using?

```
We're using:
- .NET 6 with ASP.NET Core
- Entity Framework Core 6 with PostgreSQL
- xUnit for testing
- Azure IoT Hub for device connectivity
- Docker for containerization
```

#### 2. Project Context

What's the structure and current state?

```
Project structure:
- src/Controllers/ - API endpoints
- src/Services/ - Business logic
- src/Repositories/ - Data access
- src/Models/ - Data models
- tests/ - Unit tests

Current state: We have basic CRUD operations for Users and Products. Now adding Orders functionality.
```

#### 3. Domain Context

What business logic or domain knowledge is relevant?

```
In our IoT system:
- Devices send telemetry every 30 seconds
- Temperature readings outside 0-50°C range are alerts
- Devices can be grouped into "zones"
- Each customer can have multiple zones
- Alerts must be sent to zone administrators within 1 minute
```

#### 4. Constraint Context

What limitations or requirements exist?

```
Constraints:
- API response time must be under 200ms
- We can't change the database schema (legacy system)
- Must maintain backward compatibility with v1 API
- Budget: max $500/month for cloud services
- Team is not experienced with microservices
```

### How to Provide Context Efficiently

**❌ Overloading:**

```
Read all 50 files in the src/ directory before starting
```

**✅ Progressive:**

```
Start by reading UserService.cs and IUserService.cs. We'll look at related files as needed.
```

**Use skills and plugins:**

```
Use the database-schema skill which has our full schema documented
```

---

## Breaking Down Tasks

### The Decomposition Strategy

**Large task** → **Phases** → **Steps** → **Actions**

**Example:**

**Large Task:** Build a notification system

**Phases:**

1. Design notification architecture
2. Implement core notification service
3. Add notification channels (email, SMS, push)
4. Create notification UI
5. Add notification preferences

**Steps (for Phase 2):**

1. Create NotificationService interface
2. Implement NotificationService class
3. Add notification storage (database)
4. Implement notification queue
5. Add background worker to process queue

**Actions (for Step 2):**

1. Create NotificationService.cs
2. Inject dependencies (IRepository, ILogger)
3. Implement CreateNotification method
4. Implement GetUserNotifications method
5. Add error handling
6. Write unit tests

### When to Break Down

**Signs you need decomposition:**

- Task feels overwhelming or unclear
- Multiple concerns are mixed
- High risk of errors or confusion
- Learning involved (new tech, pattern)

**How to know if decomposition is good:**

- Each piece is independently understandable
- Each piece can be completed in one session
- Clear dependencies between pieces
- Easy to validate each piece

---

## Explore Before Implementing

**Core principle:** Brainstorm multiple approaches, compare trade-offs, then select and implement the best option.

### Why Explore First?

Jumping straight to implementation can lead to:
- Suboptimal solutions (missing better alternatives)
- Costly refactoring (discovering issues late)
- Tunnel vision (committing to first idea)
- Wasted effort (solving the wrong problem)

**Better approach:** Invest time upfront to understand options.

### Request Multiple Solutions

Ask Claude to generate and compare multiple approaches:

**Effective prompts:**

```
Give me 3 different approaches to implementing user authentication
in our ASP.NET Core API. Present them in a markdown table with
pros, cons, complexity, and security considerations for each.
```

```
What are the options for handling real-time updates in our dashboard?
Compare:
1. SignalR
2. HTTP polling
3. Server-Sent Events (SSE)

Consider scalability, browser support, complexity, and our team's experience.
```

```
Propose 2-3 architectures for our notification system. For each, explain:
- How it handles high volume (10K+ notifications/hour)
- Failure scenarios and recovery
- Maintenance complexity
- Cost implications
```

### Use Comparison Tables

Request structured comparisons for clear decision-making:

```
Compare these caching strategies in a table:

| Approach | Pros | Cons | Complexity | Best For |
|----------|------|------|------------|----------|
| In-Memory (IMemoryCache) | ... | ... | ... | ... |
| Distributed (Redis) | ... | ... | ... | ... |
| HTTP Caching (ETags) | ... | ... | ... | ... |

Consider our context: 10K products, 3 API servers, 1000 req/sec.
```

### Leverage Specialized Agents for Exploration

Use agents to get different perspectives before committing:

```
@pair-programmer compare 2-3 solutions for caching product data.
Consider our 10K product catalog and 3-server setup.
```

```
@system-architect propose architectures for our notification system.
Compare monolithic vs. microservices approaches given our team size (5 devs)
and current infrastructure.
```

```
@root-cause-analyst what could go wrong with each of these approaches?
Help me identify potential failure modes before we commit.
```

### The Comparison-Driven Workflow

**5-step process:**

#### 1. Brainstorm

Request multiple approaches without judgment:

```
What are different ways to implement background job processing
in our .NET application?
```

#### 2. Compare

Analyze trade-offs systematically:

```
Create a comparison table with pros, cons, complexity, scalability,
and maintenance burden for each approach.
```

#### 3. Discuss

Ask clarifying questions about specifics:

```
How would approach B (Hangfire) handle the scenario where a job
fails halfway through processing 1000 records?

What's the learning curve for our team with approach C (Azure Functions)?

Can approach A (IHostedService) scale horizontally across multiple servers?
```

#### 4. Select

Make an informed decision with clear reasoning:

```
Let's go with approach B (Hangfire) because:
- It handles our volume requirements (5K jobs/day)
- Built-in retry and failure handling
- Our team has C# experience (no new language)
- Lower total cost than Azure Functions for our volume
- Acceptable learning curve (2-3 days)

The added complexity compared to IHostedService is worth the
scalability and reliability benefits.
```

#### 5. Implement

Execute with confidence:

```
Implement background job processing using Hangfire following
the design we discussed. Start with:
1. Install Hangfire NuGet packages
2. Configure with PostgreSQL storage
3. Create job interface and first job implementation
4. Add dashboard for monitoring
```

### Safe Exploration with `/rewind`

Don't fear trying approaches—you can always backtrack:

```
# Try approach A
Implement user authentication with custom JWT token generation

[After reviewing implementation, you're not satisfied]

# Explore alternative without losing work
/rewind to before implementation

Let's try approach B with ASP.NET Core Identity instead.
The built-in features will save us development time.
```

### When to Skip Exploration

You don't always need extensive exploration:

**Skip exploration when:**
- Solution is obvious and straightforward
- Time is critical (emergency bug fix)
- You're iterating on existing implementation
- The decision is easily reversible

**Always explore when:**
- Multiple viable approaches exist
- Decision has long-term implications
- High cost to change later (architecture, data model)
- Team is unfamiliar with the domain
- Requirements are unclear or complex

### Examples from Practice

#### Example 1: Database Strategy

**❌ Jump to implementation:**
```
Implement the database layer with Entity Framework Core
```

**✅ Explore first:**
```
We need a database layer for our IoT telemetry storage.
Compare these approaches:
1. Entity Framework Core with PostgreSQL
2. Dapper with PostgreSQL
3. Azure Cosmos DB

Consider:
- Write volume: 10K records/second
- Read patterns: Recent data + historical aggregates
- Team experience: Strong with EF Core, new to Cosmos DB
- Budget: Moderate

Recommend an approach with reasoning.
```

#### Example 2: Error Handling

**❌ Jump to implementation:**
```
Add error handling to the API
```

**✅ Explore first:**
```
What are 2-3 approaches to centralized error handling in
our ASP.NET Core API? Compare:
- Custom middleware
- Exception filters
- Problem Details (RFC 7807)

Show code examples and explain trade-offs for each.
```

---

## Common Patterns

### Pattern 1: Explore, Then Execute

```
# Step 1: Exploration
Show me the current authentication implementation in UserController.cs and AuthService.cs

# Step 2: Analysis
Based on what you see, what would be the best way to add OAuth2 support while maintaining the existing JWT authentication?

# Step 3: Execution
Let's proceed with approach B. Implement OAuth2 support following the pattern you outlined.
```

### Pattern 2: Examples Before Implementation

```
Before we implement the notification system, can you show me 2-3 examples of how the notification API would be used from a client perspective?

# Claude provides examples

These look good. Let's implement the notification service to support these use cases.
```

### Pattern 3: Iterative Refinement

```
# Iteration 1
Create a basic user search endpoint

# Iteration 2
Add filtering by role and status to the search

# Iteration 3
Add pagination to handle large result sets

# Iteration 4
Add sorting options

# Iteration 5
Optimize with database indexes
```

### Pattern 4: Validation Checkpoints

```
Create the database migration for the Orders table

[Claude creates migration]

Before we apply this, can you review it and check:
1. Are the relationships correct?
2. Do we have proper indexes?
3. Are nullable fields appropriate?
4. Any potential issues?

[Claude reviews and suggests improvements]

Good catches. Please update the migration with your suggestions.
```

### Pattern 5: Trade-off Analysis

```
We need to implement caching for our product catalog. Compare these approaches:
1. In-memory caching (IMemoryCache)
2. Distributed caching with Redis
3. HTTP caching with ETags

Consider:
- Our product catalog has 10,000 items
- Updates happen about 100 times per day
- We have 3 API servers
- Average request rate is 1000 req/sec

Provide pros/cons and recommendation.
```

---

## Anti-Patterns to Avoid

### ❌ 1. The XY Problem

Asking about your attempted solution instead of the actual problem.

**Don't:**

```
How do I iterate a dictionary backward in C#?
```

**Do:**

```
I need to process user records in reverse chronological order. Currently they're in a dictionary. What's the best approach?
```

### ❌ 2. Assuming Context

Assuming Claude knows your project specifics without explanation.

**Don't:**

```
Add the validation we discussed
```

**Do:**

```
Add email format validation to the UserValidator class, following the pattern we used for password validation in the previous conversation
```

### ❌ 3. Vague Error Reports

Reporting problems without details.

**Don't:**

```
The API isn't working
```

**Do:**

```
The POST /api/users endpoint returns 500 Internal Server Error when I send a valid user object. The error log shows: "Cannot insert NULL into column 'CreatedDate'". Here's the request body I'm sending: {...}
```

### ❌ 4. Too Many Simultaneous Changes

Asking for multiple unrelated changes at once.

**Don't:**

```
Fix the authentication bug, add pagination to search, refactor the services, update all dependencies, and add logging
```

**Do:**

```
Let's fix the authentication bug first. Once that's working, we'll tackle pagination.
```

### ❌ 5. No Validation Criteria

Not specifying how to verify success.

**Don't:**

```
Make the tests pass
```

**Do:**

```
Make the UserServiceTests pass. Expected behavior:
- GetUserById with valid ID returns user
- GetUserById with invalid ID returns null
- CreateUser with valid data returns success
- CreateUser with duplicate email throws ValidationException
```

---

## Advanced Techniques

### Technique 1: Rubber Duck Prompting

Ask Claude to explain back to you:

```
I'm thinking about implementing notifications using SignalR. Can you explain the architecture back to me based on our requirements, and point out any issues you see?
```

### Technique 2: Constraint-Based Prompting

Define what NOT to do:

```
Refactor the UserService, but:
- Don't change the public API (method signatures must stay the same)
- Don't add new dependencies
- Don't break existing tests
- Keep the changes minimal
```

### Technique 3: Role-Based Prompting

Ask Claude to take a specific perspective:

```
Review this code as a security expert. What vulnerabilities do you see?

Now review it as a performance engineer. What bottlenecks exist?

Finally, review as a maintainability expert. What would make this harder to maintain?
```

### Technique 4: Socratic Prompting

Guide Claude to discover solutions:

```
# Instead of:
Implement the notification system

# Try:
What are the key requirements for a notification system in our IoT platform?
[Claude responds]

What are the main components we'd need to build?
[Claude responds]

What challenges do you foresee with the queue-based approach?
[Claude responds]

Given those challenges, what architecture would you recommend?
[Claude responds]

Let's implement your recommended approach.
```

### Technique 5: Staged Commitment

Get buy-in before execution:

```
# Stage 1: Proposal
Propose 2-3 approaches for implementing real-time updates

# Stage 2: Discussion
I like approach 2 (SignalR), but I'm concerned about the scaling implications. How would you address that?

# Stage 3: Commitment
Let's go with approach 2 with Redis backplane for scaling. Implement the basic SignalR setup first.

# Stage 4: Validation
Before we continue, let's test this basic setup with 100 concurrent connections

# Stage 5: Expansion
The basic setup works great. Now add the Redis backplane.
```

---

## Quick Reference

### Prompt Checklist

Before hitting enter, verify:

- [ ] Is my request specific and clear?
- [ ] Have I provided relevant context?
- [ ] Are my expectations defined?
- [ ] Have I mentioned constraints?
- [ ] Is the scope appropriate (not too big)?
- [ ] Have I explained *why* (not just *what*)?

### Effective Prompt Starters

**For exploration:**

- "Show me..."
- "Explain..."
- "What are the options for..."
- "Compare..."

**For implementation:**

- "Create..."
- "Implement..."
- "Add..."
- "Refactor..."

**For review:**

- "Review this code for..."
- "What issues do you see..."
- "Analyze..."
- "Evaluate..."

**For planning:**

- "Design..."
- "Propose..."
- "What would be the best way to..."
- "How should we approach..."

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md)
- [Context Management](context-management.md)
- [Team Standards](team-standards.md)

---

**Key Takeaway:** Clear input = Clear output. Invest time in crafting precise prompts, and you'll save time in iterations and corrections.
