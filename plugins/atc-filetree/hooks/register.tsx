import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderInput, ThemeKey } from 'claude-code'

import type { Activity, Entry, Git, GitCode, GitFile } from '../types'
import {
  HEAVY,
  HIDDEN,
  MAX_ENTRIES,
  clip,
  extensionOf,
  folderCodes,
  formatAge,
  formatDate,
  formatSize,
  glyphOf,
  isCommit,
  isIgnored,
  isRunnable,
  isUnderHeavy,
  isWindowsPath,
  joinRel,
  keyOf,
  nameOf,
  openerFor,
  parentOf,
  parentsOf,
  parseNumstat,
  parseStatus,
  relativeTo,
  searchFiles,
  slash,
  sortEntries,
  toDisk,
  underPrefix,
  visibleRows,
  vscodeCliOf,
} from './tree'
import type { Platform, Row } from './tree'

const PANE = 'atc-filetree'
/** How long a file stays marked after Claude read, wrote or committed it. */
const ACTIVITY_MS = 2 * 60_000
/** Files marked at once. */
const MAX_ACTIVITY = 300
/** The wait after a change before the tree and git status are read again: changes close together are read once. */
const REFRESH_AFTER_MS = 700
/** Files the search looks through. */
const MAX_SEARCH_FILES = 20_000
/** The pane's width when docked, and its height inline above the prompt. */
const PANE_COLUMNS = 48
const PANE_ROWS = 18

const root = atom({ plugin: 'atc-filetree', key: 'root' } as const, '')
const listings = atom({ plugin: 'atc-filetree', key: 'listings' } as const, {}, { shape: 'listings-1' })
const expanded = atom({ plugin: 'atc-filetree', key: 'expanded' } as const, [])
const cursor = atom({ plugin: 'atc-filetree', key: 'cursor' } as const, '')
const top = atom({ plugin: 'atc-filetree', key: 'top' } as const, 0)
const git = atom({ plugin: 'atc-filetree', key: 'git' } as const, null, { shape: 'git-1' })
const activity = atom({ plugin: 'atc-filetree', key: 'activity' } as const, {})
// The tag changed when one pick became several: a reload declines the single path kept before.
const picked = atom({ plugin: 'atc-filetree', key: 'picked' } as const, [], { shape: 'picked-2' })
/** Files picked at once. */
const MAX_PICKED = 20
const search = atom({ plugin: 'atc-filetree', key: 'search' } as const, null)
const isOpen = atom({ plugin: 'atc-filetree', key: 'isOpen' } as const, false)

type Config = {
  activity: 'on' | 'off'
  follow: 'on' | 'off'
  openAtStart: 'on' | 'off'
  column: 'age' | 'size' | 'date' | 'none'
  glyphs: 'plain' | 'nerd'
}

function configOf(options: Record<string, unknown>): Config {
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback
  return {
    activity: pick(options.activity, ['on', 'off'], 'on'),
    follow: pick(options.follow, ['on', 'off'], 'on'),
    openAtStart: pick(options.openAtStart, ['on', 'off'], 'off'),
    column: pick(options.column, ['age', 'size', 'date', 'none'], 'age'),
    glyphs: pick(options.glyphs, ['plain', 'nerd'], 'plain'),
  }
}

/** What one registration knows besides the state: settings, the platform, and the last drawing's room. */
type Memory = {
  config: Config
  isWindows: boolean
  platform?: Platform
  /** VS Code's command line on Windows, null without it, undefined until looked up. */
  vscode?: { exe: string; cli: string } | null
  /** Where the root sits in its repository (`''` at the top), null outside one, undefined until asked. */
  prefix?: string | null
  /** The files the search looks through, read once when a search starts: every keystroke waits on the one read. */
  files?: Promise<string[]>
  /** Counts the keystrokes of a search: an answer for an older one is dropped. */
  searchSeq: number
  /** Rows of the tree the pane showed last. */
  room: number
  isRefreshQueued?: boolean
}

const HELP = [
  'The files of this folder in a pane, with git status and what Claude reads and writes.',
  '',
  '/atc-filetree           open the tree, or close it when it is shown',
  '/atc-filetree <path>    show another folder (. for the session folder)',
  '/atc-filetree refresh   read the folders and git status again',
  '/atc-filetree unpick    drop every picked file',
  '/atc-filetree close     close it',
  '/atc-filetree help      this list',
  '',
  'In the tree (ctrl+x tab gives it the keys): j/k down/up, h/l fold/unfold, Enter or o open (VS Code on Windows),',
  'p pick or unpick a file for your next prompt (several at once), s find a file, r refresh.',
].join('\n')

