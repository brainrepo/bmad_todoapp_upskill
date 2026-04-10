# Story 5.4: Accessibility Testing & WCAG Verification

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app to meet WCAG 2.1 AA standards,
So that the app is usable by everyone regardless of ability.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 5.4 — 5 criteria)**

1. **Given** all components are implemented  
   **When** axe-core is run via `@axe-core/playwright` on each E2E test  
   **Then** zero critical or serious accessibility violations are reported

2. **Given** the color palette is implemented  
   **When** contrast ratios are verified  
   **Then** `text-primary` on `bg` achieves ~15:1 (passes AA)  
   **And** `text-secondary` on `bg` achieves ~4.5:1 (passes AA)  
   **And** `accent` on `bg` achieves ~5.5:1 (passes AA)  
   **And** `error` on `surface` achieves ~4.8:1 (passes AA)

3. **Given** `prefers-reduced-motion: reduce` is set  
   **When** the app renders  
   **Then** all animations (completion transition, deletion fade-out, notification enter/exit) are disabled — state changes are instant

4. **Given** the Lighthouse accessibility audit is run  
   **When** the audit completes  
   **Then** the accessibility score is 90+ with no critical issues

5. **Given** the full accessibility test suite is run  
   **When** E2E tests with axe-core execute across all user journeys  
   **Then** keyboard navigation, screen reader, contrast, and motion-sensitivity scenarios all pass

## Tasks / Subtasks

