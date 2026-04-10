# Epic 3 Retrospective: Task Lifecycle Management

Date: 2026-04-10
Facilitator: Bob (Scrum Master)
Participants: Alice (PO), Charlie (Senior Dev), Quinn (QA Engineer), Brainrepo (Project Lead)

## Delivery Summary

| Metric | Value |
|--------|-------|
| Stories Completed | 5/5 (100%) |
| Backend Tests | 24 → 49 (+25 new) |
| Frontend Tests | 34 → 59 (+25 new) |
| E2E Tests | 9 → 17 (+8 new) |
| Total Tests | 67 → 125 (+58 new) |
| Code Review Findings | 25 across 5 reviews (0 Critical, 18M, 7L) |
| All Issues Resolved | Yes (21 fixed, 2 deferred with documented rationale) |
| Regressions | Zero |
| TDD Discipline | 100% Red-Green-Refactor |

## Epic 2 Retro Action Item Follow-Through

| Action Item | Status | Evidence |
|-------------|--------|----------|
| Commit after each story | ✅ Completed | Stories committed individually (git log shows separate commits per story) |
| Document repetitive CR patterns | ⏳ Partial | CLAUDE.md improved with AC fidelity mandate, but reviews still found 3-6 issues/story |
| Cross-reference UX spec values in stories | ✅ Completed | 1:1 AC verification became standard practice; no dropped ACs in Epic 3 |
| E2E database state management | ✅ Completed | uniqueText() pattern carried forward, shared helpers consolidated in test-helpers.ts |

## Story-by-Story Analysis

| Story | Tests Added | CR Issues | Key Patterns |
|-------|-------------|-----------|--------------|
| 3.1 Toggle API | 14 new (38 total BE) | 6 (3M, 3L) | Reused mapTodoRow, RETURNING clause, shared schema extraction |
| 3.2 Delete API | 11 new (49 total BE) | 5 (3M, 2L) | 204 No Content handling, todoIdParamsSchema consolidation, Postman MCP validation |
| 3.3 Toggle UI | 12 new (47 total FE) | 5 (2M, 3L) | Presentational component + onToggle callback prop, select-none, tabIndex |
| 3.4 Deletion UI | 12 new (59 total FE) | 6 (4M, 2L) | stopPropagation for nested elements, pr-14 padding fix, responsive × visibility |
| 3.5 E2E Tests | 8 new (17 total E2E) | 3 (2M, 1L) | QA-first generation, shared helper consolidation, flaky test hardening |

## What Went Well

1. **TDD discipline was perfect** — every story followed Red-Green-Refactor across all layers (API, hooks, components, E2E). Zero regressions across 125 tests throughout the epic.

2. **AC fidelity mandate worked** — the CLAUDE.md instruction from Epic 2's lesson prevented dropped ACs. Every story had 1:1 verification against the epics source. No ACs were lost in the pipeline.

3. **QA steps baked into epic ACs** — Postman MCP validation ACs in Stories 3.1 and 3.2 forced API contract verification against the architecture spec. Not just "does it work" but "does it match the contract." Newman CLI provided concrete proof (9/9 assertions in 3.2).

4. **QA-first test generation** — Quinn generated Journey 2 E2E tests before Story 3.5 formally ran. The dev story became lightweight verification instead of build-from-scratch. Efficient pattern worth repeating.