const GIT_COLOR: Record<GitCode, ThemeKey> = { M: 'warning', A: 'success', '?': 'success', D: 'error', R: 'suggestion', U: 'error' }
const ACTIVITY_COLOR: Record<Activity['kind'], ThemeKey> = { read: 'merged', write: 'claude', commit: 'success' }

const rowKey = (path: string) => `row:${path}`

/** The note beside the prompt: which files the person picked, each relative and absolute. */
const pickNote = (files: readonly string[]) =>
  files.length === 1
    ? `The person picked this file in the file tree to point you at it: ${files[0]}`
    : `The person picked these files in the file tree to point you at them:\n${files.map(file => `- ${file}`).join('\n')}`

/** The first row drawn so that the cursor's row is in view. */
function clampTop(first: number, at: number, room: number, total: number): number {
  let next = first
  if (at >= 0 && at < next) next = at
  if (at >= next + room) next = at - room + 1
  return Math.max(0, Math.min(next, Math.max(0, total - room)))
}

async function rootOf($: EngineInterface): Promise<string> {
  return (await read($, root)) || (await $.session.root())
}

async function listDir($: EngineInterface, memory: Memory, base: string, dir: string): Promise<Entry[] | null> {
  const listed = await $.fs.list(toDisk(base, dir, memory.isWindows)).catch(() => null)
  if (listed === null) return null
  const entries = listed
    .filter(entry => !HIDDEN.has(entry.name))
    .map(entry => ({ name: entry.name, isDir: entry.kind === 'dir', size: entry.size, mtimeMs: entry.mtimeMs }))
  return sortEntries(entries).slice(0, MAX_ENTRIES)
}

/** Lists folders again; one that is gone is closed. */
async function loadDirs($: EngineInterface, memory: Memory, dirs: readonly string[]): Promise<void> {
  if (dirs.length === 0) return
  const base = await rootOf($)
  const found = await Promise.all([...new Set(dirs)].map(async dir => [dir, await listDir($, memory, base, dir)] as const))
  await update($, listings, all => {
    const next = { ...all }
    for (const [dir, entries] of found) {
      if (entries === null) delete next[dir]
      else next[dir] = entries
    }
    return next
  })
  const gone = new Set(found.filter(([dir, entries]) => entries === null && dir !== '').map(([dir]) => dir))
  if (gone.size > 0) await update($, expanded, list => list.filter(dir => !gone.has(dir)))
}

/** Asks git once where the root sits in its repository. */
async function prefixOf($: EngineInterface, memory: Memory): Promise<string | null> {
  if (memory.prefix !== undefined) return memory.prefix
  const base = await rootOf($)
  const shown = await $.process.run(['git', 'rev-parse', '--show-prefix'], { cwd: base, timeoutMs: 10_000 }).catch(() => null)
  memory.prefix = shown !== null && shown.exitCode === 0 ? shown.stdout.trim() : null
  return memory.prefix
}

/** Reads the branch and the changed files; null outside a repository. */
async function readGit($: EngineInterface, memory: Memory): Promise<Git | null> {
  const prefix = await prefixOf($, memory)
  if (prefix === null) return null
  const base = await rootOf($)
  const run = (argv: string[]) => $.process.run(argv, { cwd: base, timeoutMs: 20_000 }).catch(() => null)
  const [status, numstat] = await Promise.all([
    run(['git', '--no-optional-locks', 'status', '--porcelain=v2', '--branch', '--ignored=matching', '-z']),
    run(['git', '--no-optional-locks', 'diff', '--numstat', '-z', 'HEAD']),
  ])
  if (status === null || status.exitCode !== 0) return null
  const parsed = parseStatus(status.stdout)
  const counts = numstat !== null && numstat.exitCode === 0 ? parseNumstat(numstat.stdout) : new Map()
  const files: Record<string, GitFile> = {}
  for (const file of parsed.files) {
    const rel = underPrefix(file.path, prefix)
    if (rel === null || rel === '') continue
    files[keyOf(rel, memory.isWindows)] = { code: file.code, ...counts.get(file.path) }
  }
  const ignored = parsed.ignored
    .map(path => underPrefix(path, prefix))
    .filter((rel): rel is string => rel !== null && rel !== '')
    .map(rel => keyOf(rel, memory.isWindows))
  return { branch: parsed.branch, ahead: parsed.ahead, behind: parsed.behind, files, ignored }
}

