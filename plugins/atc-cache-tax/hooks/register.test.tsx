import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

const SURFACES = ['terminal', 'desktop'] as const

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 24, bodyColumns: 120 } as never,
} as const

const MINUTE = 60_000
const MODEL = 'claude-opus-5-5'

type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }

/** A request that read `reads` tokens from the cache and wrote `writes`. */
const usageOf = (reads: number, writes = 500): Usage => ({ input_tokens: 10, output_tokens: 200, cache_read_input_tokens: reads, cache_creation_input_tokens: writes })

type Setup = {
  env?: Record<string, string>
  /** The promptCacheTtl setting. */
  setting?: string
  /** True: the session reports subscription rate limits once a response came. */
  isSubscription?: boolean
  /** What each keep-warm ping reads and writes, in turn; the last repeats. */
  pings?: Usage[]
}

async function session($: Engine, on: On, setup: Setup = {}) {
  const clock: MockClock = mock.clock(on, { now: 10 * 60 * MINUTE })
  mock.env(on, setup.env ?? {})
  const toasts: string[] = []
  const sent: string[] = []
  const forks: string[] = []
  let answered = false
  let next: Usage = usageOf(0)

  on('session.usage', async () => ({
    value: { startedAt: 0, context: { window: 1_000_000 }, rateLimits: answered && setup.isSubscription ? [{ kind: 'five_hour', percentUsed: 10 }] : [] },
  }) as never)
  on('settings.read', async () => ({ value: setup.setting ? { promptCacheTtl: setup.setting } : {} }) as never)
  on('model.fork', async (_$, e) => {
    forks.push(e.prompt)
    const pings = setup.pings ?? [usageOf(120_000, 40)]
    const usage = pings[Math.min(forks.length - 1, pings.length - 1)]
    return { value: { isAnswered: true, text: 'ok', usage } } as never
  })
  on('turn.step', async function* (_$, e) {
    answered = true
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: MODEL, ...next } } as never
  })
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }) as never)
  on('turn.complete', async (_$, e) => ({ text: e.answer }) as never)
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined } as never
  })
  on('prompt.submit', async (_$, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  on('ui.render', async () => ({ type: 'engine', ref: 0 }) as never)
  on('command.register', async () => ({ value: undefined }) as never)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

  /** One main turn of one request with this usage. */
  const turn = async (usage: Usage) => {
    next = usage
    await $.turn.start({ text: 'x', turnId: 't' } as never)
    const stream = $.turn.step({ turnId: 't', index: 0, model: MODEL, messageCount: 1 } as never)
    for await (const _chunk of stream) {
      // drain
    }
    await stream.result
    await $.turn.complete({ answer: 'ok', durationMs: 5, isAborted: false, turnId: 't', reason: 'answer' } as never)
  }
  return { clock, toasts, sent, forks, turn }
}

const typed = ($: Engine, text: string) => $.prompt.submit({ text, origin: { kind: 'composer' }, wait: false } as never)
const command = ($: Engine, name: string, args = '') => $.command.run({ command: name, args } as never)

async function bandText($: Engine, surface: (typeof SURFACES)[number]): Promise<string | undefined> {
  const band = await $.ui.mount({ plugin: 'atc-cache-tax', surface, ...BAND })
  const texts = (await band.findAll({ type: 'Text' })).map(t => t.text)
  await band.unmount()
  return texts[0] === '♨' ? texts.slice(1).join(' ') : undefined
}

test('an API-key session assumes five minutes; a big prompt after that is held once, then goes through', async ($, on) => {
  const { clock, sent, turn } = await session($, on)
  await turn(usageOf(0, 150_000))
  expect((await command($, 'atc-cache-tax')).text).toMatch(/lifetime 5m: an API key or cloud provider/)
  await clock.advance(7 * MINUTE)

  const held = await typed($, 'next step please')
  expect(held.drop).toMatch(/^atc-cache-tax held this prompt: the prompt cache expired 2m ago, so this prompt writes 150k tokens to it again \(about \$0\.75\)/)
  expect(sent).toEqual([])
  await typed($, 'next step please')
  expect(sent).toEqual(['next step please'])
})

test('a warm cache, a small context or a slash command is never held', async ($, on) => {
  const { clock, sent, turn } = await session($, on)
  await turn(usageOf(0, 20_000))
  await clock.advance(10 * MINUTE)
  await typed($, 'small context')
  await turn(usageOf(0, 150_000))
  await clock.advance(3 * MINUTE)
  await typed($, 'still warm')
  expect(sent).toEqual(['small context', 'still warm'])
})

test('a subscription has a one-hour cache', async ($, on) => {
  const { clock, sent, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 150_000))
  expect((await command($, 'atc-cache-tax')).text).toMatch(/lifetime 1h: a Claude subscription/)
  await clock.advance(30 * MINUTE)
  await typed($, 'after lunch')
  expect(sent).toEqual(['after lunch'])
  await clock.advance(40 * MINUTE)
  expect((await typed($, 'after a meeting')).drop).toMatch(/expired 10m ago/)
})

