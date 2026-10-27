import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

const NOW = Date.UTC(2026, 9, 26, 12, 0, 0)
const MINUTE = 60_000

const PANE = {
  component: 'Pane',
  requestId: 'atc-filetree',
  props: { title: 'Files', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { bodyRows: 20 } } as never,
} as const

// The engine may hand paths over absolute for this platform: compare them without drive or separators.
const norm = (path: string) => path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '').replace(/\/$/, '')

type Git = {
  prefix?: string
  status?: string
  numstat?: string
  /** What `git rev-parse HEAD` answers, one value per call; the last repeats. */
  heads?: string[]
  /** The files of the last commit, as `git diff-tree` lists them. */
  committed?: string[]
  /** What `git ls-files` lists. */
  tracked?: string[]
}

type Setup = {
  /** Files under the root, by path relative to it, with their size. */
  files?: Record<string, number>
  /** null: the folder is no repository. */
  git?: Git | null
  options?: Record<string, unknown>
  uname?: string
  /** The session's project root; a drive letter makes it Windows. */
  root?: string
  /** Where the shell is, when a `cd` took it away from the root. */
  cwd?: string
  /** Whether `where.exe code.cmd` finds VS Code, on Windows. */
  hasVscode?: boolean
}

const LAUNCHER = 'C:\\Code\\bin\\code.cmd'

const STATUS = ['# branch.head main', '# branch.ab +2 -0', '1 .M N... 100644 100644 100644 a a README.md', '? src/lib/new.ts', '! dist/', ''].join('\0')

async function session($: Engine, on: On, setup: Setup = {}) {
  const root = setup.root ?? '/repo'
  const cwd = setup.cwd ?? root
  const clock: MockClock = mock.clock(on, { now: NOW })
  const files = setup.files ?? { 'README.md': 100, 'src/a.ts': 2048, 'src/lib/b.ts': 10, 'src/lib/new.ts': 5, 'dist/out.js': 1, 'tools/x.ps1': 1, 'tools/run': 1 }
  const git = setup.git === null ? null : { prefix: '', status: STATUS, numstat: ['3\t1\tREADME.md', ''].join('\0'), ...setup.git }
  const heads = [...(git?.heads ?? ['aaa'])]
  const runs: string[][] = []
  const toasts: string[] = []
  const opened: string[] = []

  on('session.root', async () => ({ value: root }))
  on('session.cwd', async () => ({ value: cwd }))
  on('fs.list', async (_$, e) => {
    const dir = norm(e.path).replace(/^\/repo\/?/, '')
    const names = new Map<string, boolean>()
    for (const path of [...Object.keys(files), '.git/HEAD']) {
      const inside = dir === '' ? path : path.startsWith(`${dir}/`) ? path.slice(dir.length + 1) : null
      if (inside === null) continue
      const [name = '', ...rest] = inside.split('/')
      names.set(name, rest.length > 0)
    }
    if (names.size === 0 && dir !== '') throw new Error(`ENOENT: ${e.path}`)
    return {
      value: [...names].map(([name, isDir]) => ({
        name,
        kind: isDir ? 'dir' : 'file',
        size: isDir ? 0 : (files[dir === '' ? name : `${dir}/${name}`] ?? 0),
        mtimeMs: isDir ? 0 : NOW - 5 * MINUTE,
        isLink: false,
      })),
    } as never
  })
  on('fs.read', async (_$, e) => {
    if (e.path === LAUNCHER) return { value: '"%~dp0..\\Code.exe" "%~dp0..\\abc123\\resources\\app\\out\\cli.js" %*\r\n' } as never
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('fs.exists', async (_$, e) => ({ value: e.path.startsWith('C:\\Code\\') }))
  on('fs.stat', async (_$, e) => {
    const path = norm(e.path)
    const isDir = path === '/repo' || Object.keys(files).some(file => `/repo/${file}`.startsWith(`${path}/`))
    if (!isDir) throw new Error(`ENOENT: ${e.path}`)
    return { value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: path } } as never
  })
  on('process.run', async (_$, e) => {
    const argv = [...e.argv]
    runs.push(argv)
    const ok = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '' } }) as never
    const command = argv.filter(arg => arg !== '--no-optional-locks').slice(0, 2).join(' ')
    if (argv[0] === 'uname') return ok(`${setup.uname ?? 'Linux'}\n`)
    if (argv[0] === 'where.exe') return setup.hasVscode === false ? ({ value: { exitCode: 1, stdout: '', stderr: '' } } as never) : ok(`${LAUNCHER}\r\n`)
    if (argv[0] !== 'git') return ok()
    if (git === null) return { value: { exitCode: 128, stdout: '', stderr: 'fatal: not a git repository' } } as never
    if (command === 'git rev-parse') return argv[2] === 'HEAD' ? ok(`${heads.length > 1 ? heads.shift() : heads[0]}\n`) : ok(`${git.prefix}\n`)
    if (command === 'git status') return ok(git.status)
    if (command === 'git diff') return ok(git.numstat)
    if (command === 'git diff-tree') return ok([...(git.committed ?? []), ''].join('\0'))
    if (command === 'git ls-files') return ok([...(git.tracked ?? Object.keys(files)), ''].join('\0'))
    return ok()
  })
  const panes = new Map<string, boolean>()
  on('ui.open', async (_$, e) => {
    opened.push(e.id)
    panes.set(e.id, true)
    return { value: { isPlaced: true } } as never
  })
  on('ui.panes', async () => ({
    value: [...panes].map(([id, isShown]) => ({ id, title: id, isShown, isFocused: isShown, isPlaced: true })),
  }) as never)
  on('ui.close', async (_$, e) => {
    panes.delete(e.id)
    return { value: undefined } as never
  })
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as never)
  // The ring lands where it was asked: the engine's own answer to a move.
  on('ui.focus', async () => ({}) as never)
  on('command.register', async () => ({ value: undefined }) as never)
  on('tool.call', async () => ({ result: 'ok' }) as never)
  on('prompt.submit', async (_$, e) => ({ text: e.text, context: e.context }) as never)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: root, surface: 'terminal', isInteractive: true })
  return { clock, runs, toasts, opened }
}