async function refreshAll($: EngineInterface, memory: Memory): Promise<void> {
  memory.files = undefined
  await loadDirs($, memory, ['', ...(await read($, expanded))])
  await keepCursor($)
  const found = await readGit($, memory).catch(() => null)
  await update($, git, () => found)
}

/** Keeps the cursor on a row that is shown: the nearest folder above a row that went away, else the first row. */
async function keepCursor($: EngineInterface): Promise<void> {
  const rows = await rowsOf($)
  const shown = new Set(rows.map(row => row.path))
  const path = await read($, cursor)
  if (shown.has(path) || rows.length === 0) return
  const above = parentsOf(path).reverse().find(dir => shown.has(dir))
  await update($, cursor, () => above ?? (rows[0] as Row).path)
}

/** Reads the tree and git status again shortly, once for changes that come close together; only while the pane is open. */
function scheduleRefresh($: EngineInterface, memory: Memory): void {
  if (memory.isRefreshQueued) return
  memory.isRefreshQueued = true
  $.clock.after(REFRESH_AFTER_MS, () => {
    memory.isRefreshQueued = false
    void (async () => {
      if (await read($, isOpen)) await refreshAll($, memory)
    })().catch(() => undefined)
  })
}

async function rowsOf($: EngineInterface): Promise<Row[]> {
  return visibleRows(await read($, listings), new Set(await read($, expanded)))
}

/** Puts the cursor on a row, scrolls it into view, and gives that row the focus when the pane holds the keys. */
async function setCursor($: EngineInterface, memory: Memory, path: string): Promise<void> {
  await update($, cursor, () => path)
  const rows = await rowsOf($)
  const at = rows.findIndex(row => row.path === path)
  if (at >= 0) await update($, top, first => clampTop(first, at, memory.room, rows.length))
  void $.ui.focus({ requestId: PANE, key: rowKey(path) }).catch(() => undefined)
}

/** The focus ring landed on a row: the cursor moves there, without asking for the focus again. */
async function followFocus($: EngineInterface, memory: Memory, path: string): Promise<void> {
  if ((await read($, cursor)) === path) return
  await update($, cursor, () => path)
  const rows = await rowsOf($)
  const at = rows.findIndex(row => row.path === path)
  if (at >= 0) await update($, top, first => clampTop(first, at, memory.room, rows.length))
}

/** Opens the folders above a path and puts the cursor on it. */
async function reveal($: EngineInterface, memory: Memory, path: string): Promise<void> {
  const parents = parentsOf(path)
  await update($, expanded, list => [...new Set([...list, ...parents])])
  const lists = await read($, listings)
  const parent = parentOf(path)
  const isListed = (lists[parent] ?? []).some(entry => entry.name === nameOf(path))
  await loadDirs($, memory, ['', ...parents].filter(dir => lists[dir] === undefined || (dir === parent && !isListed)))
  await setCursor($, memory, path)
}

async function move($: EngineInterface, memory: Memory, delta: number): Promise<void> {
  const rows = await rowsOf($)
  if (rows.length === 0) return
  const path = await read($, cursor)
  const at = rows.findIndex(row => row.path === path)
  const to = Math.max(0, Math.min(rows.length - 1, at < 0 ? 0 : at + delta))
  await setCursor($, memory, (rows[to] as Row).path)
}

async function toggleDir($: EngineInterface, memory: Memory, path: string, isOpening: boolean): Promise<void> {
  if (isOpening) {
    await update($, expanded, list => (list.includes(path) ? list : [...list, path]))
    await loadDirs($, memory, [path])
  } else {
    await update($, expanded, list => list.filter(dir => dir !== path))
  }
  void $.ui.focus({ requestId: PANE, key: rowKey(path) }).catch(() => undefined)
}

/** h: closes the folder under the cursor, or goes up to the folder above. */
async function fold($: EngineInterface, memory: Memory): Promise<void> {
  const path = await read($, cursor)
  const row = (await rowsOf($)).find(one => one.path === path)
  if (row?.isOpen) return toggleDir($, memory, path, false)
  if (row && parentOf(path) !== '') await setCursor($, memory, parentOf(path))
}

/** l: opens the folder under the cursor, or steps into it when it is open. */
async function unfold($: EngineInterface, memory: Memory): Promise<void> {
  const path = await read($, cursor)
  const row = (await rowsOf($)).find(one => one.path === path)
  if (!row?.isDir) return
  if (!row.isOpen) return toggleDir($, memory, path, true)
  const first = (await read($, listings))[path]?.[0]
  if (first) await setCursor($, memory, joinRel(path, first.name))
}

