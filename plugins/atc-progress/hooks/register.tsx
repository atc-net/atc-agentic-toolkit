import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRun, Plan } from '../types'
import { CONTEXT_WINDOW, costOf, tokensOf } from './cost'
import { currentPhase, isFinished, isPlanPath, parsePlan, planRank } from './plan'

const PANE = 'atc-progress'
const PLANS_PANE = 'atc-progress-plans'

const plan = atom({ plugin: 'atc-progress', key: 'plan' } as const, null)
const isPlanHidden = atom({ plugin: 'atc-progress', key: 'isPlanHidden' } as const, false)
const isPinned = atom({ plugin: 'atc-progress', key: 'isPinned' } as const, false)
const plans = atom({ plugin: 'atc-progress', key: 'plans' } as const, [])
const agents = atom({ plugin: 'atc-progress', key: 'agents' } as const, [])
const now = atom({ plugin: 'atc-progress', key: 'now' } as const, 0)

const PLAN_TOOLS = new Set(['Write', 'Edit', 'MultiEdit'])

const HELP = [
  'atc-progress: a plan bar above the prompt and a subagents pane.',
  '',
  '/atc-progress                   show or hide the subagents pane',
  '/atc-progress open | close      open (or bring forward) / close the subagents pane',
  '/atc-progress plans             list the plans under plan/ and pin one to the bar',
  '/atc-progress plan <path>       pin a plan file to the bar (Claude is told which plan it is)',
  '/atc-progress plan              unpin: follow the newest plan in progress again',
  '/atc-progress continue [path]   fill the prompt box with "continue this plan"; Enter sends it',
  '/atc-progress hide | show       hide or show the plan bar',
  '/atc-progress help              this list',
].join('\n')

function phaseLabel(found: Plan): string {
  const phase = currentPhase(found)
  return phase ? `Phase ${phase.n} of ${found.phases.length}` : 'no phases yet'
}

/** Toasts are a small box: a short line, left up long enough to read. */
const TOAST_MS = 8000

function shortGoal(found: Plan, max = 60): string {
  return found.goal.length > max ? `${found.goal.slice(0, max - 1)}…` : found.goal
}

/** The note Claude reads after a switch, so "continue the plan" means this one. */
function trackingNote(found: Plan): string {
  return (
    `The user pointed the atc-progress plan bar at ${found.path} ("${found.goal}", ` +
    `${found.done}/${found.total} tasks done, now at ${phaseLabel(found)}). ` +
    'When they ask to continue or resume the plan, this is the plan they mean.'
  )
}

function continuePrompt(found: Plan): string {
  const phase = currentPhase(found)
  const start = phase ? `Phase ${phase.n}, the first phase that isn't Complete` : 'its first phase'
  return (
    `Continue implementing ${found.path} (${found.goal}). Pick up at ${start}. ` +
    'Read its "For Future Agents" section first, run each phase\'s verification before moving on, ' +
    "and tick each task in the plan with ✅ and today's date as you finish it."
  )
}

// ---------- formatting ----------

function joinPath(dir: string, name: string): string {
  const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  return dir.replace(/[\\/]+$/, '') + sep + name
}

function shortTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function shortDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m`
}

function shortCost(usd: number): string {
  if (usd <= 0) return '$0'
  return usd < 0.01 ? '<$0.01' : `$${usd.toFixed(2)}`
}

function shortModel(model: string): string {
  return model.replace(/^claude-/, '').replace(/\[.*\]$/, '')
}

function bar(done: number, total: number, width: number): string {
  const filled = total > 0 ? Math.round((done / total) * width) : 0
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

// ---------- plan discovery ----------

async function readPlan($: EngineInterface, path: string, mtimeMs?: number): Promise<Plan | null> {
  const text = await $.fs.read(path).catch(() => null)
  if (typeof text !== 'string') return null
  const mtime = mtimeMs ?? (await $.fs.stat(path).then(s => s.mtimeMs).catch(() => 0))
  return { ...parsePlan(path, text), mtimeMs: mtime }
}

const samePath = (a: string, b: string) => a.replace(/\\/g, '/').toLowerCase() === b.replace(/\\/g, '/').toLowerCase()

/** The markdown files under <cwd>/plan, newest first. */
async function planFiles($: EngineInterface): Promise<{ path: string; mtimeMs: number }[]> {
  const dir = joinPath(await $.session.cwd(), 'plan')
  if (!(await $.fs.exists(dir).catch(() => false))) return []
  const entries = await $.fs.list(dir).catch(() => [])
  return entries
    .filter(f => f.kind === 'file' && /\.md$/i.test(f.name))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 25)
    .map(f => ({ path: joinPath(dir, f.name), mtimeMs: f.mtimeMs }))
}

/** The newest plan in progress under <cwd>/plan, else the newest planned one. */
async function scanPlans($: EngineInterface): Promise<Plan | null> {
  let best: { plan: Plan; rank: number } | null = null
  for (const file of await planFiles($)) {
    const found = await readPlan($, file.path, file.mtimeMs)
    const rank = found ? planRank(found) : null
    if (found === null || rank === null) continue
    if (best === null || rank < best.rank) best = { plan: found, rank }
    if (rank === 0) break
  }
  return best?.plan ?? null
}

/** Puts a plan on the bar. `pinned`: the user chose it, so only the user moves the bar from now on. */
async function showPlan($: EngineInterface, found: Plan | null, pinned: boolean): Promise<void> {
  await update($, plan, () => found)
  await update($, isPlanHidden, () => false)
  await update($, isPinned, () => pinned && found !== null)
}

/**
 * At the end of each main turn. Unpinned: a plan file newer than the active one (written by
 * any tool, the shell included) takes over the bar. Pinned or not, the active plan is re-read
 * if it changed.
 */
async function refreshPlan($: EngineInterface): Promise<void> {
  const active = await read($, plan)
  const newest = (await read($, isPinned)) ? undefined : (await planFiles($))[0]
  if (newest && !(active && samePath(active.path, newest.path)) && newest.mtimeMs > (active?.mtimeMs ?? 0)) {
    const found = await readPlan($, newest.path, newest.mtimeMs)
    if (found && planRank(found) !== null) {
      await showPlan($, found, false)
      return
    }
  }
  if (!active) return
  const fresh = await readPlan($, active.path)
  if (fresh && fresh.mtimeMs !== active.mtimeMs) await update($, plan, () => fresh)
}

/** Every plan under <cwd>/plan: in progress first, then planned, then the rest; newest first within each. */
async function listPlans($: EngineInterface): Promise<Plan[]> {
  const found: Plan[] = []
  for (const file of await planFiles($)) {
    const read = await readPlan($, file.path, file.mtimeMs)
    if (read) found.push(read)
  }
  const order = (p: Plan) => planRank(p) ?? (isFinished(p) ? 3 : 2)
  return found.sort((a, b) => order(a) - order(b) || b.mtimeMs - a.mtimeMs)
}

/** Puts a plan on the bar from the picker and tells Claude, as /atc-progress plan <path> does. */
async function selectPlan($: EngineInterface, chosen: Plan): Promise<void> {
  const fresh = (await readPlan($, chosen.path)) ?? chosen
  await showPlan($, fresh, true)
  await $.ui.close({ id: PLANS_PANE }).catch(() => undefined)
  await $.session
    .append({ message: { type: 'user', content: [{ type: 'text', text: trackingNote(fresh) }] } })
    .catch(() => undefined)
  $.ui.toast(`Pinned: ${shortGoal(fresh)}\n${phaseLabel(fresh)} · ${fresh.done}/${fresh.total} tasks`, { timeoutMs: TOAST_MS })
}

// ---------- pane ----------

async function isPaneOpen($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(p => p.id === PANE)
}

async function openPane($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, now, () => at)
  await $.ui.open({ id: PANE, title: 'Subagents' })
}

/** Closes the pane when it is on screen; opens it, or brings it in front of another pane's tab, when it isn't. */
async function togglePane($: EngineInterface): Promise<boolean> {
  const pane = (await $.ui.panes()).find(p => p.id === PANE)
  if (pane?.isShown) {
    await $.ui.close({ id: PANE })
    return false
  }
  await openPane($)
  return true
}

export const register: Register = (on, options) => {
  let hasAutoOpened = false
  // Plans already toasted about while another plan was pinned: one toast per file.
  const toldAbout = new Set<string>()

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'atc-progress',
      description: 'Show or hide the subagents pane; plan [path] rescans or pins the plan bar; continue resumes it',
      argumentHint: '[plans|plan [path]|continue [path]|open|close|hide|show|help]',
    })
    await showPlan($, await scanPlans($).catch(() => null), false)

    // Ticks the elapsed times while a subagent runs; quiet otherwise.
    $.clock.every(1000, () => {
      void (async () => {
        const list = await read($, agents)
        if (!list.some(a => a.status === 'running')) return
        const at = await $.clock.now()
        await update($, now, () => at)
      })()
    })
    return started
  })

  on('command.run', { command: 'atc-progress' }, async ($, e) => {
    const [verb = '', ...rest] = e.args.trim().split(/\s+/).filter(Boolean)
    switch (verb.toLowerCase()) {
      case '':
        return { text: (await togglePane($)) ? 'Subagents pane opened.' : 'Subagents pane closed.' }
      case 'open':
        await openPane($)
        return { text: 'Subagents pane opened.' }
      case 'close':
        if (await isPaneOpen($)) await $.ui.close({ id: PANE })
        return { text: 'Subagents pane closed.' }
      case 'plan': {
        // With a path the plan is pinned; without one the bar goes back to following the newest plan.
        const target = rest.join(' ')
        const found = target ? await readPlan($, target) : await scanPlans($)
        if (target && !found) return { text: `Could not read a plan at ${target}.` }
        await showPlan($, found, Boolean(target))
        if (found) {
          const mode = target ? 'Pinned: it stays on the bar until you pick another plan or run /atc-progress plan.' : 'Following the newest plan again.'
          return {
            text: `Plan bar: ${found.goal} (${found.done}/${found.total} tasks) from ${found.path}. ${mode} /atc-progress continue to work on it.`,
            context: [trackingNote(found)],
          }
        }
        return { text: 'No plan in progress or planned under plan/*.md.' }
      }
      case 'continue': {
        const target = rest.join(' ')
        const found = target ? await readPlan($, target) : await read($, plan)
        if (!found) return { text: target ? `Could not read a plan at ${target}.` : 'No plan on the bar. Try /atc-progress plans.' }
        await showPlan($, found, true)
        if (isFinished(found)) return { text: `${found.goal} is already complete (${found.done}/${found.total} tasks).` }
        const box = await $.prompt.fill({ text: continuePrompt(found) }).catch(() => null)
        if (!box?.isFilled) return { text: continuePrompt(found), context: [trackingNote(found)] }
        return { text: `Ready to continue ${found.path}: press Enter to send the prompt, or edit it first.`, context: [trackingNote(found)] }
      }
      case 'hide':
        await update($, isPlanHidden, () => true)
        return { text: 'Plan bar hidden. /atc-progress show brings it back.' }
      case 'show':
        await update($, isPlanHidden, () => false)
        return { text: 'Plan bar shown.' }
      case 'plans':
      case 'list': {
        const found = await listPlans($)
        await update($, plans, () => found)
        if (found.length === 0) return { text: 'No plans under plan/*.md yet.' }
        await $.ui.open({ id: PLANS_PANE, title: 'Plans', focus: true, closeOnEscape: true })
        return { text: `${found.length} plan${found.length === 1 ? '' : 's'} listed: press a number or Enter on one to put it on the bar, Esc to close.` }
      }
      case 'help':
      case '?':
        return { text: HELP }
      default:
        return { text: `Unknown option "${verb}".\n\n${HELP}` }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PLANS_PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, plans)
    const active = await read($, plan)
    const isActive = (p: Plan) => active !== null && samePath(active.path, p.path)
    return (
      <Box flexDirection="column">
        <Text dimColor>Pick a plan to pin to the bar (it stays until you pick another or run /atc-progress plan): a number, or Tab/arrows and Enter. Esc closes.</Text>
        {list.map((p, i) => {
          const phase = currentPhase(p)
          const details = [p.status || 'no status', `${p.done}/${p.total} tasks`, phase ? `phase ${phase.n}/${p.phases.length}` : '', p.path.split(/[\\/]/).pop()]
            .filter(Boolean)
            .join(' · ')
          return (
            <Button key={`plan-${i}`} plain hotkey={i < 9 ? String(i + 1) : undefined} label={p.goal} onPress={() => void selectPlan($, p)}>
              {isActive(p) ? '▸ ' : '  '}
              {p.goal} <Text dimColor>{details}</Text>
            </Button>
          )
        })}
      </Box>
    )
  })

  // A plan file written or edited (by Claude or a subagent) becomes the active plan, unless the
  // user pinned another one: then the bar stays and a toast says how to switch.
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const path = (e as { file_path?: unknown }).file_path
    if (!PLAN_TOOLS.has(String(e.tool)) || typeof path !== 'string' || !isPlanPath(path)) return ran
    const found = await readPlan($, path)
    if (!found) return ran
    const active = await read($, plan)
    const isSame = active !== null && samePath(active.path, found.path)
    if (isSame) {
      await update($, plan, () => found)
    } else if (await read($, isPinned)) {
      if (!toldAbout.has(found.path)) {
        toldAbout.add(found.path)
        $.ui.toast(`Bar stays on: ${shortGoal(active ?? found)}\nWritten: ${shortGoal(found)}`, { timeoutMs: TOAST_MS })
      }
    } else {
      await showPlan($, found, false)
    }
    return ran
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined) return started
    const at = await $.clock.now()
    const run: AgentRun = {
      id: started.agentId ?? e.tool_use_id,
      type: e.subagentType,
      description: e.description,
      model: started.model,
      status: 'running',
      startedAt: at,
      contextTokens: 0,
      tokens: 0,
      costUsd: 0,
      steps: 0,
    }
    await update($, agents, list => [...list.filter(a => a.id !== run.id), run].slice(-100))
    await update($, now, () => at)
    if (options.autoOpen === 'agents' && !hasAutoOpened) {
      hasAutoOpened = true
      if (!(await isPaneOpen($))) void $.ui.open({ id: PANE, title: 'Subagents' })
    }
    return started
  })

  // Each model request a subagent makes: live context, tokens and cost.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const agentId = e.agentId
    const usage = result.usage
    if (!agentId || !usage) return result
    const model = usage.model || e.model
    await update($, agents, list =>
      list.map((a): AgentRun =>
        a.id !== agentId
          ? a
          : {
              ...a,
              model,
              effort: typeof e.effort === 'string' ? e.effort : a.effort,
              contextTokens: tokensOf(usage),
              tokens: a.tokens + tokensOf(usage),
              costUsd: a.costUsd + costOf(model, usage),
              steps: a.steps + 1,
            },
      ),
    )
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (!agentId) {
      const result = await next(e)
      await refreshPlan($).catch(() => undefined)
      return result
    }
    const at = await $.clock.now()
    await update($, agents, list =>
      list.map((a): AgentRun => {
        if (a.id !== agentId) return a
        const usage = a.steps === 0 ? e.usage : undefined
        return {
          ...a,
          status: e.reason === 'answer' ? 'done' : 'failed',
          endedAt: at,
          ...(usage ? { model: usage.model || a.model, tokens: tokensOf(usage), costUsd: costOf(usage.model || a.model, usage) } : {}),
        }
      }),
    )
    await update($, now, () => at)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, agents)
    const at = await read($, now)
    const running = list.filter(a => a.status === 'running')
    const finished = list.filter(a => a.status !== 'running').reverse()
    const totalCost = list.reduce((sum, a) => sum + a.costUsd, 0)
    const totalTokens = list.reduce((sum, a) => sum + a.tokens, 0)
    const room = Math.max(2, Math.floor((e.props.scroll.bodyRows - 4) / 2))

    const row = (a: AgentRun) => {
      const glyph = a.status === 'running' ? '●' : a.status === 'done' ? '✓' : '✗'
      const color = a.status === 'running' ? 'claude' : a.status === 'done' ? 'success' : 'error'
      const elapsed = shortDuration((a.endedAt ?? (at || a.startedAt)) - a.startedAt)
      const context = Math.round((a.contextTokens / CONTEXT_WINDOW) * 100)
      const details = [
        shortModel(a.model),
        a.effort,
        `ctx ${context}%`,
        `${shortTokens(a.tokens)} tok`,
        `~${shortCost(a.costUsd)}`,
        elapsed,
      ].filter(Boolean)
      return (
        <Box key={`run-${a.id}`} flexDirection="column">
          <Box flexDirection="row" gap={1}>
            <Text color={color}>{glyph}</Text>
            <Text bold>{a.type}</Text>
            <Text wrap="truncate-end">{a.description}</Text>
          </Box>
          <Text dimColor wrap="truncate-end">
            {'  '}
            {details.join(' · ')}
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Text dimColor>
          {running.length} running · {finished.length} finished · {shortTokens(totalTokens)} tok · ~{shortCost(totalCost)}
        </Text>
        {list.length === 0 && <Text dimColor>No subagents yet: they show here as soon as one starts.</Text>}
        {running.map(row)}
        {finished.slice(0, room).map(row)}
        {finished.length > room && <Text dimColor>… {finished.length - room} more finished</Text>}
        {finished.length > 0 && (
          <Button key="clear" label="Clear finished" onPress={() => update($, agents, l => l.filter(a => a.status === 'running'))} />
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const active = (await read($, isPlanHidden)) ? null : await read($, plan)
    const list = await read($, agents)
    const runningCount = list.filter(a => a.status === 'running').length
    if (active === null && runningCount === 0) return next(e)

    // Our row on top, other mods' rows beneath it; the engine's own placeholder is not nested.
    const drawn = await Promise.resolve(next(e)).catch(() => null)
    const below = drawn && typeof drawn === 'object' && (drawn as { type?: string }).type !== 'engine' ? drawn : null

    const { Box, Text, Button } = $.ui.resolve(e)
    const agentsButton =
      list.length > 0 ? (
        <Button key="agents" plain label={runningCount > 0 ? `agents ${runningCount} running` : `agents ${list.length}`} onPress={() => void togglePane($)} />
      ) : null

    if (active === null) {
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={2}>
            <Text color="claude">●</Text>
            <Text dimColor>
              {runningCount} subagent{runningCount === 1 ? '' : 's'} running
            </Text>
            {agentsButton}
          </Box>
          {below}
        </Box>
      )
    }

    const finished = isFinished(active)
    const pinned = await read($, isPinned)
    const phase = currentPhase(active)
    const percent = active.total > 0 ? Math.round((active.done / active.total) * 100) : 0
    const cols = e.props.bodyColumns
    const goalWidth = Math.max(10, Math.min(36, active.goal.length + 2, Math.floor(cols / 3)))
    const barWidth = Math.max(6, Math.min(30, cols - goalWidth - 44))
    const phaseText = phase ? `Phase ${phase.n}/${active.phases.length}` : 'No phases'
    const accent = finished ? 'success' : 'claude'

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2}>
          <Box width={goalWidth} flexShrink={0}>
            <Text color={accent}>{finished ? '✓ ' : '● '}</Text>
            <Text wrap="truncate-end">{active.goal}</Text>
          </Box>
          <Text color={accent}>{bar(active.done, active.total, barWidth)}</Text>
          <Text bold>{phaseText}</Text>
          <Text>
            Tasks {active.done}/{active.total}
          </Text>
          <Text dimColor>{percent}%</Text>
          {pinned && <Text dimColor>pinned</Text>}
          {!finished && !e.props.isWorking && (
            <Button key="continue" plain label="continue" onPress={() => void update($, isPinned, () => true).then(() => $.prompt.fill({ text: continuePrompt(active) }))} />
          )}
          {agentsButton}
          <Button key="dismiss" plain role="dismiss" label="x" onPress={() => update($, isPlanHidden, () => true)} />
        </Box>
        {below}
      </Box>
    )
  })
}
