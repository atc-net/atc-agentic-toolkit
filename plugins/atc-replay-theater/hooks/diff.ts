import type { DiffLine, Step } from '../types'

/** Diff lines kept per step; the pane draws as many as fit. */
export const MAX_STORED_LINES = 40
/** Unchanged lines kept on each side of a change. */
const CONTEXT = 1
/** Above this many line pairs the changed middle isn't matched: it shows as removed, then added. */
const MAX_MATCH_CELLS = 250_000

/** Lines of a text with `\r\n` and `\r` read as `\n`, a final newline ignored and tabs as two spaces. */
export function splitLines(text: string): string[] {
  if (text === '') return []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines.map(line => line.replace(/\t/g, '  '))
}

const lineOf = (op: DiffLine['op']) => (text: string): DiffLine => ({ op, text })

/** The changed middle of two texts, matched line by line on their longest common subsequence. */
function matchMiddle(before: string[], after: string[]): DiffLine[] {
  if (before.length * after.length > MAX_MATCH_CELLS) return [...before.map(lineOf('-')), ...after.map(lineOf('+'))]
  const cols = after.length + 1
  // common[i * cols + j]: the length of the longest common subsequence of before[i..] and after[j..].
  const common = new Uint32Array((before.length + 1) * cols)
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      common[i * cols + j] =
        before[i] === after[j]
          ? (common[(i + 1) * cols + j + 1] ?? 0) + 1
          : Math.max(common[(i + 1) * cols + j] ?? 0, common[i * cols + j + 1] ?? 0)
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      out.push({ op: ' ', text: before[i++] ?? '' })
      j++
    } else if ((common[(i + 1) * cols + j] ?? 0) >= (common[i * cols + j + 1] ?? 0)) {
      out.push({ op: '-', text: before[i++] ?? '' })
    } else {
      out.push({ op: '+', text: after[j++] ?? '' })
    }
  }
  return [...out, ...before.slice(i).map(lineOf('-')), ...after.slice(j).map(lineOf('+'))]
}

/** Every line of the change from `before` to `after`, unchanged ones included. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = splitLines(before)
  const b = splitLines(after)
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
  return [
    ...a.slice(0, head).map(lineOf(' ')),
    ...matchMiddle(a.slice(head, a.length - tail), b.slice(head, b.length - tail)),
    ...a.slice(a.length - tail).map(lineOf(' ')),
  ]
}

/** Keeps the changes with CONTEXT unchanged lines around each; a run left out becomes one `~` line. */
export function trimContext(lines: readonly DiffLine[]): DiffLine[] {
  const changed = lines.map(line => line.op !== ' ')
  if (!changed.some(Boolean)) return []
  const isNear = (k: number) => changed.slice(Math.max(0, k - CONTEXT), k + CONTEXT + 1).some(Boolean)
  const out: DiffLine[] = []
  let isSkipping = false
  lines.forEach((line, k) => {
    if (!isNear(k)) {
      isSkipping = true
      return
    }
    if (isSkipping && out.length > 0) out.push({ op: '~', text: '⋯' })
    isSkipping = false
    out.push(line)
  })
  return out
}

/**
 * The whole lines an Edit changed, before and after, and the 1-based line they start on: the file's
 * text around the first place `oldText` is found. Null when it isn't in the text.
 */
export function editedLines(text: string, oldText: string, newText: string): { before: string; after: string; line: number } | null {
  const lf = (s: string) => s.replace(/\r\n?/g, '\n')
  const body = lf(text)
  const old = lf(oldText)
  const at = old === '' ? -1 : body.indexOf(old)
  if (at < 0) return null
  const start = at === 0 ? 0 : body.lastIndexOf('\n', at - 1) + 1
  const lineEnd = body.indexOf('\n', at + old.length)
  const end = lineEnd < 0 ? body.length : lineEnd
  const prefix = body.slice(start, at)
  const suffix = body.slice(at + old.length, end)
  return { before: prefix + old + suffix, after: prefix + lf(newText) + suffix, line: body.slice(0, start).split('\n').length }
}

/** One step of the replay, its diff counted in full and trimmed for drawing. */
export function stepOf(input: Omit<Step, 'added' | 'removed' | 'lines' | 'more'> & { before: string; after: string }): Step {
  const { before, after, ...rest } = input
  const all = diffLines(before, after)
  const shown = trimContext(all)
  return {
    ...rest,
    added: all.filter(line => line.op === '+').length,
    removed: all.filter(line => line.op === '-').length,
    lines: shown.slice(0, MAX_STORED_LINES),
    more: Math.max(0, shown.length - MAX_STORED_LINES),
  }
}

/** Files that usually hold secrets: on disk their steps keep counts, never lines. */
const SECRET_FILES = [
  /^\.env(\..+)?$/i,
  /\.(pem|key|p12|pfx|jks|keystore|kdbx|tfvars)$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)/i,
  /^(\.npmrc|\.pypirc|\.netrc|\.git-credentials|secrets\.json|local\.settings\.json|credentials(\.json)?)$/i,
  /(secret|credential|password)/i,
]

/** A line that looks like it sets or holds a secret. */
const SECRET_LINE =
  /(pass(word|wd)?|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?secret|connection[_-]?string|auth)["']?\s*[:=]|-----BEGIN [A-Z ]*PRIVATE KEY-----|[A-Za-z0-9+/_-]{40,}/i

export const HIDDEN_LINE = '(hidden in the saved copy: looks like a secret)'

/**
 * The copy of a replay that is written to disk: a file that usually holds secrets keeps its counts
 * and no lines, and any other line that looks like a secret is replaced by a note.
 */
export function forDisk(steps: readonly Step[]): Step[] {
  return steps.map(step => {
    const name = step.file.split('/').pop() ?? step.file
    if (SECRET_FILES.some(pattern => pattern.test(name))) {
      return { ...step, lines: [{ op: '~', text: "(lines not saved: this file usually holds secrets)" }], more: 0 }
    }
    return { ...step, lines: step.lines.map(line => (SECRET_LINE.test(line.text) ? { ...line, text: HIDDEN_LINE } : line)) }
  })
}

/** A path relative to the session's folder when it is inside it, with `/` separators. */
export function relativePath(cwd: string, path: string): string {
  const slash = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '')
  const base = slash(cwd)
  const full = slash(path)
  const isWindows = /^[A-Za-z]:/.test(base)
  const head = full.slice(0, base.length)
  const isSame = isWindows ? head.toLowerCase() === base.toLowerCase() : head === base
  return base !== '' && isSame && full[base.length] === '/' ? full.slice(base.length + 1) : full
}
