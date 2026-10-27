/** Where a rule is saved: the project's `CLAUDE.md`, or the person's own `~/.claude/CLAUDE.md`. */
export type RuleScope = 'project' | 'user'

/** A rule found in a prompt, waiting for the person to save, edit or skip it. */
export type Rule = {
  id: string
  /** One line, at most 200 characters. */
  text: string
  /** Where the rule would be saved first. */
  scope: RuleScope
  /** The session's project root when the rule was found: its `CLAUDE.md` is the project one. */
  folder: string
  /**
   * True when `folder` is the project root. Rules kept before it was may name the folder the
   * shell had moved to instead; a session at a root above it takes them over.
   */
  isRoot?: boolean
  /** When it was found, in milliseconds since the epoch. */
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'atc-reflect': {
      /** The rules found in this folder that wait for a decision, oldest first. */
      pending: Rule[]
      /** True while finding rules is paused for this session; `remember:` still works. */
      isPaused: boolean
    }
  }
}