const filetree = ($: Engine, args = '') => $.command.run({ command: 'atc-filetree', args } as never)
let calls = 0
const tool = ($: Engine, name: string, input: Record<string, unknown>) =>
  $.tool.call({ tool: name, tool_use_id: `tu${++calls}`, ...input } as never)

async function pane($: Engine, surface: 'terminal' | 'desktop' = 'terminal') {
  return $.ui.mount({ plugin: 'atc-filetree', surface, ...PANE })
}

/** The rows drawn, by path, each with the cursor's mark when it is on that row. */
async function rows(ui: Awaited<ReturnType<typeof pane>>): Promise<string[]> {
  const buttons = await ui.findAll({ type: 'Button' })
  return buttons
    .filter(button => button.key?.startsWith('row:'))
    .map(button => `${button.text.startsWith('›') ? '› ' : ''}${(button.key as string).slice(4)}`)
}

test('/atc-filetree opens the tree: folders first, git status with line counts, the branch above', async ($, on) => {
  const { opened } = await session($, on)
  const ran = await filetree($)
  expect(opened).toEqual(['atc-filetree'])
  expect((ran as { text: string }).text).toMatch(/ctrl\+x tab/)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await pane($, surface)
    expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
    expect((await ui.find({ type: 'Text', text: 'M +3 -1' }))?.props.color).toBe('warning')
    expect(await ui.find({ type: 'Text', text: '⎇ main ↑2' })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: 'src' }))?.props.color).toBe('success')
    expect((await ui.find({ type: 'Text', text: 'dist' }))?.props.dimColor).toBe(true)
    expect(await ui.find({ type: 'Text', text: '.git' })).toBeUndefined()
    await ui.unmount()
  }
})

