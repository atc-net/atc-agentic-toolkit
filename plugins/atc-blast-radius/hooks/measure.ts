import type { EngineInterface } from 'claude-code'

import type { Finding } from './detect'
import { isAbsolute } from './detect'

/** What one risky part would do, measured. */
export type Part = {
  /** The command as written. */
  text: string
  /** What it would do, as a verb phrase ("delete 12 files (3.4 MB)"). */
  summary: string
  /** Files, commits or notes behind the summary, one per line. */
  details: string[]
  /** False when the measuring found nothing to lose. */
  isAtRisk: boolean
}

const MAX_ENTRIES = 20_000
const MAX_WALK_MS = 5_000
const SAMPLES = 10

export function count(n: number): string {
  return n.toLocaleString('en-US')
}

export function size(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return unit === 0 ? `${bytes} B` : `${value.toFixed(1)} ${units[unit]}`
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`
}

/** Joins with the separator the base already uses. */
export function joinPath(base: string, path: string): string {
  if (isAbsolute(path)) return path
  const sep = base.includes('\\') && !base.includes('/') ? '\\' : '/'
  const rest = path.replace(/^\.[\\/]+/, '')
  return rest === '.' || rest === '' ? base : base.replace(/[\\/]+$/, '') + sep + rest
}

/** A path for comparing: forward slashes, `.` and `..` folded, no trailing slash, lower case. */
export function normalize(path: string): string {
  const parts: string[] = []
  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (part === '.' || (part === '' && parts.length > 0)) continue
    if (part === '..' && parts.length > 1) parts.pop()
    else parts.push(part)
  }
  return (parts.join('/') || '/').toLowerCase()
}

async function homeOf($: EngineInterface): Promise<string | undefined> {
  return (await $.env.get('HOME').catch(() => undefined)) ?? (await $.env.get('USERPROFILE').catch(() => undefined))
}

/**
 * A path as the file API reads it. On Windows the Bash tool is Git Bash, which writes a drive as
 * `/e/work`: that becomes `E:/work`. Any other path starting with `/` there (`/tmp`) is Git Bash's
 * own mapping, which can't be followed, so it gives null. `~` is the home folder.
 */
export function hostPath(session: string, path: string, home: string | undefined): string | null {
  if (path.startsWith('~')) return home === undefined ? null : joinPath(home, path.slice(1).replace(/^[\\/]/, '') || '.')
  const isWindows = /^[A-Za-z]:/.test(session)
  const drive = /^\/([A-Za-z])(?:\/|$)(.*)$/.exec(path)
  if (isWindows && drive) return `${(drive[1] ?? '').toUpperCase()}:/${drive[2] ?? ''}`
  if (isWindows && /^\/(?!\/)/.test(path)) return null
  return path
}

/** The folder a finding runs in, absolute, or null when it can't be told. */
async function folderOf($: EngineInterface, cwd: string | null): Promise<string | null> {
  if (cwd === null) return null
  const session = await $.session.cwd()
  const path = hostPath(session, cwd, await homeOf($))
  return path === null ? null : joinPath(session, path)
}

async function git($: EngineInterface, dir: string, args: string[]): Promise<string | null> {
  const ran = await $.process.run(['git', ...args], { cwd: dir, timeoutMs: 15_000 }).catch(() => null)
  return ran !== null && ran.exitCode === 0 ? ran.stdout : null
}

/**
 * Whether `dir` is in a git work tree. Only git's own "not a git repository" counts as no: a git
 * that won't start, a folder that isn't there or any other failure is `unknown`, and holds.
 */
async function repoState($: EngineInterface, dir: string): Promise<'repo' | 'none' | 'unknown'> {
  const ran = await $.process.run(['git', 'rev-parse', '--is-inside-work-tree'], { cwd: dir, timeoutMs: 15_000 }).catch(() => null)
  if (ran === null) return 'unknown'
  if (ran.exitCode === 0) return ran.stdout.trim() === 'true' ? 'repo' : 'unknown'
  return /not a git repository/i.test(ran.stderr) ? 'none' : 'unknown'
}

/** Measures a git finding only inside a work tree; `none` means git itself will refuse it. */
async function inRepo(
  $: EngineInterface,
  text: string,
  cwd: string | null,
  measure: (dir: string) => Promise<Part>,
): Promise<Part> {
  const dir = await folderOf($, cwd)
  if (dir === null) return unknown(text, "it's not clear which folder it runs in")
  const state = await repoState($, dir)
  if (state === 'none') return { text, summary: 'do nothing (not a git repository)', details: [], isAtRisk: false }
  if (state === 'unknown') return unknown(text, `git couldn't be asked about ${dir}`)
  return measure(dir)
}

