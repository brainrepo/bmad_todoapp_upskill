# Story 4.5: Error & Edge Case E2E Tests

Status: done

## Story

As a user,
I want the app to handle all edge cases gracefully,
So that my trust in the app holds even when things go wrong.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 4.5)**

**Given** the full stack is running  
**When** a user submits an empty input  
**Then** nothing happens — no request, no error

**Given** the full stack is running  
**When** the backend is temporarily unavailable during a mutation  
**Then** the optimistic update is reverted and an error notification appears

**Given** the app loads with no tasks  
**When** the empty state is displayed  
**Then** the user can create a task and the empty state disappears

**Given** the E2E tests are run  
**When** the edge case journey (Journey 3) is executed  
**Then** all resilience scenarios (empty input, error notification, empty state, loading state) pass

## Tasks / Subtasks

- [x] Task 1: Add Journey 3 Playwright spec file (AC: #4, Journey 3 naming)
  - [x] 1.1: Create `bmad-todo/e2e/tests/journey-edge-cases.spec.ts` (name matches [Source: `_bmad-output/planning-artifacts/architecture.md` — E2E file tree])
  - [x] 1.2: Use `test.describe('Journey 3: Error & Edge Case Handling', …)` or equivalent clear Journey 3 label
  - [x] 1.3: Reuse `e2e/fixtures/test-helpers.ts` (`addTodo`, `uniqueText`, `getTodoItem`, etc.); extend helpers only if needed

- [x] Task 2: Empty input — no network (AC: #1)
  - [x] 2.1: Cover Enter on empty string — assert **no** `POST /api/todos` (e.g. `page.waitForRequest` with timeout short-circuit or request counter / `route` observer)
  - [x] 2.2: Cover whitespace-only (trimmed to empty per UX) — same assertion
  - [x] 2.3: No error toast, no visible error state from validation

- [x] Task 3: Mutation failure — rollback + `ErrorNotification` (AC: #2)
  - [x] 3.1: With at least one todo present, use Playwright `page.route` (or `context.route`) to fail `POST` / `PATCH` / `DELETE` to `/api/todos` with 503/500 or `abort()`
  - [x] 3.2: Assert UI returns to pre-mutation state (optimistic rollback) and `role="alert"` shows expected copy (e.g. "Task not saved — try again" / toggle / delete strings from `useTodos.ts`)
  - [x] 3.3: Stabilize with `retry` / `waitFor` patterns; avoid flake in CI (`playwright.config` already sets CI retries)

- [x] Task 4: Empty state → create task (AC: #3)
  - [x] 4.1: Start from empty list (fresh DB or app state), assert empty-state copy (e.g. "Nothing here yet")
  - [x] 4.2: Add task via `addTodo`, wait for success, assert empty state gone and task visible

- [x] Task 5: Loading state in Journey 3 (AC: #4 — “loading state” in resilience suite)
  - [x] 5.1: Assert initial load shows loading UI when `GET /api/todos` is delayed (e.g. `route` with manual `fulfill` after short delay) — expect "Loading..." or agreed selector from `LoadingState`
  - [x] 5.2: Ensure this test does not conflict with parallel workers (use unique routes or serial describe if needed)

- [x] Task 6: CI & docs
  - [x] 6.1: `npx playwright test` (or root workspace script) passes locally; document in Dev Agent Record any required env (`baseURL` already `http://localhost:5173` in `e2e/playwright.config.ts`)
  - [x] 6.2: Full stack must be running for E2E (Vite + API per existing Epic 2/3 E2E stories)

## Dev Notes

### Intent

- **Journey 3** is the resilience path ([Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Journey 3: Error & Edge Case Handling])
- Architecture already reserved **`journey-edge-cases.spec.ts`** — file did not exist yet; this story creates it
- Depends on **Story 4.3** (error UI) and **4.4** (optimistic rollback); run after those are **done** or ensure implementation matches ACs before merging E2E

### Existing E2E patterns (copy style)

- [Source: `bmad-todo/e2e/tests/journey-first-time-user.spec.ts`] — `waitForResponse`, `uniqueText`, placeholder `What needs doing?`
- [Source: `bmad-todo/e2e/tests/journey-returning-user.spec.ts`] — PATCH/GET waits, `getByRole('list', { name: 'Task list' })`
- [Source: `bmad-todo/e2e/fixtures/test-helpers.ts`] — shared helpers

### Playwright version

- Align with monorepo lockfile / [Source: `_bmad-output/planning-artifacts/architecture.md`] — Playwright ~1.58.x; use project `chromium` from config

### Failure injection

- Prefer **`page.route('**/api/todos**', handler)`** to return errors or delay responses
- For “backend unavailable”, `route.abort()` or 503 is acceptable if the app surfaces the same notification path

### Selectors (stability)

- Error toast: `getByRole('alert')` + text match for known strings
- Loading: text `Loading...` from `LoadingState` or `data-testid` only if already introduced (prefer visible text to avoid scope creep)
- Empty state: "Nothing here yet" / subtitle from `EmptyState` — verify against current `EmptyState.tsx`

### Out of scope

- **axe-core / WCAG E2E** — Epic 5 / separate stories
- **Do not** add new production dependencies for E2E only unless already approved

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.5]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Journey 3 diagram & error notification pattern]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — E2E directory layout]
- [Source: `_bmad-output/implementation-artifacts/4-4-optimistic-updates-rollback.md` — optimistic rollback scope]
- [Source: `_bmad-output/implementation-artifacts/4-3-error-state-error-notification.md` — notification strings]

## Technical requirements

- **Playwright** test file under `bmad-todo/e2e/tests/`
- **Assertions** reflect real user-visible behavior (no mocking the frontend bundle)
- **Parallel safety:** if tests share global server state, use unique task text (`uniqueText`) and order-independent assertions

## Architecture compliance

- E2E validates full-stack contract: Vite app + Fastify API + SQLite as in dev/docker
- Matches architecture expectation of three journey specs including edge cases

## Library & framework requirements

| Package | Notes |
|---------|--------|
| `@playwright/test` | Already in e2e package — no ad-hoc runner |

## File structure requirements

| Path | Action |
|------|--------|
| `bmad-todo/e2e/tests/journey-edge-cases.spec.ts` | **Create** |
| `bmad-todo/e2e/fixtures/test-helpers.ts` | Extend only if DRY requires |

## Previous story intelligence

- **4.4** implements optimistic create/toggle/delete — E2E failure tests assume rollback + notifications behave per hooks
- **4.3** fixed notification strings and `ErrorNotification` semantics

## Git intelligence summary

- Follow `feat: Story 4.5: …` commit style used in Epic 4

## Latest technical information

- Playwright routing: [Route](https://playwright.dev/docs/network#handle-requests) — `page.route` for fault injection

## Project context reference

- No `project-context.md` in repo

## Story completion status

- Story context generated for `4-5-error-edge-case-e2e-tests` — **done**
- Sprint status updated: `done`

## Dev Agent Record

### Agent Model Used

_(Dev agent)_

### Debug Log References

### Completion Notes List

- Added `bmad-todo/e2e/tests/journey-edge-cases.spec.ts` — Journey 3: empty input (no POST), whitespace-only, failed create/toggle/delete (503 + `role="alert"` + rollback), empty state via GET `[]` only **before** first `POST /api/todos` (fixes refetch being wiped when a single initial GET ran), delayed GET for loading UI.
- **Run E2E:** from repo root `bmad-todo`, start full stack (`npm run dev` — Vite `http://localhost:5173`, API proxied per `vite.config`); then `npm run test:e2e` (uses `e2e/playwright.config.ts`, `baseURL` `http://localhost:5173`). Install browsers once: `npx playwright install chromium` (or `npx playwright install`).
- CI: `playwright.config` sets `retries: 2` and `workers: 1` when `CI` is set.

### File List

- `bmad-todo/e2e/tests/journey-edge-cases.spec.ts` (created)
- `_bmad-output/implementation-artifacts/4-5-error-edge-case-e2e-tests.md` (tasks, status, Dev Agent Record)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (4-5 → done)
