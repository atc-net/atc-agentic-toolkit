import { expect, test } from 'claude-code/testing'

import { contextOf, formatDuration, formatTokens, formatUsd, isPingDue, parseWindow, rewriteCost, stateOf, stopReason, ttlOf } from './cache'

const MINUTE = 60_000
const usage = (reads: number, writes: number) => ({ input_tokens: 10, output_tokens: 100, cache_read_input_tokens: reads, cache_creation_input_tokens: writes })

test('keep-warm times parse, up to 12 hours', async () => {
  expect(parseWindow('90m')).toBe(90 * MINUTE)
  expect(parseWindow('2h')).toBe(120 * MINUTE)
  expect(parseWindow('2h30m')).toBe(150 * MINUTE)
  expect(parseWindow('always')).toBeNull()
  expect(parseWindow('12h')).toBe(720 * MINUTE)
  for (const bad of ['13h', '0m', 'soon', '', '5']) expect(parseWindow(bad)).toBeUndefined()
})

test("the lifetime follows Claude Code's order", async () => {
  expect(ttlOf({ force5m: '1', envTtl: '1h', enable1h: '1', isSubscription: true }).ttl).toBe('5m')
  expect(ttlOf({ envTtl: '1h', settingTtl: '5m' })).toEqual({ ttl: '1h', why: 'CLAUDE_CODE_PROMPT_CACHE_TTL' })
  expect(ttlOf({ settingTtl: '5m', isSubscription: true }).ttl).toBe('5m')
  expect(ttlOf({ enable1h: 'true' }).ttl).toBe('1h')
  expect(ttlOf({ enable1h: '0', isSubscription: false }).ttl).toBe('5m')
  expect(ttlOf({ isSubscription: true }).ttl).toBe('1h')
  expect(ttlOf({ configured: '1h', force5m: '1' }).ttl).toBe('1h')
  expect(ttlOf({ configured: 'auto', isSeenOverFiveMinutes: true, force5m: '1' }).ttl).toBe('1h')
  expect(ttlOf({}).why).toMatch(/^not known until the first answer/)
})

test('the cache is warm until its lifetime has passed, and a ping is due within the margin', async () => {
  expect(stateOf(100 * MINUTE, undefined, '1h')).toBe('unknown')
  expect(stateOf(100 * MINUTE, 41 * MINUTE, '1h')).toBe('warm')
  expect(stateOf(100 * MINUTE, 40 * MINUTE, '1h')).toBe('cold')
  expect(isPingDue(49 * MINUTE, 0, '1h')).toBe(false)
  expect(isPingDue(50 * MINUTE, 0, '1h')).toBe(true)
  expect(isPingDue(4 * MINUTE, 0, '5m')).toBe(true)
})

test('a ping that read nothing, or wrote much, stops keep-warm', async () => {
  expect(stopReason(usage(120_000, 40))).toBeUndefined()
  expect(stopReason(usage(0, 120_000))).toBe('the cache had already expired')
  expect(stopReason(usage(100_000, 20_000))).toBe('a ping had to write 20k tokens to the cache, so pings cost more than they save')
})

test('costs follow the model and the lifetime', async () => {
  expect(rewriteCost('claude-opus-5-5', 1_000_000, '1h')).toBe(8)
  expect(rewriteCost('claude-opus-5-5', 1_000_000, '5m')).toBe(5)
  expect(rewriteCost('claude-sonnet-4-5', 1_000_000, '5m')).toBe(3.75)
  expect(rewriteCost('some-other-model', 1_000_000, '1h')).toBe(0)
  expect(contextOf(usage(1000, 200))).toBe(1310)
})

test('figures are short', async () => {
  expect(formatTokens(950)).toBe('950')
  expect(formatTokens(151_234)).toBe('151k')
  expect(formatTokens(1_250_000)).toBe('1.3M')
  expect(formatUsd(0.004)).toBe('<$0.01')
  expect(formatUsd(1.456)).toBe('$1.46')
  expect(formatDuration(42 * MINUTE)).toBe('42m')
  expect(formatDuration(120 * MINUTE)).toBe('2h')
  expect(formatDuration(150 * MINUTE)).toBe('2h30m')
})