test('the env var and the setting decide the lifetime as Claude Code does', async ($, on) => {
  await session($, on, { env: { CLAUDE_CODE_PROMPT_CACHE_TTL: '1h', FORCE_PROMPT_CACHING_5M: '1' }, setting: '1h' })
  expect((await command($, 'atc-cache-tax')).text).toMatch(/lifetime 5m: FORCE_PROMPT_CACHING_5M is set/)
})

test('the promptCacheTtl setting is read', async ($, on) => {
  await session($, on, { setting: '1h' })
  expect((await command($, 'atc-cache-tax')).text).toMatch(/lifetime 1h: the promptCacheTtl setting/)
})

test('a cache seen holding past five minutes is taken to live an hour', async ($, on) => {
  const { clock, turn } = await session($, on)
  await turn(usageOf(0, 150_000))
  await clock.advance(20 * MINUTE)
  await turn(usageOf(150_000, 500))
  expect((await command($, 'atc-cache-tax')).text).toMatch(/lifetime 1h: seen holding for more than five minutes/)
})

test('notice mode sends the prompt and says what it cost', { options: { guard: 'notice' } }, async ($, on) => {
  const { clock, sent, toasts, turn } = await session($, on)
  await turn(usageOf(0, 150_000))
  await clock.advance(7 * MINUTE)
  await typed($, 'go on')
  expect(sent).toEqual(['go on'])
  expect(toasts.at(-1)).toMatch(/^The prompt cache expired 2m ago/)
})

test('guard off, from the command, lets everything through', async ($, on) => {
  const { clock, sent, turn } = await session($, on)
  await turn(usageOf(0, 150_000))
  expect((await command($, 'atc-cache-tax', 'guard off')).text).toBe('Guard set to off for this session.')
  await clock.advance(7 * MINUTE)
  await typed($, 'go on')
  expect(sent).toEqual(['go on'])
})

test('keep-warm pings before the cache would lapse, and the band shows it', async ($, on) => {
  const { clock, forks, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  expect((await command($, 'atc-keepwarm', '2h')).text).toMatch(/^Keep-warm on for 2h: one ping every 50m while you're away, each about \$0\.\d\d at this context/)
  for (const surface of SURFACES) expect(await bandText($, surface)).toMatch(/^keep-warm cache warm · next ping in 50m · 2h left · 0 pings/)

  await clock.advance(49 * MINUTE)
  expect(forks).toHaveLength(0)
  await clock.advance(2 * MINUTE)
  expect(forks).toHaveLength(1)
  await clock.advance(50 * MINUTE)
  expect(forks).toHaveLength(2)
  expect(await bandText($, 'terminal')).toMatch(/· 2 pings, \$0\.\d\d$/)
  // The cache stayed warm, so a prompt now goes through.
  expect((await typed($, 'back again')).drop).toBeUndefined()
})

test('keep-warm stops when a ping finds the cache gone, and when its time is up', async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { pings: [usageOf(120_000, 40), usageOf(0, 120_000)] })
  await turn(usageOf(0, 120_000))
  await command($, 'atc-keepwarm', '1h')
  await clock.advance(5 * MINUTE)
  expect(forks).toHaveLength(1)
  await clock.advance(4 * MINUTE)
  expect(forks).toHaveLength(2)
  expect(toasts.at(-1)).toMatch(/^Keep-warm stopped, the cache had already expired\. 2 pings/)
  expect(await bandText($, 'terminal')).toBeUndefined()

  await command($, 'atc-keepwarm', '30m')
  await clock.advance(31 * MINUTE)
  expect(toasts.at(-1)).toMatch(/^Keep-warm stopped, its time is up/)
})

