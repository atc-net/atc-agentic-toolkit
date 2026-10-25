// List prices in USD per million tokens (Anthropic first-party API, as of 2026-10). A cache write
// costs 2x input for a one-hour entry and 1.25x for a five-minute one; a cache read 0.1x, less on
// the newest models.
// Everything this mod shows in dollars is an estimate, never a bill.

/** `read` is the cache-read rate as a share of the input price. */
type Price = { input: number; output: number; read: number }

const PRICES: { match: RegExp; price: Price }[] = [
  { match: /fable|mythos/i, price: { input: 10, output: 50, read: 0.025 } },
  { match: /opus-5-5|opus-5\.5/i, price: { input: 4, output: 20, read: 0.05 } },
  { match: /opus/i, price: { input: 5, output: 25, read: 0.1 } },
  { match: /sonnet-5-5|sonnet-5\.5/i, price: { input: 2, output: 10, read: 0.05 } },
  { match: /sonnet/i, price: { input: 3, output: 15, read: 0.1 } },
  { match: /haiku-5|haiku-5\.5/i, price: { input: 0.1, output: 0.5, read: 0.1 } },
  { match: /haiku/i, price: { input: 1, output: 5, read: 0.1 } },
]

export type Ttl = '5m' | '1h'

export const TTL_MS: Record<Ttl, number> = { '5m': 5 * 60_000, '1h': 60 * 60_000 }
const WRITE_FACTOR: Record<Ttl, number> = { '5m': 1.25, '1h': 2 }

/** How long before the entry would lapse a keep-warm ping goes out. */
export const PING_MARGIN_MS: Record<Ttl, number> = { '5m': 60_000, '1h': 10 * 60_000 }

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

const priceOf = (model: string): Price | undefined => PRICES.find(p => p.match.test(model))?.price
const PER_TOKEN = 1 / 1_000_000

/** What the next request re-sends: the last main request's whole window, its answer included. */
export const contextOf = (usage: Usage): number =>
  (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.output_tokens || 0)

/** The cost of writing `tokens` to the cache again, as a request after it has lapsed does. */
export function rewriteCost(model: string, tokens: number, ttl: Ttl): number {
  const price = priceOf(model)
  return price ? tokens * price.input * WRITE_FACTOR[ttl] * PER_TOKEN : 0
}

/** What one request cost, cache reads and writes priced as such. */
export function costOf(model: string, usage: Usage, ttl: Ttl): number {
  const price = priceOf(model)
  if (!price) return 0
  return (
    ((usage.input_tokens || 0) * price.input +
      (usage.output_tokens || 0) * price.output +
      (usage.cache_read_input_tokens || 0) * price.input * price.read +
      (usage.cache_creation_input_tokens || 0) * price.input * WRITE_FACTOR[ttl]) *
    PER_TOKEN
  )
}

export type CacheState = 'warm' | 'cold' | 'unknown'

/** Whether the main conversation's cache entry still stands, by the time of its last request. */
export function stateOf(now: number, lastAt: number | undefined, ttl: Ttl): CacheState {
  if (lastAt === undefined) return 'unknown'
  return now - lastAt < TTL_MS[ttl] ? 'warm' : 'cold'
}

/** Whether it is time for a keep-warm ping: the entry would lapse within the margin. */
export const isPingDue = (now: number, lastAt: number, ttl: Ttl): boolean => now - lastAt >= TTL_MS[ttl] - PING_MARGIN_MS[ttl]

/**
 * Why keep-warm should stop after a ping, or undefined to go on. Nothing read means the entry had
 * lapsed already, so pings no longer save anything. Writes of 10% or more of the reads mean each
 * ping pays to write part of the conversation to the cache, which costs more than it saves.
 */
export function stopReason(usage: Usage): string | undefined {
  const reads = usage.cache_read_input_tokens || 0
  const writes = usage.cache_creation_input_tokens || 0
  if (reads === 0) return 'the cache had already expired'
  if (writes >= reads * 0.1) return `a ping had to write ${formatTokens(writes)} tokens to the cache, so pings cost more than they save`
  return undefined
}

/** The most a keep-warm window may run, so a forgotten one ends by itself. */
export const MAX_WINDOW_MS = 12 * 60 * 60_000

/** `90m`, `2h`, `2h30m` or `always` (null); undefined for anything else, or a window past 12 hours. */
export function parseWindow(text: string): number | null | undefined {
  const t = text.trim().toLowerCase()
  if (t === 'always') return null
  const match = /^(?:(\d+)h)?\s*(?:(\d+)m)?$/.exec(t)
  if (!match || (match[1] === undefined && match[2] === undefined)) return undefined
  const ms = (Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0)) * 60_000
  return ms > 0 && ms <= MAX_WINDOW_MS ? ms : undefined
}

export const formatTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`

export const formatUsd = (usd: number): string => (usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`)

export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}m`
}

/** What decides the main conversation's cache lifetime, as Claude Code reads it. */
export type TtlFacts = {
  /** The mod's own `cacheTtl` setting: `auto`, or a lifetime the person knows. */
  configured?: string
  force5m?: string
  /** CLAUDE_CODE_PROMPT_CACHE_TTL. */
  envTtl?: string
  /** The `promptCacheTtl` setting. */
  settingTtl?: unknown
  enable1h?: string
  /** True when the session reports subscription rate limits; undefined before the first response. */
  isSubscription?: boolean
  /** True once a request found the cache warm more than five minutes after the one before. */
  isSeenOverFiveMinutes?: boolean
}

export type TtlGuess = { ttl: Ttl; why: string }

const isOn = (value: string | undefined) => value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false'
const asTtl = (value: unknown): Ttl | undefined => (value === '5m' || value === '1h' ? value : undefined)

/**
 * The lifetime of the main conversation's cache, in Claude Code's order: FORCE_PROMPT_CACHING_5M,
 * CLAUDE_CODE_PROMPT_CACHE_TTL, the promptCacheTtl setting, ENABLE_PROMPT_CACHING_1H, then one hour
 * on a subscription and five minutes otherwise. The mod's own setting, and a cache seen to hold
 * past five minutes, come first.
 */
export function ttlOf(facts: TtlFacts): TtlGuess {
  const configured = asTtl(facts.configured)
  if (configured) return { ttl: configured, why: 'set in the mod’s cacheTtl setting' }
  if (facts.isSeenOverFiveMinutes) return { ttl: '1h', why: 'seen holding for more than five minutes' }
  if (isOn(facts.force5m)) return { ttl: '5m', why: 'FORCE_PROMPT_CACHING_5M is set' }
  const env = asTtl(facts.envTtl)
  if (env) return { ttl: env, why: 'CLAUDE_CODE_PROMPT_CACHE_TTL' }
  const setting = asTtl(facts.settingTtl)
  if (setting) return { ttl: setting, why: 'the promptCacheTtl setting' }
  if (isOn(facts.enable1h)) return { ttl: '1h', why: 'ENABLE_PROMPT_CACHING_1H is set' }
  if (facts.isSubscription === true) return { ttl: '1h', why: 'a Claude subscription' }
  if (facts.isSubscription === false) return { ttl: '5m', why: 'an API key or cloud provider' }
  return { ttl: '5m', why: 'not known until the first answer; five minutes assumed' }
}
