import { test, expect } from '@playwright/test'

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1920, height: 1080 },
] as const

test.describe('Responsive layout (Story 5.1)', () => {
  for (const size of viewports) {
    test(`no horizontal overflow at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.goto('/')
      const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
      })
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
