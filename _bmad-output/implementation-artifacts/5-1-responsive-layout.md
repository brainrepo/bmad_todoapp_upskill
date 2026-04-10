# Story 5.1: Responsive Layout

Status: done

## Story

As a user,
I want the app to look and work great on my phone, tablet, and desktop,
So that I can manage my tasks on any device.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 5.1 — 5 criteria)**

1. **Given** the app is viewed on a mobile viewport (< 640px)  
   **When** the page renders  
   **Then** content fills the available width with 16px side padding (`px-4`)  
   **And** the delete `×` button is always visible on each task (no hover required)  
   **And** all interactive elements have a minimum 44x44px touch target  
   **And** the task row has a minimum height of 44px

2. **Given** the app is viewed on a viewport >= 640px  
   **When** the page renders  
   **Then** content is centered with max-width 640px (`sm:max-w-[640px] sm:mx-auto`)  
   **And** side padding increases to 48px (`sm:px-12`)

3. **Given** the app is viewed on a viewport >= 1024px  
   **When** the user hovers over a task  
   **Then** the delete `×` button appears (progressive affordance via `lg:` breakpoint)  
   **And** the task row shows a left border on hover

4. **Given** responsive layout is implemented  
   **When** tested across viewports from 320px to 1920px  
   **Then** no horizontal scrolling, no content overflow, no broken layouts occur

5. **Given** responsive layout is implemented  
   **When** component tests are run  
   **Then** responsive scenarios (mobile full-width, desktop centered, touch targets) pass

## Tasks / Subtasks

