import { expect, test } from 'claude-code/testing'

import { detect } from './detect'

const kinds = (line: string, shell: 'bash' | 'powershell' = 'bash') => detect(line, shell).map(f => f.kind)

test('rm with -r or -f is a delete, a plain rm is not', async () => {
  expect(detect('rm -rf build', 'bash')).toEqual([{ text: 'rm -rf build', cwd: '.', kind: 'delete', targets: ['build'] }])
  expect(kinds('rm -f a.txt')).toEqual(['delete'])
  expect(kinds('rm --recursive out')).toEqual(['delete'])
  expect(kinds('rm a.txt')).toEqual([])
  expect(kinds('rm -rf')).toEqual([])
})

test('cd, pushd and parentheses move where a part runs', async () => {
  const [first] = detect('cd app && rm -rf dist node_modules', 'bash')
  expect(first).toMatchObject({ cwd: 'app', targets: ['dist', 'node_modules'] })
  const found = detect('( cd a && rm -rf x ); rm -rf y', 'bash')
  expect(found.map(f => f.cwd)).toEqual(['a', '.'])
  expect(detect('pushd web && popd && rm -rf tmp', 'bash')[0]?.cwd).toBe('.')
  expect(detect('cd /srv/app; rm -rf cache', 'bash')[0]?.cwd).toBe('/srv/app')
  expect(detect('cd "$DIR" && rm -rf cache', 'bash')[0]?.cwd).toBeNull()
})

test('quotes, comments and redirections are not commands', async () => {
  expect(kinds('echo "rm -rf /"')).toEqual([])
  expect(kinds('git commit -m "fix; rm -rf build"')).toEqual([])
  expect(kinds('ls # rm -rf build')).toEqual([])
  expect(detect('rm -rf build 2>/dev/null', 'bash')[0]).toMatchObject({ targets: ['build'] })
  expect(detect('rm -rf build >out.log 2>&1', 'bash')[0]).toMatchObject({ targets: ['build'] })
})

test('wrappers, assignments and nested shells are looked through', async () => {
  expect(detect('sudo -u www rm -rf /var/cache/app', 'bash')[0]).toMatchObject({ targets: ['/var/cache/app'] })
  expect(kinds('FOO=1 nice -n 5 rm -rf x')).toEqual(['delete'])
  expect(kinds('bash -lc "rm -rf dist"')).toEqual(['delete'])
  expect(kinds('timeout 5 rm -rf x')).toEqual(['delete'])
})

test('git commands that throw work away', async () => {
  expect(detect('git -C repo reset --hard HEAD~2', 'bash')[0]).toMatchObject({ kind: 'git-reset-hard', cwd: 'repo', ref: 'HEAD~2' })
  expect(detect('git reset --hard', 'bash')[0]).toMatchObject({ ref: 'HEAD' })
  expect(kinds('git reset --soft HEAD~1')).toEqual([])
  expect(detect('git checkout -- .', 'bash')[0]).toMatchObject({ kind: 'git-discard', paths: ['.'] })
  expect(detect('git restore src/a.ts', 'bash')[0]).toMatchObject({ kind: 'git-discard', paths: ['src/a.ts'] })
  expect(kinds('git restore --staged src/a.ts')).toEqual([])
  expect(kinds('git checkout main')).toEqual([])
  expect(detect('git clean -fdx', 'bash')[0]).toMatchObject({ kind: 'git-clean', args: ['-n', '-d', '-x'] })
  expect(detect('git clean -f -e .env -- build', 'bash')[0]).toMatchObject({ args: ['-n', '-e', '.env', '--', 'build'] })
  expect(kinds('git clean -n')).toEqual([])
})

test('force pushes, with and without a lease', async () => {
  expect(detect('git push --force-with-lease origin main', 'bash')[0]).toMatchObject({
    kind: 'git-force-push',
    remote: 'origin',
    refspecs: ['main'],
    hasLease: true,
  })
  expect(detect('git push -f', 'bash')[0]).toMatchObject({ remote: null, refspecs: [], hasLease: false })
  expect(detect('git push origin +main', 'bash')[0]).toMatchObject({ hasLease: false })
  expect(kinds('git push origin main')).toEqual([])
  expect(kinds('git push -u origin feature')).toEqual([])
})

test('PowerShell: Remove-Item and its aliases, paths with backslashes', async () => {
  expect(detect('Remove-Item -Recurse -Force .\\build', 'powershell')[0]).toMatchObject({ kind: 'delete', targets: ['.\\build'] })
  expect(detect('Set-Location C:\\work; Remove-Item -Path a,b -Recurse', 'powershell')[0]).toMatchObject({
    cwd: 'C:\\work',
    targets: ['a', 'b'],
  })
  expect(kinds('rm -r dist', 'powershell')).toEqual(['delete'])
  expect(kinds('Remove-Item notes.txt', 'powershell')).toEqual([])
  expect(kinds('Get-ChildItem *.log | Remove-Item -Force', 'powershell')).toEqual(['opaque'])
  expect(kinds('Get-ChildItem | ForEach-Object { Remove-Item $_ -Recurse }', 'powershell')).toEqual(['delete'])
  expect(kinds('cmd /c rd /s /q build', 'powershell')).toEqual(['delete'])
  expect(kinds('pwsh -c "Remove-Item -Recurse out"')).toEqual(['delete'])
})

test('migrations, and look-alikes that are not', async () => {
  expect(detect('dotnet ef database update', 'bash')[0]).toMatchObject({ kind: 'migration', tool: 'Entity Framework' })
  expect(detect('python manage.py migrate', 'bash')[0]).toMatchObject({ tool: 'Django' })
  expect(detect('npm run migrate', 'bash')[0]).toMatchObject({ kind: 'migration' })
  expect(kinds('dotnet ef migrations add Init')).toEqual([])
  expect(kinds('git commit -m "migrate users"')).toEqual([])
  expect(kinds('python manage.py makemigrations')).toEqual([])
})

test('commands whose files are picked at run time are held unmeasured', async () => {
  expect(kinds('ls *.tmp | xargs rm -rf')).toEqual(['opaque'])
  expect(kinds("find . -name '*.tmp' -delete")).toEqual(['opaque'])
  expect(kinds('find . -name x -exec rm {} +')).toEqual(['opaque'])
  expect(kinds('find . -name x')).toEqual([])
})
