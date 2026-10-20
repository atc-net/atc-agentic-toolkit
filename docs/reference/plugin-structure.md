# Plugin Structure Reference

Directory layout, manifest fields and file formats for plugins in this repository. For the
step-by-step workflow, see the [Plugin Development Guide](../guides/plugin-development.md).

## Directory Structure

### Skill plugin

```text
plugins/[plugin-name]/
├── plugin.json                        # Manifest read by GitHub Copilot (required)
├── README.md                          # Plugin documentation (required)
├── .mcp.json                          # MCP server configuration (optional)
├── skills/                            # Skill definitions
│   └── [skill-name]/
│       ├── SKILL.md                   # Skill definition (required)
│       ├── scripts/                   # Executable scripts (optional)
│       ├── references/                # Reference documentation (optional)
│       └── assets/                    # Templates, images and other output files (optional)
├── agents/                            # Subagent definitions (optional)
│   └── [agent-name].md
└── commands/                          # Single-file commands, older format (optional)
    └── [command-name].md
```

### Mod

```text
plugins/atc-[name]/
├── .claude-plugin/
│   └── plugin.json                    # Claude Code manifest
├── hooks/
│   ├── hooks.json                     # { "modules": ["./register.tsx"] }
│   ├── register.tsx                   # Entry point (register.ts when there's no JSX)
│   └── *.test.ts(x)                   # Tests for `claude plugin test`
├── types/
│   └── index.d.ts                     # $.state contract (optional)
└── README.md
```

See the [Mod Anatomy Reference](mod-anatomy.md) for what each mod file contains.

### Hooks plugin

```text
.claude/plugins/hooks/
├── .claude-plugin/
│   └── plugin.json                    # Claude Code manifest
├── hooks/
│   └── hooks.json                     # Shell hooks under a top-level "hooks" key
├── play_sound.ps1, play_sound.py      # Scripts the hooks call
├── sounds/
└── README.md
```

---

## Manifest Files

A plugin manifest can be in one of two places. Which one a tool reads decides which fields take
effect.

| Location | Read by | Used here for |
|----------|---------|---------------|
| `plugin.json` at the plugin root | GitHub Copilot (second in its lookup order, after `.plugin/plugin.json`) | Skill plugins |
| `.claude-plugin/plugin.json` | Claude Code (its only manifest location), and Copilot as a last fallback | Mods and the hooks plugin |

Claude Code doesn't read a root `plugin.json`. For a skill plugin it finds `skills/` and `.mcp.json`
by their default locations, and the plugin's entry in `.claude-plugin/marketplace.json` serves as the
manifest. A field that only Claude Code understands, such as `userConfig`, must therefore go in
`.claude-plugin/plugin.json`.

### Root plugin.json (skill plugins)

Every skill plugin here uses the same four fields:

