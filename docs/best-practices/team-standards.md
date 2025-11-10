# Team Standards

Guidelines for standardizing AI-assisted development practices across ATC-Net teams.

## Table of Contents

- [Why Team Standards Matter](#why-team-standards-matter)
- [Shared CLAUDE.md](#shared-claudemd)
- [Plugin Distribution](#plugin-distribution)
- [Coding Conventions](#coding-conventions)
- [Workflow Standards](#workflow-standards)
- [Documentation Standards](#documentation-standards)
- [Quality Gates](#quality-gates)

---

## Why Team Standards Matter

### The Problem

Without standards, teams experience:

- **Inconsistent AI outputs** - Different prompts yield different code styles
- **Knowledge silos** - Effective patterns aren't shared
- **Onboarding friction** - New team members lack guidance
- **Quality variance** - Code quality depends on who wrote the prompt
- **Repeated work** - Same problems solved multiple times

### The Solution

Standardized Claude Code configuration provides:

- ✅ **Consistent behavior** - AI follows team conventions automatically
- ✅ **Shared knowledge** - Best practices are codified and distributed
- ✅ **Faster onboarding** - New members inherit team expertise
- ✅ **Quality assurance** - Standards are enforced in AI outputs
- ✅ **Efficiency** - Don't reinvent solutions

---

## Shared CLAUDE.md

### Creating a Team CLAUDE.md

**Purpose:** Establish baseline behavior for all team members' Claude Code sessions.

**Location:** Project repository root (`/CLAUDE.md`)

**Example Structure:**

```markdown
# ATC-Net Team Standards

This file defines coding standards and practices for the ATC-Net team. All team members should have Claude Code configured to follow these guidelines.

## Coding Style

### General Principles
- Follow Microsoft C# Coding Conventions
- Prioritize readability over cleverness
- Write self-documenting code with clear names
- Keep methods focused and small (under 50 lines)

### Naming Conventions
- **Classes:** PascalCase (e.g., `UserService`, `OrderRepository`)
- **Interfaces:** IPascalCase (e.g., `IUserService`, `IOrderRepository`)
- **Methods:** PascalCase (e.g., `GetUserById`, `CreateOrder`)
- **Private fields:** _camelCase (e.g., `_userRepository`, `_logger`)
- **Properties:** PascalCase (e.g., `UserId`, `EmailAddress`)
- **Constants:** PascalCase (e.g., `MaxRetryAttempts`, `DefaultTimeout`)

### File Organization
- One class per file
- File name matches class name
- Organize using statements: System → Third-party → Internal
- Use file-scoped namespaces (C# 10+)

### Documentation
- XML documentation for all public members
- Include `<summary>`, `<param>`, `<returns>`, and `<exception>` tags
- Document WHY, not just WHAT
- Include examples for complex methods

## Project Structure

### Directory Layout

```
src/
├── Controllers/          # API endpoints
├── Services/            # Business logic
├── Repositories/        # Data access
├── Models/              # Data models
│   ├── Entities/        # Database entities
│   ├── DTOs/            # Data transfer objects
│   └── ViewModels/      # UI models
├── Validation/          # FluentValidation validators
├── Middleware/          # ASP.NET middleware
└── Extensions/          # Extension methods

tests/
├── UnitTests/           # xUnit unit tests
├── IntegrationTests/    # Integration tests
└── TestHelpers/         # Test utilities
```

### Namespace Structure
Follow directory structure:
- `ATC.ProjectName.Controllers`
- `ATC.ProjectName.Services`
- `ATC.ProjectName.Repositories`

## Technology Stack

### Required Frameworks
- **.NET:** 6.0 or higher
- **Web Framework:** ASP.NET Core
- **ORM:** Entity Framework Core
- **Testing:** xUnit + Moq
- **Validation:** FluentValidation
- **Logging:** Microsoft.Extensions.Logging with Serilog

### Database
- **Primary:** PostgreSQL
- **Migrations:** Entity Framework Core migrations
- **Connection:** Use connection strings from appsettings.json/environment variables

### Cloud Services
- **Platform:** Azure
- **IoT:** Azure IoT Hub + IoT Edge
- **Storage:** Azure Blob Storage
- **Messaging:** Azure Service Bus

## Development Workflows

### Git Workflow
- **Main branch:** `main` (protected, requires PR)
- **Development branch:** `develop`
- **Feature branches:** `feature/[feature-name]`
- **Bug fix branches:** `bugfix/[bug-description]`
- **Release branches:** `release/v[version]`

### Commit Messages
Follow Conventional Commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

### Pull Request Requirements
- All tests pass
- Code reviewed by at least one team member
- No merge conflicts
- Follows coding standards
- Includes tests for new functionality
- Documentation updated if needed

## Testing Standards

### Unit Tests
- Test all public methods
- Use AAA pattern (Arrange, Act, Assert)
- One assertion per test when possible
- Mock external dependencies
- Test method naming: `MethodName_Scenario_ExpectedResult`

### Code Coverage
- Minimum 80% code coverage
- 100% coverage for critical business logic
- Use `dotnet test --collect:"XPlat Code Coverage"` to measure

### Test Structure

```csharp
public class UserServiceTests
{
    [Fact]
    public async Task GetUserById_ValidId_ReturnsUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedUser = new User { Id = userId, Email = "test@example.com" };
        var mockRepo = new Mock<IUserRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(expectedUser);
        var service = new UserService(mockRepo.Object);

        // Act
        var result = await service.GetUserById(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
    }
}
```

## Error Handling

### Exception Strategy
- Use specific exceptions (ArgumentException, InvalidOperationException, etc.)
- Create custom exceptions for domain-specific errors
- Include helpful error messages
- Log exceptions with full context

### API Error Responses
Return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

## Security Standards

### Authentication & Authorization
- Use JWT tokens for API authentication
- Store secrets in Azure Key Vault, never in code
- Validate all user inputs
- Use parameterized queries (Entity Framework does this)
- Apply principle of least privilege

### OWASP Top 10
Be aware of and prevent:
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XML external entities (XXE)
- Broken access control
- Security misconfigurations
- Cross-site scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging and monitoring

## Performance Guidelines

### Database Queries
- Use async/await for all database operations
- Apply appropriate indexes
- Use pagination for large result sets
- Avoid N+1 queries (use Include/ThenInclude)
- Use Select() to project only needed fields

### API Performance
- Response time under 200ms for simple endpoints
- Use caching for frequently accessed data
- Implement rate limiting
- Use compression for responses

## Logging Standards

### Log Levels
- **Trace:** Very detailed, typically only in development
- **Debug:** Detailed information for debugging
- **Information:** General informational messages
- **Warning:** Unexpected but recoverable situations
- **Error:** Errors that require attention
- **Critical:** Critical errors requiring immediate action

### Structured Logging

```csharp
_logger.LogInformation(
    "User {UserId} created order {OrderId} with total {Total}",
    userId, orderId, total);
```

### What to Log
- Authentication/authorization events
- All exceptions with full stack traces
- Performance metrics for critical operations
- External API calls and responses
- Database query performance issues

## Claude Code Usage

### When to Use Claude Code
- Writing boilerplate code
- Implementing standard patterns
- Creating unit tests
- Refactoring existing code
- Exploring unfamiliar codebases
- Generating documentation

### When to Review Carefully
- Authentication/authorization logic
- Database migrations
- Security-sensitive code
- Performance-critical sections
- Complex business logic

### Prompting Standards
Always include in prompts:
- Target framework (.NET 6)
- Following ATC-Net conventions
- Include XML documentation
- Write unit tests
- Use dependency injection

Example prompt:
```
Create a new UserService in .NET 6 that implements IUserService. Follow ATC-Net conventions, include XML documentation, use dependency injection for IUserRepository and ILogger, and write xUnit tests.
```

## Code Review Checklist

### Before Requesting Review
- [ ] All tests pass locally
- [ ] Code follows ATC-Net conventions
- [ ] XML documentation is complete
- [ ] No commented-out code
- [ ] No debugging statements (Console.WriteLine, etc.)
- [ ] Error handling is appropriate
- [ ] Security implications considered
- [ ] Performance implications considered

### Reviewer Checklist
- [ ] Code is understandable and maintainable
- [ ] Tests cover the changes
- [ ] No security vulnerabilities
- [ ] Follows team standards
- [ ] Documentation is clear
- [ ] Error handling is robust
- [ ] No performance regressions

## Onboarding New Team Members

### Setup Checklist
- [ ] Clone team repositories
- [ ] Install required tools (.NET SDK, PostgreSQL, Azure CLI)
- [ ] Install Claude Code CLI
- [ ] Configure CLAUDE.md (copy from repo root)
- [ ] Install team plugins from atc-agentic-toolkit
- [ ] Review team standards documentation
- [ ] Complete onboarding tasks with Claude Code

### Recommended Plugins
Install these from atc-agentic-toolkit:
- `common` - Base utilities and skill creator
- `code-refactoring` - C# code quality tools
- `azure-iot` - (if working on IoT projects)

### First Tasks with Claude Code
1. Use `/format-params` on an existing project
2. Generate tests for a simple service class
3. Create a new feature following team standards
4. Have Claude Code review your changes

## Resources

### Internal
- ATC-Net GitHub: https://github.com/atc-net
- Team Wiki: [Internal wiki URL]
- Code Review Guidelines: [Internal doc]

### External
- Microsoft C# Coding Conventions: [URL]
- Entity Framework Core Best Practices: [URL]
- ASP.NET Core Security: [URL]

## Continuous Improvement

### Feedback Loop
- Suggest improvements to team standards
- Share effective Claude Code prompts and patterns
- Document new best practices as they emerge
- Update CLAUDE.md based on team experiences

### Regular Reviews
- Review team standards quarterly
- Update for new .NET versions
- Incorporate lessons learned
- Share success stories

---

## Questions?

Reach out to the team lead or post in the #development channel.

---

*Last updated: [Date]*
*Version: 1.0*
```

### Maintaining Shared CLAUDE.md

**Version control:** Keep in git repository
**Updates:** Through pull requests with team review
**Communication:** Announce changes to team
**Documentation:** Include change log

---

## Plugin Distribution

### Team Plugin Repository

**Strategy:** Create a private marketplace for your organization

1. **Fork atc-agentic-toolkit** for your organization:
   ```bash
   # Fork on GitHub: your-org/atc-agentic-toolkit
   ```

2. **Add internal plugins** to the forked repository:
   - Create plugins in `.claude/plugins/`
   - Register in `.claude-plugin/marketplace.json`
   - Document in team README

3. **Team members add the marketplace** in Claude Code:
   ```
   Add the your-org marketplace from https://github.com/your-org/atc-agentic-toolkit
   ```

4. **Install plugins from your private marketplace**:
   ```
   Install the [plugin-name] plugin from the your-org marketplace
   ```

### Internal Plugins

**For company-specific plugins:**

1. Add to your organization's marketplace repository
2. Register in `.claude-plugin/marketplace.json`
3. Document in team README
4. Announce to team (they install via marketplace)

**Example internal plugin:**
- `company-api-generator` - Generates APIs following company patterns
- `internal-deployment` - Automates deployment to internal infrastructure
- `company-security-scan` - Runs company security checklist

---

## Coding Conventions

### ATC-Net Specific Patterns

**Service pattern:**
```csharp
public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository repository, ILogger<UserService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        _logger.LogInformation("Retrieving user with ID: {UserId}", userId);
        return await _repository.GetByIdAsync(userId);
    }
}
```

**Repository pattern:**
```csharp
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
    }
}
```

### Enforcing with Claude Code

In prompts, always include:
```
Follow ATC-Net patterns: use dependency injection, include XML documentation, log appropriately, and write unit tests with xUnit and Moq.
```

---

## Workflow Standards

### Feature Development Workflow

1. **Planning**
   - Use Claude Code in plan mode to design approach
   - Document architecture decisions

2. **Implementation**
   - Create feature branch
   - Use Claude Code for boilerplate and standard patterns
   - Write code following team standards

3. **Testing**
   - Generate unit tests with Claude Code
   - Run full test suite
   - Achieve minimum 80% code coverage

4. **Review**
   - Use `@code-reviewer` agent for pre-review
   - Address issues found
   - Submit PR for team review

5. **Integration**
   - Respond to review comments
   - Merge when approved
   - Verify deployment to development environment

---

## Documentation Standards

### Code Documentation

**Required:**
- XML documentation for all public members
- README.md for each major module
- Inline comments for complex logic

**Example:**
```csharp
/// <summary>
/// Retrieves a user by their unique identifier.
/// </summary>
/// <param name="userId">The unique identifier of the user to retrieve.</param>
/// <returns>
/// A <see cref="User"/> object if found; otherwise, null.
/// </returns>
/// <exception cref="ArgumentException">
/// Thrown when userId is empty.
/// </exception>
public async Task<User?> GetUserByIdAsync(Guid userId)
{
    if (userId == Guid.Empty)
    {
        throw new ArgumentException("User ID cannot be empty", nameof(userId));
    }

    return await _repository.GetByIdAsync(userId);
}
```

### Architecture Documentation

**Maintain:**
- System architecture diagrams
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Deployment guides

**Use Claude Code to generate/update:**
```
Generate OpenAPI documentation for all controllers in the API project
```

---

## Quality Gates

### Pre-Commit

- Code compiles without warnings
- All unit tests pass
- Code formatting is correct

### Pre-Push

- Integration tests pass
- Code coverage meets minimum (80%)
- No security vulnerabilities (scan with tools)

### Pre-Merge

- All CI/CD checks pass
- Code reviewed and approved
- Documentation updated
- Tests added for new features

### Claude Code Quality Check

Use `@code-reviewer` agent before committing:

```
@code-reviewer review my changes for security, performance, and maintainability issues
```

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md)
- [Effective Prompts](effective-prompts.md)
- [Context Management](context-management.md)

---

**Key Takeaway:** Consistent standards + Shared configuration = Predictable quality. Codify your best practices in CLAUDE.md and plugins, and let Claude Code enforce them automatically.
