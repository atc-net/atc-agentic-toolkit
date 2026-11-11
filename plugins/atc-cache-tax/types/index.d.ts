/** A keep-warm window while it runs. */
export type KeepWarm = {
  /**
   * `manual` for one started with `/atc-keepwarm <time>`; `auto` for one started by auto keep-warm
   * after an answer, which ends at the next request. Missing in a window saved by 0.1: manual.
   */
  kind?: 'manual' | 'auto'
  /** An auto window's most it may spend on pings, in USD: half of what a rewrite costs. */
  budgetUsd?: number
  /** When the window ends, in milliseconds since the epoch; null runs until `/atc-keepwarm off`. */
  until: number | null
  pings: number
  /** The pings' estimated cost in USD. */
  costUsd: number
  /** When the last ping went out. */
  lastPingAt?: number
  /** When the next ping is due, as last worked out. */
  nextPingAt?: number
  /** When the band's figures were worked out: the band counts from here. */
  checkedAt: number
  /** Whether the cache was warm then: `warm`, `cold` or `unknown`. */
  cache: 'warm' | 'cold' | 'unknown'
}

declare module 'claude-code' {
  interface PluginState {
    'atc-cache-tax': {
      /** The keep-warm window, or null when none runs. */
      keepWarm: KeepWarm | null
      /**
       * The main conversation's last request (when, on which model, the context it sent) and when
       * the cache was last read or written; null before the first answer. Kept here so a reload of
       * the mod doesn't forget it.
       */
      seen: { at: number; model: string; context: number; warmAt: number } | null
    }
  }
}
