import { expect, test } from 'claude-code/testing'

import {
  folderCodes,
  formatAge,
  formatSize,
  isCommit,
  isIgnored,
  isRunnable,
  openerFor,
  parseNumstat,
  parseStatus,
  relativeTo,
  searchFiles,
  sortEntries,
  toDisk,
  visibleRows,
  vscodeCliOf,
} from './tree'

test('paths are made relative to the root on Windows and elsewhere', async () => {
  expect(relativeTo('C:\\Dev\\repo', 'C:\\Dev\\repo\\src\\a.ts', true)).toBe('src/a.ts')
  expect(relativeTo('C:\\Dev\\repo', 'c:/dev/REPO/src/a.ts', true)).toBe('src/a.ts')
  expect(relativeTo('C:\\Dev\\repo', 'C:\\Dev\\repo', true)).toBe('')
  expect(relativeTo('C:\\Dev\\repo', 'C:\\Dev\\repo2\\a.ts', true)).toBeNull()
  expect(relativeTo('/home/per/repo', '/home/per/repo/README.md', false)).toBe('README.md')
  expect(relativeTo('/home/per/repo', '/home/per/Repo/README.md', false)).toBeNull()
  expect(relativeTo('/home/per/repo', 'src/a.ts', false)).toBe('src/a.ts')
  expect(relativeTo('/home/per/repo', '../other/a.ts', false)).toBeNull()
  expect(toDisk('C:\\Dev\\repo', 'src/a.ts', true)).toBe('C:\\Dev\\repo\\src\\a.ts')
  expect(toDisk('/repo', 'src/a.ts', false)).toBe('/repo/src/a.ts')
  expect(toDisk('/repo', '', false)).toBe('/repo')
})

test('git status is read from porcelain v2 with branch, renames, untracked and ignored entries', async () => {
  const stdout = [
    '# branch.oid 1234',
    '# branch.head main',
    '# branch.upstream origin/main',
    '# branch.ab +2 -1',
    '1 .M N... 100644 100644 100644 abc abc src/a b.ts',
    '1 A. N... 000000 100644 100644 000 abc src/new.ts',
    '2 R. N... 100644 100644 100644 abc abc R100 docs/renamed.md',
    'docs/old.md',
    'u UU N... 100644 100644 100644 100644 a b c src/conflict.ts',
    '? notes.txt',
    '! node_modules/',
    '',
  ].join('\0')
  const status = parseStatus(stdout)
  expect(status.branch).toBe('main')
  expect(status.ahead).toBe(2)
  expect(status.behind).toBe(1)
  expect(status.files).toEqual([
    { path: 'src/a b.ts', code: 'M' },
    { path: 'src/new.ts', code: 'A' },
    { path: 'docs/renamed.md', code: 'R' },
    { path: 'src/conflict.ts', code: 'U' },
    { path: 'notes.txt', code: '?' },
  ])
  expect(status.ignored).toEqual(['node_modules'])
})

test('numstat counts lines per path, follows renames and leaves out binary files', async () => {
  const counts = parseNumstat(['3\t1\tsrc/a.ts', '-\t-\tlogo.png', '5\t0\t', 'old.md', 'new.md', ''].join('\0'))
  expect(counts.get('src/a.ts')).toEqual({ added: 3, removed: 1 })
  expect(counts.get('new.md')).toEqual({ added: 5, removed: 0 })
  expect(counts.has('logo.png')).toBe(false)
})

test('folders take the strongest status beneath them, and ignored folders cover what is inside', async () => {
  const codes = folderCodes({ 'src/a.ts': { code: '?' }, 'src/lib/b.ts': { code: 'M' } })
  expect(codes.get('src')).toBe('M')
  expect(codes.get('src/lib')).toBe('M')
  expect(isIgnored('node_modules/x/index.js', new Set(['node_modules']))).toBe(true)
  expect(isIgnored('src/a.ts', new Set(['node_modules']))).toBe(false)
})