async function platformOf($: EngineInterface, memory: Memory): Promise<Platform> {
  if (memory.platform) return memory.platform
  if (memory.isWindows) return (memory.platform = 'windows')
  const uname = await $.process.run(['uname', '-s'], { timeoutMs: 5_000 }).catch(() => null)
  memory.platform = uname?.stdout.trim() === 'Darwin' ? 'mac' : 'linux'
  return memory.platform
}

/** VS Code's command line on Windows, looked up once; null when `code` isn't on the PATH. */
async function vscodeOf($: EngineInterface, memory: Memory): Promise<{ exe: string; cli: string } | null> {
  if (memory.vscode !== undefined) return memory.vscode
  const found = await $.process.run(['where.exe', 'code.cmd'], { timeoutMs: 5_000 }).catch(() => null)
  const launcher = found?.exitCode === 0 ? found.stdout.split(/\r?\n/).map(line => line.trim()).find(Boolean) : undefined
  const script = launcher ? await $.fs.read(launcher).catch(() => '') : ''
  const cli = launcher && typeof script === 'string' ? vscodeCliOf(launcher, script) : null
  const isThere = cli !== null && (await $.fs.exists(cli.exe).catch(() => false)) && (await $.fs.exists(cli.cli).catch(() => false))
  memory.vscode = isThere ? cli : null
  return memory.vscode
}

/**
 * Opens a file: in VS Code on Windows, in its default app on macOS and Linux.
 *
 * On Windows a program Claude Code starts gets a hidden window, and most apps keep it hidden
 * (Explorer, the "open with" picker), so files go to VS Code, which shows itself and opens every
 * file as text. On macOS and Linux a file that could run when opened (a script, a program, a file
 * with no extension) is not opened.
 */
async function openFile($: EngineInterface, memory: Memory, path: string): Promise<void> {
  if (path === '') return
  const name = nameOf(path)
  const base = await rootOf($)
  const file = toDisk(base, path, memory.isWindows)
  const platform = await platformOf($, memory)
  if (platform === 'windows') {
    const code = await vscodeOf($, memory)
    if (code === null) {
      await $.ui.toast("Files open in VS Code on Windows, and VS Code wasn't found: `code` isn't on the PATH.")
      return
    }
    // As code.cmd runs it: the cli hands the file to VS Code, starting it when needed, and exits.
    await $.process.run([code.exe, code.cli, file], { cwd: base, env: { ELECTRON_RUN_AS_NODE: '1' }, timeoutMs: 15_000 }).catch(() => undefined)
    return
  }
  if (isRunnable(name) || extensionOf(name) === '') {
    await $.ui.toast(`${name} could run if opened, so it wasn't opened.`)
    return
  }
  // The opener may stay attached to its app's output: give up waiting soon, the app opens anyway.
  await $.process.run(openerFor(platform, file), { cwd: base, timeoutMs: 5_000 }).catch(() => undefined)
}

/** Enter, o, or a click on a row: a folder opens or closes in the tree, a file opens (in VS Code on Windows). */
async function pressRow($: EngineInterface, memory: Memory, path: string): Promise<void> {
  if (path === '') return
  const row = (await rowsOf($)).find(one => one.path === path)
  await update($, cursor, () => path)
  if (row?.isDir) return toggleDir($, memory, path, !row.isOpen)
  await openFile($, memory, path)
}

async function togglePick($: EngineInterface): Promise<void> {
  const path = await read($, cursor)
  if (path === '') return
  await update($, picked, was => (was.includes(path) ? was.filter(one => one !== path) : [...was, path].slice(-MAX_PICKED)))
  void $.ui.focus({ requestId: PANE, key: rowKey(path) }).catch(() => undefined)
}

/** The files the search looks through: git's list in a repository, else a bounded walk. */
function searchList($: EngineInterface, memory: Memory): Promise<string[]> {
  memory.files ??= readSearchList($, memory).catch(() => [])
  return memory.files
}

