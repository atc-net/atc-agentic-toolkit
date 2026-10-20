# Marketplace Configuration Reference

A `marketplace.json` file lists the plugins a repository offers and where to fetch each one. This
repository has two: one for Claude Code and one for GitHub Copilot.

The full specification is in the official docs:
[Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces) and the
[marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference).

---

## This Repository's Files

| File | Read by | Lists |
|------|---------|-------|
| `.claude-plugin/marketplace.json` | Claude Code | Every plugin: skill plugins, the `hooks` plugin and the mods |
| `.github/plugin/marketplace.json` | GitHub Copilot | Skill plugins only |

Both files use the marketplace name `atc-agentic-toolkit`, so users install with
`<plugin>@atc-agentic-toolkit` in either tool.

The split works because of lookup order:

- Claude Code reads `.claude-plugin/marketplace.json`.
- Copilot checks `marketplace.json`, `.plugin/marketplace.json`, `.github/plugin/marketplace.json` and
  `.claude-plugin/marketplace.json`, in that order, and uses the first it finds.

Copilot therefore reads the skill-only file and never sees the mods. If `.github/plugin/marketplace.json`
were deleted, Copilot would fall back to the Claude file and list plugins it can't run.

### What goes where

- **Skill plugin**: add the same entry (`name`, `source`, `description`) to both files.
- **Mod** (`plugins/atc-*`): add it only to `.claude-plugin/marketplace.json`. Mods need Claude Code
  2.1.287 or newer, and Copilot doesn't load them.
- **Hooks plugin** (`.claude/plugins/hooks`): only in `.claude-plugin/marketplace.json`. Copilot CLI
  supports plugin hooks, but this plugin is built for Claude Code's events, so the repository keeps it
  Claude-only.

### Current structure

The Claude file, shortened:

```json
{
  "name": "atc-agentic-toolkit",
  "version": "3.4.0",
  "description": "Skills, agents and MCP servers for .NET, Azure, web, data and DevOps work, plus Claude Code mods that add live UI and safety checks",
  "owner": { "name": "atc-net" },
  "plugins": [
    {
      "name": "dotnet",
      "source": "./plugins/dotnet",
      "description": "C#/.NET development skills including refactoring, testing, async patterns, documentation, and NuGet management"
    },
    {
      "name": "hooks",
      "source": "./.claude/plugins/hooks",
      "description": "Automation hooks for Claude Code sessions - notifications and workflow enhancements"
    },
    {
      "name": "atc-progress",
      "source": "./plugins/atc-progress",
      "description": "Mod (Claude Code 2.1.287+): implementation-plan progress bar above the prompt and a live subagents pane ..."
    }
  ]
}
```

The Copilot file has the same `name`, `version` and `owner`, and only the skill plugin entries.

Conventions here:

- Entries carry only `name`, `source` and `description`. The version lives in each plugin's own
  manifest.
- A mod's description starts with `Mod (Claude Code 2.1.287+):`.
- Keep the marketplace `version` the same in both files.

---

## Top-Level Fields

`name`, `owner` and `plugins` are required.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Marketplace identifier: letters, digits, `.`, `_` and `-`, starting with a letter or digit. Users type it after `@` when they install. Names that look like Anthropic's official marketplaces are reserved |
| `owner` | Object | `name` (required), `email`, `url` |
| `plugins` | Array | Plugin entries. Each entry is validated on its own, so one bad entry doesn't break the rest |
| `description` | String | Shown to users. `claude plugin validate` warns when it's missing |
| `version` | String | The marketplace manifest's version |
| `metadata.description`, `metadata.version` | String | Alternative location for `description` and `version` |
| `metadata.pluginRoot` | String | Folder that bare source names resolve under, so `"source": "dotnet"` can mean `./plugins/dotnet`. Needs Claude Code 2.1.239+ |
| `$schema` | String | JSON Schema URL for editors. Ignored at load time |
| `forceRemoveDeletedPlugins` | Boolean | When `true`, a plugin you remove from `plugins` is uninstalled from users' machines |
| `renames` | Object | Maps a former plugin name to its new name, or to `null` for a removed plugin |
| `allowCrossMarketplaceDependenciesOn` | Array | Other marketplaces whose plugins may be installed as dependencies of this one's plugins |

Claude Code ignores an unknown key, so a typo loads silently. `claude plugin validate` reports it as a
warning.

---

## Plugin Entry Fields

