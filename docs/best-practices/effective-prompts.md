# Effective Prompts

How to write prompts that get good results from Claude Code on the first try.

## Table of Contents

- [Core Principles](#core-principles)
- [Prompt Structure](#prompt-structure)
- [Providing Context](#providing-context)
- [Breaking Down Tasks](#breaking-down-tasks)
- [Explore Before Implementing](#explore-before-implementing)
- [Common Patterns](#common-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Advanced Techniques](#advanced-techniques)
- [Quick Reference](#quick-reference)

---

## Core Principles

### 1. Be Precise and Specific

The quality of the output follows the quality of the input.

**Vague:**

```text
Help me with the API
```

**Specific:**

```text
Create a new REST API endpoint in UserController that accepts a POST request with email and password, validates the credentials, and returns a JWT token
```

### 2. Provide Relevant Context

Give Claude what it needs to understand your request.

**Missing context:**

```text
Add authentication
```

**With context:**

```text
Add JWT-based authentication to our ASP.NET Core API. We're using .NET 10, Entity Framework Core with a User table, and the API follows RESTful conventions. The auth should support login and token refresh.
```

### 3. Break Complex Tasks into Steps

**Too complex:**

```text
Build a complete user management system with authentication, authorization, email verification, password reset, and admin dashboard
```

**Broken down:**

```text
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

**Open-ended:**

```text
Make the code better
```

**Clear expectations:**

```text
Refactor the UserService class to:
1. Extract database logic into a repository pattern
2. Add async/await for all database operations
3. Implement proper error handling with try-catch
4. Add XML documentation comments for all public methods
5. Follow SOLID principles, especially Single Responsibility
```

### 5. Ask for Trade-offs

Ask for Claude's reasoning, not just output.

```text
What are the pros and cons of using Redis vs. in-memory caching for session storage in our scenario?

Should we use SignalR or polling for real-time updates? What factors should influence this decision?
```

---

## Prompt Structure

### The Effective Prompt Template

```text
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

**Use short prompts for:**

- Simple, straightforward tasks
- Work within an established context
- Iterating on previous work

```text
Add a validation rule to ensure email is unique
```

**Use detailed prompts for:**

- Starting a new feature or module
- Complex requirements
- The first prompt on a topic

```text
Create an email validation system for user registration:
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

```text
We're using:
- .NET 10 with ASP.NET Core
- Entity Framework Core 10 with PostgreSQL
- xUnit for testing
- Azure IoT Hub for device connectivity
- Docker for containerization
```

#### 2. Project Context

What's the structure and current state?

```text
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

```text
In our IoT system:
- Devices send telemetry every 30 seconds
- Temperature readings outside 0-50°C range are alerts
- Devices can be grouped into "zones"
- Each customer can have multiple zones
- Alerts must be sent to zone administrators within 1 minute
```

#### 4. Constraint Context

What limitations or requirements exist?

```text
Constraints:
- API response time must be under 200ms
- We can't change the database schema (legacy system)
- Must maintain backward compatibility with v1 API
- Team is not experienced with microservices
```

### How to Provide Context Efficiently

**Overloading:**

```text
Read all 50 files in the src/ directory before starting
```

**Progressive:**

```text
Start by reading UserService.cs and IUserService.cs. We'll look at related files as needed.
```

**Reference files with `@`** to pull their contents straight into the prompt:

```text
Explain how @src/Services/UserService.cs uses @src/Repositories/IUserRepository.cs
```

Context you repeat in every session belongs in `CLAUDE.md` or `AGENTS.md`, not in each prompt. See [Team Standards](team-standards.md#shared-claudemd).

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

- The task feels overwhelming or unclear
- Multiple concerns are mixed
- High risk of errors or confusion
- New technology or patterns are involved

**Signs the decomposition is good:**

- Each piece is understandable on its own
- Each piece can be completed in one session
- Dependencies between pieces are clear
- Each piece is easy to validate

---

## Explore Before Implementing

Brainstorm approaches, compare trade-offs, then pick one and implement it. Jumping straight to code tends to lock you into the first idea and surfaces problems late, when they cost more to fix.

### Use Plan Mode

Plan mode lets Claude read files and propose a plan without editing anything until you approve. Press `Shift+Tab` until the status bar shows plan mode, or start a session with:

```bash
claude --permission-mode plan
```

### Request Multiple Solutions

```text
Give me 3 different approaches to implementing user authentication
in our ASP.NET Core API. Present them in a markdown table with
pros, cons, complexity, and security considerations for each.
```

```text
Propose 2-3 architectures for our notification system. For each, explain:
- How it handles high volume (10K+ notifications/hour)
- Failure scenarios and recovery
- Maintenance complexity
- Cost implications
```

### Use Comparison Tables

Ask for a structured comparison when you need to make a decision:

```text
Compare these caching strategies in a table:

| Approach | Pros | Cons | Complexity | Best For |
|----------|------|------|------------|----------|
| In-Memory (IMemoryCache) | ... | ... | ... | ... |
| Distributed (Redis) | ... | ... | ... | ... |
| HTTP Caching (ETags) | ... | ... | ... | ... |

Consider our context: 10K products, updated about 100 times a day, 3 API servers, 1000 req/sec.
```

### Delegate Research to Subagents

Exploring a large codebase fills your context with file reads. Ask Claude to use a subagent, which reads in its own context window and reports back a summary:

```text
Use a subagent to investigate how our auth system handles token refresh, then list the failure modes of each approach we discussed
```

If your team has defined a custom subagent (in `.claude/agents/` or a plugin's `agents/`), name it in the prompt or @-mention it to make sure it runs, for example `@agent-code-reviewer`, or `@agent-<plugin>:<name>` for a plugin's agent. Claude Code has no built-in agent by that name; it is just an example. See [Agent Creation](../guides/agent-creation.md).

### The Comparison-Driven Workflow

#### 1. Brainstorm

```text
What are different ways to implement background job processing
in our .NET application?
```

#### 2. Compare

```text
Create a comparison table with pros, cons, complexity, scalability,
and maintenance burden for each approach.
```

#### 3. Discuss

```text
How would approach B (Hangfire) handle the scenario where a job
fails halfway through processing 1000 records?

Can approach A (IHostedService) scale horizontally across multiple servers?
```

#### 4. Select

State the decision and the reasoning, so Claude implements the right thing:

```text
Let's go with approach B (Hangfire) because:
- It handles our volume requirements (5K jobs/day)
- Built-in retry and failure handling
- Our team already knows C#

The added complexity compared to IHostedService is worth the
scalability and reliability benefits.
```

#### 5. Implement

```text
Implement background job processing using Hangfire following
the design we discussed. Start with:
1. Install Hangfire NuGet packages
2. Configure with PostgreSQL storage
3. Create job interface and first job implementation
4. Add dashboard for monitoring
```

### Safe Exploration with `/rewind`

Claude Code takes a checkpoint before each prompt, so you can try an approach and back out of it:

1. Run `/rewind`, or press `Esc` twice on an empty prompt, to open the rewind menu.
2. Pick the prompt you want to go back to.
3. Choose **Restore code and conversation** (or restore only one of the two).

Then try the alternative:

```text
Let's try approach B with ASP.NET Core Identity instead.
The built-in features will save us development time.
```

Checkpoints only track edits made by Claude's file editing tools. Changes made through Bash commands (for example `rm` or `dotnet ef migrations add`) are not undone. Checkpoints don't replace git; commit work you want to keep. To try an alternative while keeping the original session intact, use `/branch`.

### When to Skip Exploration

**Skip it when:**

- The solution is obvious
- Time is critical (emergency bug fix)
- You're iterating on an existing implementation
- The decision is easy to reverse

**Always explore when:**

- Multiple viable approaches exist
- The decision has long-term implications (architecture, data model)
- The team is unfamiliar with the domain
- Requirements are unclear or complex

### Example: Database Strategy

**Jump to implementation:**

```text
Implement the database layer with Entity Framework Core
```

**Explore first:**

```text
We need a database layer for our IoT telemetry storage.
Compare these approaches:
1. Entity Framework Core with PostgreSQL
2. Dapper with PostgreSQL
3. Azure Cosmos DB

Consider:
- Write volume: 10K records/second
- Read patterns: Recent data + historical aggregates
- Team experience: Strong with EF Core, new to Cosmos DB

Recommend an approach with reasoning.
```

---

## Common Patterns

### Pattern 1: Explore, Then Execute

```text
# Step 1: Exploration
Show me the current authentication implementation in UserController.cs and AuthService.cs

# Step 2: Analysis
Based on what you see, what would be the best way to add OAuth2 support while maintaining the existing JWT authentication?

# Step 3: Execution
Let's proceed with approach B. Implement OAuth2 support following the pattern you outlined.
```

### Pattern 2: Examples Before Implementation

```text
Before we implement the notification system, show me 2-3 examples of how the notification API would be used from a client perspective.

# Claude provides examples

These look good. Let's implement the notification service to support these use cases.
```

### Pattern 3: Iterative Refinement

```text
# Iteration 1
Create a basic user search endpoint

# Iteration 2
Add filtering by role and status to the search

# Iteration 3
Add pagination to handle large result sets

# Iteration 4
Add sorting options
```

### Pattern 4: Validation Checkpoints

```text
Create the database migration for the Orders table

[Claude creates migration]

Before we apply this, review it and check:
1. Are the relationships correct?
2. Do we have proper indexes?
3. Are nullable fields appropriate?

[Claude reviews and suggests improvements]

Good catches. Update the migration with your suggestions.
```

---

## Anti-Patterns to Avoid

### 1. The XY Problem

Asking about your attempted solution instead of the actual problem.

**Don't:**

```text
How do I iterate a dictionary backward in C#?
```

**Do:**

```text
I need to process user records in reverse chronological order. Currently they're in a dictionary. What's the best approach?
```

### 2. Assuming Context

Assuming Claude knows project details you haven't given it. A new session starts with a fresh context window: instruction files (`CLAUDE.md` or `AGENTS.md`, `.claude/rules/`) and auto memory load, but the earlier conversation doesn't, unless you resume it with `claude --continue` or `/resume`.

**Don't:**

```text
Add the validation we discussed
```

**Do:**

```text
Add email format validation to the UserValidator class, following the pattern used for password validation in PasswordValidator.cs
```

### 3. Vague Error Reports

**Don't:**

```text
The API isn't working
```

**Do:**

```text
The POST /api/users endpoint returns 500 Internal Server Error when I send a valid user object. The error log shows: "Cannot insert NULL into column 'CreatedDate'". Here's the request body I'm sending: {...}
```

### 4. Too Many Simultaneous Changes

**Don't:**

```text
Fix the authentication bug, add pagination to search, refactor the services, update all dependencies, and add logging
```

**Do:**

```text
Let's fix the authentication bug first. Once that's working, we'll tackle pagination.
```

### 5. No Validation Criteria

**Don't:**

```text
Make the tests pass
```

**Do:**

```text
Make the UserServiceTests pass. Expected behavior:
- GetUserById with valid ID returns user
- GetUserById with invalid ID returns null
- CreateUser with valid data returns success
- CreateUser with duplicate email throws ValidationException
```

---

## Advanced Techniques

### Technique 1: Rubber Duck Prompting

Ask Claude to explain your plan back to you:

```text
I'm thinking about implementing notifications using SignalR. Explain the architecture back to me based on our requirements, and point out any issues you see.
```

### Technique 2: Constraint-Based Prompting

Say what not to do:

```text
Refactor the UserService, but:
- Don't change the public API (method signatures must stay the same)
- Don't add new dependencies
- Don't break existing tests
- Keep the changes minimal
```

### Technique 3: Role-Based Prompting

Ask Claude to review from a specific perspective:

```text
Review this code as a security expert. What vulnerabilities do you see?

Now review it as a performance engineer. What bottlenecks exist?
```

### Technique 4: Staged Commitment

Agree on the approach before Claude builds all of it:

```text
# Stage 1: Proposal
Propose 2-3 approaches for implementing real-time updates

# Stage 2: Discussion
I like approach 2 (SignalR), but I'm concerned about scaling. How would you address that?

# Stage 3: Commitment
Let's go with approach 2 with a Redis backplane. Implement the basic SignalR setup first.

# Stage 4: Expansion
The basic setup works. Now add the Redis backplane.
```

---

## Quick Reference

### Prompt Checklist

Before you press Enter, check:

- [ ] Is the request specific?
- [ ] Have I given the relevant context?
- [ ] Have I said what "done" looks like?
- [ ] Have I mentioned constraints?
- [ ] Is the scope small enough for one step?
- [ ] Have I explained *why*, not just *what*?

### Prompt Starters

| Goal | Starters |
|------|----------|
| Exploration | "Show me...", "Explain...", "What are the options for...", "Compare..." |
| Implementation | "Create...", "Implement...", "Add...", "Refactor..." |
| Review | "Review this code for...", "What issues do you see...", "Analyze..." |
| Planning | "Design...", "Propose...", "How should we approach..." |

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md)
- [Context Management](context-management.md)
- [Team Standards](team-standards.md)
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
