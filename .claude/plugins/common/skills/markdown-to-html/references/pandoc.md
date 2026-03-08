# Pandoc Reference

Pandoc is a universal document converter that can convert between numerous markup formats, including Markdown, HTML, LaTeX, Word, and many more.

## Installation

### Windows

```powershell
# Using Chocolatey
choco install pandoc

# Using Scoop
scoop install pandoc

# Or download installer from https://pandoc.org/installing.html
```

### macOS

```bash
# Using Homebrew
brew install pandoc
```

### Linux

```bash
# Debian/Ubuntu
sudo apt-get install pandoc

# Fedora
sudo dnf install pandoc

# Or download from https://pandoc.org/installing.html
```

## Basic Usage

### Convert Markdown to HTML

```bash
# Basic conversion
pandoc input.md -o output.html

# Standalone document with headers
pandoc input.md -s -o output.html

# With custom CSS
pandoc input.md -s --css=style.css -o output.html
```

### Convert to Other Formats

```bash
# To PDF (requires LaTeX)
pandoc input.md -s -o output.pdf

# To Word
pandoc input.md -s -o output.docx

# To LaTeX
pandoc input.md -s -o output.tex

# To EPUB
pandoc input.md -s -o output.epub
```

### Convert from Other Formats

```bash
# HTML to Markdown
pandoc -f html -t markdown input.html -o output.md

# Word to Markdown
pandoc input.docx -o output.md

# LaTeX to HTML
pandoc -f latex -t html input.tex -o output.html
```

## Common Options

| Option | Description |
|--------|-------------|
| `-f, --from <format>` | Input format |
| `-t, --to <format>` | Output format |
| `-s, --standalone` | Produce standalone document |
| `-o, --output <file>` | Output file |
| `--toc` | Include table of contents |
| `--toc-depth <n>` | TOC depth (default: 3) |
| `-N, --number-sections` | Number section headings |
| `--css <url>` | Link to CSS stylesheet |
| `--template <file>` | Use custom template |
| `--metadata <key>=<value>` | Set metadata |
| `--mathml` | Use MathML for math |
| `--mathjax` | Use MathJax for math |
| `-V, --variable <key>=<value>` | Set template variable |

## Markdown Extensions

Pandoc supports many markdown extensions:

```bash
# Enable specific extensions
pandoc -f markdown+emoji+footnotes input.md -o output.html

# Disable specific extensions
pandoc -f markdown-pipe_tables input.md -o output.html

# Use strict markdown
pandoc -f markdown_strict input.md -o output.html
```

### Common Extensions

| Extension | Description |
|-----------|-------------|
| `pipe_tables` | Pipe tables (default on) |
| `footnotes` | Footnote support |
| `emoji` | Emoji shortcodes |
| `smart` | Smart quotes and dashes |
| `task_lists` | Task list checkboxes |
| `strikeout` | Strikethrough text |
| `superscript` | Superscript text |
| `subscript` | Subscript text |
| `raw_html` | Raw HTML passthrough |

## Templates

### Using Built-in Templates

```bash
# View default template
pandoc -D html

# Use custom template
pandoc --template=mytemplate.html input.md -o output.html
```

### Template Variables

```html
<!DOCTYPE html>
<html>
<head>
  <title>$title$</title>
  $for(css)$
  <link rel="stylesheet" href="$css$">
  $endfor$
</head>
<body>
$body$
</body>
</html>
```

## YAML Metadata

Include metadata in your markdown files:

```markdown
---
title: My Document
author: John Doe
date: 2025-01-28
abstract: |
  This is the abstract.
---

# Introduction

Document content here...
```

## Filters

### Using Lua Filters

```bash
pandoc --lua-filter=filter.lua input.md -o output.html
```

Example Lua filter (`filter.lua`):

```lua
function Header(el)
  if el.level == 1 then
    el.classes:insert("main-title")
  end
  return el
end
```

### Using Pandoc Filters

```bash
pandoc --filter pandoc-citeproc input.md -o output.html
```

## Batch Conversion

### Bash Script

```bash
#!/bin/bash
for file in *.md; do
  pandoc "$file" -s -o "${file%.md}.html"
done
```

### PowerShell Script

```powershell
Get-ChildItem -Filter *.md | ForEach-Object {
  $output = $_.BaseName + ".html"
  pandoc $_.Name -s -o $output
}
```

## Security Warning

Pandoc processes input faithfully. When converting untrusted markdown:

- Use `--sandbox` mode to disable external file access
- Validate input before processing
- Sanitize HTML output if displayed in browsers

```bash
# Run in sandbox mode for untrusted input
pandoc --sandbox input.md -o output.html
```

---

## Supported Markdown Flavors

| Flavor | Support |
|--------|---------|
| Pandoc Markdown | 100% (native) |
| CommonMark | Full (use `-f commonmark`) |
| GitHub Flavored Markdown | Full (use `-f gfm`) |
| MultiMarkdown | Partial |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PDF generation fails | Install LaTeX (MacTeX, MiKTeX, or texlive) |
| Encoding issues on Windows | Run `chcp 65001` before using pandoc |
| Missing standalone headers | Add `-s` flag for complete documents |
| Math not rendering | Use `--mathml` or `--mathjax` option |
| Tables not rendering | Ensure proper table syntax with pipes and dashes |

---

## Resources

- Getting started: <https://pandoc.org/getting-started.html>
- Official documentation: <https://pandoc.org/MANUAL.html>
- Extensibility: <https://pandoc.org/extras.html>
- GitHub repository: <https://github.com/jgm/pandoc>