test('j and k move the cursor, l opens a folder and steps in, h goes up and closes it', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'down' })
  expect(await rows(ui)).toEqual(['dist', '› src', 'tools', 'README.md'])
  await ui.press({ key: 'unfold' })
  expect(await rows(ui)).toEqual(['dist', '› src', 'src/lib', 'src/a.ts', 'tools', 'README.md'])
  await ui.press({ key: 'unfold' })
  expect(await rows(ui)).toEqual(['dist', 'src', '› src/lib', 'src/a.ts', 'tools', 'README.md'])
  await ui.press({ key: 'fold' })
  expect(await rows(ui)).toEqual(['dist', '› src', 'src/lib', 'src/a.ts', 'tools', 'README.md'])
  await ui.press({ key: 'fold' })
  expect(await rows(ui)).toEqual(['dist', '› src', 'tools', 'README.md'])
  await ui.press({ key: 'up' })
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  await ui.unmount()
})

test("the file Claude reads is shown and lit purple, one it writes orange, and the marks fade after two minutes", async ($, on) => {
  const { clock } = await session($, on)
  await filetree($)
  await tool($, 'Read', { file_path: '/repo/src/lib/b.ts' })
  const ui = await pane($)
  expect(await rows(ui)).toEqual(['dist', 'src', 'src/lib', '› src/lib/b.ts', 'src/lib/new.ts', 'src/a.ts', 'tools', 'README.md'])
  expect((await ui.find({ type: 'Text', text: 'b.ts' }))?.props.color).toBe('merged')
  await tool($, 'Write', { file_path: '/repo/README.md', content: 'x' })
  expect((await ui.find({ type: 'Text', text: 'README.md' }))?.props.color).toBe('claude')
  await clock.advance(2 * MINUTE + 1000)
  await clock.settle()
  expect((await ui.find({ type: 'Text', text: 'b.ts' }))?.props.color).toBeUndefined()
  expect((await ui.find({ type: 'Text', text: 'README.md' }))?.props.color).toBe('warning')
  await ui.unmount()
})

test('a file outside the folder is left alone', async ($, on) => {
  await session($, on)
  await filetree($)
  await tool($, 'Read', { file_path: '/elsewhere/a.ts' })
  const ui = await pane($)
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  await ui.unmount()
})

test('follow off: a read is lit without moving the tree', { options: { follow: 'off' } }, async ($, on) => {
  await session($, on)
  await filetree($)
  await tool($, 'Read', { file_path: '/repo/README.md' })
  const ui = await pane($)
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  expect((await ui.find({ type: 'Text', text: 'README.md' }))?.props.color).toBe('merged')
  await ui.unmount()
})

test('a commit Claude makes lights its files green; a git command that commits nothing does not', async ($, on) => {
  await session($, on, { git: { heads: ['aaa', 'bbb'], committed: ['README.md'] } })
  await filetree($)
  await tool($, 'Bash', { command: 'git add README.md && git commit -m "docs"' })
  const ui = await pane($)
  expect((await ui.find({ type: 'Text', text: 'README.md' }))?.props.color).toBe('success')
  await ui.unmount()
})

test('a commit that left HEAD where it was marks nothing', async ($, on) => {
  await session($, on, { git: { heads: ['aaa'], committed: ['README.md'] } })
  await filetree($)
  await tool($, 'Bash', { command: 'git commit -m "nothing to commit"' })
  const ui = await pane($)
  expect((await ui.find({ type: 'Text', text: 'README.md' }))?.props.color).toBe('warning')
  await ui.unmount()
})

test('o opens a file in its app without a shell; a script is not opened, and nothing opens a folder', async ($, on) => {
  const { runs, toasts } = await session($, on)
  await filetree($)
  const ui = await pane($)
  for (let k = 0; k < 3; k++) await ui.press({ key: 'down' })
  await ui.press({ key: 'open' })
  expect(norm(runs.at(-1)?.[1] ?? '')).toBe('/repo/README.md')
  expect(runs.at(-1)?.[0]).toBe('xdg-open')
  const opened = () => runs.filter(argv => argv[0] === 'xdg-open').length
  // o on a folder opens it in the tree, not in a file manager.
  await ui.press({ key: 'up' })
  await ui.press({ key: 'open' })
  expect(await rows(ui)).toEqual(['dist', 'src', '› tools', 'tools/run', 'tools/x.ps1', 'README.md'])
  expect(opened()).toBe(1)
  // A file without an extension may be a program, and a script is one: neither is opened.
  await ui.press({ key: 'down' })
  await ui.press({ key: 'open' })
  expect(toasts.at(-1)).toMatch(/run could run if opened, so it wasn't opened/)
  await ui.press({ key: 'down' })
  await ui.press({ key: 'open' })
  expect(toasts.at(-1)).toMatch(/x\.ps1 could run if opened, so it wasn't opened/)
  expect(opened()).toBe(1)
  await ui.unmount()
})

test('on macOS a file opens with open', async ($, on) => {
  const { runs } = await session($, on, { uname: 'Darwin' })
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'row:README.md' })
  expect(runs.at(-1)?.[0]).toBe('open')
  await ui.unmount()
})