- [x] Task 1: Shell layout — `App` / `main` (AC: #1, #2)
  - [x] 1.1: Audit `App.tsx` — mobile full-width + `px-4`; apply `sm:max-w-[640px] sm:mx-auto` and `sm:px-12` per AC (avoid constraining width below `sm` if AC #1 requires edge-to-edge content area)
  - [x] 1.2: Verify header + input + list regions do not introduce horizontal overflow at 320px

- [x] Task 2: `TodoItem` — mobile vs desktop delete affordance (AC: #1, #3)
  - [x] 2.1: Mobile: delete control always visible (`opacity-100` or equivalent; no `lg:`-only visibility on small viewports)
  - [x] 2.2: `lg:` and up: restore progressive disclosure — delete appears on row hover (`lg:group-hover:`) as today
  - [x] 2.3: Touch target `min` 44×44px on interactive controls (delete button; align row/`li` min-height with AC #1)

- [x] Task 3: Manual / E2E spot-check (AC: #4)
  - [x] 3.1: Resize or use Playwright `viewport` for 320, 375, 768, 1024, 1920 — no horizontal scroll, clipping, or layout breaks
  - [x] 3.2: Document in Dev Agent Record any browser-only checks

- [x] Task 4: Tests (AC: #5)
  - [x] 4.1: Extend `App.test.tsx` / `TodoItem.test.tsx` (or dedicated tests) with viewport-aware assertions where feasible (e.g. class presence for `sm:` / `lg:` breakpoints using container queries or mock `matchMedia` if project pattern exists)
  - [x] 4.2: `npm run test --workspace=frontend` and `npm run lint --workspace=frontend` pass

## Dev Notes

### Architecture & Code Pattern Requirements

**App shell:** `main` uses mobile-first utilities: `w-full max-w-none` below `sm`, then `sm:max-w-[640px] sm:mx-auto` and `sm:px-12`; base `px-4` for 16px horizontal padding on narrow viewports.

**TodoItem:** Delete button remains `w-11 h-11` with `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`. Row uses `min-h-[44px]`; left border and surface hover on row use `lg:hover:*` so desktop hover matches epic; `active:bg-surface-hover` gives touch feedback on smaller viewports.

**TodoInput:** `min-h-[44px]` and `box-border` for minimum touch target height.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 5.1

### Out of scope

- Keyboard navigation (Story 5.2), screen reader / ARIA semantics changes (Story 5.3), axe / WCAG automation (Story 5.4)

## Technical requirements

- Tailwind v4 utility classes; mobile-first breakpoints (`sm:` 640px, `lg:` 1024px per epic)
- No new production dependencies unless required for testing

## File structure (expected touches)

| Path | Action |
|------|--------|
| `bmad-todo/frontend/src/components/App.tsx` | Likely |
| `bmad-todo/frontend/src/components/TodoItem.tsx` | Likely |
| `bmad-todo/frontend/src/components/TodoInput.tsx` | If touch target / padding |
| `bmad-todo/frontend/src/__tests__/components/*.test.tsx` | Extend or add |

## Code Review (2026-04-10)

**Sources:** `_bmad-output/planning-artifacts/epics.md` Story 5.1 (authoritative ACs), this story file, changed frontend + E2E files.

### AC fidelity (epics → implementation)

| # | Epic criterion | Verdict |
|---|------------------|---------|
| 1 | Mobile: `px-4`, delete visible without hover, 44×44 targets, row ≥44px | Met — `main` has `px-4`; delete `opacity-100` below `lg`; `w-11 h-11`, `min-h-[44px]` on row + input |
| 2 | `sm:max-w-[640px] sm:mx-auto`, `sm:px-12` | Met — on `<main>` |
| 3 | `lg:` delete on row hover; left border on hover | Met — `lg:opacity-0 lg:group-hover:opacity-100`, `lg:hover:border-border` |
| 4 | 320–1920: no horizontal scroll / overflow / broken layout | Partially automated — E2E checks `scrollWidth <= clientWidth` at listed widths; does not assert vertical overflow or layout with populated list |
| 5 | Component tests: mobile full-width, desktop centered, touch targets | Met — `App` / `TodoItem` / `TodoInput` class assertions; 103 tests |

**Count:** 5 epic AC groups ↔ 5 story AC blocks — aligned.

### Findings

**None — High / Critical**

**Medium (informational, optional follow-up)**

1. **`responsive-layout.spec.ts` uses empty app state** — Horizontal overflow is unlikely to regress on the shell with no todos; a follow-up could add one long-text todo via API or UI and re-check 320px (low priority unless overflow bugs appear).

2. **AC #4 wording “content overflow”** — Automation only covers horizontal dimension; vertical clipping or fixed-position edge cases (e.g. long error toast) are out of scope unless reported.

**Low**

3. **Unit tests encode Tailwind class strings** — Brittle if classes are refactored; acceptable for current project style; snapshot or visual regression could complement later.

### Decision

**Approve and merge** — Story 5.1 satisfies epics ACs; follow-ups are optional hardening, not blockers.

---

## Story completion status

- Code review complete — **done**; sprint `5-1-responsive-layout` → **done**

## Dev Agent Record

### Agent Model Used

_(Dev agent)_

### Debug Log References

### Completion Notes List

- **App:** `main` → `w-full max-w-none sm:max-w-[640px] sm:mx-auto px-4 sm:px-12 py-16` (AC #1 full width + `px-4`; AC #2 centered max width + `sm:px-12`).
- **TodoItem:** `min-h-[44px]`; `lg:hover:border-border` + `lg:hover:bg-surface-hover` + `active:bg-surface-hover` (AC #3 hover border on large viewports; mobile tap feedback).
- **TodoInput:** `min-h-[44px] box-border` (AC #1 touch target).
- **Tests:** `App.test.tsx` asserts `main` responsive classes; `TodoItem`/`TodoInput` assert touch and `lg:` delete affordance; **E2E** `e2e/tests/responsive-layout.spec.ts` — no horizontal overflow at 320–1920 widths (`documentElement.scrollWidth <= clientWidth`).
- Frontend: **103** unit tests pass; **lint** clean.

### File List

- `bmad-todo/frontend/src/components/App.tsx` (modified)
- `bmad-todo/frontend/src/components/TodoItem.tsx` (modified)
- `bmad-todo/frontend/src/components/TodoInput.tsx` (modified)
- `bmad-todo/frontend/src/__tests__/components/App.test.tsx` (modified)
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx` (modified)
- `bmad-todo/frontend/src/__tests__/components/TodoInput.test.tsx` (modified)
- `bmad-todo/e2e/tests/responsive-layout.spec.ts` (created)
- `_bmad-output/implementation-artifacts/5-1-responsive-layout.md` (this file)
