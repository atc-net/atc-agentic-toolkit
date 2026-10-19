/** `+` added, `-` removed, ` ` unchanged context, `~` unchanged lines left out. */
export type DiffOp = '+' | '-' | ' ' | '~'

export type DiffLine = { op: DiffOp; text: string }

/** One edit as the pane shows it, its diff already trimmed to what can be drawn. */
export type Step = {
  /** The file, relative to the session's folder when it is inside it. */
  file: string
  tool: 'Edit' | 'Write'
  /** `new file`, `rewrite`, `replace all`, `by a subagent`, joined with ` · `; may be empty. */
  note: string
  /** The line in the file where the edit starts, when it could be found. */
  line?: number
  added: number
  removed: number
  lines: DiffLine[]
  /** Diff lines left out after `lines`. */
  more: number
}

declare module 'claude-code' {
  interface PluginState {
    'atc-replay-theater': {
      /** The edits of the last main turn that made any. */
      replay: Step[]
      /** The step the pane shows. */
      index: number
      /** True while the replay is open, in its pane or in the band. */
      isOpen: boolean
      /** True when no pane could be placed, so the replay draws in the band above the prompt. */
      inBand: boolean
      /** True once the hint above the prompt was dismissed; a new replay shows it again. */
      isHintHidden: boolean
    }
  }
}
