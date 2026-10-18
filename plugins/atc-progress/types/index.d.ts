export type PlanPhase = {
  n: number
  title: string
  status: string
  done: number
  total: number
}

export type Plan = {
  path: string
  goal: string
  status: string
  phases: PlanPhase[]
  done: number
  total: number
  /** The file's modification time when it was read; 0 when unknown. */
  mtimeMs: number
}

export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRun = {
  id: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  startedAt: number
  endedAt?: number
  /** Tokens in the context window at the subagent's latest request. */
  contextTokens: number
  /** Every token billed across the subagent's requests. */
  tokens: number
  /** Rough list-price estimate, not a bill. */
  costUsd: number
  steps: number
}

declare module 'claude-code' {
  interface PluginState {
    'atc-progress': {
      plan: Plan | null
      isPlanHidden: boolean
      /** True once the user chose the plan on the bar: only the user moves it then. */
      isPinned: boolean
      /** Every plan under plan/, for the picker pane. */
      plans: Plan[]
      agents: AgentRun[]
      now: number
    }
  }
}