- [x] Task 1: axe-core + Playwright (AC: #1, #5)
  - [x] 1.1: Add `@axe-core/playwright` (and ensure `@playwright/test` is compatible) at monorepo root or `bmad-todo`
  - [x] 1.2: Implement a shared helper (e.g. `e2e/fixtures/a11y.ts` or extend `fixtures/test-helpers.ts`) that runs `injectAxe()` and `checkA11y()` (or equivalent) per page after navigation
  - [x] 1.3: Invoke **axe on each E2E spec** (`journey-first-time-user`, `journey-returning-user`, `journey-edge-cases`, `responsive-layout` — and any other spec under `e2e/tests/`) so every test file contributes to AC #1; configure rules to treat **critical** and **serious** as failures
  - [x] 1.4: Document how to run `npm run test:e2e` with stack up (per existing E2E patterns)

- [x] Task 2: Color contrast (AC: #2)
  - [x] 2.1: Locate design tokens / CSS variables for `text-primary`, `text-secondary`, `accent`, `error`, `bg`, `surface` (likely Tailwind theme or `frontend` CSS)
  - [x] 2.2: Add **automated** checks (e.g. unit test with computed hex pairs + `apca-w3` / `wcag-contrast` or documented assertion) **or** deterministic Playwright assertion against computed styles — ratios must match epic targets (~15:1, ~4.5:1, ~5.5:1, ~4.8:1) within tolerance
  - [x] 2.3: If any pair fails, adjust tokens/CSS (minimal diff) and re-verify

- [x] Task 3: Reduced motion (AC: #3)
  - [x] 3.1: Audit components for transitions/animations (todo completion, delete fade, `ErrorNotification`, `LoadingState`, etc.)
  - [x] 3.2: Ensure `prefers-reduced-motion: reduce` disables or short-circuits those animations (existing `motion-reduce:*` patterns from Story 5.1 — extend to any gaps)
  - [x] 3.3: Add E2E or Playwright test with `context.emulateMedia({ reducedMotion: 'reduce' })` (or equivalent) to assert no long transitions / instant state change where feasible

- [x] Task 4: Lighthouse accessibility (AC: #4)
  - [x] 4.1: Add a repeatable script or CI step (e.g. `lighthouse` CLI against local URL, or Playwright Lighthouse integration) targeting the main app URL
  - [x] 4.2: Assert accessibility category score **≥ 90** and **no critical** issues (document threshold in story Dev Agent Record or script output)
  - [x] 4.3: If Lighthouse is flaky in CI, document **local** verification gate and optional CI skip with rationale

- [x] Task 5: Journeys + regression (AC: #5)
  - [x] 5.1: Ensure axe runs across **all** user journeys; add minimal coverage where a journey lacks a “stable” page load for axe if needed
  - [x] 5.2: Cross-check keyboard (5.2), ARIA (5.3), responsive (5.1) behaviors — no regressions in E2E
  - [x] 5.3: `npm run test` (frontend + backend as applicable), `npm run lint`, `npm run test:e2e` pass

## Dev Notes

### Running E2E (stack up)

From `bmad-todo`: start backend + frontend (`npm run dev` with Node 22+), then in another terminal run `npm run test:e2e`. Playwright `use.baseURL` is `http://localhost:5173` (`e2e/playwright.config.ts`).

### Running Lighthouse (AC #4)

Requires Node 22+ (matches `lighthouse@13` engines). With the app reachable at the frontend URL:

`LIGHTHOUSE_URL=http://localhost:5173 npm run lighthouse:a11y`

The script enforces accessibility category score ≥ 90 (default; override with `LIGHTHOUSE_MIN_A11Y_SCORE`). Lighthouse can be environment-dependent in CI; use the command above as the local gate.

### Existing E2E layout

- Config: `bmad-todo/e2e/playwright.config.ts`
- Specs: `journey-first-time-user.spec.ts`, `journey-returning-user.spec.ts`, `journey-edge-cases.spec.ts`, `responsive-layout.spec.ts`
- Helpers: `e2e/fixtures/test-helpers.ts`

### Architecture

- **Stack:** Playwright E2E; frontend Vite/React; no new **runtime** deps for production unless required for contrast libs (prefer **devDependencies**).

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 5.4 (authoritative ACs)
- `_bmad-output/implementation-artifacts/5-3-screen-reader-aria-support.md` — prior ARIA work
- [axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)

### Out of scope

- New product features beyond a11y verification; WCAG **AAA** beyond what the epic states

## Technical requirements

- Prefer **automated** checks for contrast and axe; Lighthouse may be **scripted** locally if CI is unstable.
- Do not weaken axe rules below **critical/serious** failure for AC #1.

## File structure (expected touches)

| Path | Action |
|------|--------|
| `bmad-todo/package.json` / lockfile | Add `@axe-core/playwright`, optional contrast/Lighthouse devDeps |
| `bmad-todo/e2e/playwright.config.ts` | Possible — fixtures, global setup |
| `bmad-todo/e2e/fixtures/*.ts` | Axe helpers |
| `bmad-todo/e2e/tests/*.spec.ts` | Integrate axe per spec |
| `bmad-todo/frontend` theme / CSS | Contrast token tweaks if needed |
| `bmad-todo/frontend/src/**/*.tsx` | `motion-reduce` gaps |

## Project context reference

- No `project-context.md` in repo; rely on epics and this file.

## Story completion status

- **review** — Implementation complete; ready for code review.

## Dev Agent Record

### Agent Model Used

Cursor agent (implementation)

### Debug Log References

- axe color-contrast: resolved via token updates (`text-secondary`, `text-placeholder`) and removing `lg:opacity-0` on delete control (opacity caused serious violations); metadata date uses `text-text-placeholder` on hover background.
- Reduced-motion E2E: assert `transition-property: none` on todo row under `prefers-reduced-motion: reduce` (duration alone was misleading vs. Tailwind stacking).

### Completion Notes List

- `e2e/fixtures/a11y.ts`: `AxeBuilder` analyze; fail on critical/serious; skip non-http URLs (unused `page` fixture).
- All four E2E spec files: `test.afterEach` → `assertNoCriticalOrSeriousViolations`.
- `frontend/src/__tests__/theme-contrast.test.ts`: WCAG luminance math aligned with `app.css` tokens.
- `scripts/lighthouse-a11y.mjs` + `npm run lighthouse:a11y` (Node 22+); sample run: accessibility score 100 with dev server up.
- Palette: `app.css` — `text-secondary` `#8a8a9a`, `text-placeholder` `#8c8c9c` (AA on `bg` and row hover); prior `#6b6b7b` / `#4a4a58` failed axe on hover or small text.
- `TodoItem`: delete control always visible; task label `transition-colors` instead of `transition-all` for reduced-motion clarity.

### File List

- `bmad-todo/package.json`
- `bmad-todo/scripts/lighthouse-a11y.mjs`
- `bmad-todo/e2e/fixtures/a11y.ts`
- `bmad-todo/e2e/tests/journey-first-time-user.spec.ts`
- `bmad-todo/e2e/tests/journey-returning-user.spec.ts`
- `bmad-todo/e2e/tests/journey-edge-cases.spec.ts`
- `bmad-todo/e2e/tests/responsive-layout.spec.ts`
- `bmad-todo/frontend/src/app.css`
- `bmad-todo/frontend/src/components/TodoItem.tsx`
- `bmad-todo/frontend/src/__tests__/theme-contrast.test.ts`
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx`