```json
{
  "name": "dotnet",
  "version": "1.3.0",
  "description": "C#/.NET development skills including refactoring, testing, async patterns, documentation, NuGet management, and Windows app development",
  "skills": "./skills/"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Kebab-case, at most 64 characters. Must match the folder name and the marketplace entry `name` |
| `version` | No | Semantic version. Copilot reads it; Claude Code doesn't |
| `description` | No | One sentence, at most 1,024 characters |
| `skills` | No | Path to the skills folder. Defaults to `skills/` |

Copilot also accepts `author`, `homepage`, `repository`, `license`, `keywords`, `category`, `tags`,
`agents`, `commands`, `hooks`, `mcpServers` and `lspServers` in this file. See the
[Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference).

### .claude-plugin/plugin.json (mods and hooks plugin)

`name` is the only required field. The fields below are the ones a plugin author is likely to set.
The [plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) has the full list.

| Field | Type | Description |
|-------|------|-------------|
| `$schema` | String | JSON Schema URL for editor autocomplete. Ignored at load time |
| `name` | String | Plugin identifier in kebab-case. Every component is namespaced under it, so agent `reviewer` in `my-plugin` is `my-plugin:reviewer` |
| `displayName` | String | Name shown in the UI instead of `name` |
| `version` | String | Pins users to this version until you change it. Leave it out to let users track commits |
| `description` | String | Short explanation of what the plugin does |
| `author` | Object | `name` (required), `email`, `url` |
| `homepage` | String | Documentation URL. Must parse as a URL or the plugin fails to load |
| `repository` | String | Source repository URL |
| `license` | String | SPDX identifier such as `MIT` |
| `keywords` | Array | Discovery tags |
| `defaultEnabled` | Boolean | Whether the plugin starts enabled. Defaults to `true` |
| `dependencies` | Array | Plugins that must be enabled for this one to work: `"name"`, `"name@marketplace"` or `{ "name", "marketplace", "version" }` |
| `userConfig` | Object | Options Claude Code asks the user for. See [userConfig](#userconfig) |
| `types` | Path | A mod's `.d.ts` file that declares its `$.state` values |
| `skills` | Path or array | Extra skill folders. Adds to the default `skills/` scan |
| `commands` | Path, array or object | Command files or folders. Replaces the default `commands/` scan |
| `agents` | Path or array | Agent `.md` files (not folders). Replaces the default `agents/` scan |
| `hooks` | Path, object or array | Extra hook files or inline hooks. Merged with `hooks/hooks.json` |
| `mcpServers` | Path, object or array | Extra MCP config. Merged with `.mcp.json` |
| `lspServers` | Path, object or array | LSP server config. Merged with `.lsp.json` |
| `outputStyles` | Path or array | Output style files or folders. Replaces the default `output-styles/` scan |

Path rules:

- Every component path is relative to the plugin root and starts with `./`.
- A path must exist and stay inside the plugin root. `..` fails validation.
- Use forward slashes. On macOS and Linux a path with a backslash doesn't load.

An unknown top-level field is stripped, and `claude plugin validate` warns about it. An unknown key
inside a `userConfig` option is an error, and the plugin doesn't load.

This is the `atc-blast-radius` mod's manifest:

```json
{
  "name": "atc-blast-radius",
  "version": "0.1.0",
  "description": "Claude Code mod: holds a risky shell command ... Requires Claude Code 2.1.287+.",
  "author": { "name": "atc-net" },
  "homepage": "https://github.com/atc-net/atc-agentic-toolkit/tree/main/plugins/atc-blast-radius",
  "repository": "https://github.com/atc-net/atc-agentic-toolkit",
  "keywords": ["mod", "safety", "shell", "git"]
}
```

### userConfig

Each key is an option name (letters, digits and `_`, not starting with a digit). Each value is an
object with these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `string`, `number`, `boolean`, `directory` or `file` |
| `title` | Yes | Label in the configuration dialog |
| `description` | Yes | Help text under the field |
| `required` | No | `true` rejects an empty value |
| `default` | No | Value used when the user gives none |
| `options` | No | Fixed list of values for a `string`, shown as a picker in `/config`. Needs Claude Code 2.1.271+ |
| `multiple` | No | Lets a `string` hold a list |
| `sensitive` | No | Masks input and stores the value in the system credential store |
| `min` / `max` | No | Bounds for a `number` |

Saved values live under `pluginConfigs` in the user's `settings.json`. For a plugin loaded with
`--plugin-dir`, the key is `<name>@inline`. A plugin reads a value as `${user_config.KEY}` in MCP and
LSP config, in exec-form hook `args` and in skill and agent text. Hooks also get
`CLAUDE_PLUGIN_OPTION_<KEY>`, and a mod gets the values in `register(on, options)`.

---

## Required Files

### README.md (Plugin Root)

**Purpose:** What the plugin does and how to install it.

**Sections:** a one-line description, an overview, an **Install** section, one entry per skill, agent
or MCP server, requirements if any, and the license. A mod's README starts with its Claude Code
2.1.287 requirement.

~~~markdown
# My Plugin

One-line description.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install my-plugin --marketplace atc-net/atc-agentic-toolkit
```

## Skills

### my-skill

What the skill does and when Claude loads it. Run it directly with `/my-plugin:my-skill`.

## License

MIT
~~~

See [plugins/bicep/README.md](../../plugins/bicep/README.md) for a complete one.

---

## Optional Files

### .mcp.json (Plugin Root)

**Purpose:** MCP servers that start when the plugin is enabled. There's no separate setup step.

- Same shape as a project `.mcp.json`. Supports `stdio`, `http` and `sse` servers.
- In `/mcp` a server shows as `plugin:<plugin>:<server>`. Its tools are named
  `mcp__plugin_<plugin>_<server>__<tool>`; use that name in permission rules and hook matchers.
- `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` are substituted in `command`, `args` and `env`.
- Copilot reads `.mcp.json` too.

**Example: remote HTTP server** (from the `azure` plugin):

