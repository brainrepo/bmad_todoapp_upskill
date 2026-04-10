#!/usr/bin/env node
/**
 * Aggregate QA report generation: coverage (frontend + backend) + npm audit JSON.
 * Lighthouse is optional: set LIGHTHOUSE_URL (e.g. http://localhost:5173) with dev server running.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const bmadTodo = dirname(root)

function run (cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: bmadTodo,
    stdio: 'inherit',
    shell: false,
    ...opts,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('QA reports → qa-reports/ (see qa-reports/README.md)\n')

run('npm', ['run', 'test:coverage', '--workspace=frontend'])
run('npm', ['run', 'test:coverage', '--workspace=backend'])
run('node', [join(root, 'qa-npm-audit.mjs')])

if (process.env['LIGHTHOUSE_URL'] || process.env['RUN_LIGHTHOUSE'] === '1') {
  run('npm', ['run', 'lighthouse:a11y'])
} else {
  console.log('\nSkipping Lighthouse (set LIGHTHOUSE_URL or RUN_LIGHTHOUSE=1 with app running).')
}

console.log('\nDone.')
