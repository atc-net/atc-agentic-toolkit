import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderInput } from 'claude-code'

import type { DiffLine, Step } from '../types'
import { editedLines, forDisk, relativePath, stepOf } from './diff'

const PANE = 'atc-replay'
/** Steps kept per replay: a long run keeps its first ones. */
const MAX_STEPS = 200
/** Rows the inline pane asks for: header, strip, file, details, a blank, 12 diff lines, buttons. */
const PANE_ROWS = 18
const PANE_COLUMNS = 72
/** Rows of a step that aren't diff: header, strip, file, details, the blank above the diff, "… more", buttons. */
const CHROME_ROWS = 7

const replay = atom({ plugin: 'atc-replay-theater', key: 'replay' } as const, [])
const index = atom({ plugin: 'atc-replay-theater', key: 'index' } as const, 0)
const isOpen = atom({ plugin: 'atc-replay-theater', key: 'isOpen' } as const, false)
const inBand = atom({ plugin: 'atc-replay-theater', key: 'inBand' } as const, false)
const isHintHidden = atom({ plugin: 'atc-replay-theater', key: 'isHintHidden' } as const, false)

const HELP = [
  'Step through the file edits of the last turn that made any.',
  '',
  '/atc-replay          open the replay, or close it when it is open',
  '/atc-replay close    close it',
  '/atc-replay clear    forget the replay and hide the hint',
  '/atc-replay help     this list',
  '',
  'In the replay: n next, p previous, c or Esc close.',
].join('\n')

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function hintOf(steps: readonly Step[]): string {
  const files = new Set(steps.map(step => step.file)).size
  return `Replay: ${plural(steps.length, 'edit')} in ${plural(files, 'file')}`
}

/**
 * Replays are also kept in the plugin's store, keyed by the tool-use id of the replay's last edit
 * in the main conversation, the last few of them.
 */
const STORE_PREFIX = 'replay:'
const KEPT_REPLAYS = 5
/** How long a look that found nothing stands before the conversation is searched again. */
const LOOK_AGAIN_MS = 10_000

type Saved = { key: string; steps: Step[] }

/** What one registration remembers about the store; not drawn, so not in the state. */
type Memory = {
  /** The store key of the replay on screen, so /atc-replay clear can remove it. */
  savedKey?: string
  /** The last search of the conversation, for the band, which draws often and can't write the state. */
  lookup?: { at: number; found: Promise<Saved | null> }
}

/**
 * Keeps the replay in the store as well. A session moved to the background and back, continued or
 * resumed starts with empty state, under a new session id, but it carries the conversation over.
 */
async function saveReplay($: EngineInterface, memory: Memory, toolUseId: string, steps: Step[]): Promise<void> {
  const key = `${STORE_PREFIX}${toolUseId}`
  await $.store.set(key, forDisk(steps))
  memory.savedKey = key
  const keys = (await $.store.keys()).filter(k => k.startsWith(STORE_PREFIX))
  for (const old of keys.slice(0, -KEPT_REPLAYS)) await $.store.delete(old)
}

/**
 * The newest saved replay whose last edit is in this conversation. A new session has none of those
 * edits, so it never picks up another session's replay.
 */
async function findSaved($: EngineInterface): Promise<Saved | null> {
  const keys = new Set((await $.store.keys()).filter(k => k.startsWith(STORE_PREFIX)))
  if (keys.size === 0) return null
  const messages = await $.session.messages()
  for (const message of [...messages].reverse()) {
    for (const use of [...(message.toolUses ?? [])].reverse()) {
      const key = `${STORE_PREFIX}${use.tool_use_id}`
      if (!keys.has(key)) continue
      const steps = await $.store.get(key)
      return Array.isArray(steps) && steps.length > 0 ? { key, steps: steps as Step[] } : null
    }
  }
  return null
}

/** The saved replay of this conversation, searched for at most every LOOK_AGAIN_MS while none is found. */
async function savedReplay($: EngineInterface, memory: Memory): Promise<Saved | null> {
  const now = await $.clock.now()
  const last = memory.lookup
  if (last && (now - last.at < LOOK_AGAIN_MS || (await last.found) !== null)) return last.found
  const found = findSaved($).catch(() => null)
  memory.lookup = { at: now, found }
  return found
}

/** The replay, put back from the store when the session's state has lost it. Not for render hooks. */
async function currentReplay($: EngineInterface, memory: Memory): Promise<Step[]> {
  const steps = await read($, replay)
  if (steps.length > 0) return steps
  memory.lookup = undefined
  const saved = await savedReplay($, memory)
  if (saved === null) return []
  memory.savedKey = saved.key
  await update($, replay, () => saved.steps)
  return saved.steps
}

/** A file's text, or null when it is missing, binary or too big to read. */
async function textOf($: EngineInterface, path: string): Promise<string | null> {
  const text = await $.fs.read(path).catch(() => null)
  return typeof text === 'string' ? text : null
}

/**
 * Opens the replay. From the band's button the band holds the keys, and a pane can only take
 * them from the prompt: so the hint is taken down first and the pane opens a moment later.
 */
