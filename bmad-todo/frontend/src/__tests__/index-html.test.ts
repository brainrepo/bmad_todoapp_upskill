import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('index.html', () => {
  it('sets lang and document title for screen readers', () => {
    const html = readFileSync(join(__dirname, '../../index.html'), 'utf8')
    expect(html).toContain('lang="en"')
    expect(html).toContain('<title>things to do</title>')
  })
})