function lines(text: string | null): string[] {
  return (text ?? '').split(/\r?\n/).filter(line => line.trim() !== '')
}

function unknown(text: string, why: string): Part {
  return { text, summary: `can't be measured: ${why}`, details: [], isAtRisk: true }
}

type Tally = { files: number; dirs: number; bytes: number; samples: string[]; isCapped: boolean }

/** Adds what deleting `abs` removes to the tally; false when nothing is there. */
async function walk($: EngineInterface, abs: string, tally: Tally): Promise<boolean> {
  const stat = await $.fs.stat(abs).catch(() => null)
  if (stat === null) return false
  if (stat.kind !== 'dir' || stat.isLink) {
    tally.files++
    tally.bytes += stat.size
    if (tally.samples.length < SAMPLES) tally.samples.push(abs)
    return true
  }
  tally.dirs++
  const queue = [abs]
  const started = Date.now()
  while (queue.length > 0) {
    if (tally.files + tally.dirs >= MAX_ENTRIES || Date.now() - started > MAX_WALK_MS) {
      tally.isCapped = true
      break
    }
    const dir = queue.shift() ?? ''
    for (const entry of await $.fs.list(dir).catch(() => [])) {
      const path = joinPath(dir, entry.name)
      if (entry.kind === 'dir') {
        tally.dirs++
        queue.push(path)
      } else {
        tally.files++
        tally.bytes += entry.size
        if (tally.samples.length < SAMPLES) tally.samples.push(path)
      }
    }
  }
  return true
}

