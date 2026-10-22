import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Rule, RuleScope } from '../types'
import {
  addRule,
  CLASSIFIER,
  classifierPrompt,
  explicitRule,
  isCandidate,
  joinPath,
  normalized,
  parseVerdict,
  userFolder,
} from './rules'

const pending = atom({ plugin: 'atc-reflect', key: 'pending' } as const, [])
const isPaused = atom({ plugin: 'atc-reflect', key: 'isPaused' } as const, false)

/** Store keys: the rules waiting in every folder, and the rules the person skipped. */
const PENDING_KEY = 'pending'
const SKIPPED_KEY = 'skipped'
const KEPT_PENDING = 30
const KEPT_SKIPPED = 200
/** Prompts waiting for the classifier; more than this while it runs are not looked at. */
const MAX_QUEUED = 5
/** The wait after a prompt before the classifier runs, so the turn it started goes first. */
const CLASSIFY_AFTER_MS = 1500

const HELP = [
  'Turns corrections into rules in CLAUDE.md.',
  '',
  'remember: <rule>     keep a rule straight away, no model call',
  '/atc-reflect         list the rules waiting here',
  '/atc-reflect pause   stop finding rules in this session (remember: still works)',
  '/atc-reflect resume  start again',
  '/atc-reflect clear   drop the rules waiting here',
  '/atc-reflect help    this list',
].join('\n')

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Where each scope saves, as the band and the messages name it. */
const SHOWN: Record<RuleScope, string> = { project: 'CLAUDE.md', user: '~/.claude/CLAUDE.md' }

type Memory = {
  queue: { text: string; folder: string }[]
  timer?: Timer
  isRunning: boolean
  /** Makes rule ids unique within one load. */
  count: number
  /** The rule whose text **edit** put in the prompt box: the next `remember:` takes its place. */
  editing?: Pick<Rule, 'id' | 'scope'>
}

/**
 * The engine puts a dropped prompt back in the prompt box. A `remember:` the mod kept is taken out
 * again, as long as the box still holds just that text.
 */
function clearBox($: EngineInterface, text: string): void {
  for (const ms of [50, 250, 750]) {
    $.clock.after(ms, () => {
      void $.prompt
        .read()
        .then(box => (box.text.trim() === text.trim() ? $.prompt.fill({ text: '', mode: 'replace' }) : undefined))
        .catch(() => undefined)
    })
  }
}

async function storedPending($: EngineInterface): Promise<Rule[]> {
  const value = await $.store.get(PENDING_KEY).catch(() => undefined)
  return Array.isArray(value) ? (value as Rule[]) : []
}

async function storedSkipped($: EngineInterface): Promise<string[]> {
  const value = await $.store.get(SKIPPED_KEY).catch(() => undefined)
  return Array.isArray(value) ? (value as string[]) : []
}

/** Puts this folder's waiting rules in the state, from the store, which holds every folder's. */
async function loadPending($: EngineInterface): Promise<void> {
  const folder = await $.session.cwd()
  const rules = (await storedPending($)).filter(rule => rule.folder === folder)
  await update($, pending, () => rules)
}

async function removePending($: EngineInterface, id: string): Promise<void> {
  await update($, pending, rules => rules.filter(rule => rule.id !== id))
  const stored = await storedPending($)
  await $.store.set(PENDING_KEY, stored.filter(rule => rule.id !== id))
}

/**
 * Adds a rule to wait for a decision, unless it waits already. A rule the model found is also not
 * added when the person skipped it before; one they typed with `remember:` is, and is no longer skipped.
 */
async function addPending($: EngineInterface, memory: Memory, text: string, scope: RuleScope, folder: string, isTyped = false): Promise<boolean> {
  const key = normalized(text)
  const stored = await storedPending($)
  if (stored.some(rule => rule.folder === folder && normalized(rule.text) === key)) return false
  const skipped = await storedSkipped($)
  if (skipped.includes(key)) {
    if (!isTyped) return false
    await $.store.set(SKIPPED_KEY, skipped.filter(k => k !== key))
  }
  const at = await $.clock.now()
  const rule: Rule = { id: `${at.toString(36)}-${++memory.count}`, text, scope, folder, at }
  await $.store.set(PENDING_KEY, [...stored, rule].slice(-KEPT_PENDING))
  if ((await $.session.cwd()) === folder) await update($, pending, rules => [...rules, rule])
  return true
}

