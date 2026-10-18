// List prices in USD per million tokens (Anthropic first-party API, as of 2026-10).
// Cache writes are priced at the one-hour rate (2x input), which is what Claude Code
// writes on a subscription; sessions writing five-minute entries are overestimated.
// This is an estimate for the pane, never a bill.

type Price = { input: number; output: number; cacheRead: number }

const PRICES: { match: RegExp; price: Price }[] = [
  { match: /fable|mythos/i, price: { input: 10, output: 50, cacheRead: 0.25 } },
  { match: /opus-5-5|opus-5\.5/i, price: { input: 4, output: 20, cacheRead: 0.2 } },
  { match: /opus/i, price: { input: 5, output: 25, cacheRead: 0.5 } },
  { match: /sonnet/i, price: { input: 2, output: 10, cacheRead: 0.2 } },
  { match: /haiku-5|haiku-5\.5/i, price: { input: 0.1, output: 0.5, cacheRead: 0.01 } },
  { match: /haiku/i, price: { input: 1, output: 5, cacheRead: 0.1 } },
]

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export function priceOf(model: string): Price | undefined {
  return PRICES.find(p => p.match.test(model))?.price
}

export function costOf(model: string, usage: Usage): number {
  const price = priceOf(model)
  if (!price) return 0
  const perToken = 1 / 1_000_000
  return (
    (usage.input_tokens || 0) * price.input * perToken +
    (usage.output_tokens || 0) * price.output * perToken +
    (usage.cache_read_input_tokens || 0) * price.cacheRead * perToken +
    (usage.cache_creation_input_tokens || 0) * price.input * 2 * perToken
  )
}

export function tokensOf(usage: Usage): number {
  return (
    (usage.input_tokens || 0) +
    (usage.output_tokens || 0) +
    (usage.cache_read_input_tokens || 0) +
    (usage.cache_creation_input_tokens || 0)
  )
}

/** Every current model has a one-million-token window. */
export const CONTEXT_WINDOW = 1_000_000
