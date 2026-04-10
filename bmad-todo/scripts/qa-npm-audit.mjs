#!/usr/bin/env node
/**
 * Writes npm audit JSON to qa-reports/npm-audit.json (exit 0 even if vulns found).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const dir = join(root, 'qa-reports')
const outPath = join(dir, 'npm-audit.json')
mkdirSync(dir, { recursive: true })

const r = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  cwd: root,
  maxBuffer: 20 * 1024 * 1024,
})

const body = (r.stdout && r.stdout.trim() !== '')
  ? r.stdout
  : (r.stderr && r.stderr.trim() !== '')
    ? r.stderr
    : JSON.stringify({ error: 'npm audit produced no JSON', status: r.status })

writeFileSync(outPath, body, 'utf8')
console.log(`Wrote ${outPath}`)
