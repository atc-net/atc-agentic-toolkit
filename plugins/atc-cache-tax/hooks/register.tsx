import { atom, read, update } from 'claude-code'
import type { EngineInterface, PromptSubmitInput, PromptSubmitResult, Register, Timer } from 'claude-code'

import type { KeepWarm } from '../types'
import {
  contextOf,
  costOf,
  formatDuration,
  formatTokens,
  formatUsd,
  isPingDue,
  parseWindow,
  PING_MARGIN_MS,
  rewriteCost,
  stateOf,
  stopReason,
  TTL_MS,
  ttlOf,
} from './cache'
import type { TtlGuess, Usage } from './cache'

const keepWarm = atom({ plugin: 'atc-cache-tax', key: 'keepWarm' } as const, null)
const seen = atom({ plugin: 'atc-cache-tax', key: 'seen' } as const, null)

/** Keeps what the mod knows of the cache in the session's state, which a reload of the mod keeps. */
async function remember($: EngineInterface, memory: Memory): Promise<void> {
  const { last, warmAt } = memory
  if (last !== undefined && warmAt !== undefined) await update($, seen, () => ({ ...last, warmAt }))
}

/** The guard holds a prompt only when the context is at least this big: below it a rewrite is cheap. */
const GUARD_MIN_TOKENS = 50_000
/** A request that wrote at least this much, more than it read, after the cache lapsed counts as a rewrite. */
const REWRITE_MIN_TOKENS = 10_000
const TICK_MS = 60_000
const PING_PROMPT = 'This is an automatic keep-alive request from the atc-cache-tax mod. Reply with just: ok'

type GuardMode = 'ask' | 'notice' | 'off'
const GUARD_MODES: readonly GuardMode[] = ['ask', 'notice', 'off']

type Memory = {
  /** The main conversation's last request: when, on which model, and the context it sent. */
  last?: { at: number; model: string; context: number }
  /** When the cache was last read or written, by a main request or a ping. */
  warmAt?: number
  ttl: TtlGuess
  isSeenOverFiveMinutes: boolean
  isCachingOff: boolean
  isWorking: boolean
  isPinging: boolean
  failures: number
  guard: GuardMode
  /** Set when the guard held a prompt: it holds one per expiry, until Claude answers again. */
  held?: true
  /** Once the session has reported subscription rate limits, it is a subscription. */
  isSubscription?: boolean
  rewrites: { count: number; tokens: number; usd: number }
  timer?: Timer
  /** The mod's `cacheTtl` setting. */
  configuredTtl?: string
}

const isOn = (value: string | undefined) => value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false'
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const HELP = [
  'Keeps the prompt cache warm and warns before a prompt pays to rewrite it.',
  '',
  '/atc-cache-tax               the cache, the context, the guard and keep-warm',
  '/atc-cache-tax guard <mode>  ask, notice or off, for this session',
  '/atc-keepwarm <time>         keep the cache warm while you are away: 90m, 2h30m (up to 12h) or always',
  '/atc-keepwarm off            stop it',
  '/atc-keepwarm status         how it is going',
].join('\n')

/** Works the cache lifetime out again from the environment, the settings and the account. */
async function resolveTtl($: EngineInterface, memory: Memory): Promise<void> {
  const usage = await $.session.usage().catch(() => undefined)
  // Rate limits are reported on a subscription only, and only once a response has come.
  if (usage && usage.rateLimits.length > 0) memory.isSubscription = true
  const isSubscription = memory.isSubscription ?? (memory.last ? false : undefined)
  memory.ttl = ttlOf({
    configured: memory.configuredTtl,
    force5m: await $.env.get('FORCE_PROMPT_CACHING_5M'),
    envTtl: await $.env.get('CLAUDE_CODE_PROMPT_CACHE_TTL'),
    settingTtl: await $.settings.read({ key: 'promptCacheTtl' }).catch(() => undefined),
    enable1h: await $.env.get('ENABLE_PROMPT_CACHING_1H'),
    isSubscription,
    isSeenOverFiveMinutes: memory.isSeenOverFiveMinutes,
  })
  memory.isCachingOff = isOn(await $.env.get('DISABLE_PROMPT_CACHING'))
}

