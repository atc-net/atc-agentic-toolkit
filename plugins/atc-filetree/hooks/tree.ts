import type { Entry, GitCode, GitFile } from '../types'

/** Folders never listed. */
export const HIDDEN = new Set(['.git'])
/** Folders follow mode never opens by itself: big, generated, rarely what you want to see. */
export const HEAVY = new Set(['node_modules', 'bin', 'obj', 'dist', 'build', 'out', 'target', '.venv', 'venv', '__pycache__'])
/** Entries kept per folder. */
export const MAX_ENTRIES = 1000

/**
 * Files that run when the system opens them: these are shown in their folder instead.
 * Lowercase, without the dot.
 */
const RUNNABLE = new Set([
  'app', 'appref-ms', 'bash', 'bat', 'cmd', 'com', 'command', 'cpl', 'csh', 'desktop', 'exe', 'fish', 'hta', 'inf',
  'jar', 'js', 'jse', 'ksh', 'lnk', 'msc', 'msi', 'msp', 'pif', 'pkg', 'ps1', 'psd1', 'psm1', 'py', 'pyw', 'reg',
  'run', 'scf', 'scpt', 'scr', 'sh', 'terminal', 'url', 'vb', 'vbe', 'vbs', 'workflow', 'ws', 'wsf', 'wsh', 'zsh',
])

/** True for a Windows path: a drive letter, or a share. */
export const isWindowsPath = (path: string) => /^[A-Za-z]:([\\/]|$)/.test(path) || /^\\\\/.test(path)

/** The path with `/` separators and no trailing one (a drive root keeps it: `C:/`). */
export function slash(path: string): string {
  const forward = path.replace(/\\/g, '/')
  if (/^[A-Za-z]:\/?$/.test(forward)) return `${forward.slice(0, 2)}/`
  return forward.length > 1 ? forward.replace(/\/+$/, '') : forward
}

/** What paths are compared by: Windows compares without case. */
export const keyOf = (path: string, isWindows: boolean) => (isWindows ? path.toLowerCase() : path)

/**
 * `path` relative to `root`, with `/` separators: `''` for the root itself, null when outside it.
 * A relative `path` is taken as relative to the root already.
 */
export function relativeTo(root: string, path: string, isWindows: boolean): string | null {
  const to = slash(path)
  const isAbsolute = to.startsWith('/') || isWindowsPath(path)
  if (!isAbsolute) {
    const inside = to.replace(/^\.\//, '')
    return inside === '.' ? '' : inside.split('/').includes('..') ? null : inside
  }
  const base = slash(root)
  const [a, b] = [keyOf(to, isWindows), keyOf(base, isWindows)]
  if (a === b) return ''
  const prefix = b.endsWith('/') ? b : `${b}/`
  return a.startsWith(prefix) ? to.slice(prefix.length) : null
}

/** A path relative to the root, as the disk takes it. */
export function toDisk(root: string, rel: string, isWindows: boolean): string {
  if (rel === '') return root
  const sep = isWindows ? '\\' : '/'
  const base = root.endsWith('/') || root.endsWith('\\') ? root : `${root}${sep}`
  return `${base}${isWindows ? rel.replace(/\//g, '\\') : rel}`
}

export const joinRel = (dir: string, name: string) => (dir === '' ? name : `${dir}/${name}`)
export const nameOf = (rel: string) => rel.slice(rel.lastIndexOf('/') + 1)
export const parentOf = (rel: string) => (rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '')

/** The folders above a path, outermost first: `a/b/c.ts` → `a`, `a/b`. */
export function parentsOf(rel: string): string[] {
  const parts = rel.split('/').slice(0, -1)
  return parts.map((_, k) => parts.slice(0, k + 1).join('/'))
}

/** True when a path lies under a folder follow mode leaves closed. */
export const isUnderHeavy = (rel: string) => rel.split('/').slice(0, -1).some(part => HEAVY.has(part))

/** Folders first, then by name without case. */
export function sortEntries(entries: readonly Entry[]): Entry[] {
  return [...entries].sort((a, b) =>
    a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }),
  )
}

export type Row = { path: string; name: string; depth: number; isDir: boolean; isOpen: boolean; entry: Entry }