5. **Code reviews caught real issues every time** — 25 findings across 5 reviews. Highlights: stopPropagation for nested interactive elements (would've been a production bug), pr-14 padding fix (text overlap with × button), cursor-pointer on delete button, flaky test hardening.

6. **Layered testing strategy matured** — component tests verify CSS classes, E2E tests verify semantic state (aria-checked) + persistence. No duplication, clear responsibilities at each layer.

## What Could Be Improved

1. **Dev/QA overlap on E2E stories** — Story 3.5 was essentially done by Quinn (QA) before the dev agent touched it. The dev-story verification pass felt ceremonial. Recommendation: QA owns E2E stories directly in Epic 4.

2. **Code review finding volume too high** — 25 findings across 5 stories means quality issues aren't caught early enough. Patterns like missing cursor-pointer, padding for absolute elements, and import styles should be specified in story creation, not discovered in review.

3. **Flaky E2E test pattern** — cache invalidation timing (PATCH response → onSettled → invalidateQueries → GET refetch → re-render) creates a gap between "server confirmed" and "UI updated." Hardened with GET refetch wait, but this needs a standard helper for Epic 4's optimistic update tests.

4. **ARIA nesting deferred** — `<button>` inside `<li role="checkbox">` is technically invalid. Deferred to Epic 5.3, but building more features on this structure increases the restructuring cost later.

5. **Fade-out animation gap** — AC3 of Story 3.4 says "fade-out animation (~200ms)" but implementation removes the element instantly on re-render. Correctly deferred to Story 4.4 (optimistic updates), but the AC is partially unmet.

## Action Items for Epic 4

| # | Action | Owner | Rationale |
|---|--------|-------|-----------|
| 1 | QA owns E2E story directly — Story 4.5 goes to Quinn, not through dev-story | Quinn / Bob | Eliminates dev/QA overlap from Story 3.5 |
| 2 | Add `waitForMutationAndRefetch` E2E helper — waits for mutation response AND subsequent GET refetch | Charlie / Quinn | Prevents flaky test pattern in Epic 4 optimistic tests |
| 3 | Story creation includes CSS/UX micro-details in task subtasks | Bob | Push quality left; reduce code review finding volume |
| 4 | Plan TodoItem restructure for Epic 5 — resolve role="checkbox" + nested button ARIA violation | Charlie | Deferred from 3.4, will cascade through component tests |
| 5 | Continue commit-per-story practice | All | Confirmed working in Epic 3 |

## Patterns to Carry Forward to Epic 4

| Pattern | Source | Reuse In |
|---------|--------|----------|
| `stopPropagation` for nested interactive elements | Story 3.4 | Any compound click handlers |
| `useDeleteTodo` / `useToggleTodo` hook structure (onSettled only) | Stories 3.3, 3.4 | Story 4.4 adds onMutate/onError to these hooks |
| Shared E2E helpers (createAndWaitForTodo, toggleTodo, deleteTodo) | Story 3.5 | Story 4.5 E2E edge cases |
| Presentational component + callback props | Stories 3.3, 3.4 | EmptyState, LoadingState, ErrorNotification components |
| QA-first test generation | Story 3.5 | Story 4.5 owned by Quinn directly |
| 1:1 AC fidelity verification | CLAUDE.md mandate | All stories |
| Layered testing: component → CSS, E2E → semantic + persistence | Story 3.5 gap analysis | All UI stories |

## Epic 4 Preview & Risks

1. **Optimistic updates complexity** — Story 4.4 adds onMutate/onError/onSettled to existing hooks. The hooks are ready (simple onSettled structure), but the optimistic pattern requires careful cache manipulation and rollback logic.

2. **Error notification component** — Story 4.3 introduces ErrorNotification (fixed top-right, auto-dismiss 4s, no stacking). This is the first component with time-based behavior — timer tests need careful mocking.

3. **Empty/Loading states** — Stories 4.1 and 4.2 are simpler (presentational components), but they interact with TanStack Query's isLoading/isError states which TodoList currently handles by returning null.

4. **E2E for error scenarios** — Story 4.5 needs to simulate backend failures in E2E tests. Playwright route interception (page.route) will be needed to mock API errors.

## Key Takeaway

Epic 3 was clean — 100% delivery, zero regressions, 58 new tests, strong TDD. The main process improvements for Epic 4: QA owns E2E stories directly, push UX micro-details into story creation to reduce code review churn, and standardize E2E helpers for mutation+refetch timing.
