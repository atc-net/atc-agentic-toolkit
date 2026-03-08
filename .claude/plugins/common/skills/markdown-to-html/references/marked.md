# Marked

## Prerequisites

- Node.js installed (for CLI or programmatic usage)
- Install marked globally for CLI: `npm install -g marked`
- Or install locally: `npm install marked`

## Quick Conversion Methods

### Method 1: CLI (Recommended for Single Files)

```bash
# Convert file to HTML
marked -i input.md -o output.html

# Convert string directly
marked -s "# Hello World"

# Output: <h1>Hello World</h1>
```

### Method 2: Node.js Script

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';

const markdown = readFileSync('input.md', 'utf-8');
const html = marked.parse(markdown);
writeFileSync('output.html', html);
```

### Method 3: Browser Usage

```html
<script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
<script>
  const html = marked.parse('# Markdown Content');
  document.getElementById('output').innerHTML = html;
</script>
```

---

## Step-by-Step Workflows

### Workflow 1: Single File Conversion

1. Ensure marked is installed: `npm install -g marked`
2. Run conversion: `marked -i README.md -o README.html`
3. Verify output file was created

### Workflow 2: Batch Conversion (Multiple Files)

Create a script `convert-all.js`:

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const inputDir = './docs';
const outputDir = './html';

readdirSync(inputDir)
  .filter(file => file.endsWith('.md'))
  .forEach(file => {
    const markdown = readFileSync(join(inputDir, file), 'utf-8');
    const html = marked.parse(markdown);
    const outputFile = basename(file, '.md') + '.html';
    writeFileSync(join(outputDir, outputFile), html);
    console.log(`Converted: ${file} → ${outputFile}`);
  });
```

Run with: `node convert-all.js`

### Workflow 3: Conversion with Custom Options

```javascript
import { marked } from 'marked';

// Configure options
marked.setOptions({
  gfm: true,           // GitHub Flavored Markdown
  breaks: true,        // Convert \n to <br>
  pedantic: false,     // Don't conform to original markdown.pl
});

const html = marked.parse(markdownContent);
```

### Workflow 4: Complete HTML Document

Wrap converted content in a full HTML template:

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';

const markdown = readFileSync('input.md', 'utf-8');
const content = marked.parse(markdown);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

writeFileSync('output.html', html);
```

---

## CLI Configuration

### Using Config Files

Create `~/.marked.json` for persistent options:

```json
{
  "gfm": true,
  "breaks": true
}
```

Or use a custom config:

```bash
marked -i input.md -o output.html -c config.json
```

### CLI Options Reference

| Option | Description |
|--------|-------------|
| `-i, --input <file>` | Input Markdown file |
| `-o, --output <file>` | Output HTML file |
| `-s, --string <string>` | Parse string instead of file |
| `-c, --config <file>` | Use custom config file |
| `--gfm` | Enable GitHub Flavored Markdown |
| `--breaks` | Convert newlines to `<br>` |
| `--help` | Show all options |

---

## Security Warning

Marked does NOT sanitize output HTML. For untrusted input, use a sanitizer:

```javascript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const unsafeHtml = marked.parse(untrustedMarkdown);
const safeHtml = DOMPurify.sanitize(unsafeHtml);
```

Recommended sanitizers:

- [DOMPurify](https://github.com/cure53/DOMPurify) (recommended)
- [sanitize-html](https://github.com/apostrophecms/sanitize-html)
- [js-xss](https://github.com/leizongmin/js-xss)

---

## Supported Markdown Flavors

| Flavor | Support |
|--------|---------|
| Original Markdown | 100% |
| CommonMark 0.31 | 98% |
| GitHub Flavored Markdown | 97% |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Special characters at file start | Strip zero-width chars: `content.replace(/^[\u200B\u200C\u200D\uFEFF]/,"")` |
| Code blocks not highlighting | Add a syntax highlighter like highlight.js |
| Tables not rendering | Ensure `gfm: true` option is set |
| Line breaks ignored | Set `breaks: true` in options |
| XSS vulnerability concerns | Use DOMPurify to sanitize output |

---

## Resources

- Official documentation: <https://marked.js.org/>
- Advanced options: <https://marked.js.org/using_advanced>
- Extensibility: <https://marked.js.org/using_pro>
- GitHub repository: <https://github.com/markedjs/marked>
