import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const CWD = '/repo'
const PLAN_PATH = '/repo/plan/feature-demo-1.md'

function planText(ticks: [boolean, boolean, boolean, boolean, boolean]): string {
  const row = (n: number) => `| TASK-00${n} | Task ${n} | ${ticks[n - 1] ? '✅' : ''} | |`
  return [
    '---',
    'goal: Ship the demo',
    "status: 'In progress'",
    '---',
    '# Introduction',
    '### Implementation Phase 1',
    'Status: Complete',
    '| Task | Description | Completed | Date |',
    '|------|-------------|-----------|------|',
    row(1),
    row(2),
    '### Implementation Phase 2',
    'Status: In progress',
    '| Task | Description | Completed | Date |',
    '|------|-------------|-----------|------|',
    row(3),
    row(4),
    row(5),
  ].join('\n')
}

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120 } as never,
} as const

const PANE = {
  component: 'Pane',
  requestId: 'atc-progress',
  props: { title: 'Subagents', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { bodyRows: 30 } } as never,
} as const

// The engine hands paths over absolute for this platform: compare them without drive or separators.
const norm = (path: string) => path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')

// The panes the surface has open, each shown or behind another pane's tab; the last opened is shown.
const panes = new Map<string, boolean>()

async function session($: Engine, on: On, files: Record<string, string>, mtimes: Record<string, number> = {}) {
  panes.clear()
  mock.clock(on, { now: Date.parse('2026-10-17T10:00:00Z') })
  const paths = () => Object.keys(files)
  const mtimeOf = (path: string) => mtimes[path] ?? 1
  on('session.cwd', async () => ({ value: CWD }))
  on('fs.exists', async (_$, e) => ({ value: paths().some(k => k === norm(e.path) || k.startsWith(`${norm(e.path)}/`)) }))
  on('fs.list', async (_$, e) => ({
    value: paths()
      .filter(k => k.startsWith(`${norm(e.path)}/`))
      .map(k => ({ name: k.slice(norm(e.path).length + 1), kind: 'file' as const, size: 1, mtimeMs: mtimeOf(k), isLink: false })),
  }))
  on('fs.stat', async (_$, e) => {
    if (files[norm(e.path)] === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: { kind: 'file', size: 1, mtimeMs: mtimeOf(norm(e.path)), isLink: false } } as never
  })
  on('fs.read', async (_$, e) => {
    const text = files[norm(e.path)]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('ui.panes', async () => ({
    value: [...panes].map(([id, isShown]) => ({ id, title: id, isShown, isFocused: false, isPlaced: true })),
  }) as never)
  on('ui.open', async (_$, e) => {
    for (const id of panes.keys()) panes.set(id, false)
    panes.set(e.id, true)
    return { value: { isPlaced: true } } as never
  })
  on('ui.close', async (_$, e) => {
    panes.delete(e.id)
    return { value: undefined } as never
  })
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as never)
  on('command.register', async () => ({ value: undefined }) as never)
  on('command.run', async () => ({ text: '' }) as never)
  on('tool.call', async () => ({ result: 'ok' }) as never)
  on('agent.spawn', async () => ({ model: 'claude-sonnet-5-5', agentId: 'a1' }))
  on('turn.step', async function* (_$, e) {
    return {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'end_turn',
      usage: { model: 'claude-sonnet-5-5', input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 40000, cache_creation_input_tokens: 0 },
    } as never
  })
  on('turn.complete', async (_$, e) => ({ text: e.answer }) as never)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
}

async function bandTexts($: Engine, surface: 'terminal' | 'desktop') {
  const ui = await $.ui.mount({ plugin: 'atc-progress', surface, ...BAND })
  const found = {
    goal: (await ui.findAll({ type: 'Text', text: /^Ship the demo$/ })).length,
    tasks: (await ui.find({ type: 'Text', text: /^Tasks \d+\/\d+$/ }))?.text,
    phase: (await ui.find({ type: 'Text', text: /^Phase \d+\/\d+$/ }))?.text,
  }
  await ui.unmount()
  return found
}

test('the bar shows the plan in progress on terminal and desktop', async ($, on) => {
  await session($, on, { [PLAN_PATH]: planText([true, true, true, false, false]) })
  for (const surface of ['terminal', 'desktop'] as const) {
    expect(await bandTexts($, surface)).toEqual({ goal: 1, tasks: 'Tasks 3/5', phase: 'Phase 2/2' })
  }
})

test('an edit to the plan file moves the bar', async ($, on) => {
  const files = { [PLAN_PATH]: planText([true, true, true, false, false]) }
  await session($, on, files)
  files[PLAN_PATH] = planText([true, true, true, true, false])
  await $.tool.call({ tool: 'Edit', file_path: PLAN_PATH, old_string: '| |', new_string: '| ✅ |' } as never)
  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 4/5')
})

test('dismiss hides the bar until /atc-progress show', async ($, on) => {
  await session($, on, { [PLAN_PATH]: planText([true, false, false, false, false]) })
  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  await ui.press({ key: 'dismiss' })
  expect(await ui.find({ type: 'Text', text: /^Tasks/ })).toBeUndefined()
  await ui.unmount()
  await $.command.run({ command: 'atc-progress', args: 'show' } as never)
  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 1/5')
})

test('no plan and no subagents leaves the band to others', async ($, on) => {
  await session($, on, {})
  expect(await bandTexts($, 'terminal')).toEqual({ goal: 0, tasks: undefined, phase: undefined })
})

test('a subagent shows in the pane with its tokens and finishes', async ($, on) => {
  await session($, on, {})

  await $.agent.spawn({
    tool_use_id: 't1',
    prompt: 'Find the auth code',
    description: 'Find auth code',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
  } as never)
  const stream = $.turn.step({ turnId: 'x', index: 0, model: 'claude-sonnet-5-5', messageCount: 1, agentId: 'a1' } as never)
  for await (const _chunk of stream) {
    // drain
  }
  await stream.result

  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...PANE })
  expect(await ui.find({ type: 'Text', text: 'Explore' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Find auth code' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /sonnet-5-5 · ctx/ }))?.text).toMatch(/sonnet-5-5 · ctx 4% · 42k tok · ~\$0\.01/)
  expect(await ui.find({ type: 'Text', text: '●' })).toBeDefined()
  await ui.unmount()

  await $.turn.complete({ answer: 'done', durationMs: 5, isAborted: false, turnId: 'x', agentId: 'a1', reason: 'answer' } as never)
  const after = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...PANE })
  expect(await after.find({ type: 'Text', text: '✓' })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /1 finished/ })).toBeDefined()
  await after.unmount()
})

