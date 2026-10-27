import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

const SURFACES = ['terminal', 'desktop'] as const

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 24, bodyColumns: 100 } as never,
} as const

// The engine hands paths over absolute for this platform: compare them without drive or separators.
const norm = (path: string) => path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '')

type Setup = {
  /** The project root. */
  root?: string
  /** Where the shell is, when a `cd` took it away from the root. */
  cwd?: string
  /** File texts by path. Writes change them. */
  files?: Record<string, string>
  /** Files that exist but can't be read. */
  unreadable?: string[]
  /** What the classifier answers, by the prompt it is asked about. */
  verdicts?: Record<string, string>
  store?: Record<string, unknown>
  /** Every write fails, as on a read-only file. */
  failWrites?: boolean
}

async function session($: Engine, on: On, setup: Setup = {}) {
  const { root = '/repo', cwd = root, verdicts = {} } = setup
  const files: Record<string, string> = {}
  for (const [path, text] of Object.entries(setup.files ?? {})) files[norm(path)] = text
  const clock: MockClock = mock.clock(on, { now: 1_000_000 })
  mock.store(on, setup.store)
  mock.env(on, { HOME: '/home/per' })
  const rows = mock.session(on)
  const asked: string[] = []
  const toasts: string[] = []
  const filled: string[] = []
  const prompts: string[] = []

  on('session.root', async () => ({ value: root }))
  on('session.cwd', async () => ({ value: cwd }))
  on('fs.read', async (_$, e) => {
    const text = files[norm(e.path)]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('fs.exists', async (_$, e) => ({ value: files[norm(e.path)] !== undefined || (setup.unreadable ?? []).includes(norm(e.path)) }))
  on('fs.write', async (_$, e) => {
    if (setup.failWrites) throw new Error(`EACCES: ${e.path}`)
    files[norm(e.path)] = e.text
    return { value: undefined } as never
  })
  on('model.complete', async (_$, e) => {
    const text = /<message>\n([\s\S]*)\n<\/message>/.exec(e.prompt)?.[1] ?? ''
    asked.push(text)
    const reply = verdicts[text] ?? '{"is_rule": false, "rule": "", "scope": "project", "confidence": 0.9}'
    return { value: { isAnswered: true, text: reply, usage: { input_tokens: 300, output_tokens: 30, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } } as never
  })
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })
  // The prompt box: what fill writes and read returns.
  const box = { text: '' }
  on('prompt.fill', async (_$, e) => {
    filled.push(e.text)
    box.text = e.text
    return { isFilled: true } as never
  })
  on('prompt.read', async () => ({ value: { text: box.text, cursor: box.text.length } }) as never)
  on('prompt.submit', async (_$, e) => {
    prompts.push(e.text)
    return { text: e.text }
  })
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as never)
  on('command.register', async () => ({ value: undefined }) as never)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: root, surface: 'terminal', isInteractive: true })
  return { files, clock, rows, asked, toasts, filled, prompts, box }
}

const typed = ($: Engine, text: string) => $.prompt.submit({ text, origin: { kind: 'composer' }, wait: false } as never)
const reflect = ($: Engine, args = '') => $.command.run({ command: 'atc-reflect', args } as never)

async function bandOf($: Engine, surface: (typeof SURFACES)[number]) {
  return $.ui.mount({ plugin: 'atc-reflect', surface, ...BAND })
}

async function ruleOn($: Engine, surface: (typeof SURFACES)[number]): Promise<string | undefined> {
  const band = await bandOf($, surface)
  const texts = (await band.findAll({ type: 'Text' })).map(t => t.text)
  await band.unmount()
  return texts[0] === '◆' ? texts[2] : undefined
}

const PNPM = '{"is_rule": true, "rule": "Use pnpm, not npm.", "scope": "project", "confidence": 0.92}'

test('a correction is checked after the prompt has gone through, and its rule waits above the prompt', async ($, on) => {
  const { clock, asked, prompts } = await session($, on, { verdicts: { 'no, use pnpm not npm': PNPM } })
  await typed($, 'no, use pnpm not npm')
  expect(prompts).toEqual(['no, use pnpm not npm'])
  expect(asked).toEqual([])
  await clock.advance(2000)
  expect(asked).toEqual(['no, use pnpm not npm'])
  for (const surface of SURFACES) expect(await ruleOn($, surface)).toBe('Use pnpm, not npm.')
})

test('a prompt with no correction words, or a secret, is never sent to the model', async ($, on) => {
  const { clock, asked } = await session($, on)
  await typed($, 'add a login page')
  await typed($, 'no, the token = abc123 must never be logged')
  await clock.advance(5000)
  expect(asked).toEqual([])
  expect(await ruleOn($, 'terminal')).toBeUndefined()
})

