# Git Plugin

Git workflow utilities including commit message generators and PR descriptions.

## Overview

This plugin provides skills for streamlining Git workflows.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install git --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install git@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### suggest-commit

Generate conventional commit message suggestions based on staged changes.

### suggest-pr

Generate PR titles and structured markdown summaries for pull requests.

## License

MIT
