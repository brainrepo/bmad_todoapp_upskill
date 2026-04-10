#!/usr/bin/env node
/**
 * Accessibility audit against a running dev server.
 * Usage: LIGHTHOUSE_URL=http://localhost:5173 node scripts/lighthouse-a11y.mjs
 * Report JSON: qa-reports/lighthouse-a11y.json (override with LIGHTHOUSE_REPORT_PATH)
 * Requires Node 22+ (matches lighthouse@13 engines).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const url = process.env['LIGHTHOUSE_URL'] ?? 'http://localhost:5173'
const minScore = Number(process.env['LIGHTHOUSE_MIN_A11Y_SCORE'] ?? 90) / 100

function defaultReportPath () {
  const dir = join(process.cwd(), 'qa-reports')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'lighthouse-a11y.json')
}

async function main () {
  const [{ default: lighthouse }, { launch }] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
  ])

  const chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  })

  try {
    const runnerResult = await lighthouse(url, {
      logLevel: process.env['CI'] ? 'error' : 'info',
      output: 'json',
      onlyCategories: ['accessibility'],
      port: chrome.port,
    })

    if (runnerResult == null || runnerResult.lhr == null) {
      throw new Error('Lighthouse returned no result')
    }

    const lhr = runnerResult.lhr
    const cat = lhr.categories?.accessibility
    const score = cat?.score
    if (score == null) {
      throw new Error('Lighthouse accessibility category score missing')
    }

    const outPath =
      process.env['LIGHTHOUSE_REPORT_PATH'] ?? defaultReportPath()
    writeFileSync(outPath, typeof runnerResult.report === 'string' ? runnerResult.report : JSON.stringify(lhr, null, 2))

    const pct = Math.round(score * 100)
    console.log(`Lighthouse accessibility score: ${pct} (min ${Math.round(minScore * 100)})`)
    console.log(`Report: ${pathToFileURL(outPath).href}`)

    if (score < minScore) {
      throw new Error(
        `Accessibility score ${pct} is below minimum ${Math.round(minScore * 100)}`,
      )
    }

    const failedBinaryAudits = (cat.auditRefs ?? [])
      .map((ref) => {
        const a = lhr.audits?.[ref.id]
        if (a == null || a.score == null) return null
        if (a.scoreDisplayMode !== 'binary') return null
        if (a.score !== 0) return null
        return { id: ref.id, title: a.title }
      })
      .filter(Boolean)

    if (failedBinaryAudits.length > 0) {
      const lines = failedBinaryAudits.map((a) => `  - ${a.id}: ${a.title}`).join('\n')
      throw new Error(
        `Lighthouse accessibility: ${failedBinaryAudits.length} failed audit(s) (binary score 0):\n${lines}`,
      )
    }

    const warnAudits = (cat.auditRefs ?? [])
      .map((ref) => lhr.audits?.[ref.id])
      .filter((a) => a != null && a.score != null && a.score > 0 && a.score < 1)
    if (warnAudits.length > 0) {
      console.warn('Partial accessibility audits (informational):')
      for (const a of warnAudits) {
        console.warn(`  - ${a.id}: ${a.title}`)
      }
    }

    console.log('Lighthouse accessibility gate passed (score + binary audits).')
  } finally {
    await chrome.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