test("remember: keeps a rule without asking the model, and the prompt doesn't reach the model", async ($, on) => {
  const { clock, asked, prompts } = await session($, on)
  const result = await typed($, 'remember: answer in Danish')
  expect(result).toEqual({ drop: 'atc-reflect kept the rule. Save it from the band above the prompt.' })
  expect(prompts).toEqual([])
  await clock.advance(5000)
  expect(asked).toEqual([])
  expect(await ruleOn($, 'terminal')).toBe('answer in Danish')
})

test('save writes the rule into the project CLAUDE.md and tells the model', async ($, on) => {
  const { files, rows, toasts } = await session($, on, { files: { '/repo/CLAUDE.md': '# Repo\r\n\r\nNotes.\r\n' } })
  await typed($, 'remember: Use pnpm, not npm.')
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'save-project' })
  await band.unmount()
  expect(files['/repo/CLAUDE.md']).toBe(
    '# Repo\r\n\r\nNotes.\r\n\r\n## Learned rules\r\n\r\nRules saved with atc-reflect from corrections made while working.\r\n\r\n- Use pnpm, not npm.\r\n',
  )
  expect(toasts.at(-1)).toBe('Saved to CLAUDE.md.')
  expect(JSON.stringify(rows.appended())).toContain('Follow it from now on: Use pnpm, not npm.')
  expect(await ruleOn($, 'terminal')).toBeUndefined()
})

test('save writes to the project root CLAUDE.md after a shell cd moved into a subfolder', async ($, on) => {
  const { files } = await session($, on, { root: '/repo', cwd: '/repo/src/i18n/locales/en' })
  await typed($, 'remember: Use pnpm')
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'save-project' })
  await band.unmount()
  expect(files['/repo/CLAUDE.md']).toContain('- Use pnpm\n')
  expect(files['/repo/src/i18n/locales/en/CLAUDE.md']).toBeUndefined()
})

test('save to ~/.claude/CLAUDE.md creates the file in the home folder', async ($, on) => {
  const { files } = await session($, on)
  await typed($, 'remember: Answer in Danish')
  const band = await bandOf($, 'desktop')
  await band.press({ key: 'save-user' })
  await band.unmount()
  expect(files['/home/per/.claude/CLAUDE.md']).toContain('- Answer in Danish\n')
  expect(files['/repo/CLAUDE.md']).toBeUndefined()
})

test("a CLAUDE.md that can't be read is left alone, and the rule keeps waiting", async ($, on) => {
  const { files, toasts } = await session($, on, { unreadable: ['/repo/CLAUDE.md'] })
  await typed($, 'remember: Use pnpm')
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'save-project' })
  await band.unmount()
  expect(files['/repo/CLAUDE.md']).toBeUndefined()
  expect(toasts.at(-1)).toBe("Couldn't read CLAUDE.md, so it was left as it is.")
  expect(await ruleOn($, 'terminal')).toBe('Use pnpm')
})

test('a save whose write fails keeps the rule waiting', async ($, on) => {
  const { toasts } = await session($, on, { failWrites: true })
  await typed($, 'remember: Use pnpm')
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'save-project' })
  await band.unmount()
  expect(toasts.at(-1)).toBe('Something went wrong; the rule is still waiting.')
  expect(await ruleOn($, 'terminal')).toBe('Use pnpm')
})

test('remember: keeps a rule the person skipped before, when the model found it', async ($, on) => {
  const { clock } = await session($, on, { verdicts: { 'no, use pnpm not npm': PNPM } })
  await typed($, 'no, use pnpm not npm')
  await clock.advance(2000)
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'skip' })
  await band.unmount()
  expect(await typed($, 'remember: use pnpm, not npm')).toEqual({ drop: 'atc-reflect kept the rule. Save it from the band above the prompt.' })
  expect(await ruleOn($, 'terminal')).toBe('use pnpm, not npm')
})

test('a kept remember: is taken out of the prompt box the engine put it back in', async ($, on) => {
  const { clock, box } = await session($, on)
  await typed($, 'remember: Use pnpm')
  box.text = 'remember: Use pnpm'
  await clock.advance(1000)
  expect(box.text).toBe('')

  // A remember: that wasn't kept stays, so it can be fixed.
  await typed($, `remember: ${'x'.repeat(201)}`)
  box.text = `remember: ${'x'.repeat(201)}`
  await clock.advance(1000)
  expect(box.text).toBe(`remember: ${'x'.repeat(201)}`)
})