test('a newer plan file, written by any tool, takes over the bar when the turn ends', async ($, on) => {
  const files: Record<string, string> = { [PLAN_PATH]: planText([true, true, true, false, false]) }
  const mtimes: Record<string, number> = { [PLAN_PATH]: 1 }
  await session($, on, files, mtimes)
  // Written by the shell, say: no Write or Edit call to see.
  files['/repo/plan/feature-hello-1.md'] = "---\ngoal: Say hello\nstatus: 'In progress'\n---\n### Implementation Phase 1\n| Task | Description | Completed | Date |\n|---|---|---|---|\n| TASK-001 | a | | |\n"
  mtimes['/repo/plan/feature-hello-1.md'] = 5
  await $.turn.complete({ answer: 'planned', durationMs: 5, isAborted: false, turnId: 'm1', reason: 'answer' } as never)
  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: 'Say hello' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /^Tasks/ }))?.text).toBe('Tasks 0/1')
  await ui.unmount()
})

test('the active plan is re-read at turn end when it changed', async ($, on) => {
  const files: Record<string, string> = { [PLAN_PATH]: planText([true, false, false, false, false]) }
  const mtimes: Record<string, number> = { [PLAN_PATH]: 1 }
  await session($, on, files, mtimes)
  files[PLAN_PATH] = planText([true, true, true, true, true])
  mtimes[PLAN_PATH] = 2
  await $.turn.complete({ answer: 'done', durationMs: 5, isAborted: false, turnId: 'm2', reason: 'answer' } as never)
  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 5/5')
})

