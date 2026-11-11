# Common Plugin

Common base skills, plugins, commands etc.

## Overview

This plugin provides foundational skills and utilities shared across projects.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install common --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install common@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## MCP Servers

This plugin bundles the Context7 MCP server that starts automatically when the plugin is enabled.

### Context7

Documentation context server that provides up-to-date library documentation directly in your prompts. No API keys required.

- Resolves library identifiers and fetches relevant, version-specific documentation

Source: [@upstash/context7-mcp](https://www.npmjs.com/package/@upstash/context7-mcp)

### Draw.io

Professional diagramming with 10,000+ shapes including AWS, Azure, GCP, Kubernetes, and UML icons.

- Open diagrams from XML, CSV, or Mermaid syntax
- Full draw.io editor with export capabilities

Requires: Node.js

Source: [@drawio/mcp](https://www.npmjs.com/package/@drawio/mcp)

### Mermaid

Text-to-diagram generation supporting flowcharts, sequence diagrams, class diagrams, ER diagrams, and more.

- Generate diagrams from Mermaid syntax as PNG, SVG, or base64
- Configurable themes and backgrounds

Requires: Node.js

Source: [mcp-mermaid](https://www.npmjs.com/package/mcp-mermaid)

## Skills

### interview

Conducts structured interviews for requirements gathering.

### skill-creator

Creates and improves skills with you: it drafts the `SKILL.md`, runs test prompts with and without the skill, grades and benchmarks the results, and tunes the description so the skill triggers when it should. Ask Claude to "create a skill for …" or "improve the … skill", or run `/common:skill-creator`.

Its scripts also work on their own. Run them from the repository root.

Check a skill's frontmatter (name, description and the allowed fields):

```bash
python plugins/common/skills/skill-creator/scripts/quick_validate.py plugins/dotnet/skills/csharp-xunit
```

Check every skill in the repository:

```bash
# Bash, Git Bash or zsh
python plugins/common/skills/skill-creator/scripts/quick_validate.py plugins/*/skills/*/
```

```powershell
# PowerShell
python plugins/common/skills/skill-creator/scripts/quick_validate.py (Get-ChildItem plugins/*/skills/* -Directory)
```

The check accepts the Agent Skills standard's fields and the ones Claude Code adds, such as `user-invocable`. Add `--strict` to accept only the standard's fields, as a claude.ai upload needs. `python -m scripts.package_skill <skill folder>`, run from the skill-creator folder, packages a skill as a `.skill` file for upload, and it always checks strictly.

### create-agentsmd

Generate an AGENTS.md file for a repository.

### create-assessment-report

Assess a repository as a product and write an Assessment & Roadmap report to `plans/assessment-roadmap.md`: a competitive analysis against named alternatives, new features, improvements, performance, bugs and security, testing and documentation gaps, CI/CD and library concerns, and a sequenced roadmap with milestones.

```text
/common:create-assessment-report
/common:create-assessment-report focus on the TCP server
```

Or ask Claude to "assess this repository" or "make a roadmap for this repo".

- **Every finding has a stable ID** (`BUG-02`, `FEAT-01`), a priority (🔴 need, 🟡 nice, 🔵 maybe), a status, an effort (S, M, L) and evidence: a `path:line` in the repository, or a named competitor. Anything it couldn't verify is marked `⚠️ unverified`.
- **Run it again** to update the same report. IDs are kept, rejected items (❌) stay rejected, and a "Changed since last run" note says what moved.
- **atc-net repositories** are also checked against the atc-net pipeline standard. It first works out how the repository releases (one package or several, versioned together or apart, published from the release workflow or from a workflow per package) and then compares it with an atc-net reference repository of the same shape: release-please, Trusted Publishing, pinned actions and so on. Other repositories get a general CI/CD assessment instead.
- It uses the search, docs and package tools it has for competitor features, package versions and advisories, and says which ones it used.
- **Turn the roadmap into work** with [create-implementation-plan](#from-an-assessment-report-to-a-plan): plan a milestone, Do Next or a few findings, and the report follows the plan's progress.

For an architecture deep dive with refactored code, use [senior-engineer-audit](skills/senior-engineer-audit/SKILL.md) instead.

### create-implementation-plan

Create resumable implementation plan files in `plans/` for features, refactoring, or architecture changes, with per-phase verification and handoff summaries.

#### From an assessment report to a plan

The two skills work as a loop: assess, plan, implement, then assess again.

```text
/common:create-assessment-report             # 1. Assess: writes plans/assessment-roadmap.md
/common:create-implementation-plan vNext     # 2. Plan a milestone from the report's roadmap
/atc-progress continue                       # 3. Work through the plan (with the atc-progress mod)
/common:create-assessment-report             # 4. Assess again: what moved, what's new
```

In step 2, name what to plan:

| You type | The plan covers |
|----------|-----------------|
| `/common:create-implementation-plan vNext` | The findings in a milestone of the report's roadmap (`vNext`, `1.1`, `Later`, …) |
| `/common:create-implementation-plan Do Next` | The report's top 3 |
| `/common:create-implementation-plan Quick Wins` | The small items that could ship this week |
| `/common:create-implementation-plan BUG-02 BUG-03 TEST-01` | Exactly these findings |

The assessment skill offers this step itself when it finishes.

What the plan does with the findings:

- **Its phases follow the report's dependencies**, with tests before the fixes they cover. Each task says which finding it works on, in a `Finding` column, and the plan's front matter lists them all under `findings:`.
- **The report is updated as the work moves.** When the plan is written, its findings turn 🚧 with a link to the plan. When a finding's last task is done and verified, it turns ✅ with the date, and the commit once there is one. A finding that turns out to be wrong turns ❌, with the reason.
- **The next assessment sees all of this.** It keeps the IDs, confirms the ✅ findings in the code, and lists what changed since the last run.

Without the atc-progress mod, step 3 is a prompt such as `Continue implementing plans/feature-vnext-1.md`.

### create-llms

Create an llms.txt file from scratch based on repository structure.

### update-llms

Update an existing llms.txt file to reflect documentation changes.

### repo-story-time

Generate a comprehensive repository summary and narrative from commit history.

### excalidraw

Create, edit, and export Excalidraw diagrams using the bundled MCP server or direct JSON generation.

### markdown-to-html

Convert Markdown files to HTML using various tools and approaches.

## Requirements

- Node.js (for MCP servers)
- Python 3.x with PyYAML (`pip install pyyaml`), for the skill-creator scripts

## License

MIT
