# Plugin Development Guide

This comprehensive guide covers everything you need to create, test, and distribute custom plugins for the ATC Agentic Toolkit.

## Table of Contents

- [What is a Plugin?](#what-is-a-plugin)
- [Plugin Architecture](#plugin-architecture)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Adding Skills](#adding-skills)
- [Adding Agents](#adding-agents)
- [Adding Commands](#adding-commands)
- [Testing Your Plugin](#testing-your-plugin)
- [Registering in Marketplace](#registering-in-marketplace)
- [Distribution Strategies](#distribution-strategies)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)

---

## What is a Plugin?

A **plugin** is a packaged collection of:

- **Skills** - Modular expertise packages for complex tasks
- **Agents** - Specialized personas with domain expertise
- **Commands** - Quick slash commands for common operations
- **Documentation** - README and reference materials
- **Metadata** - Configuration for marketplace registration

Plugins enable:

- **Reusability** - Share expertise across projects and teams
- **Modularity** - Bundle related functionality together
- **Discoverability** - Marketplace registration makes plugins findable
- **Consistency** - Standardize approaches to common problems

---

## Plugin Architecture

### Directory Structure

```
.claude/plugins/[plugin-name]/
├── README.md                           # Plugin documentation
├── skills/                             # Skill definitions
│   ├── [skill-name]/
│   │   ├── SKILL.md                    # Skill instructions and metadata
│   │   ├── references/                 # Supporting documentation
│   │   │   ├── [topic1].md
│   │   │   └── [topic2].md
│   │   └── examples/                   # Optional usage examples
│   │       └── [example].md
│   └── [another-skill]/
│       └── SKILL.md
├── agents/                             # Agent persona definitions
│   ├── [agent-name].md
│   └── [another-agent].md
└── commands/                           # Slash command definitions
    ├── [command-name].md
    └── [another-command].md
```

### File Purposes

**README.md** - Plugin-level documentation:
- Overview and purpose
- List of skills, agents, and commands
- Features and use cases
- Requirements and dependencies
- Usage examples

**SKILL.md** - Individual skill definition:
- Skill metadata (name, description, category)
- Detailed instructions for Claude Code
- Progressive disclosure structure
- Reference to bundled documentation

**agents/*.md** - Agent persona definitions:
- Agent metadata (name, description, model)
- Purpose and specialized expertise
- Capabilities and behavioral traits
- Knowledge base and response approach
- Example interactions

**commands/*.md** - Slash command definitions:
- Command syntax and arguments
- Implementation instructions
- Usage examples

---

## Creating Your First Plugin

Plugins are created manually by setting up the directory structure. Once the plugin structure exists, you can add components (skills, agents, commands) to it.

### Step 1: Create Plugin Directory Structure

```bash
# Navigate to your project's Claude plugins directory
cd .claude/plugins/

# Create plugin directory
mkdir my-awesome-plugin
cd my-awesome-plugin

# Create subdirectories for components
mkdir skills agents commands

# Create plugin README
touch README.md
```

**Note:** The `skill-creator` skill can be used later to add individual skills to your plugin, but it does not create the plugin structure itself.

### Step 2: Write the Plugin README

Create a comprehensive README for your plugin:

```markdown
# My Awesome Plugin

Brief description of what your plugin does.

## Overview

Detailed explanation of the plugin's purpose, target use cases, and benefits.

## Skills

### skill-name-one

Description of what this skill does.

**Features:**
- Feature 1
- Feature 2
- Feature 3

**Usage:**
\```
Use the skill-name-one skill to [describe task]
\```

## Commands

### /command-name-one

Description of what this command does.

**Usage:**
\```
/command-name-one [argument1] [argument2]
\```

**Example:**
\```
/command-name-one myValue "description here"
\```

## Requirements

- List any dependencies
- Specific versions if needed
- External tools required

## License

MIT
```

---

## Adding Skills

Skills define workflows and processes that Claude executes. They use progressive disclosure (metadata → instructions → references) for optimal context management.

### Creating a Skill

1. Create skill directory under `.claude/plugins/[plugin-name]/skills/[skill-name]/`
2. Write `SKILL.md` with YAML frontmatter and instructions
3. Add reference documentation in `references/` (optional)
4. Test the skill by invoking it: `Use the [skill-name] skill to...`

**For detailed instructions, see:** [Skill Creation Guide](skill-creation.md)

---

## Adding Commands

Commands provide quick, parameterized access to common operations via slash commands (e.g., `/format-params`).

### Creating a Command

1. Create markdown file under `.claude/plugins/[plugin-name]/commands/[command-name].md`
2. Write command instructions including arguments, examples, and error handling
3. Test the command: `/command-name [arguments]`

**Naming:** Use lowercase with hyphens (e.g., `/add-module`, `/format-params`)

**For detailed instructions, see:** [Command Creation Guide](command-creation.md)

---

## Adding Agents

Agents define specialized personas that Claude adopts to provide domain-specific expertise. Agents define WHO Claude becomes (persona), while skills define WHAT Claude does (workflow).

### Creating an Agent

1. Create markdown file under `.claude/plugins/[plugin-name]/agents/[agent-name].md`
2. Write agent definition with YAML frontmatter (name, description, model)
3. Include sections: Purpose, Capabilities, Behavioral Traits, Knowledge Base, Response Approach, Example Interactions
4. Test the agent: `@agent-name [task description]`

**When to use:** Domain expertise, consistent philosophy, specialized persona (e.g., `frontend-developer`, `database-architect`)

**For detailed instructions, see:** [Agent Creation Guide](agent-creation.md)

---

## Testing Your Plugin

### Development Testing

During development, test your plugin within the same repository:

1. **Test skills:**
```
Use the my-skill skill to [test scenario]
```

Verify:
- Claude Code recognizes the skill
- Instructions are clear and actionable
- Output meets expectations
- Edge cases are handled

3. **Test agents:**
```
@my-specialist [task description]
```

Verify:
- Agent adopts the defined persona
- Responses reflect specialized expertise
- Behavioral traits are evident
- Knowledge base is referenced appropriately

4. **Test commands:**
```
/my-command test-arg "test value"
```

Verify:
- Command autocompletes
- Arguments are parsed correctly
- Expected behavior occurs
- Error handling works

### Testing Checklist

- [ ] Plugin directory structure is correct
- [ ] README.md is complete and accurate
- [ ] All SKILL.md files have valid frontmatter
- [ ] All agent .md files have valid frontmatter
- [ ] Instructions are clear and unambiguous
- [ ] Reference documentation is helpful
- [ ] Agent personas are well-defined and consistent
- [ ] Commands parse arguments correctly
- [ ] Error messages are informative
- [ ] Examples work as documented
- [ ] No conflicts with existing plugins
- [ ] Performance is acceptable

### Marketplace Testing

Once your plugin is ready, register it in the marketplace and test installation:

1. Register plugin in `.claude-plugin/marketplace.json`
2. Push changes to your repository
3. Add the marketplace in Claude Code
4. Install the plugin from marketplace: `Install the [plugin-name] plugin from [marketplace-name] marketplace`
5. Verify all functionality works when installed via marketplace

---

## Registering in Marketplace

To make your plugin discoverable, add it to `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "my-awesome-plugin",
      "version": "1.0.0",
      "description": "Brief description of your plugin",
      "author": { "name": "Your Name" },
      "source": "./.claude/plugins/my-awesome-plugin",
      "category": "utilities",
      "keywords": ["keyword1", "keyword2"],
      "license": "MIT",
      "strict": true
    }
  ]
}
```

**Key fields:** name (must match directory), version (semver), description (one sentence), source (relative path), category, keywords

**For complete specification, see:** [Marketplace Config Reference](../reference/marketplace-config.md)

---

## Distribution Strategies

### Strategy 1: Public Marketplace (Recommended)

**Best for:** Open-source plugins shared with the community

1. Add plugin to public `atc-agentic-toolkit` repository
2. Register in marketplace.json
3. Submit pull request
4. Users install via: `Install the [plugin-name] plugin from atc-net marketplace`

**Advantages:**
- Maximum discoverability
- Community contributions
- Version control and history

### Strategy 2: Private Marketplace

**Best for:** Internal company plugins

1. Fork `atc-agentic-toolkit` for your organization
2. Add internal plugins
3. Register in your marketplace.json
4. Team members add your marketplace and install plugins:
   - `Add the your-org marketplace from https://github.com/your-org/atc-agentic-toolkit`
   - `Install the [plugin-name] plugin from the your-org marketplace`

**Advantages:**
- Control over distribution
- Internal tools remain private
- Custom approval process
- Consistent installation experience

---

## Best Practices

### Plugin Design

**Do:**

- Focus on a specific domain or problem space
- Provide clear, actionable documentation
- Include working examples
- Handle errors gracefully
- Follow ATC-Net conventions for .NET projects

**Don't:**

- Create overly broad or unfocused plugins
- Duplicate functionality from existing plugins
- Include poorly tested or experimental code
- Ignore error handling
- Hard-code project-specific values

### Skill Design

- Use **progressive disclosure**: Metadata → Instructions → References
- Write **clear, imperative instructions**
- Provide **concrete examples**
- Bundle **relevant reference documentation**
- Keep **context lean and focused**

See [Skill Creation Guide](skill-creation.md) for detailed best practices.

### Command Design

- Use **descriptive names** that indicate purpose
- **Validate arguments** before execution
- Provide **helpful error messages**
- Include **usage examples** in definition
- **Document expected behavior** clearly

See [Command Creation Guide](command-creation.md) for detailed best practices.

### Agent Design

- Define **clear domain boundaries** for expertise
- Specify **behavioral principles** and problem-solving philosophy
- Include **concrete example interactions** showing agent value
- Reference **authoritative sources** with versions in knowledge base
- Explain **when to use agents vs. skills**

See [Agent Creation Guide](agent-creation.md) for detailed best practices.

### Documentation

- Write for **mixed audience** (beginners and experts)
- Use **code examples** liberally
- Explain **why**, not just **how**
- Keep **README concise**, link to detailed docs
- Include **troubleshooting** section

---

## Advanced Topics

### Versioning

Follow **semantic versioning** (semver): Major.Minor.Patch (e.g., 1.2.3)
- Update in `marketplace.json`, skill frontmatter, and README.md

### Performance

Large plugins impact context size:
- Bundle only essential references
- Use progressive disclosure
- Keep instructions concise

### Security

- Never include secrets
- Validate user input
- Warn about destructive operations
- Document security implications

---


---

## Next Steps

- Read the [Skill Creation Guide](skill-creation.md) for detailed skill authoring
- Review [Command Creation Guide](command-creation.md) for command best practices
- Study [Plugin Structure Reference](../reference/plugin-structure.md) for technical specs
- Explore existing plugins for inspiration and patterns

---

## Resources

- [Skill Creation Guide](skill-creation.md)
- [Command Creation Guide](command-creation.md)
- [Plugin Structure Reference](../reference/plugin-structure.md)
- [Marketplace Config Reference](../reference/marketplace-config.md)
- [Best Practices](../best-practices/)

---

**Questions or feedback?** Open an issue on [GitHub](https://github.com/atc-net/atc-agentic-toolkit/issues).