async function skip($: EngineInterface, rule: Rule): Promise<void> {
  await removePending($, rule.id)
  const skipped = await storedSkipped($)
  await $.store.set(SKIPPED_KEY, [...skipped.filter(k => k !== normalized(rule.text)), normalized(rule.text)].slice(-KEPT_SKIPPED))
}

async function claudeMdOf($: EngineInterface, rule: Rule, scope: RuleScope): Promise<string | undefined> {
  if (scope === 'project') return joinPath(rule.folder, 'CLAUDE.md')
  const folder = userFolder({
    configDir: await $.env.get('CLAUDE_CONFIG_DIR'),
    userProfile: await $.env.get('USERPROFILE'),
    home: await $.env.get('HOME'),
  })
  return folder === undefined ? undefined : joinPath(folder, 'CLAUDE.md')
}

/**
 * Saves the rule in the scope's CLAUDE.md and tells the model, which read that file when the
 * session started. A file that exists but can't be read is left alone.
 */
async function save($: EngineInterface, rule: Rule, scope: RuleScope): Promise<string> {
  const path = await claudeMdOf($, rule, scope)
  if (path === undefined) return "Couldn't find your home folder, so the rule was not saved."
  const before = await $.fs.read(path).catch(() => null)
  if (typeof before !== 'string' && (await $.fs.exists(path).catch(() => true))) {
    return `Couldn't read ${SHOWN[scope]}, so it was left as it is.`
  }
  const { text, isNew } = addRule(typeof before === 'string' ? before : '', rule.text)
  if (isNew) await $.fs.write(path, text)
  await removePending($, rule.id)
  if (!isNew) return `Already in ${SHOWN[scope]}.`
  const note = `The user saved this rule to ${path} with atc-reflect. Follow it from now on: ${rule.text}`
  await $.session.append({ message: { type: 'user', content: [{ type: 'text', text: note }] } }).catch(() => undefined)
  return `Saved to ${SHOWN[scope]}.`
}

/** Asks the model whether a prompt holds a rule, and keeps it to wait when it does. */
async function classify($: EngineInterface, memory: Memory, text: string, folder: string): Promise<void> {
  const reply = await $.model.complete({
    model: 'haiku',
    system: CLASSIFIER,
    prompt: classifierPrompt(text),
    maxTokens: 300,
    effort: 'low',
    timeoutMs: 20_000,
  })
  if (!reply.isAnswered) return
  const verdict = parseVerdict(reply.text)
  if (verdict !== null) await addPending($, memory, verdict.rule, verdict.scope, folder)
}

/** Runs the classifier on the queued prompts, one at a time, outside any prompt's dispatch. */
function schedule($: EngineInterface, memory: Memory): void {
  if (memory.timer !== undefined || memory.isRunning) return
  memory.timer = $.clock.after(CLASSIFY_AFTER_MS, () => {
    memory.timer = undefined
    memory.isRunning = true
    void (async () => {
      try {
        for (let item = memory.queue.shift(); item; item = memory.queue.shift()) {
          await classify($, memory, item.text, item.folder).catch(() => undefined)
        }
      } finally {
        memory.isRunning = false
      }
    })()
  })
}

function listOf(rules: readonly Rule[], isPausedNow: boolean): string {
  const state = isPausedNow ? 'Paused: only remember: prompts are kept.' : 'Finding rules in your prompts.'
  if (rules.length === 0) return `${state}\nNo rules waiting here.`
  return [state, `${plural(rules.length, 'rule')} waiting here:`, ...rules.map((rule, k) => `${k + 1}. ${rule.text}`)].join('\n')
}

