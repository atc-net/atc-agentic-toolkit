import { expect, test } from 'claude-code/testing'

import { diffLines, editedLines, forDisk, HIDDEN_LINE, MAX_STORED_LINES, relativePath, splitLines, stepOf, trimContext } from './diff'

const show = (lines: { op: string; text: string }[]) => lines.map(line => `${line.op}${line.text}`)

test('lines: CRLF and CR read as LF, a final newline ignored, tabs as two spaces', () => {
  expect(splitLines('a\r\nb\rc\n')).toEqual(['a', 'b', 'c'])
  expect(splitLines('\tx')).toEqual(['  x'])
  expect(splitLines('')).toEqual([])
})

test('a changed line in the middle is matched, the rest kept as context', () => {
  expect(show(diffLines('a\nb\nc\n', 'a\nB\nc\n'))).toEqual([' a', '-b', '+B', ' c'])
  expect(show(diffLines('a\nc', 'a\nb\nc'))).toEqual([' a', '+b', ' c'])
  expect(show(diffLines('', 'x\ny'))).toEqual(['+x', '+y'])
})

test('a CRLF file rewritten with LF shows only the lines that changed', () => {
  const before = 'one\r\ntwo\r\nthree\r\nfour\r\n'
  const after = 'one\ntwo\nTHREE\nfour\n'
  expect(show(diffLines(before, after))).toEqual([' one', ' two', '-three', '+THREE', ' four'])
})

test('context: one unchanged line around each change, a skipped run as ⋯', () => {
  const before = ['1', '2', '3', '4', '5', '6', '7', '8'].join('\n')
  const after = ['1', 'two', '3', '4', '5', '6', 'seven', '8'].join('\n')
  expect(show(trimContext(diffLines(before, after)))).toEqual([' 1', '-2', '+two', ' 3', '~⋯', ' 6', '-7', '+seven', ' 8'])
  expect(trimContext(diffLines('same', 'same'))).toEqual([])
})

test('a big rewrite is not matched line by line but still counted', () => {
  const before = Array.from({ length: 600 }, (_, k) => `old ${k}`).join('\n')
  const after = Array.from({ length: 600 }, (_, k) => `new ${k}`).join('\n')
  const step = stepOf({ file: 'big.txt', tool: 'Write', note: 'rewrite', before, after })
  expect([step.added, step.removed]).toEqual([600, 600])
  expect(step.lines).toHaveLength(MAX_STORED_LINES)
  expect(step.more).toBe(1200 - MAX_STORED_LINES)
})

test('an edit shows the whole lines it touched, and the line they start on', () => {
  expect(editedLines('a\nlet x = 1\nc\n', 'x = 1', 'x = 2')).toEqual({ before: 'let x = 1', after: 'let x = 2', line: 2 })
  expect(editedLines('a\r\nb\r\nc\r\n', 'b\r\nc', 'B')).toEqual({ before: 'b\nc', after: 'B', line: 2 })
  expect(editedLines('first\nsecond', 'fir', 'FIR')).toEqual({ before: 'first', after: 'FIRst', line: 1 })
  expect(editedLines('a\nb', 'zzz', 'y')).toBeNull()
  expect(editedLines('a\nb', '', 'y')).toBeNull()
})

test('the copy on disk keeps no lines of secret files and hides lines that look like secrets', () => {
  const step = (file: string, ...texts: string[]) =>
    stepOf({ file, tool: 'Write', note: '', before: '', after: texts.join('\n') })
  const [env, key, code] = forDisk([
    step('.env.local', 'DB_PASSWORD=hunter2'),
    step('certs/server.pem', 'MIIB...'),
    step(
      'src/config.ts',
      'export const port = 8080',
      'const apiKey = "abc"',
      '  "ConnectionString": "Server=x;Password=y"',
      'password: hunter2',
      'const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkw"',
      'const name = "greet"',
    ),
  ])
  for (const hidden of [env, key]) {
    expect(hidden?.lines).toEqual([{ op: '~', text: '(lines not saved: this file usually holds secrets)' }])
    expect(hidden?.added).toBe(1)
  }
  expect(code?.lines.map(line => line.text)).toEqual([
    'export const port = 8080',
    HIDDEN_LINE,
    HIDDEN_LINE,
    HIDDEN_LINE,
    HIDDEN_LINE,
    'const name = "greet"',
  ])
})

test('paths relative to the session folder on Windows, macOS and Linux', () => {
  expect(relativePath('/repo', '/repo/src/a.ts')).toBe('src/a.ts')
  expect(relativePath('/repo', '/repository/a.ts')).toBe('/repository/a.ts')
  expect(relativePath('E:\\proj', 'E:\\proj\\src\\a.ts')).toBe('src/a.ts')
  expect(relativePath('E:\\Proj\\', 'e:\\proj\\README.md')).toBe('README.md')
  expect(relativePath('E:\\proj', 'D:\\other\\a.ts')).toBe('D:/other/a.ts')
  expect(relativePath('/Repo', '/repo/a.ts')).toBe('/repo/a.ts')
})