test('folders come first, names sort without case, and only open folders show their entries', async () => {
  const sorted = sortEntries([
    { name: 'b.ts', isDir: false, size: 1, mtimeMs: 1 },
    { name: 'Src', isDir: true, size: 0, mtimeMs: 0 },
    { name: 'A.md', isDir: false, size: 1, mtimeMs: 1 },
    { name: 'docs', isDir: true, size: 0, mtimeMs: 0 },
  ])
  expect(sorted.map(entry => entry.name)).toEqual(['docs', 'Src', 'A.md', 'b.ts'])
  const rows = visibleRows(
    { '': sorted, Src: [{ name: 'x.ts', isDir: false, size: 1, mtimeMs: 1 }], docs: [{ name: 'y.md', isDir: false, size: 1, mtimeMs: 1 }] },
    new Set(['Src']),
  )
  expect(rows.map(row => `${'-'.repeat(row.depth)}${row.path}`)).toEqual(['docs', 'Src', '-Src/x.ts', 'A.md', 'b.ts'])
})

test('a git commit is told apart from other git commands', async () => {
  expect(isCommit('git commit -m "x"')).toBe(true)
  expect(isCommit('git add . && git commit -m x')).toBe(true)
  expect(isCommit('git -C plugins commit --amend')).toBe(true)
  expect(isCommit('git -c user.name=x commit -m y')).toBe(true)
  expect(isCommit('git log --grep commit')).toBe(false)
  expect(isCommit('echo commit')).toBe(false)
})

test('files are opened without a shell: VS Code on Windows, the default app elsewhere', async () => {
  const launcher = 'C:\\Users\\per\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd'
  const install = 'C:\\Users\\per\\AppData\\Local\\Programs\\Microsoft VS Code'
  expect(vscodeCliOf(launcher, '@echo off\r\n"%~dp0..\\Code.exe" "%~dp0..\\e646868227\\resources\\app\\out\\cli.js" %*\r\n')).toEqual({
    exe: `${install}\\Code.exe`,
    cli: `${install}\\e646868227\\resources\\app\\out\\cli.js`,
  })
  expect(vscodeCliOf(launcher, '')?.cli).toBe(`${install}\\resources\\app\\out\\cli.js`)
  expect(openerFor('mac', '/r/a.pdf')).toEqual(['open', '/r/a.pdf'])
  expect(openerFor('linux', '/r/a.pdf')).toEqual(['xdg-open', '/r/a.pdf'])
  for (const name of ['x.ps1', 'X.BAT', 'a.exe', 'run.sh', 'link.lnk', 'tool.py', 'Foo.app', 'x.terminal']) expect(isRunnable(name)).toBe(true)
  for (const name of ['a.md', 'a.ts', 'a.pdf', 'Makefile']) expect(isRunnable(name)).toBe(false)
})

test('search matches every word, file names first', async () => {
  const files = ['src/register.tsx', 'docs/register-notes.md', 'hooks/tree.ts', 'README.md']
  expect(searchFiles(files, 'regist')).toEqual(['src/register.tsx', 'docs/register-notes.md'])
  expect(searchFiles(files, 'docs reg')).toEqual(['docs/register-notes.md'])
  expect(searchFiles(files, '  ')).toEqual([])
})

test('sizes and ages read short', async () => {
  expect(formatSize(812)).toBe('812 B')
  expect(formatSize(4300)).toBe('4.2 KB')
  expect(formatSize(30 * 1024 * 1024)).toBe('30 MB')
  expect(formatAge(20_000)).toBe('now')
  expect(formatAge(5 * 60_000)).toBe('5m')
  expect(formatAge(3 * 3_600_000)).toBe('3h')
  expect(formatAge(3 * 86_400_000)).toBe('3d')
  expect(formatAge(400 * 86_400_000)).toBe('1y')
})
