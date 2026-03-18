---
name: markdown-conventions
description: >
  Markdown formatting conventions covering heading hierarchy, code blocks, tables, lists,
  links, images, and accessibility best practices. Apply this skill whenever writing or
  editing .md files -- including READMEs, documentation pages, changelogs, or any markdown
  content -- even if the user does not explicitly mention "markdown formatting." Also apply
  when reviewing markdown for consistency, readability, or accessibility concerns such as
  missing alt text or non-descriptive link text.
user-invocable: false
---

# Markdown Conventions

Apply these conventions when writing, editing, or reviewing markdown files to ensure consistent, readable, and accessible content.

## Heading Hierarchy

Use H2 (`##`) and H3 (`###`) for document structure. H1 is reserved for the document title (typically generated automatically from metadata or filename) -- never add an H1 inside the body.

If you find yourself reaching for H4 (`####`) or deeper, that is a signal the document structure is too nested. Restructure by splitting into separate sections or files instead.

```markdown
## Main Section
Content here.

### Subsection
More detail here.
```

## Lists

Use `-` for unordered (bullet) lists and `1.` for ordered (numbered) lists. Indent nested items with 2 spaces:

```markdown
- First item
  - Nested item
  - Another nested item
- Second item

1. Step one
2. Step two
   1. Sub-step
```

Keep list items parallel in grammatical structure -- if one item starts with a verb, they all should.

## Code Blocks

Use fenced code blocks (triple backticks) with a language identifier for syntax highlighting. This helps both readers and tooling parse the content correctly:

````markdown
```csharp
var result = await service.GetDataAsync(cancellationToken);
```
````

Use inline code (single backticks) for short references to code elements within prose, such as method names, variable names, or file paths.

## Links

Use descriptive link text that makes sense out of context -- screen readers often navigate by links alone, so "click here" or "this page" convey no meaning:

```markdown
<!-- Good -->
See the [contributing guidelines](CONTRIBUTING.md) for details.

<!-- Avoid -->
Click [here](CONTRIBUTING.md) for details.
```

Ensure all URLs are valid and point to the intended target.

## Images

Always include alt text that describes the image content for accessibility. The alt text should convey what the image shows, not just repeat the filename:

```markdown
![Architecture diagram showing the request flow from API gateway to microservices](docs/images/architecture.png)
```

## Tables

Use markdown tables with pipe (`|`) syntax. Include a header row and alignment indicators:

```markdown
| Name       | Type     | Description          |
|------------|----------|----------------------|
| id         | integer  | Unique identifier    |
| status     | string   | Current state        |
```

Keep columns aligned in the source for readability. For data that would create very wide tables, consider restructuring as a definition list or separate subsections instead.

## Whitespace and Line Length

- Insert a blank line before and after headings, code blocks, tables, and lists
- Avoid multiple consecutive blank lines
- Break paragraph text at a reasonable line length (~80-120 characters) to keep diffs clean and source readable
- Do not add trailing whitespace at the end of lines

## General Principles

- **Consistency**: maintain uniform formatting throughout the document -- same heading levels, same list markers, same code fence style
- **Accessibility**: always provide alt text for images and descriptive text for links
- **Readability**: keep the raw markdown source clean and easy to scan, not just the rendered output