async function readSearchList($: EngineInterface, memory: Memory): Promise<string[]> {
  const base = await rootOf($)
  if ((await prefixOf($, memory)) !== null) {
    const listed = await $.process
      .run(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: base, timeoutMs: 20_000 })
      .catch(() => null)
    if (listed !== null && listed.exitCode === 0) return [...new Set(listed.stdout.split('\0').filter(Boolean))].slice(0, MAX_SEARCH_FILES)
  }
  const files: string[] = []
  const queue = ['']
  while (queue.length > 0 && files.length < 5_000) {
    const dir = queue.shift() as string
    for (const entry of (await listDir($, memory, base, dir)) ?? []) {
      const path = joinRel(dir, entry.name)
      if (!entry.isDir) files.push(path)
      else if (!HEAVY.has(entry.name) && !entry.name.startsWith('.') && path.split('/').length < 8) queue.push(path)
    }
  }
  return files
}

async function toggleSearch($: EngineInterface, memory: Memory): Promise<void> {
  if ((await read($, search)) !== null) {
    await update($, search, () => null)
    return
  }
  await update($, search, () => ({ query: '', hits: [] }))
  void $.ui.focus({ requestId: PANE, key: 'search' }).catch(() => undefined)
  await searchList($, memory)
}

async function typeSearch($: EngineInterface, memory: Memory, query: string): Promise<void> {
  const seq = ++memory.searchSeq
  const hits = searchFiles(await searchList($, memory), query)
  // Keystrokes may finish out of order: only the latest one's hits are kept, and only while the search is open.
  if (seq !== memory.searchSeq) return
  await update($, search, was => (was === null ? null : { query, hits }))
}

/** Enter in the search field: goes to the first match, or closes the search when the field is empty. */
async function submitSearch($: EngineInterface, memory: Memory, query: string): Promise<void> {
  memory.searchSeq++
  if (query.trim() === '') {
    await update($, search, () => null)
    return
  }
  await chooseHit($, memory, searchFiles(await searchList($, memory), query)[0])
}

async function chooseHit($: EngineInterface, memory: Memory, path: string | undefined): Promise<void> {
  if (path === undefined) return
  await update($, search, () => null)
  await reveal($, memory, path)
}

/** Marks files with what Claude did to them, for ACTIVITY_MS. */
async function mark($: EngineInterface, memory: Memory, paths: readonly string[], kind: Activity['kind']): Promise<void> {
  if (memory.config.activity === 'off' || paths.length === 0) return
  const at = await $.clock.now()
  const keys = paths.map(path => keyOf(path, memory.isWindows))
  await update($, activity, all => {
    const kept = Object.entries(all).filter(([, one]) => at - one.at < ACTIVITY_MS)
    const next = Object.fromEntries(kept.slice(-(MAX_ACTIVITY - keys.length)))
    for (const key of keys) next[key] = { kind, at }
    return next
  })
  $.clock.after(ACTIVITY_MS, () => {
    void update($, activity, all => {
      const next = { ...all }
      for (const key of keys) if (next[key]?.at === at) delete next[key]
      return next
    }).catch(() => undefined)
  })
}

/** A file Claude read or wrote: marked, and with follow on, shown in the tree. */
async function noteFile($: EngineInterface, memory: Memory, filePath: string, kind: 'read' | 'write'): Promise<void> {
  const rel = relativeTo(await rootOf($), filePath, memory.isWindows)
  if (rel === null || rel === '') return
  await mark($, memory, [rel], kind)
  if (!(await read($, isOpen))) return
  if (kind === 'write') scheduleRefresh($, memory)
  if (memory.config.follow === 'on' && !isUnderHeavy(rel)) await reveal($, memory, rel)
  else if (kind === 'write' && (await read($, listings))[parentOf(rel)] !== undefined) await loadDirs($, memory, [parentOf(rel)])
}

async function headOf($: EngineInterface): Promise<string | null> {
  const head = await $.process.run(['git', 'rev-parse', 'HEAD'], { cwd: await rootOf($), timeoutMs: 10_000 }).catch(() => null)
  return head !== null && head.exitCode === 0 ? head.stdout.trim() : null
}

/** A commit Claude made: its files are marked. */
async function noteCommit($: EngineInterface, memory: Memory): Promise<void> {
  const prefix = await prefixOf($, memory)
  if (prefix === null) return
  const changed = await $.process
    .run(['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD'], { cwd: await rootOf($), timeoutMs: 10_000 })
    .catch(() => null)
  if (changed === null || changed.exitCode !== 0) return
  const paths = changed.stdout
    .split('\0')
    .map(path => underPrefix(path, prefix))
    .filter((rel): rel is string => rel !== null && rel !== '')
  await mark($, memory, paths, 'commit')
}