```json
{
  "mcpServers": {
    "microsoftdocs": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp"
    }
  }
}
```

**Example: local stdio server:**

```json
{
  "mcpServers": {
    "database-tools": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": { "DB_URL": "${DB_URL}" }
    }
  }
}
```

**Reference:** [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)

### hooks/hooks.json

**Purpose:** Hooks that register when the plugin loads.

- **Shell hooks** go under a top-level `"hooks"` key, in the same shape as `hooks` in
  `settings.json`. A file with the event map but no `"hooks"` wrapper fails to load. The hooks plugin's
  file also has a `"description"` key beside `"hooks"`.
- **A mod** lists its TypeScript entry point under `"modules"`:
  `{ "modules": ["./register.tsx"] }`. The path is relative to `hooks.json`. The same file can also
  hold shell hooks under `"hooks"`.

```json
{
  "description": "Audio notification hooks for Claude Code",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/notify.js"] }
        ]
      }
    ]
  }
}
```

For events and handler types, see the [hooks reference](https://code.claude.com/docs/en/hooks). For
mods, see the [Mod Anatomy Reference](mod-anatomy.md).

---

## Optional Directories

### skills/

**Purpose:** Skill definitions.

**Structure:** One folder per skill, each with a `SKILL.md`.

**Naming:** Lowercase with hyphens (e.g., `csharp-async`, `skill-creator`)

**Invocation:** Claude loads a skill when its description matches. Users run it as `/<plugin>:<skill>`.

**Contents:** See [Skill Anatomy Reference](skill-anatomy.md)

### agents/

**Purpose:** Subagent definitions. Each subagent runs in its own context window with its own tools.

**Structure:** One Markdown file per subagent: YAML frontmatter, then a free-form system prompt.

**Naming:** Lowercase with hyphens (e.g., `security-reviewer.md`)

**Invocation:** Plugin subagents are named `<plugin>:<name>`. Claude delegates to them when a task
matches the description, or you call one with `@agent-<plugin>:<name>`.

**Format:**

```markdown
---
name: security-reviewer
description: Reviews code changes for security issues. Use after edits to authentication or input handling.
tools: Read, Grep, Glob
model: inherit
---

You are a security reviewer. Read the changed files and report injection, authentication and
secrets-handling risks.
```

Plugin subagents ignore `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`. No plugin in
this repository ships an `agents/` folder yet. For every field, see the
[Agent Anatomy Reference](agent-anatomy.md).

### commands/

**Purpose:** Single-file slash commands. This is the older format; skills replace it for new work.

**Structure:** One Markdown file per command.

**Naming:** The file name is the command name. `format-params.md` in `my-plugin` runs as
`/my-plugin:format-params`. A subfolder adds a segment: `commands/db/migrate.md` is
`/my-plugin:db:migrate`.

**Format:** The same frontmatter as a skill, then the instructions. `$ARGUMENTS` holds what the user
typed after the command.

~~~markdown
---
description: Format method parameters one per line
argument-hint: [file]
---

# Format Parameters

Format the parameters in $ARGUMENTS so each one is on its own line.

## Steps

1. Read the file.
2. Reformat each method signature with more than two parameters.
3. Report the methods you changed.
~~~

See the [Command Creation Guide](../guides/command-creation.md).

---

## File Naming Conventions

### Plugins

- **Directory name:** Lowercase with hyphens
- **Examples:** `dotnet`, `azure`, `cosmosdb`
- **Mods:** `atc-<name>`, such as `atc-progress`
- **Avoid:** Underscores, spaces, and names starting with `claude-` or `anthropic-` (validation rejects them)

### Skills

- **Directory name:** Lowercase with hyphens
- **SKILL.md:** Always uppercase, exactly `SKILL.md`
- **Examples:** `csharp-async/`, `skill-creator/`

### Agents

- **File name:** Lowercase with hyphens, `.md` extension
- **Name the job:** `security-reviewer.md`, not `agent1.md`

### Commands

- **File name:** Lowercase with hyphens, `.md` extension
- **The file name is the command name:** `/my-plugin:add-module` comes from `add-module.md`

### Scripts

- **File name:** Descriptive, lowercase with underscores for multi-word
- **Extension:** Matches language (`.py`, `.ps1`, `.js`, etc.)
- **Examples:** `init_skill.py`, `play_sound.py`

### References

- **File name:** Descriptive, lowercase with hyphens
- **Extension:** `.md`
- **Examples:** `database-schema.md`, `api-endpoints.md`

### Assets

- **File name:** Descriptive, appropriate for asset type
- **Examples:** `logo.png`, `template.html`, `boilerplate/`

---

## Marketplace Registration

**Files:**

- `.claude-plugin/marketplace.json` (Claude Code): every plugin, including mods and the hooks plugin
- `.github/plugin/marketplace.json` (GitHub Copilot): skill plugins only

**Entry:**

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "One-sentence plugin description"
}
```

See [Marketplace Config Reference](marketplace-config.md) for every field.

---

## Environment Variables

Claude Code substitutes these in hook commands, MCP and LSP config, and skill and agent text. Hook
processes also get them in their environment.

| Variable | Resolves to |
|----------|-------------|
| `${CLAUDE_PLUGIN_ROOT}` | The installed plugin folder. It changes on every update, so don't store state there |
| `${CLAUDE_PLUGIN_DATA}` | `~/.claude/plugins/data/<id>/`. Kept across updates; use it for caches and installed dependencies |
| `${CLAUDE_PROJECT_DIR}` | The project root |

These variables aren't set for commands Claude runs through the Bash tool.

---

## Best Practices

### Organization

- **Group related skills** in one plugin
- **Keep plugins focused** on one domain
- **Use clear names** that say what the plugin covers

### Documentation

- **Complete README.md**: document every skill, agent and MCP server
- **Install section**: show the one-step and two-step install
- **Clear requirements**: list tools the plugin expects, such as the .NET SDK or Node.js

### File Structure

- **Flat skills directory**: don't nest skills in subdirectories
- **Clean references**: remove reference files nothing links to
- **Minimal scripts**: bundle only scripts the skill actually runs
- **Cross-platform**: scripts and hooks must work on Windows, macOS and Linux

---

## Example: Complete Plugin

```text
plugins/api-documentation/
├── plugin.json
├── README.md
├── .mcp.json
├── skills/
│   ├── generate-openapi/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   └── generate_spec.py
│   │   ├── references/
│   │   │   └── common-patterns.md
│   │   └── assets/
│   │       └── openapi-template.json
│   └── validate-api-contract/
│       ├── SKILL.md
│       └── references/
│           └── validation-rules.md
└── agents/
    └── api-reviewer.md