test('p picks a file: it goes with the next typed prompt as context, once', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  for (let k = 0; k < 3; k++) await ui.press({ key: 'down' })
  await ui.press({ key: 'pick' })
  expect(await ui.find({ type: 'Text', text: /with your next prompt: README\.md/ })).toBeDefined()
  const slash = await $.prompt.submit({ text: '/help', origin: { kind: 'person' } } as never)
  expect((slash as { context?: string[] }).context).toBeUndefined()
  const sent = await $.prompt.submit({ text: 'what is in it?', origin: { kind: 'person' } } as never)
  expect((sent as { context?: string[] }).context?.[0]).toMatch(/picked this file in the file tree to point you at it: README\.md/)
  const again = await $.prompt.submit({ text: 'and now?', origin: { kind: 'person' } } as never)
  expect((again as { context?: string[] }).context).toBeUndefined()
  await ui.unmount()
})

test('several files can be picked, p again unpicks one, and /atc-filetree unpick drops them all', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'down' })
  await ui.press({ key: 'unfold' })
  await ui.press({ key: 'down' })
  await ui.press({ key: 'down' })
  await ui.press({ key: 'pick' })
  for (let k = 0; k < 3; k++) await ui.press({ key: 'down' })
  await ui.press({ key: 'pick' })
  await ui.press({ key: 'up' })
  await ui.press({ key: 'pick' })
  await ui.press({ key: 'pick' })
  expect(await ui.find({ type: 'Text', text: 'with your next prompt: 2 files: a.ts, README.md' })).toBeDefined()
  expect((await ui.findAll({ type: 'Text', text: /◆/ })).length).toBe(3)
  const sent = await $.prompt.submit({ text: 'compare these', origin: { kind: 'person' } } as never)
  const note = (sent as { context?: string[] }).context?.[0] ?? ''
  expect(note).toMatch(/^The person picked these files in the file tree to point you at them:\n- src\/a\.ts \(.*a\.ts\)\n- README\.md \(.*README\.md\)$/)
  await ui.press({ key: 'pick' })
  expect(((await filetree($, 'unpick')) as { text: string }).text).toBe('No files picked.')
  expect(await ui.find({ type: 'Text', text: /with your next prompt/ })).toBeUndefined()
  await ui.unmount()
})

test('s finds a file by part of its path, and choosing it shows it in the tree', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'find' })
  await ui.input({ key: 'search', text: 'new', kind: 'change' })
  expect((await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('hit:')).map(b => b.key)).toEqual(['hit:src/lib/new.ts'])
  await ui.input({ key: 'search', text: 'new' })
  expect(await rows(ui)).toEqual(['dist', 'src', 'src/lib', 'src/lib/b.ts', '› src/lib/new.ts', 'src/a.ts', 'tools', 'README.md'])
  await ui.unmount()
})

test('outside a repository the tree shows without git, and search walks the folder', async ($, on) => {
  await session($, on, { git: null })
  await filetree($)
  const ui = await pane($)
  expect(await ui.find({ type: 'Text', text: /^⎇/ })).toBeUndefined()
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  await ui.press({ key: 'find' })
  await ui.input({ key: 'search', text: 'b.ts', kind: 'change' })
  expect((await ui.findAll({ type: 'Button' })).filter(b => b.key?.startsWith('hit:')).map(b => b.key)).toEqual(['hit:src/lib/b.ts'])
  await ui.unmount()
})

