import type { EngineInterface, Register } from 'claude-code'

import type { Shell } from './detect'
import { detect } from './detect'
import type { Part } from './measure'
import { measureOne } from './measure'

export const CANCEL = 'Cancel'
export const PROCEED = 'Proceed'
const HEADER = 'Blast radius'

const GUARD_FAILED =
  "atc-blast-radius couldn't check this command, so it did not run. Tell the user; " +
  'they can turn atc-blast-radius off with /plugin if they want it to run unchecked.'

export function oneLine(text: string, max: number): string {
  const line = text.replace(/\s+/g, ' ').trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

/**
 * The question in the dialog: what runs, what it would do, and the files or commits it touches,
 * one per line. Claude Code draws a question's own text as given, but refuses a mod's preview.
 */
export function questionOf(command: string, parts: readonly Part[]): string {
  const what = oneLine(parts.map(part => part.summary).join('; '), 180)
  const head = `${oneLine(command, 60)} would ${what}.`
  const details =
    parts.length === 1
      ? (parts[0]?.details ?? []).map(line => `  ${oneLine(line, 100)}`)
      : parts.flatMap(part => [
          `  ${oneLine(part.text, 60)} → ${oneLine(part.summary, 100)}`,
          ...part.details.map(line => `    ${oneLine(line, 100)}`),
        ])
  return details.length === 0 ? `${head} Run it?` : [head, ...details, 'Run it?'].join('\n')
}

type Choice = { answer?: string; isDismissed?: boolean }

/**
 * Asks in Claude Code's own question dialog. The wait is a `$` call, so it costs the hook none of
 * its budget, on every platform. Cancel comes first, so a default answer is never Proceed.
 */
async function ask($: EngineInterface, question: string): Promise<Choice> {
  return $.ui
    .ask(question, { header: HEADER, options: [CANCEL, PROCEED] })
    .then(answer => ({ answer }))
    .catch(() => ({ isDismissed: true }))
}

/** Why the call didn't run, written for Claude. */
export function refusalOf(command: string, parts: readonly Part[], choice: Choice): string {
  const cmd = oneLine(command, 120)
  const what = oneLine(parts.map(part => part.summary).join('; '), 240)
  if (choice.answer === CANCEL) {
    return (
      `atc-blast-radius: the user pressed Cancel, so this did not run: ${cmd}. It would ${what}. ` +
      "Don't run it, or anything else that does the same, without asking the user first."
    )
  }
  if (choice.answer !== undefined) {
    return `atc-blast-radius: the user didn't approve ${cmd} (it would ${what}) and wrote: "${choice.answer}". It did not run.`
  }
  return `atc-blast-radius: ${cmd} would ${what}. The confirmation was dismissed or couldn't be shown, so it did not run. Ask the user before trying again.`
}

export const register: Register = on => {
  on('tool.call', { tool: ['Bash', 'PowerShell'] }, async ($, e, next) => {
    const shell: Shell = e.tool === 'PowerShell' ? 'powershell' : 'bash'
    const command = typeof e.command === 'string' ? e.command : ''
    const findings = detect(command, shell)
    if (findings.length === 0) return next(e)
    const parts = (await Promise.all(findings.map(finding => measureOne($, finding)))).filter(part => part.isAtRisk)
    if (parts.length === 0) return next(e)

    const choice = await ask($, questionOf(command, parts))
    return choice.answer === PROCEED ? next(e) : { deny: refusalOf(command, parts, choice) }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: GUARD_FAILED }))
}
