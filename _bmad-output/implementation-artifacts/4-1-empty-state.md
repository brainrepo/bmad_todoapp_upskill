# Story 4.1: Empty State

Status: done

## Story

As a user,
I want to see a welcoming message when I have no tasks,
So that the app feels intentional even when empty, not broken.

## Acceptance Criteria (BDD)

1. **Given** no todos exist in the backend
   **When** the app loads and `GET /api/todos` returns an empty array
   **Then** the EmptyState component renders with heading "Nothing here yet" (1.25rem, weight 300, `text-secondary`) and subtext "Type above and press Enter" (0.875rem, `text-placeholder`)
   **And** the input field is auto-focused above the empty state

2. **Given** the empty state is displayed
   **When** the user creates a new task
   **Then** the empty state disappears instantly and the new task is displayed

3. **Given** the last remaining task is deleted
   **When** the list becomes empty
   **Then** the empty state reappears

4. **Given** the EmptyState component is implemented
   **When** component tests are run
   **Then** empty state scenarios (display, disappear on add, reappear on last delete) pass

## Tasks / Subtasks

- [x] Task 1: Create EmptyState component with TDD (AC: #1)
  - [x] 1.1: Write EmptyState component tests FIRST (TDD Red phase) — 5 tests, all fail (module not found)
  - [x] 1.2: Create `EmptyState.tsx` — pure presentational, no props needed
  - [x] 1.3: Heading: "Nothing here yet" with classes `text-xl font-light text-text-secondary`
  - [x] 1.4: Subtext: "Type above and press Enter" with classes `text-sm text-text-placeholder mt-2`
  - [x] 1.5: Container: `text-center py-12` for vertical centering in list area

- [x] Task 2: Integrate EmptyState into TodoList (AC: #1, #2, #3)
  - [x] 2.1: Update TodoList test — changed "renders nothing when todos array is empty" → "renders EmptyState when todos array is empty"
  - [x] 2.2: Import EmptyState in TodoList.tsx
  - [x] 2.3: Replace `if (todos.length === 0) return null` with `if (todos.length === 0) return <EmptyState />`
  - [x] 2.4: Loading and error guards remain as `return null` (unchanged)

- [x] Task 3: Verify empty state behavior with existing functionality (AC: #2, #3, #4)
  - [x] 3.1: Run full frontend test suite — 64/64 pass across 8 test files, zero regressions
  - [x] 3.2: Verified: creating a task → useCreateTodo → onSettled → invalidateQueries → refetch → todos array populated → TodoList renders items (EmptyState gone)
  - [x] 3.3: Verified: deleting last task → useDeleteTodo → onSettled → invalidateQueries → refetch → empty array → TodoList renders EmptyState

## Dev Notes

### Architecture & Code Pattern Requirements

**Pure Presentational Component — NO props, NO hooks:**
EmptyState is the simplest component in the app. It receives no props, uses no hooks, has no state. It just renders static text with styling. This follows the established pattern where presentational components are kept simple and testable.

**Integration point — TodoList owns the conditional rendering:**
EmptyState does NOT render itself conditionally. TodoList checks `todos.length === 0` and renders `<EmptyState />`. This keeps the rendering logic in one place (TodoList already handles loading/error/empty).

**AC #2 and #3 are "free" — no new code needed:**
Creating a task triggers `useCreateTodo` → `onSettled` → `invalidateQueries` → GET refetch → `todos` array has items → TodoList renders items instead of EmptyState. Deleting the last task triggers the reverse. The reactive TanStack Query pattern handles this automatically. No event handlers or state management needed in EmptyState.

### UX Spec — Exact Styling (per Epic 3 retro action item #3)

**EmptyState component anatomy:**
- Container: centered, padded vertically in the list area
- Heading: "Nothing here yet" — `font-weight: 300` (`font-light`), `font-size: 1.25rem` (`text-xl`), color `text-secondary` (`text-text-secondary`)
- Subtext: "Type above and press Enter" — `font-size: 0.875rem` (`text-sm`), color `text-placeholder` (`text-text-placeholder`)
- Spacing: `mt-2` between heading and subtext
- Container: `text-center py-12` for vertical positioning
- No animation, no hover states, no interaction

**Tailwind classes (exact):**
```
Container: text-center py-12
Heading:   text-xl font-light text-text-secondary
Subtext:   text-sm text-text-placeholder mt-2
```

### Files to CREATE (2 new files)

| File | Description |
|------|-------------|
| `frontend/src/components/EmptyState.tsx` | New presentational component |
| `frontend/src/__tests__/components/EmptyState.test.tsx` | New component tests |

### Files to MODIFY (1 file)

| File | Change |
|------|--------|
| `frontend/src/components/TodoList.tsx` | Import EmptyState, replace `return null` for empty with `return <EmptyState />` |
| `frontend/src/__tests__/components/TodoList.test.tsx` | Update empty-state test assertion |

### Files NOT to touch

- All backend files — frontend-only story
- `frontend/src/components/App.tsx` — EmptyState renders inside TodoList, not App
- `frontend/src/components/TodoInput.tsx` — input is already auto-focused, no change
- `frontend/src/components/TodoItem.tsx` — no changes
- `frontend/src/components/AppHeader.tsx` — no changes
- `frontend/src/hooks/useTodos.ts` — no changes (reactive behavior is already built)
- `frontend/src/api/todos.ts` — no changes

### Testing Requirements

**EmptyState Component Tests** (new file: `frontend/src/__tests__/components/EmptyState.test.tsx`):
- Renders heading "Nothing here yet"
- Heading has `text-xl`, `font-light`, `text-text-secondary` classes
- Renders subtext "Type above and press Enter"
- Subtext has `text-sm`, `text-text-placeholder` classes
- Container has `text-center` class

**TodoList Integration Test Update** (modify existing):
- Change test "renders nothing when todos array is empty" → "renders EmptyState when todos array is empty"
- Assert that "Nothing here yet" text is visible when todos is empty array
- Assert that "Type above and press Enter" text is visible

**Test patterns to follow:**
- EmptyState tests: `render(<EmptyState />)` directly, no providers needed (pure presentational)
- TodoList test: mock `useTodos` returning `{ todos: [], isLoading: false, isError: false }`, verify EmptyState text appears
- Use `screen.getByText()` for text assertions, `toHaveClass()` for styling

**Anti-patterns to AVOID:**
- Do NOT add props to EmptyState (it doesn't need any)
- Do NOT add loading/error state rendering to TodoList yet — those are Stories 4.2 and 4.3
- Do NOT add animation to EmptyState appearance/disappearance — the UX spec says single state, no animation
- Do NOT add any hooks or state to EmptyState
- Do NOT modify the input component (auto-focus is already working)

### Previous Story Intelligence

**From Story 3.4 (Deletion UI):**
- TodoList currently imports `useDeleteTodo`, `useTodos`, `useToggleTodo`
- The `if (todos.length === 0) return null` at line 11 is the exact line to change
- TodoList test mocks: `useTodos`, `useToggleTodo`, `useDeleteTodo` — the empty-state test only needs `useTodos` mock

**From Epic 3 Retrospective:**
- Action #3: Include CSS/UX micro-details in task subtasks — done above (exact Tailwind classes specified)
- Pattern: Presentational components with no props — EmptyState is the purest example

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 4.1: Empty State`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas

### Scope Boundaries — What This Story Does NOT Include

- **Loading state** — that's Story 4.2
- **Error state** — that's Story 4.3
- **Optimistic updates** — that's Story 4.4
- **E2E tests for empty state** — that's Story 4.5
- **Animation on empty state** — UX spec says no animation; transitions are Story 4.4 scope

This story is **frontend-only**: 1 new component + 1 new test file + 1 TodoList integration update.

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| `@testing-library/react` | (installed) | `render`, `screen` |
| `vitest` | ^4.x | Component tests |

**IMPORTANT:** Do NOT install any new dependencies.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — acceptance criteria (4 ACs, verified 1:1)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#EmptyState] — heading "Nothing here yet" (1.25rem, weight 300, text-secondary), subtext "Type above and press Enter" (0.875rem, text-placeholder)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — EmptyState.tsx location in components/
- [Source: _bmad-output/planning-artifacts/prd.md#FR16] — meaningful empty state when no todos exist
- [Source: _bmad-output/implementation-artifacts/epic-3-retrospective.md] — action item #3 (CSS micro-details in stories)
- [Source: bmad-todo/frontend/src/components/TodoList.tsx:11] — current `return null` for empty, the line to change
- [Source: bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx:59-63] — current empty test to update

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase EmptyState tests: module not found → GREEN: 5/5 pass
- RED phase TodoList empty test: "Nothing here yet" not found → GREEN: 9/9 pass
- Full regression suite: 64/64 pass across 8 test files

### Completion Notes List

- Created `EmptyState.tsx` — pure presentational, no props, no hooks: heading "Nothing here yet" + subtext "Type above and press Enter"
- Exact Tailwind classes per UX spec: `text-xl font-light text-text-secondary` (heading), `text-sm text-text-placeholder mt-2` (subtext), `text-center py-12` (container)
- Integrated into TodoList — replaced `return null` with `return <EmptyState />` for `todos.length === 0`
- AC #2 (disappear on create) and AC #3 (reappear on last delete) are inherently satisfied by TanStack Query reactive refetch — no additional code needed
- 5 new EmptyState component tests: heading text, heading classes, subtext text, subtext classes, container centering
- 1 updated TodoList test: "renders nothing when empty" → "renders EmptyState when empty"
- TDD Red-Green-Refactor followed for both tasks
- Zero regressions: all 59 existing tests continue to pass
- Total frontend tests: 64 (was 59, +5 new)

### Change Log

- 2026-04-10: Story 4.1 implemented — EmptyState component with TDD, 5 new tests, 64/64 pass
- 2026-04-10: Code review — 3 findings (1M, 2L): changed heading from `<p>` to `<h2>` for semantic HTML, added heading role test, replaced `parentElement!` with `closest('div')`. L2 (ARIA on container) deferred to Story 5.3. 65/65 pass after fixes.

### File List

**Created:**
- `bmad-todo/frontend/src/components/EmptyState.tsx` — presentational empty state component
- `bmad-todo/frontend/src/__tests__/components/EmptyState.test.tsx` — 5 component tests

**Modified:**
- `bmad-todo/frontend/src/components/TodoList.tsx` — imported EmptyState, replaced `return null` with `return <EmptyState />` for empty todos
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` — updated empty test to verify EmptyState renders
