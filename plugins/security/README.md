# Security Plugin

Security best practices and OWASP Top 10 guidelines for secure coding across all languages and frameworks.

## Overview

This plugin provides background knowledge skills that help AI coding agents write secure code by default. Skills are automatically loaded when security-relevant code is being written or reviewed.

## Install

In Claude Code 2.1.275 or newer:

```text
/plugin install security --marketplace atc-net/atc-agentic-toolkit
```

In GitHub Copilot CLI, or an older Claude Code, add the marketplace first:

```text
/plugin marketplace add atc-net/atc-agentic-toolkit
/plugin install security@atc-agentic-toolkit
```

For VS Code, see the [Quick Start](../../README.md#-quick-start).

## Skills

### security-owasp

Comprehensive secure coding guidelines based on the OWASP Top 10 and industry best practices. Covers Broken Access Control, SSRF, Cryptographic Failures, Injection (SQL, XSS, command injection), Security Misconfiguration, Vulnerable Components, Authentication and Session Management failures, and Insecure Deserialization.

This skill is automatically loaded as background knowledge — it does not appear in the `/` menu.

## License

MIT
