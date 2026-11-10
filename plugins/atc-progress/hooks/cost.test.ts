import { expect, test } from 'claude-code/testing'

import { costOf, priceOf } from './cost'

const MILLION = 1_000_000
const reads = (model: string) => costOf(model, { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: MILLION, cache_creation_input_tokens: 0 })

test('each Fable and Mythos version has its own price', async () => {
  expect(priceOf('claude-fable-5-2')).toEqual({ input: 8, output: 40, cacheRead: 0.2 })
  expect(priceOf('claude-mythos-5-2')).toEqual({ input: 8, output: 40, cacheRead: 0.2 })
  expect(priceOf('claude-fable-5-1')).toEqual({ input: 10, output: 50, cacheRead: 0.25 })
  expect(priceOf('claude-mythos-5-1')).toEqual({ input: 10, output: 50, cacheRead: 0.25 })
  expect(priceOf('claude-fable-5')).toEqual({ input: 10, output: 50, cacheRead: 1 })
  // An id newer than the list is priced as the current version.
  expect(priceOf('claude-fable-9-9')).toEqual({ input: 8, output: 40, cacheRead: 0.2 })
})

test('each Sonnet version has its own price', async () => {
  expect(reads('claude-sonnet-5-5').toFixed(4)).toBe('0.1000')
  expect(reads('claude-sonnet-5').toFixed(4)).toBe('0.2000')
  expect(priceOf('claude-sonnet-4-6')).toEqual({ input: 3, output: 15, cacheRead: 0.3 })
  expect(priceOf('claude-sonnet-9-9')).toEqual({ input: 2, output: 10, cacheRead: 0.1 })
})

test('a cache write is priced at the one-hour rate', async () => {
  const write = costOf('claude-fable-5-2', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: MILLION })
  expect(write).toBe(16)
  expect(costOf('some-other-model', { input_tokens: MILLION, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 })).toBe(0)
})