async function openPane($: EngineInterface, memory: Memory, isAsked: boolean): Promise<boolean> {
  await refreshAll($, memory)
  await update($, isOpen, () => true)
  const opened = await $.ui.open({
    id: PANE,
    title: 'Files',
    ...(isAsked ? { focus: true as const } : {}),
    rows: PANE_ROWS,
    columns: PANE_COLUMNS,
  })
  return opened.isPlaced
}

async function closePane($: EngineInterface): Promise<void> {
  await update($, isOpen, () => false)
  await $.ui.close({ id: PANE }).catch(() => undefined)
}

/** Whether the tree is on screen now, asked of the surface: a close the mod never heard of is put right. */
async function isShown($: EngineInterface): Promise<boolean> {
  if (!(await read($, isOpen))) return false
  const pane = (await $.ui.panes()).find(open => open.id === PANE)
  if (!pane) await update($, isOpen, () => false)
  return pane?.isShown === true
}

/** `/atc-filetree <path>`: shows another folder. */
async function pinFolder($: EngineInterface, memory: Memory, arg: string): Promise<string> {
  const project = await $.session.root()
  const isAbsolute = arg.startsWith('/') || arg.startsWith('\\') || isWindowsPath(arg) || arg.startsWith('~')
  const asked = isAbsolute ? arg : toDisk(project, slash(arg), isWindowsPath(project))
  const stat = await $.fs.stat(asked, { resolve: true }).catch(() => null)
  if (stat === null || stat.kind !== 'dir') return `${arg} is not a folder.`
  const folder = stat.realPath ?? asked
  memory.isWindows = isWindowsPath(folder)
  memory.prefix = undefined
  memory.files = undefined
  await update($, root, () => folder)
  await update($, listings, () => ({}))
  await update($, expanded, () => [])
  await update($, cursor, () => '')
  await update($, top, () => 0)
  await update($, git, () => null)
  await update($, search, () => null)
  await update($, picked, () => [])
  await openPane($, memory, true)
  return `Showing ${folder}.`
}

/** The right-hand side of a row: git status and counts, then the chosen column. */
function rightOf(row: Row, file: GitFile | undefined, config: Config, now: number): { status: string; column: string } {
  const counts = file && (file.added !== undefined || file.removed !== undefined) ? ` +${file.added ?? 0} -${file.removed ?? 0}` : ''
  const status = !row.isDir && file ? `${file.code}${counts}` : ''
  let column = ''
  if (!row.isDir && row.entry.mtimeMs > 0) {
    if (config.column === 'age') column = formatAge(now - row.entry.mtimeMs)
    else if (config.column === 'date') column = formatDate(row.entry.mtimeMs)
  }
  if (!row.isDir && config.column === 'size') column = formatSize(row.entry.size)
  return { status, column }
}