/** Notes one request of the main conversation: the cache it read and wrote, and the context it sent. */
async function noteRequest($: EngineInterface, memory: Memory, model: string, usage: Usage): Promise<void> {
  const now = await $.clock.now()
  const reads = usage.cache_read_input_tokens || 0
  const writes = usage.cache_creation_input_tokens || 0
  const gap = memory.warmAt === undefined ? undefined : now - memory.warmAt
  if (gap !== undefined && memory.last) {
    // Still read well past five minutes: the cache lives an hour, whatever was assumed.
    if (gap > TTL_MS['5m'] + 30_000 && reads >= memory.last.context * 0.5 && !memory.isSeenOverFiveMinutes) {
      memory.isSeenOverFiveMinutes = true
      await resolveTtl($, memory)
    }
    // Told by what the request did, not by the clock: a ping may have moved the clock on without
    // keeping the entry.
    if (writes >= REWRITE_MIN_TOKENS && writes > reads) {
      memory.rewrites.count++
      memory.rewrites.tokens += writes
      memory.rewrites.usd += rewriteCost(model, writes, memory.ttl.ttl)
      // Without the pings the entry would have expired by now, and it did: they didn't keep it.
      const kw = await read($, keepWarm)
      if (kw !== null && kw.pings > 0 && now - memory.last.at >= TTL_MS[memory.ttl.ttl]) {
        await stopKeepWarm($, memory, "the pings didn't keep this account's cache warm")
      }
    }
  }
  memory.last = { at: now, model, context: contextOf(usage) }
  memory.held = undefined
  memory.warmAt = now
  await remember($, memory)
}

async function stopKeepWarm($: EngineInterface, memory: Memory, reason?: string): Promise<void> {
  memory.timer?.cancel()
  memory.timer = undefined
  const was = await read($, keepWarm)
  await update($, keepWarm, () => null)
  if (was && reason) {
    await $.ui.toast(`Keep-warm stopped, ${reason}. ${plural(was.pings, 'ping')}, about ${formatUsd(was.costUsd)}.`)
  }
}

/** One keep-warm ping: a question over the conversation that reads its cache and so keeps it. */
async function ping($: EngineInterface, memory: Memory): Promise<void> {
  memory.isPinging = true
  try {
    const reply = await $.model.fork({ prompt: PING_PROMPT })
    if (!reply.isAnswered) {
      if (reply.reason === 'nothing-to-fork') return
      if (++memory.failures >= 2) await stopKeepWarm($, memory, `the ping failed twice (${reply.reason})`)
      return
    }
    memory.failures = 0
    const now = await $.clock.now()
    const cost = costOf(memory.last?.model ?? '', reply.usage, '5m')
    await update($, keepWarm, kw => kw && { ...kw, pings: kw.pings + 1, costUsd: kw.costUsd + cost, lastPingAt: now })
    const reason = stopReason(reply.usage)
    if (reason !== undefined) await stopKeepWarm($, memory, reason)
    else {
      memory.warmAt = now
      await remember($, memory)
    }
  } finally {
    memory.isPinging = false
  }
}

/** Once a minute while keep-warm runs: end the window, ping when due, and update the band. */
async function tick($: EngineInterface, memory: Memory): Promise<void> {
  const now = await $.clock.now()
  const kw = await read($, keepWarm)
  if (kw === null) return
  if (kw.until !== null && now >= kw.until) return stopKeepWarm($, memory, 'its time is up')
  const { ttl } = memory.ttl
  const warmAt = memory.warmAt
  // A cold cache isn't pinged: that would pay the whole rewrite. The next prompt warms it again.
  if (!memory.isWorking && !memory.isPinging && warmAt !== undefined && stateOf(now, warmAt, ttl) === 'warm' && isPingDue(now, warmAt, ttl)) {
    await ping($, memory)
  }
  const at = await $.clock.now()
  const warm = memory.warmAt
  await update($, keepWarm, current =>
    current && {
      ...current,
      checkedAt: at,
      cache: stateOf(at, warm, ttl),
      nextPingAt: warm === undefined ? undefined : warm + TTL_MS[ttl] - PING_MARGIN_MS[ttl],
    },
  )
}

function startTimer($: EngineInterface, memory: Memory): void {
  if (memory.timer !== undefined) return
  memory.timer = $.clock.every(TICK_MS, () => void tick($, memory).catch(() => undefined))
}

/** What re-sending the context costs, or undefined before the first answer. */
const rewriteNow = (memory: Memory) => (memory.last ? rewriteCost(memory.last.model, memory.last.context, memory.ttl.ttl) : undefined)

