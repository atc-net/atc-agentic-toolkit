import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const SURFACES = ['terminal', 'desktop'] as const

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 24, bodyColumns: 100 } as never,
} as const

const PANE = {
  component: 'Pane',
  requestId: 'atc-replay',
  props: { title: 'Replay', isFocused: true, bodyColumns: 70, placement: 'dock', scroll: { bodyRows: 20 } } as never,
} as const

// The engine hands paths over absolute for this platform: compare them without drive or separators.
const norm = (path: string) => path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')

type Setup = {
  cwd?: string
  /** File texts by path. Edits and writes that run change them. */
  files?: Record<string, string>
  /** What happens to an edit of a path: refused before it runs, or run and failed. */
  outcomes?: Record<string, 'deny' | 'error'>
  /** Whether the surface can place the pane. */
  isPlaced?: boolean
  /** Files that exist but can't be read as text (binary, or too big). */
  unreadable?: string[]
  /** The plugin's store as it stands at the start, as an earlier run of the session left it. */
  store?: Record<string, unknown>
  /** Tool-use ids already in the main conversation, as a session moved to the background carries over. */
  transcript?: string[]
}

async function session($: Engine, on: On, setup: Setup = {}) {
  const { cwd = '/repo', outcomes = {}, isPlaced = true } = setup
  const files: Record<string, string> = {}
  for (const [path, text] of Object.entries(setup.files ?? {})) files[norm(path)] = text
  const opened: string[] = []
  const closed: string[] = []
  const store = new Map<string, unknown>(Object.entries(setup.store ?? {}))
  // The main conversation's tool uses, oldest first: the ones the session started with, then each call.
  const transcript = [...(setup.transcript ?? [])]
  on('session.messages', async () => ({
    value: [{ role: 'assistant', text: '', toolUses: transcript.map(id => ({ tool_use_id: id, tool: 'Edit', input: {} })) }],
  }) as never)
  on('store.get', async (_$, e) => ({ value: store.get(e.key) }) as never)
  on('store.set', async (_$, e) => {
    store.set(e.key, JSON.parse(JSON.stringify(e.value)))
    return { value: undefined } as never
  })
  on('store.delete', async (_$, e) => {
    store.delete(e.key)
    return { value: undefined } as never
  })
  on('store.keys', async () => ({ value: [...store.keys()] }))
  on('session.cwd', async () => ({ value: cwd }))
  on('fs.read', async (_$, e) => {
    const text = files[norm(e.path)]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('fs.exists', async (_$, e) => ({ value: files[norm(e.path)] !== undefined || (setup.unreadable ?? []).includes(norm(e.path)) }))
  on('clock.sleep', async () => ({ value: undefined }) as never)
  on('clock.now', async () => ({ value: Date.now() }))
  // The panes the surface has open, each shown or behind another's tab; the last opened is shown.
  // A close the mod never hears of (`forget`) drops one here alone.
  const panes = new Map<string, boolean>()
  on('ui.panes', async () => ({
    value: [...panes].map(([id, isShown]) => ({ id, title: id, isShown, isFocused: isShown, isPlaced: true })),
  }) as never)
  on('ui.open', async (_$, e) => {
    opened.push(e.id)
    if (isPlaced) {
      for (const id of panes.keys()) panes.set(id, false)
      panes.set(e.id, true)
    }
    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'narrow' } } as never
  })
  on('ui.close', async (_$, e) => {
    closed.push(e.id)
    panes.delete(e.id)
    return { value: undefined } as never
  })
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as never)
  on('command.register', async () => ({ value: undefined }) as never)
  on('tool.call', async (_$, e) => {
    const call = e as unknown as { tool: string; tool_use_id: string; agentId?: string; file_path: string; old_string?: string; new_string?: string; content?: string }
    if (!call.agentId) transcript.push(call.tool_use_id)
    const path = norm(call.file_path)
    if (outcomes[path] === 'deny') return { deny: 'not allowed' } as never
    if (outcomes[path] === 'error') return { result: 'String to replace not found in file.', isError: true } as never
    if (call.tool === 'Write') files[path] = call.content ?? ''
    else files[path] = (files[path] ?? '').replace(call.old_string ?? '', call.new_string ?? '')
    return { result: 'ok' } as never
  })
  on('turn.complete', async (_$, e) => ({ text: e.answer }) as never)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd, surface: 'terminal', isInteractive: true })
  return {
    store,
    transcript,
    opened,
    closed,
    forget: (id: string) => panes.delete(id),
    /** Another pane's tab brought to the front, as an arrow key in the pane bar does. */
    showOther: () => {
      for (const id of panes.keys()) panes.set(id, false)
      panes.set('atc-progress', true)
    },
  }
}