`name` and `source` are required.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Install id before the `@`. Keep it the same as the plugin's own `name` |
| `source` | String or object | Where to fetch the plugin. See [Source Types](#source-types) |
| `description` | String | Shown in `/plugin` listings |
| `version` | String | Plugin version. When `plugin.json` also sets one, `plugin.json` wins and validation warns |
| `category` | String | Free-form category |
| `tags` | Array | Free-form search tags |
| `strict` | Boolean | Default `true`. See [Strict Mode](#strict-mode) |
| `displayName` | String | Name shown in the UI |
| `defaultEnabled` | Boolean | Default `true`. Overrides the plugin's own value |
| `dependencies` | Array | Plugins that must be enabled for this one to work |
| `author`, `homepage`, `repository`, `license`, `keywords` | | Display fields. A value set on the entry wins over the plugin's own |

An entry also accepts every `plugin.json` field, such as `commands`, `agents`, `hooks`,
`mcpServers` and `userConfig`. When the plugin has no `.claude-plugin/plugin.json`, the entry *is* the
manifest for Claude Code. That is the case for this repository's skill plugins, because Claude Code
doesn't read their root `plugin.json`.

### Strict mode

`strict` matters only when the plugin has its own `.claude-plugin/plugin.json` and the entry also
declares components (`commands`, `agents`, `skills`, `hooks`, `outputStyles`, `themes`).

| `strict` | Result |
|----------|--------|
| `true` (default) | `plugin.json` is the authority. Entry components are added to it; entry `hooks` replace the manifest's hooks for the same event |
| `false` | Declaring components in both places is a conflict, and the plugin fails to load |

With no `plugin.json`, `strict` has no effect.

---

## Source Types

| Type | Fields | Use it for |
|------|--------|------------|
| Relative path | The string, such as `"./plugins/dotnet"` | A folder inside this repository. Resolves from the repository root (the folder that holds `.claude-plugin/`), must start with `./`, and can't contain `..`. Every entry here uses this |
| `github` | `repo`, `ref`, `sha` | A GitHub repository, as `owner/repo` |
| `url` | `url`, `ref`, `sha` | Any git repository by URL |
| `git-subdir` | `url`, `path`, `ref`, `sha` | One folder of another git repository, fetched with a sparse checkout |
| `npm` | `package`, `version`, `registry` | An npm package. Install scripts don't run |
| `archive` | `url`, `sha256` | A zip over HTTPS. Needs Claude Code 2.1.224+ |
| `command` | `command`, `timeout`, `mode` | A folder printed by a command on the user's machine. Needs Claude Code 2.1.229+ |

`ref` is a branch or tag. `sha` is a full 40-character commit SHA and wins over `ref`.

```json
{
  "name": "formatter",
  "source": {
    "source": "github",
    "repo": "your-org/formatter",
    "ref": "v2.0.0"
  }
}
```

Copilot supports relative paths and GitHub or git URL sources.

---

## Versions

For a relative-path plugin in a git-hosted marketplace, Claude Code uses the first of:

1. `version` in the plugin's `.claude-plugin/plugin.json`
2. `version` in the marketplace entry
3. The git commit SHA

As far as Claude Code is concerned, the skill plugins here have neither of the first two, so each pushed
commit is a new version. Mods set `version`, so users stay on a release until it changes.

Updates aren't automatic. Auto-update is off by default for marketplaces that aren't Anthropic's, so
users run `claude plugin update <plugin>@atc-agentic-toolkit`, or turn on auto-update in `/plugin`
under **Marketplaces**.

---

## Validate

```bash
claude plugin validate .                                  # .claude-plugin/marketplace.json
claude plugin validate .github/plugin/marketplace.json    # the Copilot file
```

Validation checks JSON syntax, required fields, names, `..` in sources, unknown keys, and the
`.claude-plugin/plugin.json` of each relative-path plugin. It doesn't open the skill files of the
plugins it lists, so validate each changed plugin folder too:
`claude plugin validate plugins/<name>`. A source folder that doesn't exist passes validation and
fails only at install.

---

## Install Commands

| Tool | Command |
|------|---------|
| Claude Code 2.1.275+ (in a session) | `/plugin install <plugin> --marketplace atc-net/atc-agentic-toolkit` |
| Claude Code (in a session) | `/plugin marketplace add atc-net/atc-agentic-toolkit`, then `/plugin install <plugin>@atc-agentic-toolkit` |
| Claude Code (shell) | `claude plugin marketplace add atc-net/atc-agentic-toolkit`, then `claude plugin install <plugin>@atc-agentic-toolkit` |
| GitHub Copilot CLI | `copilot plugin marketplace add atc-net/atc-agentic-toolkit`, then `copilot plugin install <plugin>@atc-agentic-toolkit` |

To check the install path from a branch, add the marketplace as `atc-net/atc-agentic-toolkit#<branch>`.
A user can register only one marketplace per name, so the existing one has to go first, and removing a
marketplace uninstalls its plugins and deletes their data, options and secrets. For everyday testing,
load the plugin with `claude --plugin-dir` instead.

---

## Related Documentation

- [Plugin Development Guide](../guides/plugin-development.md) - Creating and registering plugins
- [Plugin Structure Reference](plugin-structure.md) - Directory layout and manifest fields
- [GitHub Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
