# Skill Anatomy Reference

Technical specification for SKILL.md file format, frontmatter metadata, and bundled resources.

## SKILL.md Structure

Every skill requires a `SKILL.md` file with two main components:

1. **YAML Frontmatter** (required) - Metadata between `---` delimiters
2. **Markdown Body** (required) - Instructions and documentation

```markdown
---
name: skill-name
description: Brief description of skill purpose and when to use it
license: MIT
---

# Skill Title

Markdown instructions for Claude Code...
```

---

## YAML Frontmatter

### Required Fields

#### name

**Type:** String

**Description:** Skill identifier, must match directory name

**Format:** Lowercase with hyphens

**Example:**

```yaml
name: iot-edge-module
```

#### description

**Type:** String

**Description:** Clear explanation of what the skill does and when to use it

**Format:** One to three sentences, third person

**Best Practice:** Include "when to use" guidance

**Example:**

```yaml
description: This skill should be used when users need to scaffold a new Azure IoT Edge module with complete project structure, Dockerfiles, and deployment manifest integration.
```

### Optional Fields

#### license

**Type:** String

**Description:** License identifier or license file reference

**Examples:**

```yaml
license: MIT
license: Apache-2.0
license: Complete terms in LICENSE.txt
```

#### version

**Type:** String

**Description:** Semantic version number

**Format:** `major.minor.patch`

**Example:**

```yaml
version: 1.0.0
```

#### author

**Type:** String

**Description:** Author name or organization

**Example:**

```yaml
author: ATC-Net
```

#### namespace

**Type:** String

**Description:** Plugin namespace (usually plugin name)

**Example:**

```yaml
namespace: azure-iot
```

#### category

**Type:** String

**Description:** Skill category for organization

**Values:** development, utilities, documentation, testing, deployment, etc.

**Example:**

```yaml
category: development
```

#### keywords

**Type:** Array of strings

**Description:** Searchable keywords

**Example:**

```yaml
keywords: [azure, iot-edge, scaffolding, dotnet]
```

### Complete Frontmatter Example

```yaml
---
name: iot-edge-module
namespace: azure-iot
description: This skill should be used when users need to scaffold a new Azure IoT Edge module with complete project structure, Dockerfiles, and deployment manifest integration.
version: 1.0.0
author: ATC-Net
category: development
keywords: [azure, iot-edge, scaffolding, modules, dotnet, csharp]
license: MIT
---
```

---

## Markdown Body

### Required Sections

#### Instructions

**Purpose:** Tell Claude Code what to do when the skill is invoked

**Format:** Clear, imperative instructions

**Structure:**

```markdown
# Skill Name

Brief overview of skill purpose.

## Instructions

When the user invokes this skill, you should:

1. [First step]
2. [Second step]
3. [Third step]

## Guidelines

- [Guideline 1]
- [Guideline 2]
```

### Recommended Sections

#### About This Skill

**Purpose:** Explain the skill's purpose and value

**Example:**

```markdown
## About This Skill

This skill automates the creation of Azure IoT Edge modules, reducing setup time from hours to minutes and ensuring consistency across projects.
```

#### When to Use

**Purpose:** Clarify appropriate use cases

**Example:**

```markdown
## When to Use

Use this skill when:
- Creating a new IoT Edge module from scratch
- Adding a module to an existing IoT Edge solution
- Standardizing module structure across projects
```

#### Prerequisites

**Purpose:** List requirements before using the skill

**Example:**

```markdown
## Prerequisites

- .NET SDK 6.0 or higher
- Docker Desktop installed
- Existing IoT Edge solution (or this skill will create one)
```

#### Examples

**Purpose:** Show concrete usage examples

**Example:**

```markdown
## Examples

**Basic module:**
\```
Use the iot-edge-module skill to create a new module named TemperatureSensor
\```

**Module with description:**
\```
Use the iot-edge-module skill to create a module named DataProcessor that aggregates sensor data
\```
```

#### Bundled Resources

**Purpose:** Document scripts, references, and assets included with the skill

**Example:**

```markdown
## Bundled Resources

**Scripts:**
- `scripts/create_module.py` - Generates module structure
- `scripts/update_manifest.py` - Updates deployment manifest

**References:**
- `references/module-structure.md` - Module directory layout
- `references/deployment-manifests.md` - Manifest configuration guide

**Assets:**
- `assets/module-template/` - .NET project template
```

#### Error Handling