```

- `generate-openapi` runs as `/api-documentation:generate-openapi` and loads its references on demand.
- `api-reviewer` is a subagent named `api-documentation:api-reviewer`.
- `.mcp.json` starts any MCP servers the skills rely on.

---

## Size Guidelines

- **Plugin README:** short. Link to the skills for detail.
- **SKILL.md body:** under 500 lines. Move detail into `references/`, which load only when needed. See
  [Progressive Disclosure and Size Limits](skill-anatomy.md#progressive-disclosure-and-size-limits).
- **Scripts:** one job per script.

---

## Validation

Run these before you open a pull request:

```bash
claude plugin validate plugins/my-plugin          # skills, agents, commands, manifest, hooks.json
claude plugin validate .                          # .claude-plugin/marketplace.json
claude plugin validate .github/plugin/marketplace.json
claude plugin test plugins/atc-my-mod             # a mod's tests
```

Add `--strict` to fail on warnings. Then check:

- [ ] README.md exists and lists every component
- [ ] Every `SKILL.md` and agent file has valid YAML frontmatter (a file that doesn't parse loads with
      every field dropped)
- [ ] Folder name, manifest `name` and marketplace entry `name` match
- [ ] References are linked from `SKILL.md`
- [ ] Scripts run on Windows, macOS and Linux
- [ ] The plugin is registered in the right marketplace files

---

## Resources

- [Skill Anatomy Reference](skill-anatomy.md)
- [Agent Anatomy Reference](agent-anatomy.md)
- [Mod Anatomy Reference](mod-anatomy.md)
- [Marketplace Config Reference](marketplace-config.md)
- [Plugin Development Guide](../guides/plugin-development.md)
- [Skill Creation Guide](../guides/skill-creation.md)
- [Agent Creation Guide](../guides/agent-creation.md)
- [Command Creation Guide](../guides/command-creation.md)
- Official docs: [Plugin manifest reference](https://code.claude.com/docs/en/plugins-reference) ·
  [Plugin components](https://code.claude.com/docs/en/plugins/components)
