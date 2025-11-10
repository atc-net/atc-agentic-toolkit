# Skill Creation Guide

This guide teaches you how to create effective skills that extend Claude Code with specialized capabilities, domain knowledge, and reusable workflows.

## Table of Contents

- [What are Skills?](#what-are-skills)
- [Skill Anatomy](#skill-anatomy)
- [Progressive Disclosure Principle](#progressive-disclosure-principle)
- [Skill Creation Process](#skill-creation-process)
- [Writing Effective Instructions](#writing-effective-instructions)
- [Bundled Resources](#bundled-resources)
- [Testing and Validation](#testing-and-validation)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

---

## What are Skills?

**Skills** are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform Claude from a general-purpose agent into a specialized agent equipped with procedural knowledge.

### What Skills Provide

1. **Specialized workflows** - Multi-step procedures for specific domains
2. **Tool integrations** - Instructions for working with specific file formats or APIs
3. **Domain expertise** - Company-specific knowledge, schemas, business logic
4. **Bundled resources** - Scripts, references, and assets for complex and repetitive tasks

### When to Create a Skill

Create a skill when:

- You perform the same workflow repeatedly
- A task requires specialized domain knowledge
- Claude needs access to schemas, APIs, or documentation
- You want to standardize team approaches to common tasks
- A workflow involves multiple steps that need coordination

---

## Skill Anatomy

Every skill consists of a required `SKILL.md` file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

### SKILL.md (required)

The heart of your skill. Contains:

**YAML Frontmatter:**
```yaml
---
name: skill-name
description: Brief description of what the skill does and when to use it
license: MIT
---
```

**Markdown Body:**

- Purpose and overview
- Instructions for Claude
- How to use bundled resources
- Guidelines and best practices
- Examples

### Bundled Resources (optional)

#### Scripts (`scripts/`)

Executable code for tasks requiring deterministic reliability or repeatedly rewritten.

**When to include:**

- Same code is rewritten repeatedly
- Deterministic reliability is needed
- Complex logic that's error-prone if regenerated

**Examples:**

- `scripts/rotate_pdf.py` - PDF rotation tasks
- `scripts/parse_schema.py` - Database schema parsing
- `scripts/format_output.sh` - Consistent output formatting

**Benefits:**

- Token efficient
- Deterministic execution
- May be executed without loading into context
- Can be patched for environment-specific adjustments

#### References (`references/`)

Documentation and reference material loaded into context as needed to inform Claude's process.

**When to include:**

- Documentation Claude should reference while working
- Large datasets or schemas
- API specifications
- Company policies or standards

**Examples:**

- `references/finance.md` - Financial schemas
- `references/api_docs.md` - API specifications
- `references/policies.md` - Company policies
- `references/database_schema.md` - Database structure

**Best practices:**

- If files are large (>10k words), include grep search patterns in SKILL.md
- Information should live in either SKILL.md or references, not both
- Keep SKILL.md lean; move detailed material to references
- Make information discoverable without hogging context window

#### Assets (`assets/`)

Files not intended to be loaded into context, but used within Claude's output.

**When to include:**

- Skill needs files for final output
- Templates or boilerplate code
- Images, icons, or brand assets
- Sample documents to copy or modify

**Examples:**

- `assets/logo.png` - Brand assets
- `assets/template.pptx` - PowerPoint templates
- `assets/frontend-template/` - HTML/React boilerplate
- `assets/font.ttf` - Typography files

**Benefits:**

- Separates output resources from documentation
- Enables Claude to use files without loading into context
- Provides consistent starting points for generated content

---

## Progressive Disclosure Principle

Skills use a three-level loading system to manage context efficiently:

### Level 1: Metadata (Always in context ~100 words)
```yaml
---
name: database-migrator
description: Creates and manages database migrations for Entity Framework Core projects
---
```

Claude sees this metadata for all available skills, helping it decide when to activate the skill.

### Level 2: SKILL.md Body (When skill triggers <5k words)

When Claude determines the skill is needed, the full SKILL.md instructions are loaded:

```markdown
# Database Migrator

This skill guides the creation of Entity Framework Core migrations...

## Instructions

To create a migration:
1. Analyze the model changes...
2. Generate migration file...
3. Review and validate...
```

### Level 3: Bundled Resources (As needed by Claude, unlimited*)

Claude loads specific resources when required:

- Reads `references/ef-core-conventions.md` when applying naming standards
- Executes `scripts/apply_migration.py` to run migrations
- Copies `assets/migration-template.cs` when scaffolding

*Unlimited because scripts can be executed without reading into context window.

**Why This Matters:**

- Keeps context lean and focused
- Loads information only when needed
- Enables complex skills without overwhelming context
- Improves performance and reliability

---

## Skill Creation Process

Follow this six-step process to create effective skills.

### Step 1: Understanding the Skill with Concrete Examples

**Goal:** Clearly understand how the skill will be used in practice.

**Skip this step only if:** The skill's usage patterns are already clearly understood.

**Questions to Ask:**

- What functionality should the skill support?
- Can you give examples of how this skill would be used?
- What would a user say that should trigger this skill?
- Are there edge cases or variations to consider?

**Example:**

For an `image-editor` skill:

- "What functionality should the skill support? Editing, rotating, anything else?"
- "Can you give examples like 'Remove red-eye from this image' or 'Rotate this image'?"
- "What other image operations are needed?"

**Best Practice:** Don't overwhelm users with too many questions at once. Start with the most important and follow up as needed.

**Conclusion:** Complete this step when there's a clear sense of the functionality the skill should support.

---

### Step 2: Planning the Reusable Skill Contents

**Goal:** Identify what scripts, references, and assets would be helpful.

**Analysis Process:**
For each concrete example:

1. Consider how to execute it from scratch
2. Identify reusable resources that would help

**Example 1: PDF Editor Skill**

**Query:** "Help me rotate this PDF"

**Analysis:**

- Rotating a PDF requires re-writing the same code each time
- **Solution:** Create `scripts/rotate_pdf.py` to store reusable code

**Example 2: Frontend Webapp Builder Skill**

**Query:** "Build me a todo app" or "Build me a dashboard"

**Analysis:**
- Writing a frontend requires the same boilerplate HTML/React each time
- **Solution:** Create `assets/hello-world/` template with boilerplate project files

**Example 3: BigQuery Skill**

**Query:** "How many users have logged in today?"

**Analysis:**

- Querying BigQuery requires re-discovering table schemas each time
- **Solution:** Create `references/schema.md` documenting table schemas

**Output:** A list of reusable resources to include: scripts, references, and assets.

---

### Step 3: Initializing the Skill

**Goal:** Create the skill directory structure and template files.

**Skip this step only if:** The skill already exists and needs iteration or updating.

**Using the skill-creator Skill:**

The fastest way to initialize a skill:

```
Use the skill-creator skill to create a new skill named my-custom-skill
```

This generates:

- Proper directory structure
- SKILL.md template with frontmatter
- Example resource directories
- Placeholder files you can customize or delete

**Manual Initialization:**

If you prefer manual setup:

```bash
# Create skill directory
mkdir -p .claude/plugins/my-plugin/skills/my-custom-skill
cd .claude/plugins/my-plugin/skills/my-custom-skill

# Create SKILL.md
touch SKILL.md

# Create resource directories
mkdir scripts references assets

# Add example files (optional)
touch scripts/example_script.py
touch references/example_reference.md
touch assets/example_template.txt
```

**After initialization:** Customize or remove generated files as needed.

---

### Step 4: Edit the Skill

**Goal:** Write instructions and create resources for another Claude instance to use.

#### Start with Reusable Skill Contents

Implement the resources identified in Step 2:

**Scripts:**

```python
# scripts/rotate_pdf.py
import sys
from PyPDF2 import PdfReader, PdfWriter

def rotate_pdf(input_path, output_path, rotation=90):
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        page.rotate(rotation)
        writer.add_page(page)

    with open(output_path, 'wb') as output_file:
        writer.write(output_file)

if __name__ == '__main__':
    rotate_pdf(sys.argv[1], sys.argv[2], int(sys.argv[3]))
```

**References:**

```markdown
# references/database_schema.md

## Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email address |
| created_at | TIMESTAMP | Account creation time |
```

**Assets:**

```html
<!-- assets/template.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Template</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```

**Delete unused examples:** The initialization creates example files in `scripts/`, `references/`, and `assets/`. Delete any not needed for your skill.

#### Update SKILL.md

**Writing Style:** Use **imperative/infinitive form** (verb-first instructions), not second person.

- ✅ Good: "To accomplish X, do Y"
- ✅ Good: "Analyze the input file"
- ❌ Bad: "You should do X"
- ❌ Bad: "If you need to do X"

This maintains consistency and clarity for AI consumption.

**Questions to Answer:**

1. **What is the purpose of the skill?** (A few sentences)
2. **When should the skill be used?**
3. **How should Claude use the skill in practice?**

**Example SKILL.md:**

```markdown
---
name: pdf-editor
description: This skill should be used when users need to manipulate PDF files, including rotating pages, merging documents, or extracting content.
license: MIT
---

# PDF Editor

This skill provides tools for common PDF manipulation tasks.

## Purpose

The PDF editor skill enables reliable, consistent PDF manipulation without rewriting the same code repeatedly. It handles rotation, merging, splitting, and content extraction.

## When to Use

Use this skill when users ask to:
- Rotate PDF pages (90°, 180°, 270°)
- Merge multiple PDFs
- Split PDFs into separate files
- Extract text or images from PDFs

## Instructions

### Rotating PDFs

To rotate a PDF:

1. Confirm the rotation angle (90, 180, or 270 degrees)
2. Execute the rotation script:
   ```bash
   python scripts/rotate_pdf.py input.pdf output.pdf 90
   ```
3. Verify the output file was created successfully
4. Inform the user of the result

### Merging PDFs

To merge multiple PDFs:

1. Collect all input file paths
2. Confirm the desired output order
3. Execute the merge script:
   ```bash
   python scripts/merge_pdfs.py output.pdf input1.pdf input2.pdf input3.pdf
   ```
4. Report success with output file location

## Error Handling

If a PDF file cannot be opened:

- Check that the file exists and is a valid PDF
- Verify file permissions
- Try opening the file with a PDF reader to confirm it's not corrupted

If rotation or merging fails:

- Review the error message from the script
- Check available disk space
- Ensure output directory exists and is writable

## References

- `scripts/rotate_pdf.py` - Rotate PDF pages
- `scripts/merge_pdfs.py` - Merge multiple PDFs
- `scripts/split_pdf.py` - Split PDF into separate files
- `scripts/extract_text.py` - Extract text content
```

---

### Step 5: Packaging a Skill (Optional)

**Goal:** Create a distributable zip file of your skill.

**Note:** This step is typically handled by the `skill-creator` skill or manual processes. The ATC Agentic Toolkit doesn't currently include packaging scripts, but you can create a simple zip file:

```bash
# From the plugin directory
cd .claude/plugins/my-plugin/skills

# Create a zip file
zip -r my-custom-skill.zip my-custom-skill/
```

**What to include:**

- SKILL.md file
- All scripts/, references/, and assets/ directories
- Any supporting files
- README if helpful

**Validation Checklist:**

- [ ] YAML frontmatter is valid
- [ ] Required fields (name, description) are present
- [ ] Instructions are clear and imperative
- [ ] Bundled resources are referenced in SKILL.md
- [ ] File naming follows conventions
- [ ] Directory structure is correct

---

### Step 6: Iterate

**Goal:** Improve the skill based on real-world usage.

**Iteration workflow:**

1. **Use the skill** on real tasks
2. **Notice struggles or inefficiencies**
3. **Identify improvements** needed in SKILL.md or resources
4. **Implement changes** and test again
5. **Repeat** until the skill performs reliably

**Common iterations:**

- Adding more detailed instructions for edge cases
- Including additional reference documentation
- Creating new scripts for repeated operations
- Improving error handling guidance
- Clarifying ambiguous instructions

**Fresh context advantage:** Often improvements are identified right after using the skill, when the performance is fresh in mind.

---

## Writing Effective Instructions

### Be Specific and Actionable

**❌ Vague:**

```markdown
Help the user with their database.
```

**✅ Specific:**

```markdown
Analyze the Entity Framework Core models, identify changes since the last migration, and generate a new migration file with appropriate naming following the format `YYYYMMDDHHMMSS_DescriptiveAction.cs`.
```

### Use Step-by-Step Guidance

**❌ High-level:**

```markdown
Create an API endpoint.
```

**✅ Step-by-step:**

```markdown
To create an API endpoint:
1. Determine the HTTP method (GET, POST, PUT, DELETE)
2. Define the route pattern following RESTful conventions
3. Create the controller action with appropriate attributes
4. Implement request validation
5. Add XML documentation comments
6. Generate response with proper status codes
```

### Include Examples

**❌ Abstract:**

```markdown
Name the migration appropriately.
```

**✅ With examples:**

```markdown
Name the migration following this pattern:
- Adding a table: `Add{TableName}Table` (e.g., `AddUsersTable`)
- Modifying a column: `Update{TableName}{ColumnName}` (e.g., `UpdateUsersEmailColumn`)
- Creating an index: `CreateIndexOn{TableName}{ColumnName}` (e.g., `CreateIndexOnUsersEmail`)
```

### Handle Edge Cases

**❌ Happy path only:**

```markdown
Execute the script to process the file.
```

**✅ With error handling:**

```markdown
Execute the script to process the file:
```bash
python scripts/process_file.py input.txt output.txt
```

If the script fails:

- Check that input.txt exists and is readable
- Verify output directory is writable
- Review error message for specific issues
- Consult references/troubleshooting.md for common problems
```

---

## Bundled Resources

### When to Bundle Scripts

**Bundle scripts when:**
- The same code is rewritten repeatedly (e.g., PDF rotation)
- Deterministic reliability is critical (e.g., financial calculations)
- Logic is complex and error-prone if regenerated (e.g., parsing algorithms)

**Don't bundle scripts when:**
- The code is simple and varies significantly (e.g., print statements)
- Flexibility is more important than consistency
- The script would need constant updates

### When to Bundle References

**Bundle references when:**
- Documentation is needed while Claude works (e.g., API specs)
- Schema or structure needs to be referenced (e.g., database schema)
- Company-specific knowledge is required (e.g., policies, standards)
- Information is stable and doesn't change frequently

**Don't bundle references when:**
- Information is available via web search
- Content changes frequently (link to live docs instead)
- Documentation is brief enough to include in SKILL.md

### When to Bundle Assets

**Bundle assets when:**
- Templates provide consistent starting points (e.g., boilerplate code)
- Brand or style assets are needed (e.g., logos, fonts)
- Sample files should be copied or modified (e.g., config templates)

**Don't bundle assets when:**
- Files are very large (>10MB)
- Assets are available via package managers or CDNs
- Content is generated from scratch each time

---

## Testing and Validation

### Manual Testing

1. **Install the skill** in a test project:
```bash
cp -r .claude/plugins/my-plugin/skills/my-custom-skill /path/to/test/.claude/plugins/test-plugin/skills/
```

2. **Invoke the skill:**

```
Use the my-custom-skill skill to [test scenario]
```

3. **Verify behavior:**

- Are instructions clear?
- Does Claude follow the workflow correctly?
- Are bundled resources used appropriately?
- Do error cases work as expected?

### Validation Checklist

**Structure:**

- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] Required fields: name, description
- [ ] Directory structure is correct

**Content:**

- [ ] Description is specific about when to use the skill
- [ ] Instructions are clear and imperative
- [ ] Examples are provided for complex operations
- [ ] Error handling is addressed
- [ ] Bundled resources are referenced in SKILL.md

**Resources:**

- [ ] Scripts are tested and work correctly
- [ ] References contain accurate information
- [ ] Assets are usable and properly formatted
- [ ] No unnecessary files are included

**Quality:**

- [ ] Instructions are unambiguous
- [ ] Edge cases are handled
- [ ] Performance is acceptable
- [ ] Context usage is optimized (progressive disclosure)

---

## Real-World Examples

### Example 1: Database Migrator Skill

**Use Case:** Create Entity Framework Core migrations consistently.

**Structure:**

```
database-migrator/
├── SKILL.md
├── scripts/
│   └── apply_migration.py
└── references/
    ├── ef-core-conventions.md
    └── naming-patterns.md
```

**SKILL.md excerpt:**

```markdown
---
name: database-migrator
description: This skill should be used when users need to create, apply, or manage Entity Framework Core database migrations for .NET projects.
---

To create a migration:
1. Analyze model changes since the last migration
2. Generate a migration name following the pattern in references/naming-patterns.md
3. Create the migration file with `dotnet ef migrations add [MigrationName]`
4. Review the generated migration for correctness
5. Apply with `scripts/apply_migration.py` if approved
```

### Example 2: API Documentation Generator Skill

**Use Case:** Generate OpenAPI specifications from API controllers.

**Structure:**

```
api-docs-generator/
├── SKILL.md
├── scripts/
│   ├── analyze_controllers.py
│   └── generate_openapi.py
├── references/
│   └── openapi-3.0-spec.md
└── assets/
    └── openapi-template.json
```

**SKILL.md excerpt:**

```markdown
---
name: api-docs-generator
description: This skill should be used when users need to generate OpenAPI 3.0 specifications from ASP.NET Core API controllers, including parameter definitions, response schemas, and examples.
---

To generate API documentation:
1. Analyze controllers in the specified namespace with `scripts/analyze_controllers.py`
2. Extract endpoint definitions, parameters, and return types
3. Use `assets/openapi-template.json` as the base structure
4. Generate OpenAPI 3.0 JSON following `references/openapi-3.0-spec.md`
5. Validate the generated specification
6. Write to the specified output path
```

### Example 3: Test Generator Skill

**Use Case:** Generate unit tests for C# classes.

**Structure:**

```
test-generator/
├── SKILL.md
└── references/
    ├── xunit-patterns.md
    ├── moq-examples.md
    └── test-naming-conventions.md
```

**SKILL.md excerpt:**

```markdown
---
name: test-generator
description: This skill should be used when users need to generate xUnit unit tests for C# classes, including test setup, assertions, and mocking with Moq.
---

To generate unit tests:
1. Analyze the target class and its public methods
2. Identify dependencies that need mocking
3. For each public method, create tests covering:
   - Happy path scenarios
   - Edge cases
   - Exception handling
4. Follow naming conventions from references/test-naming-conventions.md
5. Use Moq patterns from references/moq-examples.md for dependencies
6. Include XML documentation for test purposes
```

---

## Best Practices

### Metadata Quality

**Do:**

- Be specific about what the skill does
- Describe when to use it (not just what it is)
- Use third person: "This skill should be used when..."
- Include key capabilities in the description

**Don't:**

- Use vague descriptions like "Helps with databases"
- Write in first or second person
- Make the description too long (aim for 1-2 sentences)

### Instruction Clarity

**Do:**

- Use imperative verbs (Analyze, Create, Validate)
- Break complex tasks into numbered steps
- Include concrete examples
- Reference bundled resources explicitly
- Address error cases

**Don't:**

- Use passive voice
- Assume knowledge of internal processes
- Skip error handling
- Leave instructions ambiguous

### Context Optimization

**Do:**

- Keep SKILL.md under 5k words
- Move detailed content to references/
- Use progressive disclosure
- Bundle scripts for repetitive code
- Reference resources as needed

**Don't:**

- Duplicate information between SKILL.md and references
- Include entire documentation in SKILL.md
- Bundle resources that are rarely used
- Load everything into context at once

### Resource Organization

**Do:**

- Use clear, descriptive filenames
- Organize by type (scripts/, references/, assets/)
- Document what each resource does
- Keep resources focused and modular

**Don't:**

- Mix resource types in the same directory
- Create deep nested structures
- Include unused or example files
- Forget to reference resources in SKILL.md

---

## Next Steps

- Review the [Plugin Development Guide](plugin-development.md) for creating full plugins
- Study the [skill-creator SKILL.md](../../.claude/plugins/common/skills/skill-creator/SKILL.md) as a reference
- Explore [Skill Anatomy Reference](../reference/skill-anatomy.md) for technical details
- Read [Claude Code Fundamentals](../best-practices/claude-code-fundamentals.md) for context management

---