test('/atc-progress plan <path> tells Claude which plan to continue', async ($, on) => {
  await session($, on, { [PLAN_PATH]: planText([true, true, false, false, false]) })
  const result = await $.command.run({ command: 'atc-progress', args: `plan ${PLAN_PATH}` } as never)
  expect(result.context?.[0]).toMatch(/feature-demo-1\.md .*"Ship the demo".*2\/5 tasks done, now at Phase 2 of 2/)
})

test('/atc-progress continue and the continue button fill the prompt for the plan on the bar', async ($, on) => {
  const filled: string[] = []
  on('prompt.fill', async (_$, e) => {
    filled.push(e.text)
    return { isFilled: true } as never
  })
  await session($, on, { [PLAN_PATH]: planText([true, true, false, false, false]) })
  const result = await $.command.run({ command: 'atc-progress', args: 'continue' } as never)
  expect(result.text).toMatch(/press Enter/)
  expect(filled[0]).toMatch(/^Continue implementing .*feature-demo-1\.md \(Ship the demo\)\. Pick up at Phase 2, the first phase that isn't Complete\./)

  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  await ui.press({ key: 'continue' })
  await ui.unmount()
  expect(filled.length).toBe(2)
})

test('the continue button is hidden while Claude is working', async ($, on) => {
  await session($, on, { [PLAN_PATH]: planText([true, false, false, false, false]) })
  const working = { ...BAND, props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 120 } as never }
  const busy = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...working })
  expect(await busy.find({ key: 'continue' })).toBeUndefined()
  expect(await busy.find({ type: 'Text', text: /^Tasks/ })).toBeDefined()
  await busy.unmount()
  const idle = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  expect(await idle.find({ key: 'continue' })).toBeDefined()
  await idle.unmount()
})

test('/atc-progress plans lists every plan and a pick puts it on the bar and tells Claude', async ($, on) => {
  const notes: string[] = []
  on('session.append', async (_$, e, next) => {
    const block = e.message.content[0] as { text?: string } | undefined
    notes.push(block?.text ?? '')
    return next(e)
  })
  on('ui.toast', async () => ({ value: undefined }) as never)
  const done = "---\ngoal: Old work\nstatus: 'Completed'\n---\n### Implementation Phase 1\n| Task | Description | Completed | Date |\n|---|---|---|---|\n| TASK-001 | a | ✅ | |\n"
  const later = "---\ngoal: Next up\nstatus: 'Planned'\n---\n### Implementation Phase 1\n| Task | Description | Completed | Date |\n|---|---|---|---|\n| TASK-001 | a | | |\n"
  await session(
    $,
    on,
    { [PLAN_PATH]: planText([true, false, false, false, false]), '/repo/plan/old-1.md': done, '/repo/plan/next-1.md': later },
    { [PLAN_PATH]: 1, '/repo/plan/old-1.md': 3, '/repo/plan/next-1.md': 2 },
  )
  const result = await $.command.run({ command: 'atc-progress', args: 'plans' } as never)
  expect(result.text).toMatch(/^3 plans listed/)

  const picker = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', component: 'Pane', requestId: 'atc-progress-plans', props: PANE.props })
  const rows = await picker.findAll({ type: 'Button' })
  expect(rows.map(r => r.props.label)).toEqual(['Ship the demo', 'Next up', 'Old work'])
  await picker.press({ key: 'plan-1' })
  await picker.unmount()

  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 0/1')
  expect(notes[0]).toMatch(/next-1\.md \("Next up"/)
})

const OLDER = '/repo/plan/older-1.md'
const olderPlan = "---\ngoal: Older work\nstatus: 'In progress'\n---\n### Implementation Phase 1\n| Task | Description | Completed | Date |\n|---|---|---|---|\n| TASK-001 | a | ✅ | |\n| TASK-002 | b | | |\n"

test('a picked plan stays on the bar at turn end, even with a newer plan in plan/', async ($, on) => {
  on('ui.toast', async () => ({ value: undefined }) as never)
  await session($, on, { [PLAN_PATH]: planText([true, false, false, false, false]), [OLDER]: olderPlan }, { [PLAN_PATH]: 9, [OLDER]: 1 })
  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 1/5')
  await $.command.run({ command: 'atc-progress', args: 'plans' } as never)
  const picker = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', component: 'Pane', requestId: 'atc-progress-plans', props: PANE.props })
  await picker.press({ key: 'plan-1' })
  await picker.unmount()
  await $.turn.complete({ answer: 'ok', durationMs: 5, isAborted: false, turnId: 'p1', reason: 'answer' } as never)
  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  expect((await ui.find({ type: 'Text', text: /^Tasks/ }))?.text).toBe('Tasks 1/2')
  expect(await ui.find({ type: 'Text', text: 'pinned' })).toBeDefined()
  await ui.unmount()
})

test('while pinned, a write to another plan leaves the bar and toasts once', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', async (_$, e) => {
    toasts.push(String((e as { text?: unknown }).text ?? ''))
    return { value: undefined } as never
  })
  const files: Record<string, string> = { [PLAN_PATH]: planText([true, false, false, false, false]), [OLDER]: olderPlan }
  await session($, on, files)
  await $.command.run({ command: 'atc-progress', args: `plan ${OLDER}` } as never)
  for (const turn of ['w1', 'w2']) {
    await $.tool.call({ tool: 'Write', file_path: PLAN_PATH, content: files[PLAN_PATH] } as never)
    await $.turn.complete({ answer: 'ok', durationMs: 5, isAborted: false, turnId: turn, reason: 'answer' } as never)
  }
  expect((await bandTexts($, 'terminal')).tasks).toBe('Tasks 1/2')
  expect(toasts.filter(t => /^Bar stays on: .+\nWritten: Ship the demo$/.test(t)).length).toBe(1)
})

