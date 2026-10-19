import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

// The engine hands paths over absolute for this platform: compare them without drive or separators.
const norm = (path: string) => path.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '').replace(/\/+$/, '')

type Answer = string | 'dismiss'

type Setup = {
  /** The session's folder; a file is put in it so it exists. */
  cwd?: string
  /** Files by absolute path, with their sizes; folders are implied by the paths. */
  files?: Record<string, number>
  /** Git's answer to an argv, keyed by the arguments joined with spaces. */
  git?: Record<string, string>
  /** What `git rev-parse --is-inside-work-tree` finds: a work tree, git's own "not a repository", or a git that fails. */
  repo?: 'yes' | 'no' | 'broken'
  /** What the person answers in the dialog: an option label, typed words, or 'dismiss'. */
  answer?: Answer
  /** Makes the engine fail under the guard, as a broken measurement would. */
  isBroken?: boolean
}

async function session($: Engine, on: On, setup: Setup) {
  const { cwd = '/repo', git = {}, repo = 'yes', answer = 'Cancel', isBroken = false } = setup
  const files: Record<string, number> = { [`${norm(cwd)}/README.md`]: 10, ...setup.files }
  const asked: { question: string }[] = []
  const ran: string[] = []
  const isDir = (path: string) => Object.keys(files).some(k => k.startsWith(`${norm(path)}/`))
  on('session.cwd', async () => {
    if (isBroken) throw new Error('no folder')
    return { value: cwd }
  })
  on('env.get', async (_$, e) => ({ value: e.name === 'HOME' ? '/home/me' : undefined }))
  on('fs.stat', async (_$, e) => {
    const path = norm(e.path)
    if (files[path] !== undefined) return { value: { kind: 'file', size: files[path], mtimeMs: 1, isLink: false } } as never
    if (isDir(path)) return { value: { kind: 'dir', size: 0, mtimeMs: 1, isLink: false } } as never
    throw new Error(`ENOENT: ${e.path}`)
  })
  on('fs.list', async (_$, e) => {
    const dir = norm(e.path)
    const names = new Map<string, 'file' | 'dir'>()
    for (const path of Object.keys(files).filter(k => k.startsWith(`${dir}/`))) {
      const [name = '', ...deeper] = path.slice(dir.length + 1).split('/')
      names.set(name, deeper.length ? 'dir' : 'file')
    }
    return {
      value: [...names].map(([name, kind]) => ({ name, kind, size: files[`${dir}/${name}`] ?? 0, mtimeMs: 1, isLink: false })),
    }
  })
  on('process.run', async (_$, e) => {
    const [cmd, ...args] = e.argv
    const asked = args.join(' ')
    const done = (exitCode: number, stdout: string, stderr = '') =>
      ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } }) as never
    if (cmd === 'git' && asked === 'rev-parse --is-inside-work-tree') {
      if (repo === 'broken') throw new Error('git could not start')
      return repo === 'yes' ? done(0, 'true\n') : done(128, '', 'fatal: not a git repository (or any of the parent directories): .git')
    }
    const stdout = cmd === 'git' ? git[asked] : undefined
    return done(stdout === undefined ? 1 : 0, stdout ?? '')
  })
  on('tool.call', async (_$, e) => {
    const call = e as unknown as { tool: string; command?: string; questions?: { question: string }[] }
    if (call.tool === 'AskUserQuestion') {
      const question = call.questions?.[0]?.question ?? ''
      asked.push({ question })
      if (answer === 'dismiss') return { deny: 'dismissed' } as never
      return { result: { questions: call.questions, answers: { [question]: answer } } } as never
    }
    ran.push(call.command ?? '')
    return { result: { stdout: '', stderr: '' } } as never
  })
  return { asked, ran }
}

const BUILD = { '/repo/build/app.dll': 2048, '/repo/build/app.pdb': 1024, '/repo/build/sub/x.js': 100 }

