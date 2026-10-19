/** The shell a command line is written for: the Bash tool's, the PowerShell tool's, or cmd /c. */
export type Shell = 'bash' | 'powershell' | 'cmd'

type Base = {
  /** The risky command as written, for the report. */
  text: string
  /** Where it runs: relative to the session's folder ('.' is that folder), absolute, or null when unknown. */
  cwd: string | null
}

/** One risky part of a command line, before anything is measured. */
export type Finding = Base &
  (
    | { kind: 'delete'; targets: string[] }
    | { kind: 'git-reset-hard'; ref: string }
    | { kind: 'git-discard'; paths: string[]; isAll: boolean }
    | { kind: 'git-clean'; args: string[] }
    | { kind: 'git-force-push'; remote: string | null; refspecs: string[]; hasLease: boolean }
    | { kind: 'migration'; tool: string }
    | { kind: 'opaque'; why: string }
  )

type Token = { word: string } | { op: string }

const ESCAPE: Record<Shell, string | null> = { bash: '\\', powershell: '`', cmd: null }

/** Splits a command line into words and operators, dropping quotes, comments and redirections. */
export function tokenize(line: string, shell: Shell): Token[] {
  const tokens: Token[] = []
  const escape = ESCAPE[shell]
  let word = ''
  let isInWord = false
  const flush = () => {
    if (isInWord) tokens.push({ word })
    word = ''
    isInWord = false
  }
  /** Index of the paren closing the one at `open`, quotes skipped. */
  const closing = (open: number) => {
    let depth = 0
    for (let j = open; j < line.length; j++) {
      const c = line[j]
      if (c === "'" || c === '"') {
        const end = line.indexOf(c, j + 1)
        j = end < 0 ? line.length : end
      } else if (c === '(') depth++
      else if (c === ')' && --depth === 0) return j
    }
    return line.length - 1
  }
  for (let i = 0; i < line.length; i++) {
    const c = line[i] ?? ''
    const next = line[i + 1]
    if (escape !== null && c === escape && next !== undefined) {
      if (next !== '\n') word += next
      isInWord = isInWord || next !== '\n'
      i++
      continue
    }
    if (c === "'" && shell !== 'cmd') {
      const end = line.indexOf("'", i + 1)
      const stop = end < 0 ? line.length : end
      word += line.slice(i + 1, stop)
      isInWord = true
      i = stop
      continue
    }
    if (c === '"') {
      let j = i + 1
      for (; j < line.length && line[j] !== '"'; j++) {
        const inner = line[j] ?? ''
        const after = line[j + 1] ?? ''
        const isEscaped = escape !== null && inner === escape && (shell === 'powershell' || '"\\$`\n'.includes(after))
        if (isEscaped && after !== '') {
          j++
          if (after !== '\n') word += after
        } else word += inner
      }
      isInWord = true
      i = j
      continue
    }
    // $( ... ) in either shell, and ( ... ) in PowerShell, stay one opaque piece of the word.
    if ((c === '$' && next === '(') || (c === '(' && shell === 'powershell')) {
      const end = closing(c === '$' ? i + 1 : i)
      word += line.slice(i, end + 1)
      isInWord = true
      i = end
      continue
    }
    if (c === '#' && !isInWord && shell !== 'cmd') {
      const end = line.indexOf('\n', i)
      if (end < 0) break
      i = end - 1
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      flush()
      continue
    }
    if (c === '\n') {
      flush()
      tokens.push({ op: ';' })
      continue
    }
    if (c === '>' || c === '<' || (c === '&' && next === '>')) {
      if (/^\d+$/.test(word) || word === '*') {
        word = ''
        isInWord = false
      } else flush()
      let j = i + 1
      while (j < line.length && '>&|<'.includes(line[j] ?? '')) j++
      if (line.slice(i, j).endsWith('&') && /[\d-]/.test(line[j] ?? '')) {
        while (j < line.length && /[\d-]/.test(line[j] ?? '')) j++
      } else tokens.push({ op: 'redirect' })
      i = j - 1
      continue
    }
    const isGroup = shell === 'powershell' ? c === '{' || c === '}' : c === '(' || c === ')'
    if (c === '&' || c === '|' || c === ';' || (isGroup && !isInWord)) {
      flush()
      const two = line.slice(i, i + 2)
      if (two === '&&' || two === '||') {
        tokens.push({ op: two })
        i++
      } else tokens.push({ op: c === '{' ? '(' : c === '}' ? ')' : c })
      continue
    }
    word += c
    isInWord = true
  }
  flush()
  return tokens
}