async function treeView($: EngineInterface, e: RenderInput, memory: Memory) {
  const elements = $.ui.resolve(e)
  const { Box, Text, Button } = elements
  // The mobile app draws no field: the search is typed elsewhere there.
  const Input = 'Input' in elements ? elements.Input : undefined
  const props = e.props as { bodyColumns: number; scroll: { bodyRows: number } }
  const columns = Math.max(20, props.bodyColumns)
  const [base, lists, open, at, first, repo, recent, pick, find] = await Promise.all([
    rootOf($),
    read($, listings),
    read($, expanded),
    read($, cursor),
    read($, top),
    read($, git),
    read($, activity),
    read($, picked),
    read($, search),
  ])
  const now = await $.clock.now()
  const isWindows = memory.isWindows
  const rows = visibleRows(lists, new Set(open))

  const footerRows = columns >= 64 ? 1 : 2
  const chrome = 1 + (pick.length > 0 ? 1 : 0) + (find ? 1 : 0) + footerRows
  const room = Math.max(3, props.scroll.bodyRows - chrome)
  memory.room = room

  const branch = repo
    ? [`⎇ ${repo.branch || 'no commits'}`, repo.ahead > 0 ? `↑${repo.ahead}` : '', repo.behind > 0 ? `↓${repo.behind}` : '']
        .filter(Boolean)
        .join(' ')
    : ''
  const header = (
    <Box flexDirection="row" justifyContent="space-between">
      <Text bold wrap="truncate-start">
        {clip(nameOf(slash(base)) || slash(base), Math.max(8, columns - branch.length - 2))}
      </Text>
      {branch !== '' && <Text color="suggestion">{branch}</Text>}
    </Box>
  )
  const pickLine =
    pick.length > 0 ? (
      <Text color="suggestion" wrap="truncate-end">
        ◆ with your next prompt: {pick.length === 1 ? pick[0] : `${pick.length} files: ${pick.map(nameOf).join(', ')}`}
      </Text>
    ) : null
  const pickedSet = new Set(pick)
  const footer = (
    <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
      <Button key="down" plain hotkey="j" label="↓" onPress={() => void move($, memory, 1)} />
      <Button key="up" plain hotkey="k" label="↑" onPress={() => void move($, memory, -1)} />
      <Button key="fold" plain hotkey="h" label="fold" onPress={() => void fold($, memory)} />
      <Button key="unfold" plain hotkey="l" label="unfold" onPress={() => void unfold($, memory)} />
      <Button key="open" plain hotkey="o" label="open" onPress={() => void (async () => pressRow($, memory, await read($, cursor)))()} />
      <Button key="pick" plain hotkey="p" label="pick" onPress={() => void togglePick($)} />
      <Button key="find" plain hotkey="s" label="find" onPress={() => void toggleSearch($, memory)} />
      <Button key="refresh" plain hotkey="r" label="refresh" onPress={() => void refreshAll($, memory)} />
    </Box>
  )

  if (find) {
    const hits = find.hits.slice(0, room)
    return (
      <Box flexDirection="column">
        {header}
        {pickLine}
        {Input ? (
          <Input
            key="search"
            label="Find "
            placeholder="part of a file name or path"
            submitLabel="go to it"
            autoFocus
            onInput={(value: string) => void typeSearch($, memory, value)}
            onSubmit={(value: string) => void submitSearch($, memory, value)}
          />
        ) : (
          <Text dimColor>Search needs a surface with a text field.</Text>
        )}
        <Box flexDirection="column" height={room}>
          {find.query !== '' && hits.length === 0 && <Text dimColor>No file matches.</Text>}
          {hits.map(path => (
            <Button key={`hit:${path}`} plain onPress={() => void chooseHit($, memory, path)}>
              <Text>{clip(path, columns - 1)}</Text>
            </Button>
          ))}
        </Box>
        {footer}
      </Box>
    )
  }

  const files = repo?.files ?? {}
  const folders = folderCodes(files)
  const ignored = new Set(repo?.ignored ?? [])
  const recentDirs = new Map<string, Activity['kind']>()
  for (const [key, one] of Object.entries(recent)) for (const dir of parentsOf(key)) recentDirs.set(dir, one.kind)

  const cursorAt = rows.findIndex(row => row.path === at)
  const start = clampTop(first, cursorAt, room, rows.length)
  const shown = rows.slice(start, start + room)

  return (
    <Box flexDirection="column">
      {header}
      {pickLine}
      <Box flexDirection="column" height={room}>
        {lists[''] === undefined && <Text dimColor>Reading the folder…</Text>}
        {lists[''] !== undefined && rows.length === 0 && <Text dimColor>This folder is empty.</Text>}
        {shown.map(row => {
          const key = keyOf(row.path, isWindows)
          const file = files[key]
          const did = recent[key]?.kind ?? (row.isDir && !row.isOpen ? recentDirs.get(key) : undefined)
          const code = row.isDir ? folders.get(key) : file?.code
          const color = did ? ACTIVITY_COLOR[did] : code ? GIT_COLOR[code] : undefined
          const isCursor = row.path === at || (cursorAt < 0 && row === rows[0])
          const { status, column } = rightOf(row, file, memory.config, now)
          const isPicked = pickedSet.has(row.path)
          const left = `${isCursor ? '›' : ' '}${isPicked ? '◆' : ' '}${'  '.repeat(row.depth)}`
          const glyph = glyphOf(row, memory.config.glyphs)
          const right = [status, column].filter(Boolean).join(' ')
          const nameRoom = columns - left.length - glyph.length - (right ? right.length + 1 : 0) - 1
          const name = clip(row.name, Math.max(4, nameRoom))
          const gap = Math.max(1, columns - left.length - glyph.length - name.length - right.length - 1)
          return (
            <Button key={rowKey(row.path)} plain onPress={() => void pressRow($, memory, row.path)}>
              <Text color={isCursor || isPicked ? 'suggestion' : undefined}>{left}</Text>
              <Text dimColor>{glyph}</Text>
              <Text color={color} bold={isCursor || did !== undefined} dimColor={!color && isIgnored(key, ignored)}>
                {name}
              </Text>
              <Text>{right ? ' '.repeat(gap) : ''}</Text>
              {status !== '' && <Text color={file ? GIT_COLOR[file.code] : undefined}>{status}</Text>}
              {column !== '' && <Text dimColor>{status !== '' ? ` ${column}` : column}</Text>}
            </Button>
          )
        })}
      </Box>
      {footer}
    </Box>
  )
}