test('edit puts the rule in the prompt box and keeps it waiting until the edited one is sent', async ($, on) => {
  const { clock, filled } = await session($, on)
  await typed($, 'remember: Answer in Danish')
  await typed($, 'remember: Use yarn')
  await clock.advance(1000)
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'edit' })
  await band.unmount()
  expect(filled).toEqual(['remember: Answer in Danish'])
  expect(await ruleOn($, 'terminal')).toBe('Answer in Danish')

  await typed($, 'remember: Answer in Danish, code in English')
  expect((await reflect($)).text).toBe('Finding rules in your prompts.\n2 rules waiting here:\n1. Use yarn\n2. Answer in Danish, code in English')
})

test('skip never suggests a rule the model found again', async ($, on) => {
  const { clock } = await session($, on, { verdicts: { 'no, use pnpm not npm': PNPM } })
  await typed($, 'no, use pnpm not npm')
  await clock.advance(2000)
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'skip' })
  await band.unmount()
  await typed($, 'no, use pnpm not npm')
  await clock.advance(2000)
  expect(await ruleOn($, 'terminal')).toBeUndefined()
})

test('rules wait in the store for their own folder, and come back in a new session there', async ($, on) => {
  const waiting = [
    { id: 'a', text: 'Use pnpm', scope: 'project', folder: '/repo', at: 1 },
    { id: 'b', text: 'Use cargo', scope: 'project', folder: '/other', at: 2 },
  ]
  await session($, on, { store: { pending: waiting } })
  expect(await ruleOn($, 'terminal')).toBe('Use pnpm')
  expect((await reflect($)).text).toBe('Finding rules in your prompts.\n1 rule waiting here:\n1. Use pnpm')
})

test('a rule kept under a subfolder before the root fix moves up to the root, and saves there', async ($, on) => {
  const waiting = [
    { id: 'a', text: 'Use pnpm', scope: 'project', folder: '/repo/src/i18n', at: 1 },
    { id: 'b', text: 'Use cargo', scope: 'project', folder: '/repo/crates', at: 2, isRoot: true },
    { id: 'c', text: 'use pnpm.', scope: 'project', folder: '/repo', at: 3, isRoot: true },
    { id: 'd', text: 'Prefer records', scope: 'project', folder: '/repo/api', at: 4 },
  ]
  await session($, on, { store: { pending: waiting } })
  // The duplicate of a root rule is dropped; a nested project's own root keeps its rules.
  expect((await reflect($)).text).toBe('Finding rules in your prompts.\n2 rules waiting here:\n1. use pnpm.\n2. Prefer records')
})

test('a legacy rule kept under a subfolder saves to the root CLAUDE.md', async ($, on) => {
  const waiting = [{ id: 'a', text: 'Use pnpm', scope: 'project', folder: '\\repo\\src\\i18n', at: 1 }]
  const { files } = await session($, on, { store: { pending: waiting } })
  const band = await bandOf($, 'terminal')
  await band.press({ key: 'save-project' })
  await band.unmount()
  expect(files['/repo/CLAUDE.md']).toContain('- Use pnpm\n')
  expect(files['/repo/src/i18n/CLAUDE.md']).toBeUndefined()
})

test('/atc-reflect pause stops the model checks; remember: still works', async ($, on) => {
  const { clock, asked } = await session($, on, { verdicts: { 'no, use pnpm not npm': PNPM } })
  expect((await reflect($, 'pause')).text).toMatch(/^Paused for this session/)
  await typed($, 'no, use pnpm not npm')
  await clock.advance(2000)
  expect(asked).toEqual([])
  await typed($, 'remember: Use pnpm')
  expect(await ruleOn($, 'terminal')).toBe('Use pnpm')
  await reflect($, 'resume')
  await typed($, 'no, use pnpm not npm')
  await clock.advance(2000)
  expect(asked).toEqual(['no, use pnpm not npm'])
})

test('remember-only never sends a prompt to the model', { options: { detect: 'remember-only' } }, async ($, on) => {
  const { clock, asked } = await session($, on, { verdicts: { 'no, use pnpm not npm': PNPM } })
  await typed($, 'no, use pnpm not npm')
  await clock.advance(5000)
  expect(asked).toEqual([])
})

test('/atc-reflect clear drops the rules waiting here', async ($, on) => {
  await session($, on)
  await typed($, 'remember: Use pnpm')
  await typed($, 'remember: Prefer records')
  expect((await reflect($, 'clear')).text).toBe('Dropped 2 rules.')
  expect(await ruleOn($, 'terminal')).toBeUndefined()
})