let calls = 0
const edit = ($: Engine, file_path: string, old_string: string, new_string: string, extra: Record<string, unknown> = {}) =>
  $.tool.call({ tool: 'Edit', tool_use_id: `tu${++calls}`, file_path, old_string, new_string, ...extra } as never)
const write = ($: Engine, file_path: string, content: string) =>
  $.tool.call({ tool: 'Write', tool_use_id: `tu${++calls}`, file_path, content } as never)
const endTurn = ($: Engine, agentId?: string) =>
  $.turn.complete({ answer: 'ok', durationMs: 5, isAborted: false, turnId: 't1', reason: 'answer', ...(agentId ? { agentId } : {}) } as never)
const replayCommand = ($: Engine, args = '') => $.command.run({ command: 'atc-replay', args } as never)

async function hintOn($: Engine, surface: (typeof SURFACES)[number]): Promise<string | undefined> {
  const band = await $.ui.mount({ plugin: 'atc-replay-theater', surface, ...BAND })
  const hint = (await band.find({ type: 'Text', text: /^Replay: / }))?.text
  await band.unmount()
  return hint
}

const A_TS = 'export function greet(name) {\n  return `Hi ${name}`\n}\n'

test('edits that ran become the replay when the main turn ends, and the hint says so', async ($, on) => {
  await session($, on, { files: { '/repo/src/a.ts': A_TS } })
  await edit($, '/repo/src/a.ts', 'greet(name)', 'welcome(name)')
  await write($, '/repo/src/b.ts', 'export const b = 1\n')
  for (const surface of SURFACES) expect(await hintOn($, surface)).toBeUndefined()
  await endTurn($)
  for (const surface of SURFACES) expect(await hintOn($, surface)).toBe('Replay: 2 edits in 2 files')
})

test('a refused or failed edit is not in the replay', async ($, on) => {
  await session($, on, { files: { '/repo/a.ts': 'x\n' }, outcomes: { '/repo/a.ts': 'deny', '/repo/b.ts': 'error' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await edit($, '/repo/b.ts', 'x', 'y')
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBeUndefined()
  expect((await replayCommand($)).text).toMatch(/^No edits to replay yet/)
})

test("a subagent's turn end doesn't publish the replay; its edits join the main turn's, with a note", async ($, on) => {
  await session($, on, { files: { '/repo/src/a.ts': A_TS } })
  await edit($, '/repo/src/a.ts', '  return `Hi ${name}`', '  return `Hello ${name}`', { agentId: 'a1' })
  await endTurn($, 'a1')
  expect(await hintOn($, 'terminal')).toBeUndefined()
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBe('Replay: 1 edit in 1 file')
  await replayCommand($)
  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  expect((await pane.find({ type: 'Text', text: /^Edit/ }))?.text).toBe('Edit · by a subagent · line 2')
  await pane.unmount()
})

test('the pane steps through the edits with Next and Prev, and Close closes it', async ($, on) => {
  const { opened, closed } = await session($, on, { files: { '/repo/src/a.ts': A_TS } })
  await edit($, '/repo/src/a.ts', 'greet(name)', 'welcome(name)')
  await write($, '/repo/README.md', '# Greeter\n')
  await endTurn($)
  expect((await replayCommand($)).text).toBe('Replay: 2 edits in 2 files. n next, p previous, c or Esc close.')
  expect(opened).toEqual(['atc-replay'])

  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface, ...PANE })
    const stepText = async () => (await pane.find({ type: 'Text', text: /^step / }))?.text
    expect(await stepText()).toBe('step 1 of 2')
    expect(await pane.find({ type: 'Text', text: 'src/a.ts' })).toBeDefined()
    expect((await pane.findAll({ type: 'Text', text: /^[-+] / })).map(t => t.text)).toEqual([
      '- export function greet(name) {',
      '+ export function welcome(name) {',
    ])
    await pane.press({ key: 'next' })
    expect(await stepText()).toBe('step 2 of 2')
    expect((await pane.find({ type: 'Text', text: /^Write/ }))?.text).toBe('Write · new file')
    await pane.press({ key: 'next' })
    expect(await stepText()).toBe('step 2 of 2')
    await pane.press({ key: 'prev' })
    expect(await stepText()).toBe('step 1 of 2')
    await pane.unmount()
  }

  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  await pane.press({ key: 'close' })
  expect(closed).toEqual(['atc-replay'])
  await pane.unmount()
})

