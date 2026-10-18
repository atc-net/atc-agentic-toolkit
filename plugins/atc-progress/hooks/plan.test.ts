import { expect, test } from 'claude-code/testing'

import { currentPhase, isFinished, isPlanPath, parsePlan, planRank } from './plan'

const PLAN = [
  '---',
  'goal: Ship the demo',
  "status: 'In progress'",
  '---',
  '',
  '# Introduction',
  '',
  '## 2. Implementation Steps',
  '',
  '### Implementation Phase 1',
  '',
  'Status: Complete <!-- Not started | In progress | Complete -->',
  '',
  '| Task | Description | Completed | Date |',
  '|------|-------------|-----------|------|',
  '| TASK-001 | One | ✅ | 2026-10-17 |',
  '| TASK-002 | Two | ✅ | 2026-10-17 |',
  '',
  '#### Verification',
  '- **VER-001**: run it',
  '',
  '### Implementation Phase 2',
  '',
  'Status: In progress <!-- Not started | In progress | Complete -->',
  '',
  '| Task | Description | Completed | Date |',
  '|------|-------------|-----------|------|',
  '| TASK-003 | Three | ✅ | 2026-10-17 |',
  '| TASK-004 | Four | | |',
  '| TASK-005 | Five | | |',
  '',
  '## 3. Alternatives',
  '',
  '| TASK-999 | not a task of any phase | ✅ | |',
].join('\r\n')

test('parses goal, status, phases and ticked tasks', async () => {
  const plan = parsePlan('/repo/plan/feature-demo-1.md', PLAN)
  expect(plan.goal).toBe('Ship the demo')
  expect(plan.status).toBe('In progress')
  expect(plan.phases).toEqual([
    { n: 1, title: '', status: 'Complete', done: 2, total: 2 },
    { n: 2, title: '', status: 'In progress', done: 1, total: 3 },
  ])
  expect(plan.done).toBe(3)
  expect(plan.total).toBe(5)
  expect(currentPhase(plan)?.n).toBe(2)
  expect(isFinished(plan)).toBe(false)
  expect(planRank(plan)).toBe(0)
})

test('a template placeholder goal falls back to the first heading', async () => {
  const plan = parsePlan('/repo/plan/x.md', '---\ngoal: [Concise Title]\nstatus: Planned\n---\n# Upgrade the API\n')
  expect(plan.goal).toBe('Upgrade the API')
  expect(planRank(plan)).toBe(1)
  expect(plan.total).toBe(0)
})

test('a phase without a Status line takes its status from its tasks', async () => {
  const text = '### Implementation Phase 1\n| TASK-001 | a | ✅ | |\n| TASK-002 | b | ✅ | |\n'
  const plan = parsePlan('/repo/plan/no-status.md', text)
  expect(plan.goal).toBe('no-status')
  expect(plan.phases[0]?.status).toBe('Complete')
  expect(isFinished(plan)).toBe(true)
  expect(planRank(plan)).toBe(null)
})

test('a pipe inside a task description does not move the Completed column', async () => {
  const text = [
    '### Implementation Phase 2',
    'Status: Complete',
    '| Task | Description | Completed | Date |',
    '|------|-------------|-----------|------|',
    "| TASK-004 | If `($output | Out-String).Trim() -cne 'Hello, World!'`, write FAIL. | ✅ | 2026-10-17 |",
    '| TASK-005 | An escaped \\| pipe | ✅ | 2026-10-17 |',
    '| TASK-006 | Not yet | | |',
  ].join('\n')
  const plan = parsePlan('/repo/plan/pipes.md', text)
  expect(plan.done).toBe(2)
  expect(plan.total).toBe(3)
})

test('a table with the Completed column elsewhere is still read', async () => {
  const text = ['### Implementation Phase 1', '| Task | Completed | Description |', '|---|---|---|', '| TASK-001 | ✅ | first |', '| TASK-002 | | second |'].join('\n')
  const plan = parsePlan('/repo/plan/columns.md', text)
  expect(plan.done).toBe(1)
  expect(plan.total).toBe(2)
})

test('recognises plan paths on either separator', async () => {
  expect(isPlanPath('/repo/plan/feature-x-1.md')).toBe(true)
  expect(isPlanPath('E:\\repo\\plan\\feature-x-1.md')).toBe(true)
  expect(isPlanPath('/repo/plans/feature-x-1.md')).toBe(false)
  expect(isPlanPath('/repo/plan/notes.txt')).toBe(false)
})
