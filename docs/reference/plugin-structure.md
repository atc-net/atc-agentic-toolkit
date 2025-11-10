# Plugin Structure Reference

Technical specification for plugin directory structure, file formats, and organization.

## Directory Structure

```
.claude/plugins/[plugin-name]/
├── README.md                          # Plugin documentation (required)
├── skills/                            # Skill definitions (optional)
│   └── [skill-name]/
│       ├── SKILL.md                   # Skill definition (required)
│       ├── scripts/                   # Executable scripts (optional)
│       │   └── *.py, *.sh, *.js
│       ├── references/                # Reference documentation (optional)
│       │   └── *.md
│       └── assets/                    # Output resources (optional)
│           └── templates, images, etc.
├── agents/                            # Agent persona definitions (optional)
│   ├── [agent-name].md                # Agent definition
│   └── [another-agent].md
└── commands/                          # Slash command definitions (optional)
    └── [command-name].md              # Command definition
```

---

## Required Files

### README.md (Plugin Root)

**Purpose:** Plugin-level documentation and overview.

**Format:** Markdown

**Required Sections:**
- Plugin title and brief description
- Overview with detailed explanation
- Skills section (list all skills with descriptions, if any)
- Agents section (list all agents with descriptions, if any)
- Commands section (list all commands with usage, if any)
- Requirements (dependencies, versions)
- License

**Example:**
```markdown
# My Plugin

Brief one-line description.

## Overview

Detailed explanation of plugin purpose and capabilities.

## Skills

### skill-name

Description of what this skill does.

**Usage:**
\```
Use the skill-name skill to [task]
\```

## Agents

### agent-name

Description of the specialized persona this agent provides.

**Expertise:** [Domain/Technology]

**Usage:**
\```
@agent-name [task description]
\```

## Commands

### /command-name

Description and usage.

## Requirements

- .NET SDK 9.0+
- Python 3.x

## License

MIT
```

---

## Optional Directories

### skills/

**Purpose:** Contains skill definitions.

**Structure:** One directory per skill.

**Naming:** Lowercase with hyphens (e.g., `iot-edge-module`, `skill-creator`)

**Contents:** See [Skill Anatomy Reference](skill-anatomy.md)

### agents/

**Purpose:** Contains agent persona definitions.

**Structure:** One markdown file per agent.

**Naming:** Lowercase with hyphens (e.g., `frontend-developer.md`, `database-architect.md`)

**Contents:** See [Agent Anatomy Reference](agent-anatomy.md)

**Format:** Markdown with YAML frontmatter:
```markdown
---
name: agent-name
description: Brief description of agent expertise
model: sonnet
---

# Agent Name

## Purpose
Define the specialized role...

## Capabilities
List expertise areas...

## Behavioral Traits
Define approach to problems...

## Knowledge Base
Reference authoritative sources...

## Response Approach
Define how the agent structures responses...

## Example Interactions
Provide concrete use case examples...
```

### commands/

**Purpose:** Contains slash command definitions.

**Structure:** One markdown file per command.

**Naming:** Must match command name exactly (e.g., `format-params.md` → `/format-params`)

**Format:** Markdown with specific structure:
```markdown
# Command Title

Brief description.

## Instructions

When the user invokes `/command-name [args]`, you should:

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Arguments

- `arg1` (required): Description
- `arg2` (optional): Description, defaults to X

## Examples

```
/command-name value1 value2
```

## Error Handling

If [condition]:
- [Action]
```

---

## File Naming Conventions

### Plugins

- **Directory name:** Lowercase with hyphens
- **Examples:** `code-refactoring`, `azure-iot`, `common`
- **Avoid:** Underscores, spaces, special characters

### Skills

- **Directory name:** Lowercase with hyphens
- **SKILL.md:** Always uppercase, exactly `SKILL.md`
- **Examples:** `iot-edge-module/`, `skill-creator/`

### Agents

- **File name:** Lowercase with hyphens, `.md` extension
- **Descriptive of expertise:** `frontend-developer.md`, `database-architect.md`
- **Focus on domain:** `react-specialist.md` not `developer1.md`
- **Examples:** `mobile-developer.md`, `security-analyst.md`

### Commands

- **File name:** Lowercase with hyphens, `.md` extension
- **Must match command name** - `/add-module` requires `add-module.md`
- **Examples:** `format-params.md`, `add-iot-edge-module.md`

### Scripts

- **File name:** Descriptive, lowercase with underscores for multi-word
- **Extension:** Matches language (`.py`, `.sh`, `.js`, etc.)
- **Examples:** `rotate_pdf.py`, `init_skill.py`, `parse_schema.sh`

### References