**Purpose:** Guide Claude Code on handling errors

**Example:**

```markdown
## Error Handling

**If module already exists:**
- Inform the user
- Ask if they want to overwrite
- Require explicit confirmation before proceeding

**If .NET SDK is not installed:**
- Display error message
- Provide installation link
- Do not proceed with module creation
```

---

## Writing Style Guidelines

### Use Imperative Form

**❌ Don't use second person:**

```markdown
You should create the module directory...
```

**✅ Use imperative/infinitive:**

```markdown
Create the module directory...
```

### Be Specific and Actionable

**❌ Vague:**

```markdown
Help the user with their module.
```

**✅ Specific:**

```markdown
Create a new IoT Edge module directory at src/Modules/[ModuleName]/ with the following structure:
- [ModuleName].csproj
- Program.cs
- Dockerfile
- Dockerfile.dev
```

### Use Structured Steps

**❌ Paragraph form:**

```markdown
First you need to validate the module name and then create the directory structure and after that generate the project files and finally update the deployment manifest.
```

**✅ Numbered steps:**

```markdown
1. Validate the module name (PascalCase, no special characters)
2. Create directory structure at src/Modules/[ModuleName]/
3. Generate .NET project file ([ModuleName].csproj)
4. Create Program.cs with IoT Edge template
5. Generate Dockerfiles (production and development)
6. Update deployment.template.json
```

---

## Bundled Resources

### scripts/

**Purpose:** Executable code for deterministic or repeatedly rewritten tasks

**File Types:** `.py`, `.sh`, `.js`, etc.

**When to Include:**

- Same code is rewritten repeatedly
- Deterministic reliability is needed
- Complex logic prone to errors if regenerated

**Organization:**

```
scripts/
├── main_script.py          # Primary script
├── helper_script.py        # Supporting script
└── utils.sh                # Utility functions
```

**Referencing in SKILL.md:**

```markdown
To rotate the PDF, execute:
\```bash
python scripts/rotate_pdf.py input.pdf output.pdf 90
\```
```

### references/

**Purpose:** Documentation loaded into context as needed

**File Types:** `.md` primarily

**When to Include:**

- Documentation Claude should reference
- Schemas, specifications, standards
- Domain knowledge, company policies
- API documentation

**Organization:**

```
references/
├── main-concepts.md        # Core information
├── api-specification.md    # API docs
├── database-schema.md      # Schema details
└── examples.md             # Usage examples
```

**Referencing in SKILL.md:**

```markdown
## Database Schema

For complete schema details, see references/database-schema.md.

Key tables:
- Users
- Orders
- Products
```

**Best Practice:** For large files (>10k words), include grep patterns:

```markdown
To find specific table definitions, search references/database-schema.md for the table name.
```

### assets/

**Purpose:** Files used in output, not loaded into context

**File Types:** Any - templates, images, fonts, boilerplate code

**When to Include:**

- Templates for generated output
- Brand assets (logos, fonts)
- Boilerplate code
- Sample/starter files

**Organization:**

```
assets/
├── templates/
│   ├── html-template.html
│   └── config-template.json
├── images/
│   └── logo.png
└── boilerplate/
    └── starter-project/
```

**Referencing in SKILL.md:**

```markdown
Copy the template from assets/templates/config-template.json as the base configuration.
```

---

## Progressive Disclosure

Skills use a three-level loading strategy:

### Level 1: Metadata (Always Loaded)

**What:** Frontmatter (`name` and `description`)

**Size:** ~100 words

**Purpose:** Help Claude decide if skill is relevant

**Loaded:** All the time for all skills

### Level 2: SKILL.md Body (Loaded When Triggered)

**What:** Full markdown instructions

**Size:** <5,000 words (recommended)

**Purpose:** Provide instructions for executing the skill

**Loaded:** When Claude activates the skill

### Level 3: Bundled Resources (Loaded As Needed)

**What:** scripts/, references/, assets/

**Size:** Unlimited* (*scripts can execute without reading into context)

**Purpose:** Provide detailed information and resources

**Loaded:** When Claude determines they're needed

**Example Flow:**

User: "Create an IoT Edge module named TemperatureSensor"

1. **Metadata scanned:** Claude sees `iot-edge-module` skill matches
2. **SKILL.md loaded:** Full instructions are read
3. **Resources loaded progressively:**
   - Reads `references/module-structure.md` to understand layout
   - Executes `scripts/create_module.py` (may not read into context)
   - Copies files from `assets/module-template/`

