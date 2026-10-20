# Team Standards

How to share Claude Code instructions, settings and plugins across ATC-Net teams, so everyone gets the same behavior.

## Table of Contents

- [Why Team Standards Matter](#why-team-standards-matter)
- [Shared CLAUDE.md](#shared-claudemd)
- [Shared Settings](#shared-settings)
- [Plugin Distribution](#plugin-distribution)
- [Coding Conventions](#coding-conventions)
- [Workflow Standards](#workflow-standards)
- [Documentation Standards](#documentation-standards)
- [Quality Gates](#quality-gates)

---

## Why Team Standards Matter

Without shared configuration, every developer gets slightly different results: code style depends on who wrote the prompt, good patterns stay with one person, and new team members start from zero.

Commit the configuration to the repository instead:

| What | Where | Shared with |
|------|-------|-------------|
| Instructions | `AGENTS.md`, `CLAUDE.md` or `.claude/CLAUDE.md` | Everyone who clones the repo |
| Settings, permissions, hooks | `.claude/settings.json` | Everyone who clones the repo |
| Skills, agents, MCP servers | Plugins from a team marketplace | Everyone who installs them |

Personal preferences go in files that are not committed: `CLAUDE.local.md`, `.claude/settings.local.json`, and the files under `~/.claude/`.

---

## Shared CLAUDE.md

### Where Instructions Live

Claude Code loads instruction files at the start of every session:

| File | Scope |
|------|-------|
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | The project. Commit it so the team shares it |
| `./CLAUDE.local.md` | You, in this project. Add it to `.gitignore` |
| `~/.claude/CLAUDE.md` | You, in every project |
| `.claude/rules/*.md` | Rules for the project; with `paths` frontmatter they load only for matching files |
| Managed `CLAUDE.md` | Everyone in the organization, deployed by IT |

Auto memory (the notes Claude writes itself) is per user and per repository. It does not replace a shared instruction file.

Run `/init` to generate a first `CLAUDE.md` from the codebase, then edit it.

### AGENTS.md

`AGENTS.md` is the instruction file that other coding agents, including GitHub Copilot, read. This repository uses one: [`AGENTS.md`](../../AGENTS.md) at the root, and no `CLAUDE.md`.

Claude Code (v2.1.277 or later) reads `AGENTS.md` directly, but by default only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working directory or above it:

- **Only `AGENTS.md`:** Claude reads it. Good for repositories that also serve Copilot.
- **Both files:** Claude reads only `CLAUDE.md`. Put `@AGENTS.md` on the first line of `CLAUDE.md` to import it, then add Claude-specific instructions below.
- **A personal `CLAUDE.local.md`** in a project that relies on `AGENTS.md` also stops `AGENTS.md` from loading. Import `@AGENTS.md` or change the Project instructions setting in `/config`.

On teams with Windows users, use the `@AGENTS.md` import rather than a symlink; Git checks symlinks out as plain text files unless `core.symlinks` is enabled.

### Example Team CLAUDE.md

Keep the file short; the Claude Code docs suggest under 200 lines per file, because longer files use more context and are followed less reliably. State what Claude can't discover from the code. Leave detailed C# conventions to skills such as `dotnet:csharp-conventions` and `dotnet:csharp-xunit`, which load only when relevant.

````markdown
# ATC-Net Team Standards

## Technology Stack
- .NET 10 (current LTS), ASP.NET Core, Entity Framework Core
- PostgreSQL, EF Core migrations
- Azure: IoT Hub, Blob Storage, Service Bus, Key Vault
- Tests: xUnit, NSubstitute, FluentAssertions

## Build and Test
- Build: `dotnet build`
- Test: `dotnet test`
- Coverage: `dotnet test --collect:"XPlat Code Coverage"`

## Conventions
- Follow the dotnet plugin's csharp-conventions skill
- File-scoped namespaces, one type per file
- XML documentation on all public members
- Async all the way for I/O; pass CancellationToken
- Secrets come from Azure Key Vault or environment variables, never from code

## Project Layout
- src/Api/ - Controllers and endpoints
- src/Domain/ - Business logic
- src/Infrastructure/ - Data access and external services
- tests/ - Unit and integration tests

## Testing
- Test method naming: MethodName_Scenario_ExpectedResult
- Arrange / Act / Assert
- Minimum 80% coverage; critical business logic fully covered

## Git
- Branches: feature/<name>, bugfix/<name>
- Conventional Commits: feat, fix, docs, refactor, test, chore
- Never commit to main directly; open a PR

## Review Carefully
- Authentication and authorization
- Database migrations
- Security-sensitive and performance-critical code
````

### Maintaining the Shared File

- Keep it in git and change it through pull requests.
- When Claude repeats a mistake, add one line that prevents it.
- Remove lines that no longer matter; a short file is followed more closely.
- Review it when you upgrade .NET or change tools.

---

## Shared Settings

`.claude/settings.json` is the shared project settings file. Commit it so teammates get the same permissions, hooks, environment variables and plugins. Personal overrides go in `.claude/settings.local.json`, which Claude Code keeps out of git when it creates the file.

Example: allow the build and test commands without a prompt, and block reading secrets:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(dotnet build *)",
      "Bash(dotnet test *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

Run `/status` to confirm which settings files loaded. For organization-wide policy that users can't override, use [managed settings](https://code.claude.com/docs/en/managed-settings).

---

## Plugin Distribution

Plugins package skills, agents, hooks and MCP servers. A marketplace is a repository with a `.claude-plugin/marketplace.json` file that lists plugins and where to fetch them. See [Marketplace Configuration](../reference/marketplace-config.md) and [Plugin Development](../guides/plugin-development.md).

### Install from atc-agentic-toolkit

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install dotnet@atc-agentic-toolkit
```

On Claude Code 2.1.275 or later, one step does both:

```text
/plugin install dotnet --marketplace atc-net/atc-agentic-toolkit
```

### Share Plugins Through the Repository

To give every contributor the same plugins, register the marketplace and enable the plugins in the repository's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "atc-agentic-toolkit": {
      "source": { "source": "github", "repo": "atc-net/atc-agentic-toolkit" }
    }
  },
  "enabledPlugins": {
    "common@atc-agentic-toolkit": true,
    "dotnet@atc-agentic-toolkit": true
  }
}
```

The key under `extraKnownMarketplaces` must match the `name` in the marketplace's `marketplace.json`. Claude Code registers the marketplace only after a contributor accepts the workspace trust dialog for the folder. This repository's own [`.claude/settings.json`](../../.claude/settings.json) registers a marketplace with `extraKnownMarketplaces` in the same way.

### Team Marketplace for Internal Plugins

For company-specific plugins, keep your own marketplace repository and register it next to atc-net's:

1. Create a repository with `.claude-plugin/marketplace.json` and your plugins under `plugins/`.
2. Add each plugin as an entry in `marketplace.json` (`name`, `source`, `description`). The entry name must match the `name` in the plugin's `plugin.json`.
3. If skill plugins should also work in GitHub Copilot, list them in `.github/plugin/marketplace.json` too, as this repository does. Mods don't run in Copilot, so list them only in `.claude-plugin/marketplace.json`.
4. Check it with `claude plugin validate .` before you push.
5. Teammates add it with `/plugin marketplace add your-org/your-marketplace`, or you add it to `.claude/settings.json` as shown above.

If you fork atc-agentic-toolkit instead, change the `name` in both `marketplace.json` files; otherwise the fork collides with the atc-net marketplace of the same name. Private repositories work as long as each user has read access with their git credentials.

Plugins can also be Claude Code mods, which change Claude Code's own interface and behavior. See [Mod Creation](../guides/mod-creation.md) and [Mod Anatomy](../reference/mod-anatomy.md).

### Recommended Plugins

From atc-agentic-toolkit:

- `common` - Implementation planning, markdown conventions, skill creator, coding discipline
- `dotnet` - C# conventions, xUnit tests, async patterns, NuGet management
- `git` - Commit messages and PR descriptions
- `security` - OWASP-based security review
- `azure` - Azure service skills (if you work on Azure projects)

---

## Coding Conventions

### ATC-Net Specific Patterns

**Service pattern** (sealed, primary constructor, `CancellationToken` passed through; see `dotnet:csharp-conventions` for the full rules):

```csharp
public sealed class UserService(
    IUserRepository repository,
    ILogger<UserService> logger) : IUserService
{
    public Task<User?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Retrieving user with ID: {UserId}", userId);
        return repository.GetByIdAsync(userId, cancellationToken);
    }
}
```

### Enforcing with Claude Code

Put conventions in the shared instruction file and in skills, so you don't have to repeat them in every prompt. The `dotnet` plugin's skills cover C# style, tests and async code. Plugin skills run as slash commands prefixed with the plugin name, for example `/dotnet:format-params` to apply the team's parameter line-break formatting.

---

## Workflow Standards

### Feature Development Workflow

1. **Planning**
   - Press `Shift+Tab` to enter plan mode and agree on the approach before Claude edits files
   - Record architecture decisions

2. **Implementation**
   - Create a feature branch
   - Use Claude Code for boilerplate and standard patterns

3. **Testing**
   - Ask Claude to write and run the unit tests
   - Run the full test suite
   - Meet the minimum coverage

4. **Review**
   - Run `/code-review` to check your branch for bugs before you open a PR (`/code-review --fix` also applies the findings)
   - Address the findings
   - Submit the PR for team review

5. **Integration**
   - Respond to review comments
   - Merge when approved

---

## Documentation Standards

### Code Documentation

**Required:**

- XML documentation for all public members
- A README.md for each major module
- Comments for logic that isn't obvious from the code

**Example:**

```csharp
/// <summary>
/// Retrieves a user by their unique identifier.
/// </summary>
/// <param name="userId">The unique identifier of the user to retrieve.</param>
/// <param name="cancellationToken">The cancellation token.</param>
/// <returns>
/// A <see cref="User"/> object if found; otherwise, null.
/// </returns>
/// <exception cref="ArgumentException">
/// Thrown when userId is empty.
/// </exception>
public Task<User?> GetUserByIdAsync(
    Guid userId,
    CancellationToken cancellationToken)
{
    if (userId == Guid.Empty)
    {
        throw new ArgumentException("User ID cannot be empty", nameof(userId));
    }

    return repository.GetByIdAsync(userId, cancellationToken);
}
```

The `dotnet:csharp-docs` skill covers XML documentation conventions.

### Architecture Documentation

Maintain system architecture diagrams, API documentation (OpenAPI), database schema documentation, and deployment guides. Claude Code can generate and update them:

```text
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
- Code coverage meets the minimum (80%)
- No known vulnerable packages

### Pre-Merge

- All CI checks pass
- Code reviewed and approved
- Documentation updated
- Tests added for new features

### Claude Code Quality Check

Run the built-in review before you commit:

```text
/code-review
```

`/code-review` reviews the changes on your branch for correctness bugs and follows your `CLAUDE.md`. For a security-focused pass, use the `security` plugin's OWASP skill.

### Enforce Gates with Hooks

Instructions are guidance; hooks are guaranteed. Hooks are shell commands that Claude Code runs at fixed points, configured under `hooks` in `.claude/settings.json` so the whole team gets them. For example, a `PostToolUse` hook with an `Edit|Write` matcher can run a formatter after every edit, and a `PreToolUse` hook can block a tool call by exiting with code 2. See the [hooks guide](https://code.claude.com/docs/en/hooks-guide). This repository keeps its own shell hooks in `.claude/plugins/hooks/`.

---

## Resources

- [Claude Code Fundamentals](claude-code-fundamentals.md)
- [Effective Prompts](effective-prompts.md)
- [Context Management](context-management.md)
- [Claude Code memory (CLAUDE.md and AGENTS.md)](https://code.claude.com/docs/en/memory)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Create a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
