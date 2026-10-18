import type { Plan, PlanPhase } from '../types'

// Parses an implementation plan as written by the common:create-implementation-plan skill:
// front matter with `goal:` and `status:`, phases headed `### Implementation Phase N`, each
// with a `Status:` line and a task table whose Completed column holds ✅ once the task is done.

const PHASE_HEADING = /^###\s+Implementation Phase\s+(\d+)\s*[:\-–—]?\s*(.*)$/i
const SECTION_END = /^#{1,3}\s/
const TASK_ROW = /^\|\s*TASK-[\w-]+\s*\|/i
const DONE_MARK = /✅|✔|☑|\[x\]|^\s*(x|yes|done)\s*$/i
const HEADER_ROW = /^\|.*\bcompleted\b.*\|/i

// Cells of a table row; an escaped `\|` stays inside its cell.
function cellsOf(line: string): string[] {
  const placeholder = '\uE000'
  return line
    .replace(/\\\|/g, placeholder)
    .split('|')
    .slice(1, -1)
    .map(cell => cell.split(placeholder).join('|').trim())
}

export function isPlanPath(path: string): boolean {
  return /(^|[\\/])plan[\\/][^\\/]+\.md$/i.test(path)
}

function unquote(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '').trim()
}

function frontMatter(lines: string[]): { fields: Record<string, string>; bodyStart: number } {
  const fields: Record<string, string> = {}
  if (lines[0]?.trim() !== '---') return { fields, bodyStart: 0 }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (line.trim() === '---') return { fields, bodyStart: i + 1 }
    const match = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (match) fields[(match[1] ?? '').toLowerCase()] = unquote(match[2] ?? '')
  }
  return { fields: {}, bodyStart: 0 }
}

function phaseStatus(raw: string | undefined, done: number, total: number): string {
  const text = (raw ?? '').replace(/<!--.*?-->/g, '').trim()
  if (text) return text
  if (total > 0 && done === total) return 'Complete'
  return done > 0 ? 'In progress' : 'Not started'
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? path
}

export function parsePlan(path: string, text: string): Plan {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const { fields, bodyStart } = frontMatter(lines)
  const phases: PlanPhase[] = []
  let current: { n: number; title: string; status?: string; done: number; total: number } | null = null
  // Where the Completed column sits, counted from the row's end: a description holding an
  // unescaped `|` (a pipeline in a code span) adds cells in the middle, never at the end.
  let completedFromEnd = 1
  let heading = ''

  const close = () => {
    if (!current) return
    phases.push({ ...current, status: phaseStatus(current.status, current.done, current.total) })
    current = null
  }

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const phase = PHASE_HEADING.exec(line)
    if (phase) {
      close()
      current = { n: Number(phase[1]), title: (phase[2] ?? '').trim(), done: 0, total: 0 }
      continue
    }
    if (!heading && /^#\s+\S/.test(line)) heading = line.replace(/^#\s+/, '').trim()
    if (!current) continue
    if (SECTION_END.test(line) && !/^####/.test(line)) {
      close()
      continue
    }
    const status = /^\s*\**Status\**\s*:\s*(.+)$/i.exec(line)
    if (status && current.status === undefined) {
      current.status = status[1] ?? ''
      continue
    }
    if (HEADER_ROW.test(line) && !TASK_ROW.test(line)) {
      const header = cellsOf(line)
      const index = header.findIndex(cell => /^completed$/i.test(cell))
      if (index >= 0) completedFromEnd = header.length - 1 - index
      continue
    }
    if (TASK_ROW.test(line)) {
      const cells = cellsOf(line)
      current.total += 1
      if (DONE_MARK.test(cells[cells.length - 1 - completedFromEnd] ?? '')) current.done += 1
    }
  }
  close()

  const done = phases.reduce((sum, p) => sum + p.done, 0)
  const total = phases.reduce((sum, p) => sum + p.total, 0)
  const goal = fields.goal && !fields.goal.startsWith('[') ? fields.goal : heading || fileName(path)
  return { path, goal, status: fields.status ?? '', phases, done, total, mtimeMs: 0 }
}

/** The phase being worked on: the first in progress, else the first not complete, else the last. */
export function currentPhase(plan: Plan): PlanPhase | undefined {
  const isComplete = (p: PlanPhase) => /complete|done/i.test(p.status)
  return (
    plan.phases.find(p => /in progress/i.test(p.status)) ??
    plan.phases.find(p => !isComplete(p)) ??
    plan.phases[plan.phases.length - 1]
  )
}

export function isFinished(plan: Plan): boolean {
  if (/completed/i.test(plan.status)) return true
  return plan.total > 0 && plan.done === plan.total
}

/** Ranks plans for the band: in progress first, then planned; null for anything else. */
export function planRank(plan: Plan): number | null {
  if (/in progress/i.test(plan.status)) return 0
  if (/planned/i.test(plan.status)) return 1
  return null
}