---

## Size Recommendations

### SKILL.md

**Target:** 1,000-3,000 words

**Maximum:** 5,000 words

**If larger:** Move content to references/

### Frontmatter Description

**Target:** 1-2 sentences

**Maximum:** 3 sentences

### References

**No strict limit** - Loaded on demand

**Best Practice:** Split into focused files rather than one large file

### Scripts

**Keep focused** - One responsibility per script

**Document well** - Include comments and docstrings

### Assets

**Consider size** - Large assets (>10MB) may slow installation

---

## Validation Checklist

Before publishing a skill:

### Frontmatter

- [ ] YAML is valid (test with YAML parser)
- [ ] `name` matches directory name
- [ ] `description` is clear and includes "when to use"
- [ ] `name` is lowercase-with-hyphens format

### Instructions

- [ ] Written in imperative form
- [ ] Steps are numbered and clear
- [ ] Specific and actionable
- [ ] Error handling is addressed
- [ ] Examples are provided

### Resources

- [ ] All referenced resources exist
- [ ] Scripts are executable
- [ ] References are accurate
- [ ] Assets are properly formatted
- [ ] No unused files

### Testing

- [ ] Skill activates when invoked
- [ ] Instructions are followed correctly
- [ ] Scripts execute successfully
- [ ] Output meets expectations

---

## Example: Complete SKILL.md

```markdown
---
name: database-migrator
namespace: common
description: This skill should be used when users need to create, apply, or manage Entity Framework Core database migrations for .NET projects.
version: 1.0.0
author: ATC-Net
category: development
keywords: [database, migrations, entity-framework, dotnet, csharp]
license: MIT
---

# Database Migrator

This skill automates the creation and management of Entity Framework Core migrations, ensuring consistent naming conventions and proper migration structure.

## When to Use

Use this skill when:
- Creating a new database migration after model changes
- Applying migrations to update database schema
- Rolling back migrations
- Generating migration scripts for review

## Prerequisites

- .NET SDK 6.0 or higher
- Entity Framework Core tools installed
- Existing DbContext in the project

## Instructions

### Creating a Migration

When the user requests a new migration, you should:

1. **Analyze model changes:**
   - Identify which entities were added, modified, or removed
   - Determine the type of change (table addition, column modification, etc.)

2. **Generate migration name:**
   - Follow the naming pattern from references/naming-conventions.md
   - Use descriptive names: `AddUsersTable`, `UpdateOrderStatusColumn`

3. **Create the migration:**
   \```bash
   dotnet ef migrations add [MigrationName]
   \```

4. **Review the generated migration:**
   - Check that Up() and Down() methods are correct
   - Verify data types and constraints
   - Ensure indexes are appropriate

5. **Inform the user:**
   - Report migration name and location
   - Provide command to apply: `dotnet ef database update`

### Applying Migrations

To apply pending migrations:

1. **List pending migrations:**
   \```bash
   dotnet ef migrations list
   \```

2. **Apply migrations:**
   \```bash
   dotnet ef database update
   \```

3. **Verify success:**
   - Check for error messages
   - Confirm database schema matches expectations

## Guidelines

- Always review generated migrations before applying
- Never auto-apply migrations without user confirmation
- Include both Up() and Down() methods
- Test migrations on development environment first
- Keep migrations focused (one logical change per migration)

## Bundled Resources

**References:**
- `references/naming-conventions.md` - Migration naming patterns
- `references/ef-core-best-practices.md` - EF Core guidelines

## Error Handling

**If no model changes detected:**
- Inform user: "No model changes detected. Migration not created."
- Suggest reviewing model classes for changes

**If migration fails to apply:**
- Display the error message
- Check references/troubleshooting.md for common issues
- Suggest rolling back: `dotnet ef database update [PreviousMigration]`

**If naming conflicts:**
- Detect existing migration with similar name
- Suggest more specific name
- Ask user for preferred name

## Examples

**Create migration for new table:**
\```
Use the database-migrator skill to create a migration for the new Products table
\```

**Apply pending migrations:**
\```
Use the database-migrator skill to apply all pending migrations
\```

**Roll back migration:**
\```
Use the database-migrator skill to roll back to the AddUsersTable migration
\```
```

---

## Resources

- [Plugin Structure Reference](plugin-structure.md)
- [Skill Creation Guide](../guides/skill-creation.md)
- [Marketplace Config Reference](marketplace-config.md)