async function openReplay($: EngineInterface, memory: Memory, isFromBand = false): Promise<boolean> {
  if ((await currentReplay($, memory)).length === 0) return false
  await update($, isOpen, () => true)
  if (isFromBand) await $.clock.sleep(150)
  const opened = await $.ui.open({ id: PANE, title: 'Replay', focus: true, closeOnEscape: true, rows: PANE_ROWS, columns: PANE_COLUMNS })
  await update($, inBand, () => !opened.isPlaced)
  return true
}

/**
 * Whether the replay is on screen, behind another pane's tab, or closed, asked of the surface
 * rather than taken from the state: a pane the person closed is put right here even if the close
 * never reached this mod.
 */
async function replayState($: EngineInterface): Promise<'shown' | 'behind' | 'closed'> {
  if (!(await read($, isOpen))) return 'closed'
  if (await read($, inBand)) return 'shown'
  const pane = (await $.ui.panes()).find(open => open.id === PANE)
  if (pane) return pane.isShown ? 'shown' : 'behind'
  await update($, isOpen, () => false)
  return 'closed'
}

async function closeReplay($: EngineInterface): Promise<void> {
  const wasInBand = await read($, inBand)
  await update($, isOpen, () => false)
  await update($, inBand, () => false)
  if (!wasInBand) await $.ui.close({ id: PANE }).catch(() => undefined)
}

const backgroundOf = (op: DiffLine['op']) => (op === '+' ? 'diffAdded' : op === '-' ? 'diffRemoved' : undefined)

/** The numbered cells of the strip that fit, around the current step. */
function stripWindow(total: number, at: number, columns: number): number[] {
  const fit = Math.max(3, Math.floor((columns - 4) / 4))
  const start = Math.max(0, Math.min(at - Math.floor(fit / 2), total - fit))
  return Array.from({ length: Math.min(fit, total) }, (_, k) => start + k)
}

/** One step of the replay, with the strip of steps and Prev / Next / Close. */
async function replayView($: EngineInterface, e: RenderInput, rows: number, columns: number) {
  const { Box, Text, Button } = $.ui.resolve(e)
  const steps = await read($, replay)
  if (steps.length === 0) return <Text dimColor>No edits to replay.</Text>
  const at = Math.max(0, Math.min(await read($, index), steps.length - 1))
  const step = steps[at] as Step
  const room = Math.max(3, rows - CHROME_ROWS)
  const shown = step.lines.slice(0, room)
  const left = step.lines.length - shown.length + step.more
  const go = (to: number) => update($, index, () => Math.max(0, Math.min(to, steps.length - 1)))
  const cells = stripWindow(steps.length, at, columns)
  const details = [step.tool, step.note, step.line === undefined ? '' : `line ${step.line}`].filter(Boolean).join(' · ')

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color="claude">
          ▶ Replay
        </Text>
        <Text bold>
          step {at + 1} of {steps.length}
        </Text>
      </Box>
      <Box flexDirection="row">
        {(cells[0] ?? 0) > 0 && <Text dimColor>… </Text>}
        {cells.map(k => (
          <Text key={`cell-${k}`} inverse={k === at} bold={k === at} dimColor={k !== at}>
            {` ${k + 1} `}
          </Text>
        ))}
        {(cells.at(-1) ?? 0) < steps.length - 1 && <Text dimColor> …</Text>}
      </Box>
      <Text bold wrap="truncate-start">
        {step.file}
      </Text>
      <Box flexDirection="row" gap={2}>
        <Text dimColor>{details}</Text>
        <Text color="success">+{step.added}</Text>
        <Text color="error">−{step.removed}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {shown.length === 0 && <Text dimColor>(no line changes)</Text>}
        {shown.map((line, k) => (
          <Text key={`line-${k}`} backgroundColor={backgroundOf(line.op)} dimColor={line.op === ' ' || line.op === '~'} wrap="truncate-end">
            {`${line.op === '~' ? ' ' : line.op} ${line.text}`}
          </Text>
        ))}
        {left > 0 && <Text dimColor>… {plural(left, 'more line')}</Text>}
      </Box>
      <Box flexDirection="row" gap={2}>
        <Button key="prev" label="◀ Prev" hotkey="p" onPress={() => void go(at - 1)} />
        <Button key="next" label="Next ▶" hotkey="n" autoFocus onPress={() => void go(at + 1)} />
        <Button key="close" label="Close" hotkey="c" onPress={() => void closeReplay($)} />
      </Box>
    </Box>
  )
}

