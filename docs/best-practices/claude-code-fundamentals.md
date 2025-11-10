# Claude Code Fundamentals

Essential concepts and principles for effective use of Claude Code in software development workflows.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Context Window Management](#context-window-management)
- [Persistent Memory](#persistent-memory)
- [Customization Mechanisms](#customization-mechanisms)
- [Working with Agents](#working-with-agents)
- [Introspection & Discovery](#introspection--discovery)
- [Essential Commands](#essential-commands)
- [Best Practices](#best-practices)

---

## Core Concepts

### What is Claude Code?

Claude Code is an AI-powered CLI tool that extends Claude's capabilities for software development. It provides:

- **Context-aware assistance** - Understands your codebase and project structure
- **Tool integration** - Can read files, run commands, make edits
- **Extensibility** - Supports custom skills, commands, and plugins
- **Iterative workflows** - Maintains conversation history and context

### The Three Memory Systems

Claude Code operates with three distinct memory systems:

#### 1. Context Window (Working Memory)

- **What it is:** The current conversation, including messages, file contents, and tool outputs
- **Size:** Limited (tracks approximately 200K tokens for Sonnet 4.5)
- **Lifecycle:** Exists for the duration of the session
- **Management:** Must be actively managed to maintain performance

**Key point:** Think of context as RAM—it's fast but limited. Keep it lean and focused.

#### 2. Persistent Memory (CLAUDE.md)

- **What it is:** A markdown file containing instructions and preferences that persist across sessions
- **Location:** Project root or home directory (`~/.config/claude/CLAUDE.md`)
- **Lifecycle:** Permanent until explicitly modified
- **Use cases:** Coding style, project conventions, recurring instructions

**Key point:** Think of CLAUDE.md as your configuration file—it sets baseline behavior for all sessions.

#### 3. Skills and Plugins (Packaged Knowledge)

- **What they are:** Modular expertise packages that extend Claude's capabilities
- **Lifecycle:** Installed once, available in all sessions
- **Loading:** Progressive disclosure (metadata → instructions → resources)

**Key point:** Think of skills as specialized training—they activate when needed without cluttering context.

---

## Context Window Management

Effective context management is crucial for Claude Code's reliability and performance.

### Why Context Management Matters

- **Performance:** Smaller context = faster responses
- **Reliability:** Focused context = more accurate outputs
- **Cost:** Context size affects API usage
- **Quality:** Relevant context = better results

### The `/context` Command

Monitor context usage:

```
/context
```

Shows:
- Current context size (tokens used)
- What's in context (files, messages, tool outputs)
- Percentage of capacity used

**Rule of thumb:** If context exceeds 70% capacity, consider:
- Removing unnecessary files
- Summarizing earlier conversation
- Using `/rewind` to backtrack
- Starting a fresh session

### Context Best Practices

#### 1. Provide Only Relevant Information

**❌ Too much:**
```
Read all the files in the project
```

**✅ Targeted:**
```
Read the UserService.cs file and its interface IUserService.cs
```

#### 2. Use Progressive Disclosure

**❌ Front-loading:**
```
Read all documentation files before we start
```

**✅ On-demand:**
```
Start with the API overview, we'll reference specific endpoints as needed
```

#### 3. Explore First, Then Guide

**Good workflow:**
1. Let Claude explore to understand the codebase
2. Review what it learned
3. Guide it to specific areas for detailed work
4. Monitor context size throughout

#### 4. Leverage Specialized Agents

Specialized agents (like `@pair-programmer`, `@code-reviewer`) have their own context windows:

```
@code-reviewer review the changes in UserService.cs
```

Benefits:
- Separate context for separate tasks
- Parallel workstreams
- Focused expertise per task

---

## Persistent Memory

The `CLAUDE.md` file stores instructions that apply across all sessions.

### Location

**Project-specific:**
```
/path/to/your/project/CLAUDE.md
```

**Global (home directory):**
```
~/.config/claude/CLAUDE.md
```

**Priority:** Project-specific overrides global.

### What to Include

**Coding style and conventions:**
```markdown
# Coding Style

- Use 4 spaces for indentation
- Follow ATC-Net naming conventions
- Always include XML documentation for public members
- Prefer explicit types over `var` for clarity
```

**Project structure:**
```markdown
# Project Organization

- Controllers: `src/Controllers/`
- Services: `src/Services/`
- Models: `src/Models/`
- Tests: `tests/[Component]Tests/`
```

**Technology stack:**
```markdown
# Tech Stack

- Framework: .NET 6.0
- Testing: xUnit + Moq
- Database: PostgreSQL with Entity Framework Core
- IoT: Azure IoT Hub + IoT Edge
```

**Common workflows:**
```markdown
# Workflows

## Creating a New Feature

1. Create feature branch from `develop`
2. Implement changes following TDD
3. Update documentation
4. Run full test suite
5. Create PR with description
```

**Preferences and constraints:**
```markdown
# Preferences

- Always ask before modifying database migrations
- Run tests before committing changes
- Follow security best practices (OWASP Top 10)
- Include logging for all external API calls
```

### What NOT to Include

- **Secrets or credentials** - Use environment variables
- **Frequently changing information** - Use skills with references/
- **Large code examples** - Use assets/ in skills
- **Task-specific instructions** - Use skills or commands

### Updating CLAUDE.md

**View current content:**
```
/claude-md
```

**Edit:**
```
Edit CLAUDE.md to add our new testing conventions
```

**Best practice:** Update CLAUDE.md iteratively as patterns emerge.

---

## Customization Mechanisms

Claude Code provides five mechanisms for customization, each suited to different needs.

### 1. Slash Commands

**Purpose:** Quick, frequent operations

**Location:** `.claude/commands/[name].md`

**Invocation:** `/command-name [args]`

**Best for:**
- Single, focused tasks
- Operations with explicit parameters
- Frequently used workflows

**Example:**
```
/format-params
/add-module TemperatureSensor "Description"
```

### 2. Subagents (Specialized Agents)

**Purpose:** Task-specific expertise with isolated context

**Built-in examples:**
- `@pair-programmer` - Compare approaches, generate alternatives
- `@system-architect` - Design scalable architecture
- `@root-cause-analyst` - Investigate unclear bugs
- `@code-reviewer` - Review code objectively

**Invocation:**
```
@code-reviewer review the changes in UserService.cs
```

**Benefits:**
- Separate context window
- Specialized focus
- Parallel work streams

### 3. Agent Skills

**Purpose:** Modular, discoverable expertise packages

**Location:** `.claude/skills/[namespace]/[skill-name]/SKILL.md`

**Invocation:** Natural language
```
Use the iot-edge-module skill to create a new module named TemperatureSensor
```

**Best for:**
- Complex, multi-step workflows
- Domain-specific knowledge
- Bundled resources (scripts, references, assets)

**Components:**
- SKILL.md with instructions
- scripts/ for executable code
- references/ for documentation
- assets/ for templates and files

### 4. Plugins

**Purpose:** Distributable collections of skills and commands

**Location:** `.claude/plugins/[plugin-name]/`

**Installation:**
```
Install the azure-iot plugin from the atc-net marketplace
```

**Best for:**
- Packaging related functionality
- Team-wide standardization
- Reusable across projects

**Components:**
- Multiple skills
- Multiple commands
- Plugin-level documentation

### 5. Structured Notes (CLAUDE.md)

**Purpose:** Persistent instructions across sessions

**Location:** Project root or `~/.config/claude/`

**Best for:**
- Coding style and conventions
- Project structure
- Recurring preferences

---

## Working with Agents

### When to Use Specialized Agents

#### @pair-programmer

**Use when:** You want to compare multiple approaches

```
@pair-programmer compare 2-3 solutions for implementing user authentication with pros and cons of each
```

**Output:** Detailed comparison with recommendations

#### @system-architect

**Use when:** Designing scalable systems or major features

```
@system-architect design a scalable architecture for processing IoT telemetry at scale
```

**Output:** Architecture diagrams, component descriptions, considerations

#### @root-cause-analyst

**Use when:** Investigating unclear bugs or unexpected behavior

```
@root-cause-analyst investigate why the temperature readings are intermittently null
```

**Output:** Systematic analysis, hypothesis testing, root cause identification

#### @code-reviewer

**Use when:** Getting unbiased feedback on code changes

```
@code-reviewer review the changes in feature/user-authentication branch
```

**Output:** Code review with suggestions, potential issues, best practices

### Agent Best Practices

- **One agent, one task** - Don't mix multiple responsibilities
- **Provide context** - Give agents the information they need
- **Review outputs** - Agents provide recommendations, you make decisions
- **Iterate** - Use agent feedback to refine your approach

---

## Introspection & Discovery

Claude Code's conversational nature enables feature exploration through dialogue. Rather than memorizing every capability, leverage Claude's ability to explain itself and reflect on effective patterns.

### Ask About Capabilities

Don't assume what Claude can or cannot do—ask directly:

```
What tools do you have access to for analyzing code?

Can you help me understand the authentication patterns in this codebase?

What limitations should I be aware of when working with database migrations?

What's the best way to handle this scenario in our project structure?
```

**Benefits:**
- Discover features you didn't know existed
- Understand tool limitations before attempting tasks
- Get contextual advice specific to your situation
- Reduce trial-and-error

### Post-Task Reflection

After completing tasks, reflect on what worked:

```
What approach worked best for that refactoring task?

Were there any patterns we used that we should codify into a skill?

What would you recommend differently next time?

How could we make this process more efficient in the future?
```

**Benefits:**
- Learn from successful patterns
- Identify opportunities for automation
- Build domain-specific intuition
- Continuous improvement of workflows

### Convert Patterns into Reusable Components

When effective patterns emerge through usage:

1. **Notice what worked well** - Pay attention to prompts and workflows that consistently produce good results
2. **Identify if it's repeatable** - Does this pattern apply to multiple scenarios?
3. **Consider creating a skill or command** - Package the pattern for reuse
4. **Document in CLAUDE.md** - For simpler patterns, add to project conventions

**Example workflow:**

```
# After successfully implementing a feature
That worked really well. We should capture this pattern for creating new API endpoints.

# Claude helps identify the pattern
The pattern we used was: 1) Create interface, 2) Implement service, 3) Add controller endpoint, 4) Write tests, 5) Update API documentation.

# Decide how to codify it
Let's create a slash command /add-endpoint that follows this pattern.

# Create the command
Create a slash command in .claude/commands/add-endpoint.md that implements this workflow.
```

### Exploratory Questions

Use Claude as a thought partner:

**Architecture decisions:**
```
@system-architect what factors should I consider when deciding between these two approaches?
```

**Code quality:**
```
Review this code and tell me what questions I should be asking about its design.
```

**Learning opportunities:**
```
What advanced C# features could improve this implementation? Explain the trade-offs.
```

---

## Essential Commands

### Navigation and Context

**View context:**
```
/context
```

**Rewind to previous state:**
```
/rewind
```

**Clear context (fresh start):**
```
/clear
```

### Configuration

Claude Code can be configured at both user and project levels to customize behavior, permissions, and available tools.

**View current settings:**
```
/config
```

Shows all current configuration options and their values.

**Modify settings:**
```
/config set [option] [value]
```

**View CLAUDE.md:**
```
/claude-md
```

#### Configuration Best Practices

1. **Start restrictive, then loosen** - Begin with manual approvals, enable auto-approval as trust builds
2. **Different configs for different phases** - Exploration vs. implementation vs. refactoring
3. **Commit project configs** - Share `.claude/config.json` with your team via git
4. **Document your settings** - Add comments in CLAUDE.md explaining configuration choices
5. **Review periodically** - Configurations that worked early may need adjustment

#### When to Adjust Configuration

**Enable auto-approval when:**
- Working alone on personal projects
- Rapid prototyping phase
- High trust in Claude's behavior
- Frequent, similar operations

**Disable auto-approval when:**
- Production code modifications
- Unfamiliar codebase
- High-risk changes
- Learning/onboarding phase
- Pair programming with team

**Restrict tools when:**
- Security-sensitive projects
- Want reproducible sessions
- Corporate/compliance requirements
- Teaching or demonstrations

### History and Sessions

**View conversation history:**
```
/history
```

**Save session:**
```
/save [name]
```

**Load saved session:**
```
/load [name]
```

### Help and Documentation

**Get help:**
```
/help
```

**List available commands:**
```
/commands
```

**List available skills:**
```
/skills
```

---

## Best Practices

### Incremental Evolution

Treat your Claude Code setup as a living system:

1. **Start simple** - Begin with basic CLAUDE.md and a few commands
2. **Notice patterns** - Identify repetitive tasks and workflows
3. **Codify** - Create skills and commands for repeated patterns
4. **Refine** - Iterate based on real-world usage
5. **Share** - Distribute effective patterns to your team

### Planning Modes

For complex features requiring careful thought, Claude Code provides planning modes that separate planning from execution.

#### Why Use Planning Modes?

**Without planning mode:**
- Claude might start implementing immediately
- Risk of wrong direction with wasted effort
- Hard to get buy-in on approach before work begins
- Difficult to see full scope upfront

**With planning mode:**
- Explicit separation of planning and execution phases
- Review and adjust plan before any code changes
- Clear scope and approach documented
- Team alignment before implementation starts

#### Extended Plan Mode (`/plan`)

**Activate:**
```
/plan
```

**When to use:**
- Building large features (>1 day of work)
- Unclear requirements needing exploration
- Multiple possible approaches to evaluate
- High-risk changes requiring careful planning
- Need to present plan to stakeholders first

**How it works:**
1. You describe the goal or problem
2. Claude researches and explores (read-only)
3. Claude presents a comprehensive plan
4. You review, discuss, and refine the plan
5. You explicitly approve to begin implementation
6. Claude executes the agreed plan

**Example workflow:**

```
# Activate plan mode
/plan

# Describe your goal
I need to add user role-based authorization to our API.
Currently we only have authentication. We need to support
Admin, Manager, and User roles with different permissions.

# Claude explores the codebase
[Claude reads authentication code, controller structure, etc.]

# Claude presents plan
Here's my plan:
1. Create Role enum and update User model
2. Add roles to JWT token claims
3. Create authorization policies
4. Add [Authorize] attributes to controllers
5. Update tests for role scenarios
... (detailed steps)

# You review and provide feedback
This looks good, but let's also add a middleware for logging
unauthorized access attempts.

# Claude updates plan
[Plan revised with logging addition]

# You approve
Looks great, let's proceed with the implementation

# Claude executes plan
[Implementation begins]
```

**Benefits:**
- Avoid costly mistakes through upfront review
- Clear documentation of approach
- Stakeholder buy-in before work begins
- Opportunity to catch issues early

#### Structured Plan Mode (`/structured-plan`)

**Activate:**
```
/structured-plan
```

**When to use:**
- Multi-phase projects (weeks or months)
- Coordinated work across multiple areas
- Need phased delivery milestones
- Complex projects requiring staged rollout
- Multiple team members involved

**How it works:**
1. Claude breaks work into distinct phases
2. Each phase has clear deliverables and dependencies
3. You can execute phases sequentially or in parallel
4. Each phase can be reviewed independently
5. Adjustments can be made between phases

**Example workflow:**

```
# Activate structured plan mode
/structured-plan

# Describe complex project
We need to migrate our user authentication from custom JWT
to Azure AD B2C. We have 50K active users and can't have downtime.

# Claude creates phased plan
Phase 1: Preparation (Week 1)
- Research Azure AD B2C setup
- Create test tenant
- Document migration strategy
- Set up development environment

Phase 2: Dual Authentication (Week 2-3)
- Implement Azure AD B2C alongside existing auth
- Support both authentication methods
- Add feature flag for gradual rollout

Phase 3: User Migration (Week 4-5)
- Create migration scripts
- Migrate users in batches
- Monitor for issues

Phase 4: Cutover (Week 6)
- Direct all new users to Azure AD B2C
- Monitor metrics
- Support existing JWT tokens during grace period

Phase 5: Cleanup (Week 7)
- Remove old authentication code
- Update documentation
- Final testing

# Execute phases one at a time
Let's start with Phase 1

[Complete Phase 1]

# Review before next phase
Phase 1 looks good. Ready for Phase 2?

[Continue through phases]
```

**Benefits:**
- Clear milestones and progress tracking
- Reduced risk through phased approach
- Flexibility to adjust between phases
- Easier team coordination

#### Choosing the Right Mode

| Scenario | Use `/plan` | Use `/structured-plan` | Skip planning |
|----------|-------------|------------------------|---------------|
| Single feature, 1-2 days | ✅ If complex | ❌ | Maybe |
| Large feature, 1-2 weeks | ✅ | ✅ If phased | ❌ |
| Multi-month project | ❌ | ✅ | ❌ |
| Quick bug fix | ❌ | ❌ | ✅ |
| Unclear requirements | ✅ | ✅ If very complex | ❌ |
| Multiple approaches possible | ✅ | ❌ | ❌ |
| High-risk change | ✅ | ✅ If large | ❌ |
| Emergency fix | ❌ | ❌ | ✅ |

#### Planning Mode Best Practices

1. **Be specific in your initial prompt** - Provide context about scale, constraints, and requirements
2. **Ask questions during planning** - Clarify before approving the plan
3. **Request alternatives** - "Show me 2-3 approaches" even in plan mode
4. **Review carefully** - The plan is your blueprint; ensure it's right
5. **Stay engaged** - Provide feedback and guidance during planning
6. **Don't skip planning for complex work** - The time invested saves debugging and rework

### The Experimentation Mindset

**Philosophy:** Working implementations refined through feedback beat pursuing perfection initially.

#### Embrace Fearless Experimentation

Claude Code encourages a culture of trying things without fear:

- **Try different implementations** - Don't get stuck on the "perfect" approach upfront
- **Discard unsuccessful approaches** - It's okay to restart with a better understanding
- **Use `/rewind` liberally** - Explore alternatives without consequence
- **Commit frequently** - Create safe checkpoints for experimentation

**Example workflow:**

```
# Try approach A
Let's implement authentication using JWT tokens with refresh tokens

[Implementation reveals complexity]

# Pivot without fear
/rewind
Let's try a simpler approach with session-based auth first, then add JWT later if needed
```

#### Fail Fast, Iterate Quickly

**❌ Perfection-first approach:**
```
Design the perfect solution architecture before writing any code.
Anticipate every edge case up front.
Don't start until we have all the answers.
```

**✅ Iteration-first approach:**
```
Let's start with a simple working version that handles the main use case.
We can identify issues through actual usage.
Refine based on real feedback and metrics.
```

#### Learn Through Doing

Domain-specific intuition develops through hands-on practice, not just planning:

1. **Start with simple working version** - Get it running
2. **Identify issues through usage** - Real problems emerge
3. **Refine based on feedback** - Improve what matters
4. **Build expertise iteratively** - Learn by doing

**Example:**

```
# Start simple
Create a basic notification service that sends emails

# Use and learn
[After using it, you discover rate limiting issues]

# Refine
Add a queue system to handle rate limiting

# Use and learn more
[After more usage, you discover priority needs]

# Refine again
Add priority levels to the notification queue
```

#### Git as Your Safety Net

Frequent commits enable fearless experimentation:

```bash
# Create a checkpoint
git commit -m "Working version of user service"

# Experiment freely
[Try new approach with Claude]

# Keep what works
git commit -m "Improved error handling"

# Or discard what doesn't
git reset --hard HEAD~1
/clear  # Start fresh conversation in Claude
```

**Best practices:**
- Commit before trying risky refactorings
- Use descriptive commit messages
- Keep commits small and focused
- Don't fear `/rewind` in Claude or `git reset` in your repo

### Team Consistency

For teams:

1. **Standardize CLAUDE.md** - Share common conventions
2. **Create shared plugins** - Distribute team skills
3. **Document patterns** - Record what works
4. **Review together** - Discuss effective approaches

### Context Hygiene

- **Monitor regularly** - Check `/context` periodically
- **Remove when done** - Clear files no longer needed
- **Summarize long threads** - Condense earlier conversation
- **Fresh starts** - Don't fear `/clear` for new tasks

---

## Resources

- **Official Documentation:** https://docs.claude.com/claude-code
- **Context Management Guide:** [context-management.md](context-management.md)
- **Effective Prompts Guide:** [effective-prompts.md](effective-prompts.md)
- **Team Standards:** [team-standards.md](team-standards.md)

---

**Key Takeaway:** Claude Code's effectiveness comes from understanding and managing its three memory systems: context window (working memory), CLAUDE.md (persistent instructions), and skills/plugins (packaged expertise). Master these, and you'll master Claude Code.