test("keep-warm stops when its pings didn't keep the cache: the next prompt had to rewrite it", async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await command($, 'atc-keepwarm', '2h')
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  // Back after 70 minutes: the guard sees a ping 20 minutes ago, but the request writes everything again.
  await clock.advance(19 * MINUTE)
  expect((await typed($, 'back')).drop).toBeUndefined()
  await turn(usageOf(0, 120_000))
  expect(toasts.at(-1)).toMatch(/^Keep-warm stopped, the pings didn't keep this account's cache warm\. 1 ping/)
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Cache rewrites this session: 1, 120k tokens, about \$0\.96/)
})

test('the guard holds one prompt per expiry, whatever its text', async ($, on) => {
  const { clock, sent, turn } = await session($, on)
  await turn(usageOf(0, 150_000))
  await clock.advance(7 * MINUTE)
  expect((await typed($, 'first try')).drop).toBeDefined()
  expect((await typed($, 'first try, reworded')).drop).toBeUndefined()
  expect(sent).toEqual(['first try, reworded'])
})

test('keep-warm never pings a cache that has already expired, or while Claude works', async ($, on) => {
  const { clock, forks, turn } = await session($, on)
  await turn(usageOf(0, 120_000))
  await clock.advance(10 * MINUTE)
  expect((await command($, 'atc-keepwarm', 'always')).text).toMatch(/The cache has already expired: pings start after your next prompt\.$/)
  await clock.advance(10 * MINUTE)
  expect(forks).toHaveLength(0)
  expect(await bandText($, 'terminal')).toMatch(/cache expired · pings start after your next prompt · no end/)
})

test("what the mod knows of the cache is kept in the session's state, which a reload keeps", async ($, on) => {
  const written: unknown[] = []
  on('state.set', async (_$, e, next) => {
    if ((e as { key?: string }).key === 'seen') written.push((e as { value: unknown }).value)
    return next(e)
  })
  const { clock, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  const at = clock.now()
  expect(written.at(-1)).toEqual({ at, model: MODEL, context: 120_210, warmAt: at })
})

test('/atc-keepwarm off and bad times', async ($, on) => {
  await session($, on)
  expect((await command($, 'atc-keepwarm', 'off')).text).toBe('Keep-warm is not on.')
  expect((await command($, 'atc-keepwarm', '13h')).text).toMatch(/^"13h" is not a time/)
  await command($, 'atc-keepwarm', '90m')
  expect((await command($, 'atc-keepwarm', 'off')).text).toBe('Keep-warm off. 0 pings, about <$0.01.')
})

test('with prompt caching off, nothing is held and keep-warm refuses', async ($, on) => {
  const { clock, sent, turn } = await session($, on, { env: { DISABLE_PROMPT_CACHING: '1' } })
  await turn(usageOf(0, 150_000))
  await clock.advance(10 * MINUTE)
  await typed($, 'hello')
  expect(sent).toEqual(['hello'])
  expect((await command($, 'atc-keepwarm', '2h')).text).toMatch(/^Prompt caching is off/)
})

test('auto keep-warm is off unless it is set', { options: { autoKeepWarm: 'off' } }, async ($, on) => {
  const { clock, forks, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(0)
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Auto keep-warm: off \(the autoKeepWarm setting in \/config/)
})

test('auto keep-warm pings after an answer, shows only once it has pinged, and says what it did on return', { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  expect(await bandText($, 'terminal')).toBeUndefined()
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Keep-warm: auto, 3h more; 0 pings, about <\$0\.01 of at most \$0\.48 for this break/)

  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  for (const surface of SURFACES) expect(await bandText($, surface)).toMatch(/^auto keep-warm cache warm · next ping in 49m · 2h9m left · 1 ping, \$0\.\d\d$/)
  await clock.advance(50 * MINUTE)
  expect(forks).toHaveLength(2)

  // Back: the prompt reads the cache, and the window ends until the answer starts a new one.
  expect((await typed($, 'back')).drop).toBeUndefined()
  await turn(usageOf(120_000, 500))
  expect(toasts.at(-1)).toMatch(
    /^While you were away, auto keep-warm sent 2 pings \(about \$0\.\d\d\), so this prompt read 120k tokens from the cache instead of writing them to it again \(about \$0\.96\)\.$/,
  )
  expect(await bandText($, 'terminal')).toBeUndefined()
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Keep-warm: auto, 3h more; 0 pings/)
})

