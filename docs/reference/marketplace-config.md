# Marketplace Configuration Reference

For complete documentation on `marketplace.json` configuration, see the official Claude Code documentation:

**[Plugin Marketplaces Documentation](https://code.claude.com/docs/en/plugin-marketplaces)**

---

## Quick Reference

**Location:** `.claude-plugin/marketplace.json`

**Purpose:** Register plugins for discovery and installation

**Basic Structure:**

```json
{
  "name": "marketplace-identifier",
  "version": "1.0.0",
  "owner": {
    "name": "owner-name",
    "email": "contact@example.com"
  },
  "metadata": {
    "description": "Marketplace description",
    "version": "1.0.0"
  },
  "repository": "https://github.com/org/repo",
  "plugins": [
    {
      "name": "plugin-name",
      "version": "1.0.0",
      "description": "One-sentence plugin description",
      "author": {
        "name": "Author Name"
      },
      "source": "./.claude/plugins/plugin-name",
      "category": "utilities",
      "keywords": ["keyword1", "keyword2"],
      "homepage": "https://github.com/org/repo",
      "repository": "https://github.com/org/repo",
      "license": "MIT",
      "strict": true
    }
  ]
}
```

---

## What You'll Find in the Official Documentation

The official Claude Code documentation provides complete specifications for:

- **Complete field specifications** - Detailed descriptions of all marketplace.json fields
- **Validation rules** - Requirements for valid marketplace configuration
- **Best practices** - Marketplace management and plugin registration guidelines
- **Versioning strategies** - Semantic versioning for plugins and marketplaces
- **Category options** - Available plugin categories
- **Strict mode** - Validation and enforcement options

---

## Related Documentation

- [Plugin Development Guide](../guides/plugin-development.md) - Creating and registering plugins
- [Plugin Structure Reference](plugin-structure.md) - Directory layout and organization

---

**For up-to-date technical specifications, always refer to the [official documentation](https://code.claude.com/docs/en/plugin-marketplaces).**