test('the column shows size when asked', { options: { column: 'size' } }, async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'down' })
  await ui.press({ key: 'unfold' })
  expect(await ui.find({ type: 'Text', text: '2.0 KB' })).toBeDefined()
  await ui.unmount()
})

test('/atc-filetree <path> shows that folder; /atc-filetree again closes the tree', async ($, on) => {
  await session($, on)
  expect(((await filetree($, 'src')) as { text: string }).text).toMatch(/^Showing .*src/)
  const ui = await pane($)
  expect(await rows(ui)).toEqual(['› lib', 'a.ts'])
  await ui.unmount()
  expect(((await filetree($, 'nope')) as { text: string }).text).toBe('nope is not a folder.')
  expect(((await filetree($)) as { text: string }).text).toBe('Tree closed.')
})

test("the tree and /atc-filetree <path> start at the project root, not where the shell's cd went", async ($, on) => {
  await session($, on, { root: '/repo', cwd: '/repo/src/lib' })
  await filetree($)
  const ui = await pane($)
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  await ui.unmount()
  expect(((await filetree($, 'src')) as { text: string }).text).toMatch(/^Showing .*src/)
  const shown = await pane($)
  expect(await rows(shown)).toEqual(['› lib', 'a.ts'])
  await shown.unmount()
})

test('Enter in an empty search field closes the search', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'find' })
  expect(await ui.find({ type: 'Input' })).toBeDefined()
  await ui.input({ key: 'search', text: '' })
  expect(await ui.find({ type: 'Input' })).toBeUndefined()
  expect(await rows(ui)).toEqual(['› dist', 'src', 'tools', 'README.md'])
  await ui.unmount()
})

test('the cursor follows the focus ring, so l, h and o act on the row the arrows or a click lit', async ($, on) => {
  await session($, on)
  await filetree($)
  const ui = await pane($)
  await $.ui.focus({ component: 'Pane', requestId: 'atc-filetree', plugin: 'atc-filetree', element: 'row:tools', origin: { kind: 'person' } } as never)
  expect(await rows(ui)).toEqual(['dist', 'src', '› tools', 'README.md'])
  await ui.press({ key: 'unfold' })
  expect(await rows(ui)).toEqual(['dist', 'src', '› tools', 'tools/run', 'tools/x.ps1', 'README.md'])
  await $.ui.focus({ component: 'Pane', requestId: 'atc-filetree', plugin: 'atc-filetree', element: 'row:src', origin: { kind: 'person' } } as never)
  await ui.press({ key: 'open' })
  expect(await rows(ui)).toEqual(['dist', '› src', 'src/lib', 'src/a.ts', 'tools', 'tools/run', 'tools/x.ps1', 'README.md'])
  await ui.unmount()
})

test('on Windows a file opens in VS Code through its cli, scripts too; without VS Code it says so', async ($, on) => {
  const { runs } = await session($, on, { root: 'C:\\repo' })
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'row:README.md' })
  const opened = runs.at(-1) as string[]
  expect(opened.slice(0, 2)).toEqual(['C:\\Code\\Code.exe', 'C:\\Code\\abc123\\resources\\app\\out\\cli.js'])
  expect(opened[2]).toBe('C:\\repo\\README.md')
  await ui.press({ key: 'row:tools' })
  await ui.press({ key: 'row:tools/x.ps1' })
  expect(runs.at(-1)?.[2]).toBe('C:\\repo\\tools\\x.ps1')
  expect(runs.some(argv => argv[0] === 'explorer.exe')).toBe(false)
  await ui.unmount()
})

test('on Windows without VS Code nothing is started, and a note says why', async ($, on) => {
  const { runs, toasts } = await session($, on, { root: 'C:\\repo', hasVscode: false })
  await filetree($)
  const ui = await pane($)
  await ui.press({ key: 'row:README.md' })
  expect(toasts.at(-1)).toMatch(/VS Code wasn't found/)
  expect(runs.some(argv => !['git', 'where.exe'].includes(argv[0] as string))).toBe(false)
  await ui.unmount()
})
