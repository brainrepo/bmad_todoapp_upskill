# Epic 2 Retrospective: Task Capture & Display

Date: 2026-03-07
Facilitator: Bob (Scrum Master)
Participants: Alice (PO), Charlie (Senior Dev), Dev Agent (Claude Opus 4.6)

## Delivery Summary

| Metric | Value |
|--------|-------|
| Stories Completed | 5/5 |
| Total Tests | 67 (34 frontend unit + 24 backend unit + 9 E2E) |
| Code Review Issues Found | 12 across 3 reviews |
| Critical (H) Issues | 2 |
| Medium (M) Issues | 8 |
| Low (L) Issues | 2 |
| All Issues Fixed | Yes (automatic fix chosen each time) |

## Story-by-Story Analysis

| Story | Tests Added | CR Issues | Key Patterns |
|-------|-------------|-----------|--------------|
| 2.1 Create Todo API | 15 (4 unit + 7 integration + 4 existing) | H1, M2-M4 | TDD, snake-to-camel mapping, parameterized SQL |
| 2.2 List Todos API | 9 new (24 total) | M1-M3, L1 | Extracted mapTodoRow DRY helper, self-contained test instances |
| 2.3 Task Input UI | 16 new (2 API + 3 hook + 9 component + 2 existing) | M1-M3 | Optimistic updates, Tailwind v4 @theme tokens |
| 2.4 Task List Display | 12 new (34 total FE) | H1, M1-M2 | Hook mocking, UX spec pixel compliance |
| 2.5 E2E Verification | 9 E2E (67 total) | M1-M3 | uniqueText() pattern, waitForResponse timing, request interception |

## What Went Well

1. **TDD discipline was maintained** -- every story followed Red-Green-Refactor. Zero regressions across all 5 stories.

2. **Code reviews caught real issues** -- the timestamp font size mismatch (H1 in 2.4) would have been a UX spec deviation in production. The waitForTimeout anti-pattern (M1 in 2.5) would have caused flaky CI.

3. **Architectural boundaries held** -- no SQL leaked into route handlers, no direct API calls from components, no useQuery in components. The layered approach made each story additive.

4. **Optimistic updates worked first try** -- the TanStack Query onMutate/onError/onSettled pattern was well-specified in the story files, leading to clean implementation.

5. **E2E test patterns matured** -- the uniqueText() helper and waitForResponse-before-action pattern are reusable across Epic 3's E2E tests.

## What Could Be Improved

1. **E2E database state management** -- Story 2.5 hit significant issues with accumulated state between test runs. The uniqueText() pattern works but a proper test database reset mechanism would be cleaner. Action for Epic 3: Consider adding a DELETE /api/todos (clear all) endpoint for test cleanup, or use a test-specific database file.

2. **Code review findings were repetitive** -- similar issues appeared across stories (Content-Type assertions, test isolation, fragile selectors). Action: These patterns should be documented so they're caught during implementation, not review.

3. **Story specs had minor UX discrepancies** -- the timestamp font size was specified as 0.75rem in the story but 0.6875rem in the UX spec. Action: Story creation should cross-reference UX spec values more carefully.

4. **No commits between stories** -- all 5 stories were implemented in sequence without git commits. Action for Epic 3: Commit after each story completion for better traceability.

## Patterns to Carry Forward to Epic 3

| Pattern | Source | Reuse In |
|---------|--------|----------|
| mapTodoRow helper | Story 2.2 | Story 3.1 (PATCH returns updated todo) |
| Optimistic update shape | Story 2.3 | Stories 3.3, 3.4 (toggle/delete mutations) |
| uniqueText() E2E helper | Story 2.5 | Story 3.5 (lifecycle E2E) |
| waitForResponse before action | Story 2.5 | Story 3.5 |
| Request interception for "nothing happens" | Story 2.5 | Story 4.5 (edge case E2E) |
| Dynamic mock (vi.fn() with mockReturnValue) | Story 2.4 CR | Stories 3.3, 3.4 (component tests) |

## Epic 3 Preview & Risks

1. **Toggle click handler on TodoItem** -- currently role="checkbox" exists but no onClick. Adding it needs careful accessibility (Space/Enter should also toggle -- but that's Epic 5).

2. **Delete button visibility** -- hover on desktop, always visible on mobile. The lg: breakpoint logic needs careful implementation.

3. **Fade-out animation on delete** -- 200ms CSS transition that removes DOM element after animation. Need to handle timing between optimistic removal and animation completion.

4. **E2E test complexity** -- Story 3.5 needs to test toggle + untoggle + delete + persistence. More complex journeys than Epic 2.

## Key Takeaway

Architecture and TDD practices are solid. For Epic 3, focus on committing after each story and being more precise with UX spec values in story creation.
