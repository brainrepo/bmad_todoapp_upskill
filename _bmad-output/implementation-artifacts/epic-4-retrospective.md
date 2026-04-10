# Epic 4 Retrospective: Resilient User Experience

Date: 2026-04-10  
Facilitator: Bob (Scrum Master)  
Participants: Alice (PO), Charlie (Senior Dev), Dana (QA Engineer), Brainrepo (Project Lead)

## Delivery Summary

| Metric | Value |
|--------|-------|
| Stories Completed | 5/5 (100%) |
| Frontend unit tests | 98 (12 files; hooks + components + API client) |
| Backend unit tests | 49 (unchanged API surface in Epic 4) |
| E2E tests | 24 total (Journey 1 + Journey 2 + Journey 3 edge cases) |
| Epic focus | Empty / loading / error UI, optimistic rollback, Playwright resilience suite |

## Epic 3 Retro Action Item Follow-Through

| Action Item (from Epic 3 retro) | Status | Evidence |
|--------------------------------|--------|----------|
| QA owns E2E story directly — Story 4.5 to QA | Partial | Journey 3 spec was implemented in dev flow; outcome still strong (green suite, solid patterns). Process ownership can shift in Epic 5 if desired. |
| Add `waitForMutationAndRefetch` E2E helper | Not added as named helper | Journey 2/3 specs use `waitForResponse` + refetch waits where needed; Epic 4.5 uses `page.route` for faults instead. Revisit if flaky tests return. |
| Story creation includes CSS/UX micro-details | Ongoing | Stories 4.x reference UX tokens; some polish still landed in code review (e.g. 4.4). |
| Plan TodoItem restructure for Epic 5 (ARIA) | Open | Still deferred; Epic 5.3 is the right home. |
| Commit after each story | Ongoing | Encouraged; verify per repo habit. |

## Story-by-Story Notes

| Story | Theme | Highlights |
|-------|--------|------------|
| 4.1 Empty state | Presentational `EmptyState`, TodoList branch | TDD on copy and layout; integrates with existing query refetch. |
| 4.2 Loading state | `LoadingState`, guards in TodoList | `aria-busy` / polite live region; ordering vs error/empty. |
| 4.3 Error state & notification | `ErrorState`, `ErrorNotification`, `useErrorNotification` | Fixed toast, known strings from hooks; timer-tested. |
| 4.4 Optimistic updates & rollback | `useTodos` mutations, delete fade | Temp ID swap on create; rollback + messages; **flush** of pending delete when switching rows (code review). |
| 4.5 E2E edge cases | `journey-edge-cases.spec.ts` | 503 on POST/PATCH/DELETE; empty input; delayed GET for loading; **empty list** simulation fixed by fulfilling `[]` only for GETs **before** first `POST` (avoids refetch wiping the new task). |

## What Went Well

1. **End-to-end resilience is testable** — Playwright `page.route` gives deterministic failure and delay without mocking the frontend bundle; aligns with architecture.

2. **Optimistic UX matches product intent** — Create/toggle/delete feel immediate; rollback and copy in `useTodos` stay centralized.

3. **Code review on 4.4 caught a real race** — Rapid delete on two rows within the fade window could drop a delete; `pendingDeleteIdRef` flush + careful `onSettled` fixed it.

4. **AC fidelity discipline held** — Story 4.5 was traced 1:1 to epics; Journey 3 naming and file path match architecture.

5. **Regression safety** — Large hook tests (`useTodos`) and component tests absorbed optimistic complexity without dropping coverage.

## What Could Be Improved

1. **E2E empty-state simulation is subtle** — “First N GETs = []” is wrong when N includes the post-create refetch; the **before POST** rule is the durable pattern. Document in test-helpers or a one-line comment in the spec for future journeys.

2. **Shared DB across E2E workers** — Parallel runs can still make “global empty” flaky if a test assumes a clean server; route-based empty list is the right workaround until an isolated test DB or reset API exists.

3. **Epic 3 “QA owns E2E”** — Not fully adopted; for Epic 5 a11y E2E, clarify owner (QA vs dev) up front.

4. **Noise in unit test logs** — Some suites log `ECONNREFUSED` to port 3000 (likely stray fetch); worth a cleanup spike so CI logs stay clean.

## Action Items for Epic 5

| # | Action | Owner | Notes |
|---|--------|-------|--------|
| 1 | Decide owner for Story 5.4 (and any Playwright a11y runs) — QA vs dev | Bob / Brainrepo | Align with Epic 3 retro intent |
| 2 | Optional: extract `fulfillEmptyTodosUntilPost` (or document pattern) in E2E helpers | Charlie | Reduces duplicate route logic if more journeys need “empty” |
| 3 | TodoItem accessibility restructure (`role="checkbox"` vs nested button) | Charlie | Planned in Epic 3 retro; Epic 5.3 |
| 4 | Chase down `ECONNREFUSED` :3000 in frontend tests | Dana / Charlie | Test env or mock consistency |
| 5 | Keep 1:1 AC checks vs `epics.md` at create-story / code-review | All | CLAUDE.md mandate |

## Patterns to Carry Forward to Epic 5

| Pattern | Where | Use in Epic 5 |
|---------|--------|----------------|
| `ErrorNotification` + `useErrorNotification` | 4.3 | Any new user-visible errors |
| Optimistic + rollback in mutations | 4.4 | Extend carefully if new mutations |
| Playwright route for fault injection | 4.5 | axe or network scenarios if specified |
| `getByRole('alert')` for toasts | 4.3, 4.5 | Consistent with screen reader work in 5.3 |
| Journey-based E2E file naming | 4.5 | Next journeys if added |

## Epic 5 Preview (from planning)

Epic 5 is **Responsive Design & Accessibility**: responsive layout (5.1), keyboard navigation (5.2), screen reader & ARIA (5.3), accessibility testing & WCAG verification (5.4). It builds directly on the current `TodoList` / `TodoItem` structure; the deferred **checkbox + button** semantics from Epic 3 retro should be addressed in 5.3.

**Dependencies:** Stable list UI, error paths, and E2E harness from Epic 4. No epic-level architectural pivot required.

**Risks:** Fixing ARIA may touch many tests; plan a focused story order (e.g. structure before WCAG sweep).

## Key Takeaway

Epic 4 delivered a coherent **resilience layer**: visible states for empty/loading/error, optimistic updates with rollback, and a **Journey 3** E2E suite that encodes edge cases including network fault injection. The main process lesson is to **encode fragile E2E patterns explicitly** (empty list = GETs before POST, not “first N GETs”). Epic 5 should own the long-standing **TodoItem accessibility** debt and clarify **who owns accessibility-focused E2E**.
