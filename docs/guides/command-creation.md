# Command Creation Guide

This guide teaches you how to create effective slash commands that provide quick access to common tasks and workflows in Claude Code.

## Table of Contents

- [What are Commands?](#what-are-commands)
- [When to Create a Command](#when-to-create-a-command)
- [Command Structure](#command-structure)
- [Writing Command Instructions](#writing-command-instructions)
- [Argument Handling](#argument-handling)
- [Error Handling](#error-handling)
- [Testing Commands](#testing-commands)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)

---

## What are Commands?

**Slash commands** are quick shortcuts that provide rapid access to common tasks without the overhead of invoking a full skill. They're invoked with the `/` prefix followed by the command name and optional arguments.

### Characteristics

- **Fast invocation** - Type `/command-name` for instant access
- **Argument support** - Accept parameters for flexibility
- **Task-specific** - Focus on a single, well-defined operation
- **Lightweight** - No metadata or bundled resources
- **Auto-completion** - Claude Code suggests commands as you type

### Commands vs. Skills

| Aspect | Commands | Skills |
|--------|----------|--------|
| **Invocation** | `/command-name [args]` | Natural language prompt |
| **Complexity** | Simple, single task | Complex, multi-step workflows |
| **Arguments** | Explicit parameters | Context from conversation |
| **Resources** | None bundled | Scripts, references, assets |
| **Use Case** | Quick, frequent operations | Specialized domain expertise |

---

## When to Create a Command

Create a command when:

✅ **The task is quick and straightforward**
- Formatting code
- Running a specific tool
- Generating boilerplate

✅ **The operation is performed frequently**
- Adding a module
- Creating a test file
- Updating documentation

✅ **Arguments make the task more efficient**
- `/add-module ModuleName "Description"`
- `/format-params --strict`
- `/generate-tests ClassName`

✅ **The workflow doesn't require decision-making**
- Clear inputs → deterministic outputs
- No complex branching logic
- Minimal context needed

❌ **Don't create a command when:**
- The task requires extended conversation
- Decision-making is needed during execution
- Multiple steps with dependencies are involved
- Domain expertise or bundled resources would help
- The operation varies significantly based on context

**Rule of thumb:** If it takes more than 3 sentences to describe what the command does, it's probably better as a skill.

---

## Command Structure

### Directory Location

Commands are stored in the `commands/` directory of your plugin:

```
.claude/plugins/my-plugin/
└── commands/
    ├── my-command.md
    ├── another-command.md
    └── quick-fix.md
```

### File Naming

- **File name must match command name:** `format-params.md` → `/format-params`
- **Use lowercase with hyphens:** `add-module.md`, not `AddModule.md`
- **Be descriptive:** `generate-tests.md`, not `gt.md`
- **Avoid conflicts:** Check for existing commands first

### Basic Structure

```markdown
# Command Title

Brief description of what the command does (1-2 sentences).

## Instructions

When the user invokes `/command-name [arg1] [arg2]`, you should:

1. [First step - validate arguments]
2. [Second step - perform main action]
3. [Third step - report results]

## Arguments

- `arg1` (required): Description of first argument
- `arg2` (optional): Description of second argument, defaults to [value]

## Examples

\```
/command-name value1 "value with spaces"
\```

Expected output:
- [Describe what the user should see]

## Error Handling

If [error condition]:
- [How to inform the user]
- [What corrective action to suggest]

## Notes

- [Any special considerations]
- [Related commands or skills]
```

---

## Writing Command Instructions

### Be Direct and Actionable

Commands should have clear, imperative instructions.

**❌ Vague:**
```markdown
Help the user format their code.
```

**✅ Direct:**
```markdown
When the user invokes `/format-params`, you should:
1. Find all `.cs` files in the current project
2. Apply parameter formatting following ATC-Net conventions
3. Report the number of files modified
4. List any files that had errors
```

### Use Numbered Steps

Break the command workflow into clear, sequential steps.

**Example:**
```markdown
## Instructions

When the user invokes `/add-iot-edge-module [ModuleName] "[Description]"`, you should:

1. **Validate arguments:**
   - ModuleName: Must be PascalCase, no spaces
   - Description: Required, brief module purpose

2. **Create module structure:**
   - Create directory: `src/Modules/[ModuleName]/`
   - Generate .csproj file with .NET 6.0 target
   - Create Program.cs with IoT Edge boilerplate

3. **Generate Dockerfiles:**
   - Create Dockerfile (production)
   - Create Dockerfile.dev (development)

4. **Update deployment manifest:**
   - Add module to deployment.template.json
   - Configure routing if first module

5. **Integrate with solution:**
   - Add project reference to solution file
   - Report success with module location
```

### Include Context About Purpose

Help Claude understand *why* steps are being performed.

**Example:**
```markdown
2. **Validate input format:**
   - Check that the namespace follows .NET naming conventions
   - This ensures generated code will compile without errors
```

---

## Argument Handling

### Defining Arguments

Be explicit about:
- Argument names and order
- Required vs. optional
- Expected format
- Default values

**Example:**
```markdown
## Arguments

- `module-name` (required): Module name in PascalCase (e.g., TemperatureSensor)
- `description` (required): Brief description of module purpose, enclosed in quotes if it contains spaces
- `--framework` (optional): Target framework, defaults to net6.0
- `--output-dir` (optional): Output directory, defaults to src/Modules/
```

### Handling Optional Arguments

Show how optional arguments affect behavior:

```markdown
If `--framework` is provided:
- Use the specified framework in .csproj file
- Validate that it's a supported .NET version

If `--framework` is not provided:
- Default to net6.0
- Proceed without validation
```

### Validating Arguments

Always validate before executing:

```markdown
1. **Validate arguments:**
   - Check `module-name` matches pattern: ^[A-Z][a-zA-Z0-9]*$
   - If invalid, inform user and show correct format
   - Check `description` is not empty
   - If missing, prompt user to provide it
```

### Handling Spaces and Special Characters

Document how to handle arguments with spaces:

```markdown
## Examples

For arguments with spaces, use quotes:

\```
/add-module TemperatureSensor "Processes temperature data from IoT sensors"
\```

For paths with spaces on Windows:
\```
/generate-docs "C:\My Projects\API Documentation\output.json"
\```
```

---

## Error Handling

### Anticipate Common Errors

Think through what can go wrong:

```markdown
## Error Handling

**If module name is invalid:**
- Show error: "Module name must be PascalCase (e.g., TemperatureSensor)"
- Provide correct format example
- Do not proceed with creation

**If module directory already exists:**
- Show error: "Module '[ModuleName]' already exists at [path]"
- Ask user if they want to overwrite
- Require explicit confirmation before proceeding

**If solution file not found:**
- Show error: "No solution file found in current directory"
- Suggest running command from solution root
- Offer to create without solution integration

**If .NET SDK not available:**
- Show error: "dotnet command not found"
- Provide installation link
- Do not proceed
```

### Provide Actionable Feedback

Don't just report errors—guide users to solutions:

**❌ Not helpful:**
```markdown
If the command fails, show an error.
```

**✅ Helpful:**
```markdown
If file write fails due to permissions:
- Show error: "Cannot write to [path] - permission denied"
- Suggest: "Try running from a directory where you have write access"
- Alternative: "Use --output-dir to specify a different location"
```

---

## Testing Commands

### Manual Testing

1. **Create the command file:**
```bash
cd .claude/plugins/my-plugin/commands
```

2. **Write command definition:**
Create `my-command.md` with proper structure.

3. **Test in Claude Code:**
```
/my-command test-arg "test value"
```

4. **Verify behavior:**
- Command auto-completes correctly
- Arguments are parsed properly
- Instructions are followed
- Output meets expectations
- Errors are handled gracefully

### Test Scenarios

Test with various inputs:

**Valid inputs:**
```
/add-module TemperatureSensor "Temperature processing"
/add-module DataAggregator "Aggregates sensor data"
```

**Edge cases:**
```
/add-module Test ""                    # Empty description
/add-module lowercase "Test"           # Invalid casing
/add-module Has Spaces "Test"          # Spaces in name
/add-module "ValidName" Description    # Quotes in wrong place
```

**Error conditions:**
```
/add-module                            # Missing arguments
/add-module TooManyArgs One Two Three  # Too many arguments
```

### Validation Checklist

- [ ] Command file is named correctly (matches command name)
- [ ] Instructions are clear and imperative
- [ ] All arguments are documented with types and requirements
- [ ] Required vs. optional is specified
- [ ] Examples show correct usage
- [ ] Error handling covers common failures
- [ ] Command performs single, focused task
- [ ] No conflicts with existing commands

---

## Real-World Examples

### Example 1: Format Parameters Command

**File:** `format-params.md`

**Command:** `/format-params`

```markdown
# Format Parameters

Formats C# method parameters across all .cs files in the project for consistency with ATC-Net coding conventions.

## Instructions

When the user invokes `/format-params`, you should:

1. **Find all C# files:**
   - Search recursively for `*.cs` files in the current directory
   - Exclude `bin/` and `obj/` directories

2. **Apply formatting rules:**
   - Ensure parameters are on separate lines if there are 3+ parameters
   - Align parameter names consistently
   - Apply proper indentation (4 spaces per level)
   - Format attributes above parameters correctly

3. **Process each file:**
   - Read the file content
   - Apply formatting transformations
   - Write back only if changes were made
   - Track files modified vs. skipped

4. **Report results:**
   - List files that were modified
   - Show count of total files processed
   - Report any files that had errors
   - Indicate if no changes were needed

## Arguments

None. This command operates on all .cs files in the current project.

## Examples

\```
/format-params
\```

Expected output:
\```
Formatting C# parameters...

Modified files:
- src/Services/DataService.cs
- src/Controllers/ApiController.cs
- src/Models/UserModel.cs

Processed: 15 files
Modified: 3 files
Errors: 0 files
\```

## Error Handling

**If no .cs files are found:**
- Inform user: "No C# files found in current directory"
- Suggest: "Ensure you're running this command from a .NET project directory"

**If file read fails:**
- Report which file failed
- Continue processing remaining files
- Include in error count at end

**If file write fails:**
- Report permission or access issues
- Skip that file
- Continue with others
- List failed files in summary

## Notes

- This command follows ATC-Net coding conventions
- It's safe to run multiple times (idempotent)
- No changes are made to files that already comply
- Related skill: `code-quality` for more advanced refactoring
```

---

### Example 2: Add IoT Edge Module Command

**File:** `add-iot-edge-module.md`

**Command:** `/add-iot-edge-module [ModuleName] "[Description]"`

```markdown
# Add IoT Edge Module

Quick command to scaffold a new Azure IoT Edge module with complete project structure, Dockerfiles, and deployment configuration.

## Instructions

When the user invokes `/add-iot-edge-module [ModuleName] "[Description]"`, you should:

1. **Validate arguments:**
   - ModuleName: Must be PascalCase (e.g., TemperatureSensor)
   - Description: Required, brief module purpose
   - If invalid, show error and correct format

2. **Check preconditions:**
   - Verify solution file exists in current or parent directory
   - Confirm src/Modules/ directory exists or can be created
   - Check that module doesn't already exist

3. **Create module structure:**
   - Directory: `src/Modules/[ModuleName]/`
   - Project file: `[ModuleName].csproj` targeting net6.0
   - Program.cs with IoT Edge module template
   - Supporting files: .dockerignore, module.json

4. **Generate Dockerfiles:**
   - `Dockerfile` for production (alpine-based)
   - `Dockerfile.dev` for development (with debugging)

5. **Update deployment manifest:**
   - Add module entry to deployment.template.json
   - Configure default routing if first module
   - Set image repository pattern

6. **Integrate with solution:**
   - Add project reference to .sln file
   - Verify successful addition

7. **Report results:**
   - Confirm module creation
   - Show module directory path
   - List files created
   - Provide next steps (build, deploy)

## Arguments

- `ModuleName` (required): Module name in PascalCase, no spaces or special characters
- `Description` (required): Brief description of module purpose, use quotes if it contains spaces

## Examples

**Simple module:**
\```
/add-iot-edge-module TemperatureSensor "Reads temperature from sensors"
\```

**Module with complex description:**
\```
/add-iot-edge-module DataAggregator "Aggregates and filters sensor data before sending to IoT Hub"
\```

Expected output:
\```
Creating IoT Edge module: TemperatureSensor

✓ Created directory: src/Modules/TemperatureSensor/
✓ Generated project file: TemperatureSensor.csproj
✓ Created Program.cs with IoT Edge template
✓ Generated Dockerfile (production)
✓ Generated Dockerfile.dev (development)
✓ Updated deployment.template.json
✓ Added to solution file

Module created successfully!
Location: src/Modules/TemperatureSensor/

Next steps:
1. Implement module logic in Program.cs
2. Build: dotnet build src/Modules/TemperatureSensor
3. Test: docker build -f src/Modules/TemperatureSensor/Dockerfile.dev
4. Deploy: Update deployment manifest and push to IoT Hub
\```

## Error Handling

**If ModuleName is invalid:**
- Error: "Module name must be PascalCase (e.g., TemperatureSensor, not temperature_sensor)"
- Do not proceed with creation

**If module already exists:**
- Error: "Module 'TemperatureSensor' already exists at src/Modules/TemperatureSensor/"
- Ask: "Do you want to overwrite? (This will delete existing code)"
- Require explicit confirmation

**If solution file not found:**
- Error: "No .sln file found in current directory or parent directories"
- Suggest: "Run this command from your solution root, or create module without solution integration"
- Option: Proceed without adding to solution (ask user)

**If deployment.template.json not found:**
- Warning: "No deployment.template.json found"
- Action: Create module but skip manifest update
- Inform: "You'll need to manually add the module to your deployment manifest"

## Notes

- This command is a quick shortcut to the full `iot-edge-module` skill
- For more complex scenarios, use the skill instead
- Module follows ATC-Net conventions and best practices
- Includes logging, service patterns, and constants by default
- Related skill: `iot-edge-module` for guided setup
```

---

### Example 3: Generate Tests Command

**File:** `generate-tests.md`

**Command:** `/generate-tests [ClassName] [--framework xunit|nunit]`

```markdown
# Generate Tests

Generates unit test file for a specified C# class with test stubs for all public methods.

## Instructions

When the user invokes `/generate-tests [ClassName] [--framework xunit|nunit]`, you should:

1. **Parse arguments:**
   - Extract ClassName (required)
   - Extract framework flag (optional, defaults to xunit)
   - Validate framework is either xunit or nunit

2. **Locate the class:**
   - Search for `[ClassName].cs` in the project
   - If multiple matches, ask user to specify path
   - If not found, report error

3. **Analyze the class:**
   - Read the class file
   - Identify all public methods
   - Note method signatures (parameters, return types)
   - Identify dependencies for mocking

4. **Generate test file:**
   - Create test class name: `[ClassName]Tests`
   - Use appropriate test framework syntax
   - Generate test method for each public method
   - Include setup/teardown if dependencies exist
   - Add using statements
   - Add XML documentation

5. **Write test file:**
   - Location: `tests/[ClassName]Tests.cs` or alongside source
   - Create test directory if it doesn't exist
   - Confirm write location with user if ambiguous

6. **Report results:**
   - Confirm test file creation
   - List test methods generated
   - Provide instructions to run tests

## Arguments

- `ClassName` (required): Name of the class to generate tests for (e.g., UserService)
- `--framework` (optional): Test framework to use, either `xunit` or `nunit`, defaults to `xunit`

## Examples

**Basic usage (xUnit):**
\```
/generate-tests UserService
\```

**Specify framework:**
\```
/generate-tests ProductService --framework nunit
\```

Expected output:
\```
Generating tests for UserService...

Found class: src/Services/UserService.cs
Public methods: 5

Generated: tests/UserServiceTests.cs
Test methods:
- GetUserById_ValidId_ReturnsUser
- GetUserById_InvalidId_ReturnsNull
- CreateUser_ValidUser_ReturnsSuccess
- UpdateUser_ValidUser_ReturnsSuccess
- DeleteUser_ValidId_ReturnsSuccess

Run tests: dotnet test tests/UserServiceTests.cs
\```

## Error Handling

**If class not found:**
- Error: "Class 'UserService' not found in project"
- Suggest: "Check class name spelling or specify full namespace"
- Option: "Search for similar class names?"

**If multiple classes found:**
- List all matches with paths
- Ask user to specify which one
- Provide command with path: `/generate-tests Namespace.ClassName`

**If test file already exists:**
- Warning: "Test file tests/UserServiceTests.cs already exists"
- Ask: "Overwrite, append, or cancel?"
- Wait for user decision

**If invalid framework specified:**
- Error: "Framework must be 'xunit' or 'nunit', got '[value]'"
- Show correct usage
- Do not proceed

## Notes

- Test methods follow naming convention: MethodName_Scenario_ExpectedResult
- Includes TODO comments for test implementation
- Dependencies are identified and marked for mocking
- XML documentation is generated for each test
- Related skill: `test-coverage` for analyzing existing test coverage
```

---

## Best Practices

### Naming Conventions

**Do:**
- Use descriptive, verb-noun patterns: `/add-module`, `/generate-docs`
- Use lowercase with hyphens: `/format-params`
- Make purpose immediately clear: `/run-tests`

**Don't:**
- Use abbreviations: `/fmt` instead of `/format`
- Use underscores: `/add_module`
- Use camelCase or PascalCase: `/AddModule`
- Create overly long names: `/add-new-iot-edge-module-with-dockerfile`

### Documentation Quality

**Do:**
- Start with a brief (1-2 sentence) description
- Use numbered steps in instructions
- Include complete argument documentation
- Provide multiple usage examples
- Handle errors gracefully with helpful messages

**Don't:**
- Write vague or ambiguous instructions
- Assume user knowledge
- Skip error handling
- Forget to document optional arguments
- Leave out examples

### Argument Design

**Do:**
- Put required arguments first
- Use clear, descriptive argument names
- Document expected formats
- Provide sensible defaults for optional arguments
- Show how to handle spaces and special characters

**Don't:**
- Create commands with too many arguments (>4)
- Use unclear abbreviations
- Make argument order confusing
- Forget to validate inputs
- Assume argument types

### Error Messages

**Do:**
- Explain what went wrong
- Suggest corrective actions
- Provide examples of correct usage
- Link to related documentation
- Continue gracefully when possible

**Don't:**
- Just say "Error"
- Use technical jargon
- Leave users stuck
- Crash without explanation
- Give up on first error

### Command Scope

**Do:**
- Keep commands focused on one task
- Make commands quick to execute
- Use skills for complex workflows
- Provide escape hatches to related skills
- Consider frequency of use

**Don't:**
- Try to do too much in one command
- Create commands that need multiple steps of user interaction
- Duplicate skill functionality
- Create commands for rare operations

---

## Next Steps

- Review [Plugin Development Guide](plugin-development.md) for creating complete plugins
- Study [Skill Creation Guide](skill-creation.md) for more complex workflows
- Check existing commands in [code-refactoring](../../.claude/plugins/code-refactoring/commands/) and [azure-iot](../../.claude/plugins/azure-iot/commands/) plugins
- Explore [Command Reference](../reference/plugin-structure.md#commands) for technical specifications

---

**Ready to create your first command?** Add a command file to your plugin's `commands/` directory and start coding!