/** The command's name as typed, without a folder, `.exe` or case. */
export function nameOf(word: string | undefined): string {
  return (word ?? '')
    .replace(/^.*[\\/]/, '')
    .replace(/\.exe$/i, '')
    .toLowerCase()
}

export function isAbsolute(path: string): boolean {
  return /^(?:[A-Za-z]:|[\\/]|~(?:[\\/]|$))/.test(path)
}

function joinCwd(cwd: string | null, path: string): string | null {
  if (cwd === null || path === '' || path === '-' || /[$%`]/.test(path)) return null
  if (isAbsolute(path) || cwd === '.') return path
  return `${cwd.replace(/[\\/]+$/, '')}/${path}`
}

/** Wrappers that run the command after them, with the options of theirs that take a value. */
const WRAPPERS: Record<string, string[]> = {
  sudo: ['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-U'],
  doas: ['-u', '-C'],
  env: ['-u', '-C', '-S'],
  nice: ['-n'],
  ionice: ['-c', '-n'],
  timeout: ['-s', '-k', '--signal', '--kill-after'],
  stdbuf: ['-i', '-o', '-e'],
  nohup: [],
  time: [],
  command: [],
  builtin: [],
  exec: [],
}
const XARGS_VALUES = ['-I', '-n', '-P', '-L', '-d', '-s', '-E', '-a']
const UNIX_SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh'])
const PS_HOSTS = new Set(['pwsh', 'powershell'])
const PS_REMOVE = new Set(['remove-item', 'ri', 'rm', 'del', 'erase', 'rd', 'rmdir'])
const PS_REMOVE_VALUES = ['-path', '-literalpath', '-lp', '-pspath', '-filter', '-include', '-exclude', '-credential', '-stream']
const PS_REMOVE_PATHS = ['-path', '-literalpath', '-lp', '-pspath']
const CD = new Set(['cd', 'chdir', 'pushd', 'sl', 'set-location', 'push-location'])
const POPD = new Set(['popd', 'pop-location'])
const READERS = new Set(['git', 'echo', 'printf', 'cat', 'grep', 'rg', 'ls', 'less', 'head', 'tail', 'find', 'type', 'get-content', 'write-output', 'write-host', 'code'])

const MIGRATIONS: Array<[RegExp, string]> = [
  [/\bmanage\.py\s+migrate\b/, 'Django'],
  [/\b(?:rake|rails)\s+db:(?:migrate|rollback|reset|drop|setup|schema:load)\b/, 'Rails'],
  [/\balembic\s+(?:upgrade|downgrade|stamp)\b/, 'Alembic'],
  [/\bprisma\s+(?:migrate\s+(?:deploy|reset|dev)|db\s+push)\b/, 'Prisma'],
  [/\bdotnet(?:\s+|-)ef\s+database\s+(?:update|drop)\b/, 'Entity Framework'],
  [/^update-database\b/, 'Entity Framework'],
  [/\bflyway\b.*\b(?:migrate|clean|undo|repair)\b/, 'Flyway'],
  [/\bliquibase\b.*\b(?:update|rollback|drop-all|dropall)\b/, 'Liquibase'],
  [/\bknex\s+migrate:/, 'Knex'],
  [/\bsequelize(?:-cli)?\s+db:migrate/, 'Sequelize'],
  [/\btypeorm\b.*\bmigration:(?:run|revert)\b/, 'TypeORM'],
  [/\bdrizzle-kit\s+(?:push|migrate)\b/, 'Drizzle'],
]

/** Each short-flag cluster's letters (`-fdx` gives f, d, x), with repeats counted. */
function letters(args: readonly string[]): string {
  return args.filter(a => /^-[A-Za-z]+$/.test(a)).map(a => a.slice(1)).join('')
}

function gitFinding(args: readonly string[], cwd: string | null, text: string): Finding | null {
  let i = 0
  let dir = cwd
  while (i < args.length && (args[i] ?? '').startsWith('-')) {
    const a = args[i] ?? ''
    if (a === '-C') dir = joinCwd(dir, args[i + 1] ?? '')
    i += ['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(a) ? 2 : 1
  }
  const sub = args[i]
  const rest = args.slice(i + 1)
  const flags = letters(rest)
  const base = { text, cwd: dir }
  if (sub === 'reset' && rest.includes('--hard')) {
    return { ...base, kind: 'git-reset-hard', ref: rest.find(a => !a.startsWith('-')) ?? 'HEAD' }
  }
  if (sub === 'checkout') {
    const dashes = rest.indexOf('--')
    if (dashes >= 0) {
      const paths = rest.slice(dashes + 1)
      return paths.length ? { ...base, kind: 'git-discard', paths, isAll: false } : null
    }
    if (rest.includes('.')) return { ...base, kind: 'git-discard', paths: ['.'], isAll: false }
    if (rest.includes('--force') || flags.includes('f')) return { ...base, kind: 'git-discard', paths: [], isAll: true }
    return null
  }
  if (sub === 'restore') {
    const isStaged = rest.includes('--staged') || flags.includes('S')
    const isWorktree = rest.includes('--worktree') || flags.includes('W')
    if (isStaged && !isWorktree) return null
    const dashes = rest.indexOf('--')
    const paths =
      dashes >= 0
        ? rest.slice(dashes + 1)
        : rest.filter((a, n) => !a.startsWith('-') && rest[n - 1] !== '-s' && rest[n - 1] !== '--source')
    return paths.length ? { ...base, kind: 'git-discard', paths, isAll: false } : null
  }
  if (sub === 'clean') {
    const isForced = rest.includes('--force') || flags.includes('f')
    const isDry = rest.includes('--dry-run') || flags.includes('n')
    const isInteractive = rest.includes('--interactive') || flags.includes('i')
    if (!isForced || isDry || isInteractive) return null
    const dry = ['-n']
    if ((flags.match(/f/g) ?? []).length + rest.filter(a => a === '--force').length > 1) dry.push('-f', '-f')
    if (flags.includes('d')) dry.push('-d')
    if (flags.includes('x')) dry.push('-x')
    if (flags.includes('X')) dry.push('-X')
    const paths: string[] = []
    for (let n = 0; n < rest.length; n++) {
      const a = rest[n] ?? ''
      if (a === '-e' || a === '--exclude') dry.push('-e', rest[++n] ?? '')
      else if (a.startsWith('--exclude=')) dry.push(a)
      else if (a === '--') {
        paths.push(...rest.slice(n + 1))
        break
      } else if (!a.startsWith('-')) paths.push(a)
    }
    if (paths.length) dry.push('--', ...paths)
    return { ...base, kind: 'git-clean', args: dry }
  }
  if (sub === 'push') {
    let isForced = false
    let hasLease = false
    const positionals: string[] = []
    for (let n = 0; n < rest.length; n++) {
      const a = rest[n] ?? ''
      if (a === '--force' || (/^-[A-Za-z]+$/.test(a) && a.includes('f'))) isForced = true
      else if (a === '--force-with-lease' || a.startsWith('--force-with-lease=')) hasLease = true
      else if (['-o', '--push-option', '--repo', '--receive-pack', '--exec'].includes(a)) n++
      else if (!a.startsWith('-')) positionals.push(a)
    }
    const refspecs = positionals.slice(1)
    if (refspecs.some(r => r.startsWith('+'))) isForced = true
    if (!isForced && !hasLease) return null
    return { ...base, kind: 'git-force-push', remote: positionals[0] ?? null, refspecs, hasLease: hasLease && !isForced }
  }
  return null
}

function deleteFinding(
  name: string,
  args: readonly string[],
  shell: Shell,
  base: Base,
  isPiped: boolean,
): Finding | null {
  let isRisky = false
  const targets: string[] = []
  if (shell === 'powershell' && PS_REMOVE.has(name)) {
    for (let n = 0; n < args.length; n++) {
      const a = args[n] ?? ''
      const lower = a.toLowerCase()
      if (!a.startsWith('-')) targets.push(...a.split(',').filter(Boolean))
      else if (lower.startsWith('-recurse:') || (lower.length >= 2 && '-recurse'.startsWith(lower))) isRisky = true
      else if (lower.startsWith('-force:') || (lower.length >= 3 && '-force'.startsWith(lower))) isRisky = true
      else if (lower.length >= 3 && PS_REMOVE_VALUES.some(p => p.startsWith(lower) || p === lower)) {
        const value = args[++n] ?? ''
        if (PS_REMOVE_PATHS.some(p => p.startsWith(lower))) targets.push(...value.split(',').filter(Boolean))
      }
    }
  } else if (shell === 'cmd' && (name === 'rd' || name === 'rmdir' || name === 'del' || name === 'erase')) {
    const switches = args.filter(a => a.startsWith('/')).map(a => a.toLowerCase())
    isRisky = switches.includes('/s') || ((name === 'del' || name === 'erase') && (switches.includes('/q') || switches.includes('/f')))
    targets.push(...args.filter(a => !a.startsWith('/')))
  } else if (name === 'rm') {
    let isEnd = false
    for (const a of args) {
      if (isEnd || !a.startsWith('-') || a === '-') targets.push(a)
      else if (a === '--') isEnd = true
      else if (a === '--recursive' || a === '--force') isRisky = true
      else if (!a.startsWith('--') && /[rRf]/.test(a)) isRisky = true
    }
  } else return null
  if (!isRisky) return null
  if (targets.length) return { ...base, kind: 'delete', targets }
  return isPiped ? { ...base, kind: 'opaque', why: 'the files to delete come through a pipe' } : null
}

type Context = { shell: Shell; cwd: string | null; dirs: (string | null)[]; out: Finding[] }

/** Looks at one simple command; returns the folder the next command runs in. */
function visit(words: readonly string[], ctx: Context, isPiped: boolean): string | null {
  const { shell, cwd, dirs, out } = ctx
  let i = 0
  let isViaXargs = false
  if (shell === 'bash') while (/^[A-Za-z_]\w*=/.test(words[i] ?? '')) i++
  for (;;) {
    const name = nameOf(words[i])
    const values = WRAPPERS[name]
    if (values !== undefined) {
      i++
      while ((words[i] ?? '').startsWith('-') || (name === 'env' && /^[A-Za-z_]\w*=/.test(words[i] ?? ''))) {
        i += values.includes(words[i] ?? '') ? 2 : 1
      }
      if (name === 'timeout') i++
      continue
    }
    if (name === 'xargs') {
      isViaXargs = true
      i++
      while ((words[i] ?? '').startsWith('-')) i += XARGS_VALUES.includes(words[i] ?? '') ? 2 : 1
      continue
    }
    break
  }
  const name = nameOf(words[i])
  const args = words.slice(i + 1)
  const text = words.join(' ')
  const base: Base = { text, cwd }

  if (UNIX_SHELLS.has(name)) {
    const flag = args.findIndex(a => /^-[a-z]*c[a-z]*$/.test(a))
    const script = flag >= 0 ? args[flag + 1] : undefined
    if (script !== undefined) out.push(...detect(script, 'bash', cwd))
    return cwd
  }
  if (PS_HOSTS.has(name)) {
    const lower = args.map(a => a.toLowerCase())
    if (lower.some(a => a.startsWith('-e') && '-encodedcommand'.startsWith(a))) {
      out.push({ ...base, kind: 'opaque', why: 'the script is encoded' })
      return cwd
    }
    const flag = lower.findIndex(a => a.length >= 2 && '-command'.startsWith(a))
    if (flag >= 0) out.push(...detect(args.slice(flag + 1).join(' '), 'powershell', cwd))
    return cwd
  }
  if (name === 'cmd') {
    const flag = args.findIndex(a => /^\/[ck]$/i.test(a))
    if (flag >= 0) out.push(...detect(args.slice(flag + 1).join(' '), 'cmd', cwd))
    return cwd
  }
  if (CD.has(name)) {
    const target = args.find(a => !a.startsWith('-') && !/^\/d$/i.test(a))
    if (name === 'pushd' || name === 'push-location') dirs.push(cwd)
    if (target === undefined) return shell === 'bash' ? null : cwd
    return joinCwd(cwd, target)
  }
  if (POPD.has(name)) return dirs.length ? (dirs.pop() ?? null) : null

  if (name === 'git') {
    const found = gitFinding(args, cwd, text)
    if (found) out.push(found)
    return cwd
  }
  if (name === 'find') {
    const lower = args.map(a => a.toLowerCase())
    const exec = lower.findIndex(a => a === '-exec' || a === '-execdir' || a === '-ok')
    if (lower.includes('-delete') || (exec >= 0 && nameOf(lower[exec + 1]) === 'rm')) {
      out.push({ ...base, kind: 'opaque', why: 'find picks the files to delete when it runs' })
    }
    return cwd
  }
  const deleted = deleteFinding(name, args, shell, base, isPiped)
  if (deleted) {
    out.push(isViaXargs ? { ...base, kind: 'opaque', why: 'the files to delete come through a pipe' } : deleted)
    return cwd
  }
  if (!READERS.has(name)) {
    const line = [name, ...args].join(' ').toLowerCase()
    const known = MIGRATIONS.find(([pattern]) => pattern.test(line))
    if (known) out.push({ ...base, kind: 'migration', tool: known[1] })
    else if (args.some(a => /^(?:db:)?migrate(?::[\w-]+)?$/i.test(a))) out.push({ ...base, kind: 'migration', tool: name })
  }
  return cwd
}

/**
 * The risky parts of a command line: deletes, git commands that throw work away,
 * force pushes and database migrations. A leading `cd dir &&`, pushd/popd and
 * `git -C dir` move where each part runs; a `cd` inside `( … )` stays inside.
 */
export function detect(line: string, shell: Shell, cwd: string | null = '.'): Finding[] {
  const ctx: Context = { shell, cwd, dirs: [], out: [] }
  const groups: (string | null)[] = []
  let words: string[] = []
  let isDropping = false
  let isPiped = false
  const run = () => {
    if (words.length) ctx.cwd = visit(words, ctx, isPiped)
    words = []
  }
  for (const token of tokenize(line, shell)) {
    if ('word' in token) {
      if (isDropping) isDropping = false
      else words.push(token.word)
      continue
    }
    if (token.op === 'redirect') {
      isDropping = true
      continue
    }
    run()
    isPiped = token.op === '|'
    if (token.op === '(') groups.push(ctx.cwd)
    else if (token.op === ')') ctx.cwd = groups.length ? (groups.pop() ?? null) : ctx.cwd
  }
  run()
  return ctx.out
}
