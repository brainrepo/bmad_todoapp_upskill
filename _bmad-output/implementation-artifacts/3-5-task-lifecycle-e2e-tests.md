# Story 3.5: Task Lifecycle E2E Tests

Status: done

## Story

As a user,
I want to complete, uncomplete, and delete tasks in a full end-to-end flow,
So that the entire task lifecycle is verified across the full stack.

## Acceptance Criteria (BDD)

1. **Given** the full stack is running with existing tasks
   **When** a user completes a task
   **Then** the task shows strikethrough + italic + dimmed color
   **And** refreshing the page preserves the completed state

2. **Given** a completed task exists
   **When** a user clicks the task to uncomplete it
   **Then** the task returns to active visual state
   **And** refreshing the page preserves the active state

3. **Given** a task exists
   **When** a user deletes it via the `×` button
   **Then** the task disappears from the list
   **And** refreshing the page confirms the task is permanently gone

4. **Given** the E2E tests are run
   **When** the returning user journey (Journey 2) is executed
   **Then** all lifecycle scenarios (complete, uncomplete, delete, persistence) pass

## Tasks / Subtasks

- [x] Task 1: Verify existing Journey 2 E2E tests cover all ACs (AC: #1, #2, #3, #4)
  - [x] 1.1: Run `journey-returning-user.spec.ts` and confirm all 8 tests pass — 8/8 pass
  - [x] 1.2: Cross-reference each AC against test assertions — all 4 ACs mapped to 8 tests
  - [x] 1.3: Identify any AC gaps — visual CSS tested at component level, semantic state at E2E level; no gap requiring additional E2E assertions

- [x] Task 2: Add visual assertion for completed state if missing (AC: #1)
  - [x] 2.1: Verify `expectTodoCompleted` checks `aria-checked="true"` (semantic completion) — confirmed
  - [x] 2.2: Assess whether CSS visual assertions needed — component tests cover CSS classes (line-through, italic, text-text-secondary); E2E covers semantic state + persistence
  - [x] 2.3: No additional E2E CSS assertions needed — layered testing strategy is sound, adding CSS checks would duplicate component coverage and create brittle tests

- [x] Task 3: Run full E2E regression suite (AC: #4)
  - [x] 3.1: Run all Playwright tests — Journey 1 + Journey 2 — 17/17 pass (one flake on first run, 17/17 on retry)
  - [x] 3.2: Run frontend unit test suite — 59/59 pass, zero regressions

## Dev Notes

### CRITICAL: Tests Already Exist

The QA agent (Quinn) generated the Journey 2 E2E tests during this sprint session. The tests are:
- **File:** `bmad-todo/e2e/tests/journey-returning-user.spec.ts` (8 tests)
- **Helpers added:** `bmad-todo/e2e/fixtures/test-helpers.ts` (+5 new helpers)
- **Status:** Already committed (`965dbd4`), all 17/17 E2E tests passing

**This story is a verification and gap-fill story, NOT a write-from-scratch story.** The dev agent should:
1. Verify existing tests map to ACs
2. Fill any gaps
3. Run full regression

### Existing E2E Test → AC Mapping

| Test | AC |
|------|-----|
| `clicking a task marks it as completed with visual distinction` | AC1 |
| `completed state persists after page refresh` | AC1 |
| `clicking a completed task reverts it to active visual state` | AC2 |
| `uncompleted (active) state persists after page refresh` | AC2 |
| `clicking × removes the task from the list` | AC3 |
| `deleted task is permanently gone after page refresh` | AC3 |
| `deletion is immediate — no confirmation dialog` | AC3 (bonus) |
| `create, complete, uncomplete, and delete in sequence` | AC4 |

### Visual Assertion Gap Analysis

AC1 says "strikethrough + italic + dimmed color" — the existing `expectTodoCompleted` helper checks `aria-checked="true"` which is the **semantic** completion signal. The **visual** CSS classes (`line-through italic text-text-secondary`) are already tested in component tests (`TodoItem.test.tsx` lines 38-43). E2E tests typically assert on user-visible outcomes, not implementation details. The `aria-checked` attribute is the accessibility-level truth of completion state.

**Recommended approach:** Document that visual CSS is tested at component level, semantic state at E2E level. No additional visual assertions needed unless the reviewer disagrees.

### Test Helpers Available

From `e2e/fixtures/test-helpers.ts`:
- `addTodo(page, text)` — fill input + press Enter
- `getTodoItem(page, text)` — locate by `role="checkbox"` + text filter
- `toggleTodo(page, text)` — click the todo item
- `deleteTodo(page, text)` — click × via `aria-label="Delete task: [text]"`
- `expectTodoCompleted(page, text)` — assert `aria-checked="true"`
- `expectTodoActive(page, text)` — assert `aria-checked="false"`
- `expectTodoVisible(page, text)` — assert visible
- `getTodoCount(page)` — count items
- `getTodoTextAtPosition(page, position)` — get text at index

### Files to VERIFY (already exist)

| File | Status |
|------|--------|
| `bmad-todo/e2e/tests/journey-returning-user.spec.ts` | Already committed, 8 tests |
| `bmad-todo/e2e/fixtures/test-helpers.ts` | Already committed, 5 new helpers |

### Files NOT to touch

- All backend files — E2E-only story
- All frontend source files — no component changes
- Frontend unit test files — no changes needed
- `journey-first-time-user.spec.ts` — Journey 1, no changes

### Previous Story Intelligence

**From Story 3.4 (Task Deletion UI):**
- Frontend tests: 59/59 passing
- Delete × button uses `aria-label="Delete task: [text]"` — used by E2E `deleteTodo` helper
- Toggle uses `role="checkbox"` with `aria-checked` — used by E2E `expectTodoCompleted/Active`

**From QA Automation (Quinn):**
- Generated 8 Journey 2 tests covering all lifecycle scenarios
- All tests use `waitForResponse` to ensure API calls complete before assertions
- Uses `uniqueText()` pattern to avoid test data collisions
- E2E total: 17 tests (9 Journey 1 + 8 Journey 2)

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 3.5: Task Lifecycle E2E Tests`
**Recent:** `965dbd4` already committed QA-generated tests

### Scope Boundaries

- This is an **E2E test verification story** — no feature implementation
- Do NOT modify frontend or backend source code
- Do NOT add tests for Epic 4 features (empty state, loading, errors) — that's Story 4.5
- Do NOT add accessibility E2E tests — that's Story 5.4

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| `@playwright/test` | v1.58.x | E2E test framework |

**IMPORTANT:** Do NOT install any new dependencies.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] — acceptance criteria (4 ACs, verified 1:1)
- [Source: _bmad-output/planning-artifacts/prd.md#Journey 2] — returning user journey scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing] — Playwright E2E covering all user journeys
- [Source: bmad-todo/e2e/tests/journey-returning-user.spec.ts] — existing Journey 2 tests (8 tests)
- [Source: bmad-todo/e2e/fixtures/test-helpers.ts] — shared test helpers
- [Source: _bmad-output/implementation-artifacts/tests/test-summary.md] — QA automation summary

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Task 1: Ran journey-returning-user.spec.ts — 8/8 pass
- Task 1: Cross-referenced all 4 ACs against 8 tests — full coverage confirmed
- Task 1: Visual gap analysis — CSS tested at component level, semantic at E2E level, no gap
- Task 2: Verified expectTodoCompleted uses aria-checked="true" — correct semantic assertion
- Task 2: Assessed CSS assertions — component tests cover line-through/italic/text-text-secondary, E2E adding them would duplicate and create brittleness
- Task 3: Full E2E suite — 17/17 pass (one flake on first run due to cache invalidation timing, 17/17 on retry; CI retries config handles this)
- Task 3: Frontend unit suite — 59/59 pass, zero regressions

### Completion Notes List

- This was a verification story — QA agent (Quinn) had already generated all Journey 2 E2E tests
- Verified 8 E2E tests map 1:1 to all 4 ACs
- Visual assertion gap assessed: AC1's "strikethrough + italic + dimmed" is tested at component level (TodoItem.test.tsx:38-43); E2E tests verify semantic state via aria-checked, which is the correct testing pyramid approach
- One flaky test observed: "completed state persists after page refresh" — timing between PATCH response and cache invalidation/refetch. Playwright auto-retry and CI retries config (retries: 2) handle this. Not a code bug.
- No files created or modified — all tests were pre-existing from QA automation
- Total E2E tests: 17 (9 Journey 1 + 8 Journey 2)
- Total frontend unit tests: 59

### Change Log

- 2026-04-10: Story 3.5 verified — all Journey 2 E2E tests confirmed against ACs, visual gap documented, 17/17 E2E + 59/59 unit pass
- 2026-04-10: Code review — 3 findings (2M, 1L): moved createAndWaitForTodo + uniqueText to shared helpers, hardened flaky persistence test with GET refetch wait. 17/17 E2E + 59/59 unit pass after fixes.

### File List

**Modified (code review fixes):**
- `bmad-todo/e2e/fixtures/test-helpers.ts` — added `uniqueText` and `createAndWaitForTodo` shared helpers
- `bmad-todo/e2e/tests/journey-returning-user.spec.ts` — removed local helpers, imported from shared; added GET refetch wait to persistence tests
- `bmad-todo/e2e/tests/journey-first-time-user.spec.ts` — removed local `uniqueText`, imported from shared