/** The lines of the first question asked, separators as forward slashes. */
const linesOf = (asked: { question: string }[]) => (asked[0]?.question ?? '').replace(/\\/g, '/').split('\n')

test('rm -rf asks with the measured files listed in the question; Cancel denies and nothing runs', async ($, on) => {
  const { asked, ran } = await session($, on, { files: BUILD, answer: 'Cancel' })
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)
  expect(asked).toHaveLength(1)
  const lines = linesOf(asked)
  expect(lines[0]).toBe('rm -rf build would delete 3 files in 2 folders (3.1 KB).')
  expect(lines.slice(1, -1).sort()).toEqual(['  build/app.dll', '  build/app.pdb', '  build/sub/x.js'])
  expect(lines.at(-1)).toBe('Run it?')
  expect(ran).toEqual([])
  expect(out.deny).toContain('the user pressed Cancel')
})

test('a command with two risky parts lists each part with what it touches', async ($, on) => {
  const { asked } = await session($, on, {
    files: { '/repo/build/app.dll': 2048 },
    git: { 'status --porcelain': ' M src/a.ts\n', 'diff --shortstat HEAD': ' 1 file changed, 2 insertions(+)\n' },
  })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build && git reset --hard' } as never)
  expect(linesOf(asked)).toEqual([
    'rm -rf build && git reset --hard would delete 1 file in 1 folder (2.0 KB); throw away uncommitted changes in 1 file (+2 −0 lines).',
    '  rm -rf build → delete 1 file in 1 folder (2.0 KB)',
    '    build/app.dll',
    '  git reset --hard → throw away uncommitted changes in 1 file (+2 −0 lines)',
    '    src/a.ts',
    'Run it?',
  ])
})

test('Proceed runs the command as written', async ($, on) => {
  const { ran } = await session($, on, { files: BUILD, answer: 'Proceed' })
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)
  expect(ran).toEqual(['rm -rf build'])
  expect(out.deny).toBeUndefined()
})

const refusals: Array<[string, Answer, string]> = [
  ['a dismissed dialog', 'dismiss', 'was dismissed'],
  ['typed words instead of a choice', 'use git clean instead', 'wrote: "use git clean instead"'],
]
for (const [name, answer, reason] of refusals) {
  test(`${name} denies`, async ($, on) => {
    const { ran } = await session($, on, { files: BUILD, answer })
    const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)
    expect(ran).toEqual([])
    expect(out.deny).toContain(reason)
  })
}

test('nothing at risk runs straight through, without asking', async ($, on) => {
  const { asked, ran } = await session($, on, { files: {}, git: { 'status --porcelain': '?? new.txt\n' } })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf /repo/build' } as never)
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
  expect(asked).toEqual([])
  expect(ran).toEqual(['rm -rf /repo/build', 'git reset --hard', 'npm test'])
})

test('a relative path that is not in the session folder is held: the shell may be elsewhere', async ($, on) => {
  const { asked, ran } = await session($, on, {})
  await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)
  expect(linesOf(asked)).toEqual([
    "rm -rf build would delete build, which isn't in /repo.",
    "  If Claude's shell has moved to another folder, it would delete what has that name there.",
    'Run it?',
  ])
  expect(ran).toEqual([])
})

test('Windows: a Git Bash drive path is measured on that drive', async ($, on) => {
  const { asked } = await session($, on, { cwd: 'E:\\scratch', files: { '/scratch/build/a.txt': 1024 } })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf /e/scratch/build' } as never)
  expect(linesOf(asked)[0]).toBe('rm -rf /e/scratch/build would delete 1 file in 1 folder (1.0 KB).')
})

test("Windows: a Git Bash path that isn't on a drive is held unmeasured", async ($, on) => {
  const { asked, ran } = await session($, on, { cwd: 'E:\\scratch' })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf /tmp/cache' } as never)
  expect(asked[0]?.question).toContain("files that can't be measured")
  expect(ran).toEqual([])
})

