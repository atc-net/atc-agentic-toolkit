# GitHub Plugin

GitHub platform skills including CI/CD workflow conventions for GitHub Actions and GitHub issue management.

## Overview

This plugin provides skills for working with GitHub platform features beyond basic git operations.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install github --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install github@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### github-actions-conventions

Best practices and conventions for GitHub Actions CI/CD workflows. Covers workflow structure, jobs, steps, triggers, secret management, OIDC authentication, caching, matrix strategies, testing, deployment strategies, and security hardening.

This skill is automatically loaded as background knowledge when working with GitHub Actions workflow files.

### github-issues

Create, update, and manage GitHub issues with labels, assignees, milestones, issue types, and project fields.

## License

MIT