/** The rows the tree shows: the root's entries, and each open folder's beneath it. */
export function visibleRows(listings: Readonly<Record<string, readonly Entry[]>>, expanded: ReadonlySet<string>): Row[] {
  const rows: Row[] = []
  const walk = (dir: string, depth: number) => {
    for (const entry of listings[dir] ?? []) {
      const path = joinRel(dir, entry.name)
      const isOpen = entry.isDir && expanded.has(path)
      rows.push({ path, name: entry.name, depth, isDir: entry.isDir, isOpen, entry })
      if (isOpen && rows.length < 20_000) walk(path, depth + 1)
    }
  }
  walk('', 0)
  return rows
}

/** The status letter of one `git status --porcelain=v2` entry's `XY`. */
function codeOf(xy: string): GitCode {
  if (xy.includes('D')) return 'D'
  if (xy.includes('A')) return 'A'
  if (xy.includes('R') || xy.includes('C')) return 'R'
  return 'M'
}

export type Status = {
  branch: string
  ahead: number
  behind: number
  files: { path: string; code: GitCode }[]
  ignored: string[]
}

/** Reads `git status --porcelain=v2 --branch --ignored=matching -z`. Paths are relative to the repository's top. */
export function parseStatus(stdout: string): Status {
  const status: Status = { branch: '', ahead: 0, behind: 0, files: [], ignored: [] }
  const fields = stdout.split('\0')
  for (let k = 0; k < fields.length; k++) {
    const field = fields[k] as string
    if (field.startsWith('# branch.head ')) status.branch = field.slice(14)
    else if (field.startsWith('# branch.ab ')) {
      const [, ahead = '0', behind = '0'] = /^# branch\.ab \+(\d+) -(\d+)/.exec(field) ?? []
      status.ahead = Number(ahead)
      status.behind = Number(behind)
    } else if (field.startsWith('1 ')) {
      // 1 XY sub mH mI mW hH hI path
      const parts = field.split(' ')
      status.files.push({ path: parts.slice(8).join(' '), code: codeOf(parts[1] ?? '') })
    } else if (field.startsWith('2 ')) {
      // 2 XY sub mH mI mW hH hI Xscore path, then the original path as the next field
      const parts = field.split(' ')
      status.files.push({ path: parts.slice(9).join(' '), code: 'R' })
      k++
    } else if (field.startsWith('u ')) {
      // u XY sub m1 m2 m3 mW h1 h2 h3 path
      status.files.push({ path: field.split(' ').slice(10).join(' '), code: 'U' })
    } else if (field.startsWith('? ')) status.files.push({ path: field.slice(2), code: '?' })
    else if (field.startsWith('! ')) status.ignored.push(field.slice(2).replace(/\/$/, ''))
  }
  if (status.branch === '(detached)') status.branch = 'detached'
  return status
}

/** Reads `git diff --numstat -z`: lines added and removed per path; binary files are left out. */
export function parseNumstat(stdout: string): Map<string, { added: number; removed: number }> {
  const counts = new Map<string, { added: number; removed: number }>()
  const fields = stdout.split('\0')
  for (let k = 0; k < fields.length; k++) {
    const match = /^(-|\d+)\t(-|\d+)\t(.*)$/s.exec(fields[k] as string)
    if (!match) continue
    let path = match[3] as string
    // A rename: an empty path, then the old and the new path as fields of their own.
    if (path === '') {
      path = fields[k + 2] ?? ''
      k += 2
    }
    if (match[1] !== '-' && path !== '') counts.set(path, { added: Number(match[1]), removed: Number(match[2]) })
  }
  return counts
}

/**
 * Git's paths made relative to the tree's root: `prefix` is where the root sits in the repository
 * (`git rev-parse --show-prefix`, `''` at the top). Paths outside the root are left out.
 */
export function underPrefix(path: string, prefix: string): string | null {
  if (prefix === '') return path
  return path.startsWith(prefix) ? path.slice(prefix.length) : null
}

/** A folder's mark: the strongest status of the changed files beneath it. */
const RANK: Record<GitCode, number> = { U: 5, D: 4, M: 3, R: 2, A: 1, '?': 0 }

/** Every folder that holds changed files, keyed by `keyOf`, with the strongest status beneath it. */
export function folderCodes(files: Readonly<Record<string, GitFile>>): Map<string, GitCode> {
  const codes = new Map<string, GitCode>()
  for (const [key, file] of Object.entries(files)) {
    for (const dir of parentsOf(key)) {
      const was = codes.get(dir)
      if (was === undefined || RANK[file.code] > RANK[was]) codes.set(dir, file.code)
    }
  }
  return codes
}