export const register: Register = on => {
  // Edits of the running main turn, its subagents' included; they become the replay when it ends.
  let pending: Step[] = []
  // The tool-use id of the running turn's last edit in the main conversation: the replay's store key.
  let pendingKey: string | undefined
  const memory: Memory = {}

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'atc-replay',
      description: "Step through the last turn's file edits, one diff at a time",
      argumentHint: '[close|clear|help]',
    })
    await currentReplay($, memory).catch(() => [])
    return started
  })

  on('command.run', { command: 'atc-replay' }, async ($, e) => {
    const verb = e.args.trim().toLowerCase()
    switch (verb) {
      case '':
      case 'open': {
        // On screen: close it. Behind another pane's tab: opening it again brings it to the front.
        if (verb === '' && (await replayState($)) === 'shown') {
          await closeReplay($)
          return { text: 'Replay closed.' }
        }
        if (!(await openReplay($, memory))) return { text: 'No edits to replay yet: the replay fills when a turn edits files.' }
        return { text: `${hintOf(await read($, replay))}. n next, p previous, c or Esc close.` }
      }
      case 'close':
        await closeReplay($)
        return { text: 'Replay closed.' }
      case 'clear':
        await closeReplay($)
        await update($, replay, () => [])
        await update($, index, () => 0)
        if (memory.savedKey !== undefined) await $.store.delete(memory.savedKey).catch(() => undefined)
        memory.savedKey = undefined
        memory.lookup = undefined
        return { text: 'Replay cleared.' }
      case 'help':
      case '?':
        return { text: HELP }
      default:
        return { text: `Unknown option "${verb}".\n\n${HELP}` }
    }
  })

  // Records an edit once it has run without error. It never blocks, changes or delays the edit.
  on('tool.call', { tool: ['Edit', 'Write'] }, async ($, e, next) => {
    const call = e as {
      tool: string
      tool_use_id?: string
      file_path?: unknown
      old_string?: unknown
      new_string?: unknown
      content?: unknown
      replace_all?: unknown
      agentId?: string
    }
    const path = typeof call.file_path === 'string' ? call.file_path : ''
    const before = path === '' ? null : await textOf($, path)
    const existed = before !== null || (path !== '' && (await $.fs.exists(path).catch(() => false)))
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError || path === '' || pending.length >= MAX_STEPS) return ran

    const file = relativePath(await $.session.cwd().catch(() => ''), path)
    const byAgent = call.agentId ? 'by a subagent' : ''
    if (call.tool === 'Edit') {
      const oldText = typeof call.old_string === 'string' ? call.old_string : ''
      const newText = typeof call.new_string === 'string' ? call.new_string : ''
      const note = [call.replace_all === true ? 'replace all' : '', byAgent].filter(Boolean).join(' · ')
      // Whole lines when the edit is found in the file as it was; the replaced text alone otherwise.
      const lines = before === null ? null : editedLines(before, oldText, newText)
      pending.push(stepOf({ file, tool: 'Edit', note, line: lines?.line, before: lines?.before ?? oldText, after: lines?.after ?? newText }))
    } else {
      const content = typeof call.content === 'string' ? call.content : ''
      const kind = before !== null ? 'rewrite' : existed ? "rewrite (the old text couldn't be read)" : 'new file'
      const note = [kind, byAgent].filter(Boolean).join(' · ')
      pending.push(stepOf({ file, tool: 'Write', note, before: before ?? '', after: content }))
    }
    if (!call.agentId && call.tool_use_id) pendingKey = call.tool_use_id
    return ran
  }).catch(($, e, next) => next(e))

  // The end of a main turn: its edits become the replay. A turn without edits keeps the last one.
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId || pending.length === 0) return done
    const steps = pending
    const key = pendingKey
    pending = []
    pendingKey = undefined
    await update($, replay, () => steps)
    await update($, index, () => 0)
    await update($, isHintHidden, () => false)
    // Only subagents edited: none of the edits is in the main conversation to find it by, so it isn't kept.
    memory.savedKey = undefined
    if (key !== undefined) await saveReplay($, memory, key, steps).catch(() => undefined)
    return done
  })

  // The person closed the pane (Esc or its close mark): the hint comes back. It never stops a close.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) {
      await update($, isOpen, () => false)
      await update($, inBand, () => false)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) =>
    replayView($, e, e.props.scroll.bodyRows, e.props.bodyColumns),
  )

  // The hint above the prompt after a turn with edits, or the replay itself when no pane could be placed.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    if ((await read($, isOpen)) && (await read($, inBand))) return replayView($, e, e.props.maxRows, e.props.bodyColumns)
    if (e.props.isWorking || (await read($, isOpen)) || (await read($, isHintHidden))) return next(e)
    // A render hook can't write the state, so a replay the state lost is read from the store here.
    const held = await read($, replay)
    const steps = held.length > 0 ? held : ((await savedReplay($, memory))?.steps ?? [])
    if (steps.length === 0) return next(e)

    // Our row on top, other mods' rows beneath it; the engine's own placeholder is not nested.
    const drawn = await Promise.resolve(next(e)).catch(() => null)
    const below = drawn && typeof drawn === 'object' && (drawn as { type?: string }).type !== 'engine' ? drawn : null
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2}>
          <Text color="claude">▶</Text>
          <Text>{hintOf(steps)}</Text>
          <Button key="replay" plain label="replay" onPress={() => void openReplay($, memory, true)} />
          <Button key="dismiss" plain role="dismiss" label="x" onPress={() => void update($, isHintHidden, () => true)} />
        </Box>
        {below}
      </Box>
    )
  })
}