function globRegex(pattern: string): RegExp {
  const body = pattern.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${body}$`, 'i')
}

/** A target with a glob in its last part, expanded against its folder; other globs can't be. */
async function expand($: EngineInterface, dir: string, target: string): Promise<string[] | null> {
  if (!/[*?[]/.test(target)) return [target]
  const cut = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'))
  const parent = cut < 0 ? '' : target.slice(0, cut)
  const pattern = target.slice(cut + 1)
  if (/[*?[]/.test(parent) || pattern.includes('[')) return null
  const regex = globRegex(pattern)
  const entries = await $.fs.list(joinPath(dir, parent || '.')).catch(() => [])
  return entries
    .filter(entry => regex.test(entry.name) && (pattern.startsWith('.') || !entry.name.startsWith('.')))
    .map(entry => (parent ? `${parent}/${entry.name}` : entry.name))
}

async function measureDelete($: EngineInterface, text: string, cwd: string | null, targets: string[]): Promise<Part> {
  const dir = await folderOf($, cwd)
  if (dir === null) return unknown(text, "it's not clear which folder it runs in")
  if ((await $.fs.stat(dir).catch(() => null))?.kind !== 'dir') return unknown(text, `the folder it runs in (${dir}) isn't there`)
  const sessionDir = await $.session.cwd()
  // The project root, which a shell `cd` into one of its folders doesn't move.
  const project = normalize(await $.session.root())
  const home = await homeOf($)
  const tally: Tally = { files: 0, dirs: 0, bytes: 0, samples: [], isCapped: false }
  const notes: string[] = []
  const found: string[] = []
  const missing: string[] = []
  for (const raw of targets) {
    if (/[$%`({]/.test(raw)) {
      notes.push(`${raw}: can't be measured (a variable or expression)`)
      continue
    }
    const target = hostPath(sessionDir, raw, home)
    if (target === null) {
      notes.push(`${raw}: can't be measured (no home folder, or a Git Bash path that isn't on a drive)`)
      continue
    }
    const paths = await expand($, dir, target)
    if (paths === null) {
      notes.push(`${raw}: can't be measured (a glob in a folder name)`)
      continue
    }
    if (paths.length === 0 && !isAbsolute(target)) missing.push(raw)
    for (const path of paths) {
      const abs = joinPath(dir, path)
      const where = normalize(abs)
      if (/^(?:[a-z]:)?\/?$/.test(where)) notes.push(`⚠ ${raw} is the root of a drive or of the file system`)
      else if (home !== undefined && where === normalize(home)) notes.push(`⚠ ${raw} is your home folder`)
      else if (project === where || project.startsWith(`${where}/`)) notes.push(`⚠ ${raw} holds this whole project folder`)
      if (await walk($, abs, tally)) found.push(path)
      else if (!isAbsolute(path)) missing.push(raw)
    }
  }
  const unmeasured = notes.some(note => note.includes("can't be measured"))
  const isDangerous = notes.some(note => note.startsWith('⚠'))
  // A relative path measured from the session's folder: Claude's shell keeps its own folder between
  // calls, so a name that isn't here may well be there. Hold it rather than guess.
  if (found.length === 0 && missing.length > 0 && !unmeasured && !isDangerous) {
    return {
      text,
      summary: `delete ${missing.join(', ')}, which isn't in ${dir}`,
      details: ["If Claude's shell has moved to another folder, it would delete what has that name there."],
      isAtRisk: true,
    }
  }
  if (found.length === 0 && !unmeasured && !isDangerous) {
    return { text, summary: 'delete nothing (no such files)', details: [], isAtRisk: false }
  }
  const tracked = found.length ? lines(await git($, dir, ['ls-files', '--', ...found])).length : 0
  const plus = tally.isCapped ? '+' : ''
  const parts = [`delete ${count(tally.files)}${plus} ${tally.files === 1 ? 'file' : 'files'}`]
  if (tally.dirs > 0) parts.push(`in ${count(tally.dirs)}${plus} ${tally.dirs === 1 ? 'folder' : 'folders'}`)
  let summary = `${parts.join(' ')} (${size(tally.bytes)}${plus})`
  if (tracked > 0) summary += `, ${count(tracked)} of them tracked by git`
  if (unmeasured && found.length === 0) summary = "delete files that can't be measured"
  const strip = (path: string) => {
    const base = dir.replace(/[\\/]+$/, '')
    return normalize(path).startsWith(`${normalize(base)}/`) ? path.slice(base.length + 1) : path
  }
  const details = [...notes, ...tally.samples.map(strip)]
  if (tally.files > tally.samples.length) details.push(`… and ${count(tally.files - tally.samples.length)}${plus} more`)
  return { text, summary, details, isAtRisk: true }
}

function shortstat(text: string | null): string {
  const line = lines(text)[0]?.trim() ?? ''
  const inserted = /(\d+) insertion/.exec(line)?.[1]
  const deleted = /(\d+) deletion/.exec(line)?.[1]
  return inserted || deleted ? ` (+${inserted ?? 0} −${deleted ?? 0} lines)` : ''
}

async function measureReset($: EngineInterface, text: string, dir: string, ref: string): Promise<Part> {
  const status = await git($, dir, ['status', '--porcelain'])
  if (status === null) return unknown(text, "git status didn't run")
  const changed = lines(status).filter(line => !line.startsWith('??'))
  const summary: string[] = []
  const details: string[] = changed.slice(0, SAMPLES).map(line => line.slice(3))
  if (changed.length > SAMPLES) details.push(`… and ${count(changed.length - SAMPLES)} more`)
  if (changed.length > 0) {
    const stat = shortstat(await git($, dir, ['diff', '--shortstat', 'HEAD']))
    summary.push(`throw away uncommitted changes in ${plural(changed.length, 'file')}${stat}`)
  }
  if (ref !== 'HEAD') {
    const behind = await git($, dir, ['rev-list', '--count', `${ref}..HEAD`])
    const n = Number.parseInt(behind ?? '', 10)
    if (behind === null) summary.push(`move the branch to ${ref}, which can't be resolved`)
    else if (n > 0) {
      summary.push(`move the branch back ${plural(n, 'commit')} (still in the reflog)`)
      details.push(...lines(await git($, dir, ['log', '--format=%h %s', `-n${SAMPLES}`, `${ref}..HEAD`])))
    }
  }
  if (summary.length === 0) return { text, summary: 'change nothing (no uncommitted changes)', details: [], isAtRisk: false }
  return { text, summary: summary.join(' and '), details, isAtRisk: true }
}

async function measureDiscard(
  $: EngineInterface,
  text: string,
  dir: string,
  paths: string[],
  isAll: boolean,
): Promise<Part> {
  const scope = paths.length ? ['--', ...paths] : []
  const status = await git($, dir, ['status', '--porcelain', ...scope])
  if (status === null) return unknown(text, "git status didn't run")
  const changed = lines(status).filter(line => !line.startsWith('??') && (isAll || line[1] !== ' '))
  if (changed.length === 0) return { text, summary: 'change nothing (no unstaged changes)', details: [], isAtRisk: false }
  const stat = shortstat(await git($, dir, ['diff', '--shortstat', ...(isAll ? ['HEAD'] : []), ...scope]))
  const details = changed.slice(0, SAMPLES).map(line => line.slice(3))
  if (changed.length > SAMPLES) details.push(`… and ${count(changed.length - SAMPLES)} more`)
  return { text, summary: `throw away changes in ${plural(changed.length, 'file')}${stat}`, details, isAtRisk: true }
}

async function measureClean($: EngineInterface, text: string, dir: string, args: string[]): Promise<Part> {
  const listed = await git($, dir, ['clean', ...args])
  if (listed === null) return unknown(text, "git clean -n didn't run here")
  const paths = lines(listed).map(line => line.replace(/^Would (?:remove|skip repository) /, ''))
  if (paths.length === 0) return { text, summary: 'delete nothing (no untracked files)', details: [], isAtRisk: false }
  const details = paths.slice(0, SAMPLES)
  if (paths.length > SAMPLES) details.push(`… and ${count(paths.length - SAMPLES)} more`)
  return { text, summary: `delete ${plural(paths.length, 'untracked path')}`, details, isAtRisk: true }
}

async function measurePush(
  $: EngineInterface,
  text: string,
  dir: string,
  remote: string | null,
  refspecs: string[],
  hasLease: boolean,
): Promise<Part> {
  const upstream = (await git($, dir, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']))?.trim()
  const current = (await git($, dir, ['rev-parse', '--abbrev-ref', 'HEAD']))?.trim() ?? 'HEAD'
  const slash = upstream?.indexOf('/') ?? -1
  const target = remote ?? (upstream && slash > 0 ? upstream.slice(0, slash) : 'origin')
  const pairs =
    refspecs.length > 0
      ? refspecs.map(spec => {
          const [src = '', dst] = spec.replace(/^\+/, '').split(':')
          const local = src === '' || src === 'HEAD' ? 'HEAD' : src
          const name = dst ?? (src === 'HEAD' ? current : src)
          return { src: local, dst: name.replace(/^refs\/heads\//, '') }
        })
      : [{ src: 'HEAD', dst: upstream && slash > 0 && !remote ? upstream.slice(slash + 1) : current }]
  const summary: string[] = []
  const details: string[] = []
  let isUnknown = false
  let dropped = 0
  for (const { src, dst } of pairs) {
    const tracking = `refs/remotes/${target}/${dst}`
    if ((await git($, dir, ['rev-parse', '--verify', '--quiet', tracking])) === null) {
      isUnknown = true
      summary.push(`overwrite ${target}/${dst}, which has no fetched copy here, so what it drops can't be listed`)
      continue
    }
    const n = Number.parseInt((await git($, dir, ['rev-list', '--count', `${src}..${tracking}`])) ?? '0', 10)
    dropped += n
    if (n > 0) {
      summary.push(`drop ${plural(n, 'commit')} from ${target}/${dst}`)
      details.push(...lines(await git($, dir, ['log', '--format=%h %s', `-n${SAMPLES}`, `${src}..${tracking}`])))
    } else summary.push(`overwrite ${target}/${dst} (drops nothing as of your last fetch)`)
  }
  const isAtRisk = isUnknown || dropped > 0 || !hasLease
  return { text, summary: summary.join(' and '), details, isAtRisk }
}

/** Measures one finding with the file system and git, never through a shell. */
export async function measureOne($: EngineInterface, finding: Finding): Promise<Part> {
  const { text, cwd } = finding
  switch (finding.kind) {
    case 'delete':
      return measureDelete($, text, cwd, finding.targets)
    case 'git-reset-hard':
      return inRepo($, text, cwd, dir => measureReset($, text, dir, finding.ref))
    case 'git-discard':
      return inRepo($, text, cwd, dir => measureDiscard($, text, dir, finding.paths, finding.isAll))
    case 'git-clean':
      return inRepo($, text, cwd, dir => measureClean($, text, dir, finding.args))
    case 'git-force-push':
      return inRepo($, text, cwd, dir => measurePush($, text, dir, finding.remote, finding.refspecs, finding.hasLease))
    case 'migration':
      return {
        text,
        summary: `run a ${finding.tool} database migration, which git can't undo`,
        details: ['Pending migrations aren\'t listed: listing them would run your project\'s code first.'],
        isAtRisk: true,
      }
    case 'opaque':
      return unknown(text, finding.why)
  }
}
