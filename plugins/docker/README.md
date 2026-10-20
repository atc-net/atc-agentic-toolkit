# Docker Plugin

Docker and containerization best practices covering Dockerfile optimization, multi-stage builds, security, and orchestration.

## Overview

This plugin provides background knowledge skills that help AI coding agents create optimized, secure Docker images and container configurations. Skills are automatically loaded when working with Dockerfiles, docker-compose files, and container-related code.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install docker --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install docker@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### docker-conventions

Comprehensive Docker best practices including multi-stage builds, base image selection, layer optimization, .dockerignore usage, non-root users, health checks, security scanning, resource limits, and orchestration patterns.

This skill is automatically loaded as background knowledge — it does not appear in the `/` menu.

## License

MIT