test("a cd into a folder that isn't there is held", async ($, on) => {
  const { asked, ran } = await session($, on, {})
  await $.tool.call({ tool: 'Bash', command: 'cd gone && rm -rf build' } as never)
  expect(asked[0]?.question).toContain("isn't there")
  expect(ran).toEqual([])
})

test('git that fails to answer holds the command', async ($, on) => {
  const { asked, ran } = await session($, on, { repo: 'broken' })
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard' } as never)
  expect(asked[0]?.question).toContain("git couldn't be asked")
  expect(ran).toEqual([])
})

test('outside a repository, git reset --hard runs (git refuses it itself)', async ($, on) => {
  const { asked, ran } = await session($, on, { repo: 'no' })
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard' } as never)
  expect(asked).toEqual([])
  expect(ran).toEqual(['git reset --hard'])
})

test('git reset --hard lists the uncommitted changes it would throw away', async ($, on) => {
  const { asked } = await session($, on, {
    git: {
      'status --porcelain': ' M src/a.ts\nM  src/b.ts\n?? new.txt\n',
      'diff --shortstat HEAD': ' 2 files changed, 10 insertions(+), 3 deletions(-)\n',
    },
  })
  await $.tool.call({ tool: 'Bash', command: 'git reset --hard' } as never)
  expect(linesOf(asked)).toEqual([
    'git reset --hard would throw away uncommitted changes in 2 files (+10 −3 lines).',
    '  src/a.ts',
    '  src/b.ts',
    'Run it?',
  ])
})

test('a force push names the commits it would drop from the remote', async ($, on) => {
  const { asked } = await session($, on, {
    git: {
      'rev-parse --abbrev-ref --symbolic-full-name @{u}': 'origin/main\n',
      'rev-parse --abbrev-ref HEAD': 'main\n',
      'rev-parse --verify --quiet refs/remotes/origin/main': 'abc\n',
      'rev-list --count HEAD..refs/remotes/origin/main': '2\n',
      'log --format=%h %s -n10 HEAD..refs/remotes/origin/main': 'abc123 fix login\ndef456 add tests\n',
    },
  })
  await $.tool.call({ tool: 'Bash', command: 'git push --force' } as never)
  expect(linesOf(asked)).toEqual([
    'git push --force would drop 2 commits from origin/main.',
    '  abc123 fix login',
    '  def456 add tests',
    'Run it?',
  ])
})

test('a lease push that drops nothing goes through', async ($, on) => {
  const { asked, ran } = await session($, on, {
    git: {
      'rev-parse --abbrev-ref HEAD': 'main\n',
      'rev-parse --verify --quiet refs/remotes/origin/main': 'abc\n',
      'rev-list --count HEAD..refs/remotes/origin/main': '0\n',
    },
  })
  await $.tool.call({ tool: 'Bash', command: 'git push --force-with-lease origin main' } as never)
  expect(asked).toEqual([])
  expect(ran).toHaveLength(1)
})

test('PowerShell Remove-Item -Recurse is held too', async ($, on) => {
  const { asked, ran } = await session($, on, { files: BUILD, answer: 'Cancel' })
  const out = await $.tool.call({ tool: 'PowerShell', command: 'Remove-Item -Recurse -Force .\\build' } as never)
  expect(asked[0]?.question).toContain('would delete 3 files')
  expect(ran).toEqual([])
  expect(out.deny).toBeDefined()
})

test('a migration is held with a note, since it cannot be measured', async ($, on) => {
  const { asked } = await session($, on, {})
  await $.tool.call({ tool: 'Bash', command: 'dotnet ef database update' } as never)
  expect(asked[0]?.question).toContain("Entity Framework database migration, which git can't undo")
})

test('a guard that fails denies instead of letting the command run', async ($, on) => {
  const { ran } = await session($, on, { files: BUILD, answer: 'Proceed', isBroken: true })
  const out = await $.tool.call({ tool: 'Bash', command: 'rm -rf build' } as never)
  expect(ran).toEqual([])
  expect(out.deny).toContain("couldn't check this command")
})