test('/atc-progress plan without a path unpins, and the newest plan takes over again', async ($, on) => {
  const files: Record<string, string> = { [PLAN_PATH]: planText([true, false, false, false, false]), [OLDER]: olderPlan }
  const mtimes: Record<string, number> = { [PLAN_PATH]: 1, [OLDER]: 2 }
  await session($, on, files, mtimes)
  await $.command.run({ command: 'atc-progress', args: `plan ${PLAN_PATH}` } as never)
  const result = await $.command.run({ command: 'atc-progress', args: 'plan' } as never)
  expect(result.text).toMatch(/Following the newest plan again/)
  mtimes[PLAN_PATH] = 1
  mtimes[OLDER] = 5
  files[OLDER] = olderPlan.replace('| TASK-002 | b | | |', '| TASK-002 | b | ✅ | |')
  await $.turn.complete({ answer: 'ok', durationMs: 5, isAborted: false, turnId: 'u1', reason: 'answer' } as never)
  const ui = await $.ui.mount({ plugin: 'atc-progress', surface: 'terminal', ...BAND })
  expect((await ui.find({ type: 'Text', text: /^Tasks/ }))?.text).toBe('Tasks 2/2')
  expect(await ui.find({ type: 'Text', text: 'pinned' })).toBeUndefined()
  await ui.unmount()
})

test('/atc-progress help shows the commands, and an unknown option says so', async ($, on) => {
  await session($, on, {})
  const help = await $.command.run({ command: 'atc-progress', args: 'help' } as never)
  expect(help.text).toMatch(/\/atc-progress plans +list the plans/)
  const unknown = await $.command.run({ command: 'atc-progress', args: 'frobnicate' } as never)
  expect(unknown.text).toMatch(/^Unknown option "frobnicate"/)
})

test('/atc-progress plan rescans and reports the plan', async ($, on) => {
  await session($, on, { [PLAN_PATH]: planText([true, true, false, false, false]) })
  const result = await $.command.run({ command: 'atc-progress', args: 'plan' } as never)
  expect(result.text).toMatch(/Ship the demo \(2\/5 tasks\)/)
})

test('/atc-progress brings the subagents pane forward when another pane is shown over it, and closes it when it is in front', async ($, on) => {
  await session($, on, {})
  const toggle = async () => (await $.command.run({ command: 'atc-progress', args: '' } as never)).text
  expect(await toggle()).toBe('Subagents pane opened.')
  panes.set('atc-progress', false)
  panes.set('atc-replay', true)
  expect(await toggle()).toBe('Subagents pane opened.')
  expect(panes.get('atc-progress')).toBe(true)
  expect(await toggle()).toBe('Subagents pane closed.')
  expect(panes.has('atc-progress')).toBe(false)
})