test('a Write over a CRLF file on Windows shows the file relative to the folder and only the changed line', async ($, on) => {
  await session($, on, { cwd: 'E:\\proj', files: { 'E:\\proj\\src\\a.ts': 'one\r\ntwo\r\nthree\r\n' } })
  await write($, 'E:\\proj\\src\\a.ts', 'one\nTWO\nthree\n')
  await endTurn($)
  await replayCommand($)
  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  expect(await pane.find({ type: 'Text', text: 'src/a.ts' })).toBeDefined()
  expect((await pane.find({ type: 'Text', text: /^Write/ }))?.text).toBe('Write · rewrite')
  expect((await pane.findAll({ type: 'Text', text: /^[-+ ] / })).map(t => t.text)).toEqual(['  one', '- two', '+ TWO', '  three'])
  await pane.unmount()
})

test('a turn without edits keeps the last replay; a new one replaces it', async ($, on) => {
  await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBe('Replay: 1 edit in 1 file')
  await write($, '/repo/b.ts', '1\n')
  await write($, '/repo/c.ts', '2\n')
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBe('Replay: 2 edits in 2 files')
})

test('dismissing the hint hides it until the next replay', async ($, on) => {
  await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  const band = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...BAND })
  await band.press({ key: 'dismiss' })
  expect(await band.find({ type: 'Text', text: /^Replay: / })).toBeUndefined()
  await band.unmount()
  await write($, '/repo/b.ts', '1\n')
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBe('Replay: 1 edit in 1 file')
})

test("the hint's button opens the replay and steps aside for it", async ($, on) => {
  const { opened } = await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  const band = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...BAND })
  await band.press({ key: 'replay' })
  expect(opened).toEqual(['atc-replay'])
  expect(await band.find({ type: 'Text', text: /^Replay: / })).toBeUndefined()
  await band.unmount()
})

test('with no room for a pane the replay draws above the prompt, and Close returns the hint', async ($, on) => {
  const { closed } = await session($, on, { files: { '/repo/a.ts': 'x\n' }, isPlaced: false })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  await replayCommand($)
  const band = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...BAND })
  expect((await band.find({ type: 'Text', text: /^step / }))?.text).toBe('step 1 of 1')
  await band.press({ key: 'close' })
  expect(closed).toEqual([])
  expect((await band.find({ type: 'Text', text: /^Replay: / }))?.text).toBe('Replay: 1 edit in 1 file')
  await band.unmount()
})

test("a pane closed without the mod hearing of it doesn't stop /atc-replay opening it", async ($, on) => {
  const { opened, forget } = await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  await replayCommand($)
  forget('atc-replay')
  expect((await replayCommand($)).text).toBe('Replay: 1 edit in 1 file. n next, p previous, c or Esc close.')
  expect(opened).toEqual(['atc-replay', 'atc-replay'])
})

test('/atc-replay brings the pane back to the front when another pane is shown over it', async ($, on) => {
  const { opened, closed, showOther } = await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  await replayCommand($)
  showOther()
  expect((await replayCommand($)).text).toBe('Replay: 1 edit in 1 file. n next, p previous, c or Esc close.')
  expect(opened).toEqual(['atc-replay', 'atc-replay'])
  expect(closed).toEqual([])
  expect((await replayCommand($)).text).toBe('Replay closed.')
})