async function card($: EngineInterface, memory: Memory): Promise<string> {
  const now = await $.clock.now()
  const { ttl, why } = memory.ttl
  const lines: string[] = []
  if (memory.isCachingOff) lines.push('Prompt caching is off (DISABLE_PROMPT_CACHING), so there is nothing to keep warm.')
  const state = stateOf(now, memory.warmAt, ttl)
  const left = memory.warmAt === undefined ? 0 : memory.warmAt + TTL_MS[ttl] - now
  lines.push(
    `Cache: ${state === 'unknown' ? 'unknown until Claude has answered' : state === 'warm' ? `warm, about ${formatDuration(left)} left` : `expired ${formatDuration(-left)} ago`} (lifetime ${ttl}: ${why})`,
  )
  if (memory.last) {
    lines.push(`Context: ${formatTokens(memory.last.context)} tokens on ${memory.last.model}; writing it to the cache again costs about ${formatUsd(rewriteNow(memory) ?? 0)}`)
  }
  const guardText = { ask: 'holds a prompt once', notice: 'shows a notice', off: 'does nothing' }[memory.guard]
  lines.push(`Guard: ${memory.guard} (${guardText} when the cache has expired and the context is ${formatTokens(GUARD_MIN_TOKENS)} tokens or more)`)
  const kw = await read($, keepWarm)
  if (kw === null) lines.push('Keep-warm: off (/atc-keepwarm 2h turns it on)')
  else {
    const window = kw.until === null ? 'until you turn it off' : `${formatDuration(kw.until - now)} more`
    lines.push(`Keep-warm: on, ${window}; ${plural(kw.pings, 'ping')}, about ${formatUsd(kw.costUsd)}`)
  }
  const r = memory.rewrites
  lines.push(`Cache rewrites this session: ${r.count === 0 ? 'none' : `${r.count}, ${formatTokens(r.tokens)} tokens, about ${formatUsd(r.usd)}`}`)
  lines.push('', 'Dollar figures are estimates at list prices.')
  return lines.join('\n')
}

/** The guard's answer to a prompt: hold it, or undefined to let it through. */
async function guardOf($: EngineInterface, memory: Memory, e: PromptSubmitInput): Promise<PromptSubmitResult | undefined> {
  if (memory.guard === 'off' || memory.isCachingOff || e.command || e.isMeta) return undefined
  if (e.origin.kind !== 'composer' && e.origin.kind !== 'bridge') return undefined
  const last = memory.last
  if (!last || memory.warmAt === undefined || last.context < GUARD_MIN_TOKENS) return undefined
  const now = await $.clock.now()
  const { ttl } = memory.ttl
  if (stateOf(now, memory.warmAt, ttl) !== 'cold') return undefined
  if (memory.held) return undefined
  const ago = formatDuration(now - memory.warmAt - TTL_MS[ttl])
  const cost = formatUsd(rewriteCost(last.model, last.context, ttl))
  const what = `the prompt cache expired ${ago} ago, so this prompt writes ${formatTokens(last.context)} tokens to it again (about ${cost})`
  if (memory.guard === 'notice') {
    await $.ui.toast(`${what.charAt(0).toUpperCase()}${what.slice(1)}.`)
    return undefined
  }
  memory.held = true
  return { drop: `atc-cache-tax held this prompt: ${what}. Press Enter to send it anyway, or /clear to start over.` }
}

