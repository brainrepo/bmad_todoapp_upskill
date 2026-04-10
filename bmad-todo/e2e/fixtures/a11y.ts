import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'

const FAIL_IMPACTS = new Set(['critical', 'serious'])

/**
 * Fails the test if axe reports any critical or serious violations.
 * Skips when the page has not navigated to an http(s) URL (e.g. unused page fixture).
 */
export async function assertNoCriticalOrSeriousViolations (page: Page) {
  const url = page.url()
  if (!url.startsWith('http')) return

  const results = await new AxeBuilder({ page }).analyze()
  const bad = results.violations.filter((v) =>
    v.impact != null && FAIL_IMPACTS.has(v.impact),
  )
  if (bad.length === 0) return

  const lines = bad.map((v) => {
    const sample = v.nodes[0]?.html?.slice(0, 200) ?? '(no html)'
    return `  - ${v.id} [${v.impact}]: ${v.help} (${v.nodes.length} element(s))\n    e.g. ${sample}`
  })
  throw new Error(
    `axe: ${bad.length} critical/serious violation(s):\n${lines.join('\n')}`,
  )
}
