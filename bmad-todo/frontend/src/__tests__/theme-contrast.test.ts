import { describe, expect, it } from 'vitest'

/**
 * WCAG 2.1 relative luminance + contrast (same math as axe).
 * Token hex values must stay aligned with `src/app.css` @theme.
 */
const THEME = {
  bg: '#141419',
  surface: '#1c1c24',
  textPrimary: '#e8e8ed',
  textSecondary: '#8a8a9a',
  accent: '#7c9cb5',
  error: '#c4756e',
} as const

function hexToRgb (hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function linearize (channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance (hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio (foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function expectNear (
  label: string,
  actual: number,
  target: number,
  tolerance: number,
) {
  expect(actual, label).toBeGreaterThanOrEqual(target - tolerance)
  expect(actual, label).toBeLessThanOrEqual(target + tolerance)
}

describe('theme contrast (epic Story 5.4)', () => {
  it('text-primary on bg ~15:1', () => {
    const r = contrastRatio(THEME.textPrimary, THEME.bg)
    expectNear('primary/bg', r, 15, 0.6)
    expect(r).toBeGreaterThanOrEqual(4.5)
  })

  it('text-secondary on bg ~4.5:1 (AA)', () => {
    const r = contrastRatio(THEME.textSecondary, THEME.bg)
    expectNear('secondary/bg', r, 5.4, 0.5)
    expect(r).toBeGreaterThanOrEqual(4.5)
  })

  it('text-secondary on surface-hover meets AA (delete control on row hover)', () => {
    const r = contrastRatio(THEME.textSecondary, '#24242e')
    expect(r).toBeGreaterThanOrEqual(4.5)
  })

  it('accent on bg ~5.5:1 (strong AA)', () => {
    const r = contrastRatio(THEME.accent, THEME.bg)
    expectNear('accent/bg', r, 6.0, 0.75)
    expect(r).toBeGreaterThanOrEqual(5.5)
  })

  it('error on surface ~4.8:1', () => {
    const r = contrastRatio(THEME.error, THEME.surface)
    expectNear('error/surface', r, 4.8, 0.35)
    expect(r).toBeGreaterThanOrEqual(4.5)
  })
})