- **File name:** Descriptive, lowercase with hyphens
- **Extension:** `.md` for markdown documentation
- **Examples:** `database-schema.md`, `api-endpoints.md`, `conventions.md`

### Assets

- **File name:** Descriptive, appropriate for asset type
- **Examples:** `logo.png`, `template.html`, `boilerplate/`

---

## Marketplace Registration

**File:** `.claude-plugin/marketplace.json`

**Purpose:** Registers plugins for discovery and installation.

**Location:** Repository root level (not inside `.claude/`)

**Format:** JSON

**Structure:**
```json
{
  "name": "marketplace-name",
  "version": "1.0.0",
  "owner": {
    "name": "organization-name",
    "email": "contact@example.com"
  },
  "metadata": {
    "description": "Marketplace description",
    "version": "1.0.0"
  },
  "repository": "https://github.com/org/repo",
  "plugins": [
    {
      "name": "plugin-name",
      "version": "1.0.0",
      "description": "One-sentence plugin description",
      "author": {
        "name": "Author Name"
      },
      "source": "./.claude/plugins/plugin-name",
      "category": "utilities",
      "keywords": ["keyword1", "keyword2"],
      "homepage": "https://github.com/org/repo",
      "repository": "https://github.com/org/repo",
      "license": "MIT",
      "strict": true
    }
  ]
}
```

See [Marketplace Config Reference](marketplace-config.md) for detailed specification.

---

## Best Practices

### Organization

- **Group related skills** in one plugin
- **Keep plugins focused** on a specific domain
- **Separate concerns** - Don't mix unrelated functionality
- **Use clear names** that indicate purpose

### Documentation

- **Complete README.md** - Document all features
- **Usage examples** - Show how to use skills and commands
- **Clear requirements** - List dependencies explicitly
- **Keep updated** - Maintain documentation as plugin evolves

### File Structure

- **Flat skills directory** - Don't nest skills in subdirectories
- **Organized assets** - Group by type when many assets exist
- **Clean references** - Remove unused reference files
- **Minimal scripts** - Only bundle scripts that are reused

### Version Control

- **Track all files** - Include in git
- **Ignore generated files** - Use `.gitignore` for build artifacts
- **Document changes** - Use commit messages to explain updates
- **Tag releases** - Use git tags for plugin versions

---

## Example: Complete Plugin

```
.claude/plugins/api-documentation/
├── README.md
├── skills/
│   ├── generate-openapi/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── analyze_controllers.py
│   │   │   └── generate_spec.py
│   │   ├── references/
│   │   │   ├── openapi-3.0-spec.md
│   │   │   └── common-patterns.md
│   │   └── assets/
│   │       └── openapi-template.json
│   └── validate-api-contract/
│       ├── SKILL.md
│       ├── scripts/
│       │   └── validate_spec.py
│       └── references/
│           └── validation-rules.md
└── commands/
    ├── gen-api-docs.md
    └── validate-api.md
```

**README.md:** Documents the plugin, lists both skills and commands

**Skills:**
- `generate-openapi/` - Complex workflow with scripts and references
- `validate-api-contract/` - Another related skill

**Commands:**
- `gen-api-docs.md` - Quick shortcut for simple cases
- `validate-api.md` - Quick validation command

---

## Size Guidelines

### Plugin README

- **Target:** 200-500 words
- **Maximum:** 1,000 words
- **Link to detailed docs** if more content needed

### Skills

- **SKILL.md:** Under 5,000 words (use references for details)
- **References:** No limit (loaded as needed)
- **Scripts:** Keep focused, one responsibility per script

### Commands

- **Command definition:** 100-300 words
- **Keep concise** - Commands are for simple tasks

---

## Validation

Before distributing a plugin, verify:

- [ ] README.md exists and is complete
- [ ] All SKILL.md files have valid YAML frontmatter
- [ ] All agent .md files have valid YAML frontmatter
- [ ] Agent files follow naming conventions
- [ ] Command files match command names
- [ ] No unused files or directories
- [ ] Scripts are executable (`chmod +x` on Unix)
- [ ] References are properly linked from SKILL.md
- [ ] Examples work as documented
- [ ] Plugin is registered in marketplace.json (if applicable)

---

## Resources

- [Skill Anatomy Reference](skill-anatomy.md)
- [Agent Anatomy Reference](agent-anatomy.md)
- [Marketplace Config Reference](marketplace-config.md)
- [Plugin Development Guide](../guides/plugin-development.md)
- [Skill Creation Guide](../guides/skill-creation.md)
- [Agent Creation Guide](../guides/agent-creation.md)
- [Command Creation Guide](../guides/command-creation.md)