/** True when a path is ignored by git: it, or a folder above it, is in the ignored list. */
export function isIgnored(key: string, ignored: ReadonlySet<string>): boolean {
  if (ignored.has(key)) return true
  return parentsOf(key).some(dir => ignored.has(dir))
}

/** True when a shell command makes a git commit. */
export const isCommit = (command: string) => /(^|[;&|(\s])git(\s+-[cC]\s+\S+|\s+--\S+)*\s+commit\b/.test(command)

export const extensionOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '')

/** True for a file the system would run rather than open. */
export const isRunnable = (name: string) => RUNNABLE.has(extensionOf(name))

export type Platform = 'windows' | 'mac' | 'linux'

/**
 * VS Code's command line from its `code.cmd` launcher: `Code.exe` and the `cli.js` it runs as Node,
 * the way the launcher does. The cli hands the file to VS Code and exits, so nothing waits on the app.
 */
export function vscodeCliOf(launcher: string, script: string): { exe: string; cli: string } | null {
  const bin = launcher.slice(0, launcher.lastIndexOf('\\'))
  const install = bin.slice(0, bin.lastIndexOf('\\'))
  if (install === '') return null
  // `"%~dp0..\Code.exe" "%~dp0..\resources\app\out\cli.js" %*`, the cli under a version folder in newer builds.
  const cli = /%~dp0\.\.\\([^"\r\n]*cli\.js)/i.exec(script)?.[1] ?? 'resources\\app\\out\\cli.js'
  return { exe: `${install}\\Code.exe`, cli: `${install}\\${cli}` }
}

/** The command that opens a file in its default app on macOS and Linux, as an argument vector (no shell). */
export const openerFor = (platform: Exclude<Platform, 'windows'>, path: string) => [platform === 'mac' ? 'open' : 'xdg-open', path]

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

export function formatAge(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d`
  if (days < 60) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

export function formatDate(at: number): string {
  const day = new Date(at)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${day.getFullYear()}-${two(day.getMonth() + 1)}-${two(day.getDate())}`
}

/** Search hits: every word of the query in the path, without case; name hits first, then shorter paths. */
export function searchFiles(files: readonly string[], query: string, limit = 50): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const hits = files.filter(path => {
    const lower = path.toLowerCase()
    return words.every(word => lower.includes(word))
  })
  const score = (path: string) => (words.every(word => nameOf(path).toLowerCase().includes(word)) ? 0 : 1)
  return hits.sort((a, b) => score(a) - score(b) || a.length - b.length || a.localeCompare(b)).slice(0, limit)
}

/** Nerd Font icons for common kinds of file; the plain set draws none. */
const NERD: Record<string, string> = {
  cs: '\u{f031b}', csproj: '\u{f0610}', sln: '\u{f0610}', slnx: '\u{f0610}',
  ts: '\u{e628}', tsx: '\u{e7ba}', js: '\u{e74e}', jsx: '\u{e7ba}', mjs: '\u{e74e}',
  json: '\u{e60b}', md: '\u{e609}', yml: '\u{e6a8}', yaml: '\u{e6a8}', toml: '\u{e6b2}',
  py: '\u{e606}', go: '\u{e627}', rs: '\u{e7a8}', java: '\u{e738}', ps1: '\u{e683}', sh: '\u{f489}',
  html: '\u{e736}', css: '\u{e749}', scss: '\u{e749}', xml: '\u{f05c0}', svg: '\u{f0721}', png: '\u{f03e}',
  jpg: '\u{f03e}', gif: '\u{f03e}', lock: '\u{f023}', txt: '\u{f0219}', sql: '\u{e706}', dockerfile: '\u{f0868}',
}

/** The glyph before a name. */
export function glyphOf(row: Pick<Row, 'name' | 'isDir' | 'isOpen'>, glyphs: 'plain' | 'nerd'): string {
  if (glyphs === 'plain') return row.isDir ? (row.isOpen ? '▾ ' : '▸ ') : '  '
  if (row.isDir) return row.isOpen ? '\u{f115} ' : '\u{f114} '
  const ext = extensionOf(row.name) || row.name.toLowerCase()
  return `${NERD[ext] ?? '\u{f016}'} `
}

/** Cuts text to `width` cells, ending with `…`. */
export const clip = (text: string, width: number) =>
  width <= 0 ? '' : text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`