test("auto keep-warm claims no saving when you're back before the cache would have expired", { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  await clock.advance(4 * MINUTE)
  await typed($, 'back')
  await turn(usageOf(120_000, 500))
  expect(toasts).toEqual([])
})

test('auto keep-warm ends quietly when its time is up, and says so on return', { options: { autoKeepWarm: '1h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  await clock.advance(60 * MINUTE)
  expect(forks).toHaveLength(1)
  expect(toasts).toEqual([])
  expect(await bandText($, 'terminal')).toBeUndefined()

  await clock.advance(30 * MINUTE)
  await typed($, 'back')
  await typed($, 'back')
  await turn(usageOf(0, 120_000))
  expect(toasts.at(-1)).toMatch(/^While you were away, auto keep-warm sent 1 ping \(about \$0\.\d\d\), then stopped: its 1h were up\.$/)
  // Not the pings' fault: auto keep-warm stays on.
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Auto keep-warm: up to 1h after each answer/)
})

test('with the five-minute lifetime, auto keep-warm stops at half of what a rewrite costs', { options: { autoKeepWarm: '4h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on)
  await turn(usageOf(0, 120_000))
  for (let minute = 0; minute < 60; minute++) await clock.advance(MINUTE)
  // A rewrite costs about $0.60 here and a ping about $0.03: ten pings, every 4 minutes.
  expect(forks).toHaveLength(10)
  expect(await bandText($, 'terminal')).toBeUndefined()

  await typed($, 'back')
  await typed($, 'back')
  await turn(usageOf(0, 120_000))
  expect(toasts.at(-1)).toMatch(/^While you were away, auto keep-warm sent 10 pings \(about \$0\.28\), then stopped: it reached its cost limit/)
})

test("auto keep-warm turns itself off for the session when its pings didn't keep the cache", { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  await clock.advance(19 * MINUTE)
  await typed($, 'back')
  await turn(usageOf(0, 120_000))
  expect(toasts.at(-1)).toMatch(/^Auto keep-warm is off for this session: the pings didn't keep this account's cache warm\. 1 ping/)

  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  expect((await command($, 'atc-cache-tax')).text).toMatch(/Auto keep-warm: off for this session, because the pings didn't keep/)
})

test('auto keep-warm turns itself off for the session when a ping finds the cache expired, as over a plan limit', { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true, pings: [usageOf(0, 120_000)] })
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  expect(toasts.at(-1)).toMatch(/^Auto keep-warm is off for this session: a ping found the cache already expired, so it lives shorter than the mod assumed .* setting cacheTtl to 5m .*\. 1 ping, about \$\d\.\d\d\.$/)

  // The next break pays no second rewrite.
  await typed($, 'back')
  await typed($, 'back')
  await turn(usageOf(0, 120_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
})

test('a manual window wins over auto keep-warm, which starts again after the next answer', { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, toasts, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  await command($, 'atc-keepwarm', '30m')
  expect(await bandText($, 'terminal')).toMatch(/^keep-warm /)
  await clock.advance(31 * MINUTE)
  expect(toasts.at(-1)).toMatch(/^Keep-warm stopped, its time is up/)

  await turn(usageOf(120_000, 500))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  expect(await bandText($, 'terminal')).toMatch(/^auto keep-warm /)
})

test('auto keep-warm skips a small context', { options: { autoKeepWarm: '3h' } }, async ($, on) => {
  const { clock, forks, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 20_000))
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(0)
})

test('/atc-keepwarm auto turns it on and off for the session', async ($, on) => {
  const { clock, forks, turn } = await session($, on, { isSubscription: true })
  await turn(usageOf(0, 120_000))
  expect((await command($, 'atc-keepwarm', 'auto 2h')).text).toMatch(/^Auto keep-warm on for this session: after each answer the cache is kept warm for up to 2h/)
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  expect((await command($, 'atc-keepwarm', 'off')).text).toMatch(/^Keep-warm off\. 1 ping, about \$0\.\d\d\. Auto keep-warm starts again after Claude's next answer/)

  await turn(usageOf(120_000, 500))
  expect((await command($, 'atc-keepwarm', 'auto off')).text).toBe('Auto keep-warm off for this session.')
  await clock.advance(51 * MINUTE)
  expect(forks).toHaveLength(1)
  expect((await command($, 'atc-keepwarm', 'auto 9h')).text).toMatch(/^"9h" is not an auto time/)
  expect((await command($, 'atc-keepwarm', 'auto')).text).toMatch(/^Auto keep-warm: off \(/)
})