export const register: Register = (on, options) => {
  const memory: Memory = { queue: [], isRunning: false, count: 0 }
  const isModelOn = options.detect !== 'remember-only'

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'atc-reflect',
      description: 'Rules found in your corrections, waiting to be saved to CLAUDE.md',
      argumentHint: '[pause|resume|clear|help]',
    })
    await loadPending($).catch(() => undefined)
    return started
  })

  on('command.run', { command: 'atc-reflect' }, async ($, e) => {
    const verb = e.args.trim().toLowerCase()
    switch (verb) {
      case '':
      case 'list':
        return { text: listOf(await read($, pending), !isModelOn || (await read($, isPaused))) }
      case 'pause':
        await update($, isPaused, () => true)
        return { text: 'Paused for this session. remember: <rule> still works; /atc-reflect resume starts again.' }
      case 'resume':
        if (!isModelOn) return { text: 'The mod is set to remember-only in /config, so only remember: prompts are kept.' }
        await update($, isPaused, () => false)
        return { text: 'Finding rules in your prompts again.' }
      case 'clear': {
        const rules = await read($, pending)
        for (const rule of rules) await removePending($, rule.id)
        return { text: rules.length === 0 ? 'No rules waiting here.' : `Dropped ${plural(rules.length, 'rule')}.` }
      }
      case 'help':
      case '?':
        return { text: HELP }
      default:
        return { text: `Unknown option "${verb}".\n\n${HELP}` }
    }
  })

  // `remember: <rule>` is the mod's own and never reaches the model. Any other prompt the person
  // typed is read once it has entered the session; it is never changed or held.
  on('prompt.submit', async ($, e, next) => {
    const isTyped = !e.command && !e.isMeta && (e.origin.kind === 'composer' || e.origin.kind === 'bridge')
    const explicit = isTyped ? explicitRule(e.text) : undefined
    if (explicit !== undefined) {
      if ('error' in explicit) return { drop: `atc-reflect: ${explicit.error}` }
      const edited = memory.editing
      memory.editing = undefined
      if (edited !== undefined) await removePending($, edited.id)
      const isAdded = await addPending($, memory, explicit.rule, edited?.scope ?? 'project', await $.session.cwd(), true)
      clearBox($, e.text)
      return { drop: isAdded ? 'atc-reflect kept the rule. Save it from the band above the prompt.' : 'atc-reflect: that rule is waiting already.' }
    }

    const entered = await next(e)
    try {
      if (!isTyped || entered.drop !== undefined || !isModelOn || (await read($, isPaused)) || !isCandidate(e.text)) return entered
      if (memory.queue.length < MAX_QUEUED) memory.queue.push({ text: e.text, folder: await $.session.cwd() })
      schedule($, memory)
    } catch {
      // Finding a rule is never worth failing a prompt for.
    }
    return entered
  }).catch(($, e, next) => next(e))

  // The oldest waiting rule above the prompt, with where to save it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.isWorking) return next(e)
    const rules = await read($, pending)
    const rule = rules[0]
    if (rule === undefined) return next(e)

    // Our row on top, other mods' rows beneath it; the engine's own placeholder is not nested.
    const drawn = await Promise.resolve(next(e)).catch(() => null)
    const below = drawn && typeof drawn === 'object' && (drawn as { type?: string }).type !== 'engine' ? drawn : null
    const { Box, Text, Button } = $.ui.resolve(e)
    const scopes: RuleScope[] = rule.scope === 'user' ? ['user', 'project'] : ['project', 'user']
    const press = (work: () => Promise<string>) => () =>
      void work()
        .then(text => $.ui.toast(text))
        .catch(() => $.ui.toast('Something went wrong; the rule is still waiting.'))
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text color="claude">◆</Text>
          <Text bold>Rule</Text>
          <Text wrap="truncate-end">{rule.text}</Text>
          {rules.length > 1 && <Text dimColor>(1 of {rules.length})</Text>}
        </Box>
        <Box flexDirection="row" gap={2} paddingLeft={2}>
          {scopes.map(scope => (
            <Button key={`save-${scope}`} plain label={`save to ${SHOWN[scope]}`} onPress={press(() => save($, rule, scope))} />
          ))}
          <Button
            key="edit"
            plain
            label="edit"
            onPress={press(async () => {
              await $.prompt.fill({ text: `remember: ${rule.text}`, mode: 'replace' })
              memory.editing = { id: rule.id, scope: rule.scope }
              return 'Change the rule and press Enter. Until you do, it keeps waiting.'
            })}
          />
          <Button
            key="skip"
            plain
            role="dismiss"
            label="skip"
            onPress={press(async () => {
              await skip($, rule)
              return 'Skipped. It won’t be suggested again.'
            })}
          />
        </Box>
        {below}
      </Box>
    )
  })
}
