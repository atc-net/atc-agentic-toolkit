/** One entry of a folder as the tree keeps it. */
export type Entry = {
  name: string
  isDir: boolean
  /** Bytes, for a file; 0 otherwise. */
  size: number
  /** Last change, milliseconds since the epoch, for a file; 0 otherwise. */
  mtimeMs: number
}

/** `M` modified, `A` added, `D` deleted, `R` renamed, `U` in conflict, `?` untracked. */
export type GitCode = 'M' | 'A' | 'D' | 'R' | 'U' | '?'

export type GitFile = { code: GitCode; added?: number; removed?: number }

export type Git = {
  /** The branch, `detached`, or empty before the first commit. */
  branch: string
  ahead: number
  behind: number
  /** Changed files, keyed by their path relative to the tree's root (lowercase on Windows). */
  files: Record<string, GitFile>
  /** Ignored files and folders, the same way. */
  ignored: string[]
}

/** What Claude last did to a file: read it, wrote it, or committed it. */
export type Activity = { kind: 'read' | 'write' | 'commit'; at: number }

declare module 'claude-code' {
  interface PluginState {
    'atc-filetree': {
      /** The folder the tree shows, absolute; empty until the session starts. */
      root: string
      /** Each listed folder's entries, by its path relative to the root (`''` the root). */
      listings: Shaped<Record<string, Entry[]>>
      /** The open folders, relative to the root. */
      expanded: string[]
      /** The row the cursor is on, relative to the root. */
      cursor: string
      /** The first row drawn. */
      top: number
      /** The repository's state, or null outside a repository. */
      git: Shaped<Git | null>
      /** Recent activity, keyed like `Git.files`. */
      activity: Record<string, Activity>
      /** The files handed to Claude with the next prompt, relative to the root, in the order picked. */
      picked: Shaped<string[]>
      /** The search, while it is open: what was typed and the paths that match. */
      search: { query: string; hits: string[] } | null
      /** True while the pane is open. */
      isOpen: boolean
    }
  }
}