export const register: Register = (on, options) => {
  const memory: Memory = {
    ttl: { ttl: '5m', why: 'not known yet' },
    isSeenOverFiveMinutes: false,
    isCachingOff: false,
    isWorking: false,
    isPinging: false,
    failures: 0,
    guard: GUARD_MODES.includes(options.guard as GuardMode) ? (options.guard as GuardMode) : 'ask',
    rewrites: { count: 0, tokens: 0, usd: 0 },
    configuredTtl: typeof options.cacheTtl === 'string' ? options.cacheTtl : undefined,
  }

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({ name: 'atc-cache-tax', description: 'The prompt cache: warm or expired, what a rewrite costs, the guard', argumentHint: '[guard ask|notice|off|help]' })
    await $.command.register({ name: 'atc-keepwarm', description: 'Keep the prompt cache warm while you are away', argumentHint: '[90m|2h30m|always|status|off]' })
    // After a reload of the mod: what it knew of the cache, from the session's state.
    const known = await read($, seen)
    if (known !== null && memory.last === undefined) {
      memory.last = { at: known.at, model: known.model, context: known.context }
      memory.warmAt = known.warmAt
    }
    await resolveTtl($, memory).catch(() => undefined)
    // After a reload the window is still in the state: its timer starts again.
    if ((await read($, keepWarm)) !== null) startTimer($, memory)
    return started
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) memory.isWorking = true
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (!e.agentId) {
      memory.isWorking = false
      await resolveTtl($, memory).catch(() => undefined)
    }
    return done
  }).catch(($, e, next) => next(e))

  // Reads what each main request read from and wrote to the cache. It never changes a request.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (!e.agentId && result.usage) await noteRequest($, memory, result.usage.model || e.model, result.usage).catch(() => undefined)
    return result
  })

  on('prompt.submit', async ($, e, next) => {
    const held = await guardOf($, memory, e).catch(() => undefined)
    return held ?? next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'atc-cache-tax' }, async ($, e) => {
    const [verb = '', mode = ''] = e.args.trim().toLowerCase().split(/\s+/)
    if (verb === '' || verb === 'status') return { text: await card($, memory) }
    if (verb === 'guard') {
      if (!GUARD_MODES.includes(mode as GuardMode)) return { text: `Guard is ${memory.guard}. Use /atc-cache-tax guard ask, notice or off.` }
      memory.guard = mode as GuardMode
      return { text: `Guard set to ${mode} for this session.` }
    }
    if (verb === 'help' || verb === '?') return { text: HELP }
    return { text: `Unknown option "${verb}".\n\n${HELP}` }
  })

  on('command.run', { command: 'atc-keepwarm' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === '' || arg === 'status') return { text: await card($, memory) }
    if (arg === 'off') {
      const was = await read($, keepWarm)
      await stopKeepWarm($, memory)
      return { text: was === null ? 'Keep-warm is not on.' : `Keep-warm off. ${plural(was.pings, 'ping')}, about ${formatUsd(was.costUsd)}.` }
    }
    if (arg === 'help' || arg === '?') return { text: HELP }
    const window = parseWindow(arg)
    if (window === undefined) return { text: `"${arg}" is not a time: use 90m, 2h, 2h30m (up to 12h) or always.\n\n${HELP}` }
    if (memory.isCachingOff) return { text: 'Prompt caching is off (DISABLE_PROMPT_CACHING), so there is nothing to keep warm.' }

    const now = await $.clock.now()
    const { ttl } = memory.ttl
    const kw: KeepWarm = {
      until: window === null ? null : now + window,
      pings: 0,
      costUsd: 0,
      checkedAt: now,
      cache: stateOf(now, memory.warmAt, ttl),
      nextPingAt: memory.warmAt === undefined ? undefined : memory.warmAt + TTL_MS[ttl] - PING_MARGIN_MS[ttl],
    }
    await update($, keepWarm, () => kw)
    startTimer($, memory)
    const every = formatDuration(TTL_MS[ttl] - PING_MARGIN_MS[ttl])
    const each = memory.last
      ? `, each about ${formatUsd(costOf(memory.last.model, { input_tokens: 0, output_tokens: 10, cache_read_input_tokens: memory.last.context, cache_creation_input_tokens: 50 }, '5m'))} at this context`
      : ''
    const length = window === null ? 'until /atc-keepwarm off' : `for ${formatDuration(window)}`
    const note = kw.cache === 'cold' ? ' The cache has already expired: pings start after your next prompt.' : ''
    return { text: `Keep-warm on ${length}: one ping every ${every} while you're away${each} (cache lifetime ${ttl}: ${memory.ttl.why}).${note}` }
  })

  // While keep-warm runs: a row above the prompt with how it stands, and a way to stop it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const kw = await read($, keepWarm)
    if (kw === null) return next(e)

    // Our row on top, other mods' rows beneath it; the engine's own placeholder is not nested.
    const drawn = await Promise.resolve(next(e)).catch(() => null)
    const below = drawn && typeof drawn === 'object' && (drawn as { type?: string }).type !== 'engine' ? drawn : null
    const { Box, Text, Button } = $.ui.resolve(e)
    const cache =
      kw.cache === 'warm'
        ? `cache warm${kw.nextPingAt === undefined ? '' : ` · next ping in ${formatDuration(kw.nextPingAt - kw.checkedAt)}`}`
        : kw.cache === 'cold'
          ? 'cache expired · pings start after your next prompt'
          : 'waiting for the first answer'
    const left = kw.until === null ? 'no end' : `${formatDuration(kw.until - kw.checkedAt)} left`
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text color="claude">♨</Text>
          <Text bold>keep-warm</Text>
          <Text dimColor wrap="truncate-end">
            {`${cache} · ${left} · ${plural(kw.pings, 'ping')}, ${formatUsd(kw.costUsd)}`}
          </Text>
          <Button key="off" plain role="dismiss" label="off" onPress={() => void stopKeepWarm($, memory).then(() => $.ui.toast('Keep-warm off.'))} />
        </Box>
        {below}
      </Box>
    )
  })
}