export const register: Register = (on, options) => {
  const memory: Memory = { config: configOf(options), isWindows: false, room: PANE_ROWS - 3, searchSeq: 0 }

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'atc-filetree',
      description: 'Show the files of this folder in a pane, with git status and what Claude reads and writes',
      argumentHint: '[path|refresh|unpick|close|help]',
    })
    const project = await $.session.root()
    const held = await read($, root)
    memory.isWindows = isWindowsPath(held || project)
    if (held === '') await update($, root, () => project)
    // A reload keeps the state, and the pane with it: read what changed meanwhile.
    if (await read($, isOpen)) scheduleRefresh($, memory)
    else if (memory.config.openAtStart === 'on') void openPane($, memory, false).catch(() => undefined)
    return started
  })

  on('command.run', { command: 'atc-filetree' }, async ($, e) => {
    const arg = e.args.trim()
    switch (arg.toLowerCase()) {
      case '':
      case 'open':
        if (arg === '' && (await isShown($))) {
          await closePane($)
          return { text: 'Tree closed.' }
        }
        await openPane($, memory, true)
        return { text: 'ctrl+x tab gives the tree the keys: j/k move, h/l fold, Enter opens, p picks, s finds.' }
      case 'close':
        await closePane($)
        return { text: 'Tree closed.' }
      case 'refresh':
        await refreshAll($, memory)
        return { text: 'Read the folders and git status again.' }
      case 'unpick':
        await update($, picked, () => [])
        return { text: 'No files picked.' }
      case 'help':
      case '?':
        return { text: HELP }
      default:
        return { text: await pinFolder($, memory, arg) }
    }
  })

  // Reads and writes: marked, and followed. These hooks only watch: the call always goes on.
  on('tool.call', { tool: ['Read', 'Edit', 'Write', 'NotebookEdit'] }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError) return ran
    const call = e as { tool: string; file_path?: unknown; notebook_path?: unknown }
    const path = typeof call.file_path === 'string' ? call.file_path : typeof call.notebook_path === 'string' ? call.notebook_path : ''
    if (path !== '') await noteFile($, memory, path, call.tool === 'Read' ? 'read' : 'write').catch(() => undefined)
    return ran
  }).catch(($, e, next) => next(e))

  // Shell commands may change any file; a git commit marks the files it committed.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = typeof (e as { command?: unknown }).command === 'string' ? (e as { command: string }).command : ''
    const isCommitting = isCommit(command)
    const before = isCommitting ? await headOf($).catch(() => null) : null
    const ran = await next(e)
    if (ran.deny !== undefined) return ran
    if (isCommitting && !ran.isError) {
      const after = await headOf($).catch(() => null)
      if (after !== null && after !== before) await noteCommit($, memory).catch(() => undefined)
    }
    if (await read($, isOpen)) scheduleRefresh($, memory)
    return ran
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (await read($, isOpen)) scheduleRefresh($, memory)
    return done
  }).catch(($, e, next) => next(e))

  // The picked files go to Claude with the next prompt the person types, as context beside it.
  on('prompt.submit', async ($, e, next) => {
    const paths = await read($, picked)
    if (paths.length === 0 || e.origin?.kind === 'plugin' || e.text.trimStart().startsWith('/')) return next(e)
    const base = await rootOf($)
    const note = pickNote(paths.map(path => `${path} (${toDisk(base, path, memory.isWindows)})`))
    const sent = await next({ ...e, context: [...(e.context ?? []), note] })
    // A prompt another hook held back keeps the picks for the next one.
    if ((sent as { drop?: string }).drop === undefined) await update($, picked, () => [])
    return sent
  }).catch(($, e, next) => next(e))

  // The arrows, Tab or a click move the focus ring over the rows: the cursor goes with it, so
  // o, h, l and p act on the row that is lit, not on one picked earlier.
  on('ui.focus', async ($, e, next) => {
    const moved = await next(e)
    if (e.requestId !== PANE || moved.deny !== undefined || !e.element?.startsWith('row:')) return moved
    if (e.plugin !== undefined && e.plugin !== 'atc-filetree') return moved
    await followFocus($, memory, e.element.slice(4)).catch(() => undefined)
    return moved
  }).catch(($, e, next) => next(e))

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) await update($, isOpen, () => false)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => treeView($, e, memory))
}