test("a replay is saved under its last edit's tool-use id, secrets left out, the last five kept", async ($, on) => {
  const older = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map(id => [`replay:${id}`, []]))
  const { store, transcript } = await session($, on, { files: { '/repo/a.ts': 'x\n' }, store: { other: 1, ...older } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  const first = `replay:${transcript.at(-1)}`
  expect([...store.keys()]).toEqual(['other', 'replay:b', 'replay:c', 'replay:d', 'replay:e', first])
  expect((store.get(first) as { file: string }[])[0]?.file).toBe('a.ts')
  await write($, '/repo/.env', 'API_KEY=s3cret\n')
  await endTurn($)
  const second = `replay:${transcript.at(-1)}`
  expect(JSON.stringify(store.get(second))).not.toContain('s3cret')
  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  expect(await pane.find({ type: 'Text', text: '+ API_KEY=s3cret' })).toBeDefined()
  await pane.unmount()
  await replayCommand($, 'clear')
  expect(store.has(second)).toBe(false)
})

const SAVED = [{ file: 'src/a.ts', tool: 'Edit', note: '', line: 3, added: 1, removed: 1, lines: [{ op: '-', text: 'old' }, { op: '+', text: 'new' }], more: 0 }]

test('a session moved to the background and back finds its replay through the conversation it carries', async ($, on) => {
  await session($, on, { store: { 'replay:toolu_old': [], 'replay:toolu_mine': SAVED }, transcript: ['toolu_0', 'toolu_mine', 'toolu_9'] })
  expect(await hintOn($, 'terminal')).toBe('Replay: 1 edit in 1 file')
  expect((await replayCommand($)).text).toBe('Replay: 1 edit in 1 file. n next, p previous, c or Esc close.')
  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  expect((await pane.find({ type: 'Text', text: /^Edit/ }))?.text).toBe('Edit · line 3')
  await pane.unmount()
})

test("a new session doesn't pick up another session's saved replay", async ($, on) => {
  await session($, on, { store: { 'replay:toolu_other': SAVED }, transcript: [] })
  expect(await hintOn($, 'terminal')).toBeUndefined()
  expect((await replayCommand($)).text).toMatch(/^No edits to replay yet/)
})

test("a turn where only subagents edited is replayed but not saved, since the conversation doesn't hold its edits", async ($, on) => {
  const { store } = await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y', { agentId: 'a1' })
  await endTurn($)
  expect(await hintOn($, 'terminal')).toBe('Replay: 1 edit in 1 file')
  expect([...store.keys()]).toEqual([])
})

test("a Write over a file whose old text can't be read says so instead of calling it new", async ($, on) => {
  await session($, on, { unreadable: ['/repo/logo.bin'] })
  await write($, '/repo/logo.bin', 'text now\n')
  await endTurn($)
  await replayCommand($)
  const pane = await $.ui.mount({ plugin: 'atc-replay-theater', surface: 'terminal', ...PANE })
  expect((await pane.find({ type: 'Text', text: /^Write/ }))?.text).toBe("Write · rewrite (the old text couldn't be read)")
  await pane.unmount()
})

test('/atc-replay toggles, clear forgets, help lists the commands', async ($, on) => {
  const { closed } = await session($, on, { files: { '/repo/a.ts': 'x\n' } })
  await edit($, '/repo/a.ts', 'x', 'y')
  await endTurn($)
  await replayCommand($)
  expect((await replayCommand($)).text).toBe('Replay closed.')
  expect(closed).toEqual(['atc-replay'])
  expect((await replayCommand($, 'clear')).text).toBe('Replay cleared.')
  expect(await hintOn($, 'terminal')).toBeUndefined()
  expect((await replayCommand($, 'help')).text).toContain('/atc-replay clear')
  expect((await replayCommand($, 'frobnicate')).text).toMatch(/^Unknown option "frobnicate"/)
})
