# Story 4.2: Loading State

Status: done

## Story

As a user,
I want to see a calm loading indicator while my tasks are being fetched,
So that I know the app is working even on slow connections.

## Acceptance Criteria (BDD)

1. **Given** the app is loading and `GET /api/todos` has not yet responded
   **When** the page renders
   **Then** the LoadingState component displays "Loading..." centered in the list area (0.875rem, `text-placeholder`)

2. **Given** the `GET /api/todos` request completes successfully
   **When** data is received
   **Then** the loading state is replaced by the todo list (or empty state)

3. **Given** the LoadingState is displayed
   **When** the loading state is visible
   **Then** no spinner, no progress bar, no skeleton screen is shown — text only

4. **Given** the LoadingState component is implemented
   **When** component tests are run
   **Then** loading scenarios (display during fetch, replace on completion) pass

## Tasks / Subtasks

- [x] Task 1: Create LoadingState component with TDD (AC: #1, #3)
  - [x] 1.1: Write LoadingState component tests FIRST — 6 tests, all fail (module not found)
  - [x] 1.2: Create `LoadingState.tsx` — pure presentational, no props
  - [x] 1.3: Text: "Loading..." with classes `text-sm text-text-placeholder`
  - [x] 1.4: Container: `text-center py-12` with `aria-live="polite"` and `aria-busy="true"`
  - [x] 1.5: Uses `<p>` element — status text, not a heading

- [x] Task 2: Integrate LoadingState into TodoList (AC: #1, #2)
  - [x] 2.1: Update TodoList test — "renders nothing when loading" → "renders LoadingState when loading"
  - [x] 2.2: Import LoadingState in TodoList.tsx
  - [x] 2.3: Replace `if (isLoading) return null` with `if (isLoading) return <LoadingState />`
  - [x] 2.4: Error guard remains as `return null` (Story 4.3)

- [x] Task 3: Run full regression suite (AC: #4)
  - [x] 3.1: Run full frontend test suite — 71/71 pass across 9 test files, zero regressions
  - [x] 3.2: Verified: AC #2 inherently satisfied — TanStack Query transitions isLoading → data → TodoList re-renders with items or EmptyState

## Dev Notes

### Architecture & Code Pattern Requirements

**Mirror EmptyState exactly** — LoadingState follows the identical pattern:
- Pure presentational, no props, no hooks, no state
- TodoList owns conditional rendering
- AC #2 (replaced by list/empty) is "free" — TanStack Query reactive state handles it

**Key difference from EmptyState:**
- Single text element (no heading + subtext pair)
- Uses `<p>` not `<h2>` — "Loading..." is status text, not a section heading (lesson from Story 4.1 code review)
- Requires ARIA attributes: `aria-live="polite"` and `aria-busy="true"` on the container (UX spec line 760, epics AC for Story 5.3 but the UX spec includes it in LoadingState design)

### UX Spec — Exact Styling

**LoadingState component anatomy:**
- Container: `text-center py-12` with `aria-live="polite"` `aria-busy="true"`
- Text: "Loading..." — `font-size: 0.875rem` (`text-sm`), color `text-placeholder` (`text-text-placeholder`)
- No spinner, no progress bar, no skeleton screen
- No animation, no pulsing

**Tailwind classes (exact):**
```
Container: text-center py-12
Text:      text-sm text-text-placeholder
```

### Files to CREATE (2 new files)

| File | Description |
|------|-------------|
| `frontend/src/components/LoadingState.tsx` | New presentational component |
| `frontend/src/__tests__/components/LoadingState.test.tsx` | New component tests |

### Files to MODIFY (1 file)

| File | Change |
|------|--------|
| `frontend/src/components/TodoList.tsx` | Import LoadingState, replace `return null` for loading with `return <LoadingState />` |
| `frontend/src/__tests__/components/TodoList.test.tsx` | Update loading test assertion |

### Files NOT to touch

- All backend files
- `EmptyState.tsx` / `EmptyState.test.tsx` — no changes
- `App.tsx`, `TodoInput.tsx`, `TodoItem.tsx`, `AppHeader.tsx` — no changes
- `hooks/useTodos.ts`, `api/todos.ts` — no changes

### Testing Requirements

**LoadingState Component Tests** (new file):
- Renders "Loading..." text
- Text has `text-sm` and `text-text-placeholder` classes
- Container has `text-center` class
- Container has `aria-live="polite"` attribute
- Container has `aria-busy="true"` attribute
- Does NOT contain any `<svg>`, `<img>`, or spinner elements (AC #3)

**TodoList Integration Test Update:**
- Change "renders nothing when loading" → "renders LoadingState when loading"
- Assert "Loading..." text visible when `isLoading: true`

**Test patterns:**
- LoadingState: `render(<LoadingState />)` directly, no providers
- Use `screen.getByText()` for text, `toHaveAttribute()` for ARIA
- Mirror EmptyState test structure

**Anti-patterns to AVOID:**
- Do NOT add props to LoadingState
- Do NOT add error state rendering — that's Story 4.3
- Do NOT add animation or pulsing
- Do NOT use `<h2>` — "Loading..." is status text, use `<p>`

### Previous Story Intelligence

**From Story 4.1 (Empty State):**
- Pure presentational pattern: no props, no hooks, `text-center py-12` container
- Code review: `<p>` → `<h2>` for EmptyState heading. LoadingState uses `<p>` intentionally — it's status text, not a heading.
- Code review: replaced `parentElement!` with `closest('div')` — use same safe pattern
- Total frontend tests after 4.1: 65

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 4.2: Loading State`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas

### Scope Boundaries

- **Empty state** — Story 4.1 (done)
- **Error state** — Story 4.3
- **Optimistic updates** — Story 4.4
- **E2E tests** — Story 4.5
- **ARIA enhancements beyond aria-live/busy** — Story 5.3

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| `@testing-library/react` | (installed) | `render`, `screen` |
| `vitest` | ^4.x | Component tests |

**IMPORTANT:** Do NOT install any new dependencies.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — acceptance criteria (4 ACs, verified 1:1)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#LoadingState] — "Loading..." text only, 0.875rem, text-placeholder, no spinner
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] — aria-live="polite", aria-busy="true" on loading region
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — LoadingState.tsx location
- [Source: _bmad-output/planning-artifacts/prd.md#FR17] — loading indicator while fetching
- [Source: _bmad-output/implementation-artifacts/4-1-empty-state.md] — EmptyState pattern to mirror, code review lessons
- [Source: bmad-todo/frontend/src/components/TodoList.tsx:10] — current `return null` for loading
- [Source: bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx:50-54] — current loading test to update

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase LoadingState tests: module not found → GREEN: 6/6 pass
- RED phase TodoList loading test: "Loading..." not found → GREEN: 9/9 pass
- Full regression suite: 71/71 pass across 9 test files

### Completion Notes List

- Created `LoadingState.tsx` — pure presentational, no props: "Loading..." text with `text-sm text-text-placeholder`
- Container has `aria-live="polite"` and `aria-busy="true"` for screen reader support
- Uses `<p>` not `<h2>` — "Loading..." is status text, not a heading (lesson from Story 4.1 code review)
- Integrated into TodoList — replaced `return null` with `return <LoadingState />` for `isLoading`
- AC #2 (replaced by list/empty) inherently satisfied by TanStack Query reactive state
- 6 new LoadingState tests: text, styling, centering, aria-live, aria-busy, no spinner elements
- 1 updated TodoList test: "renders nothing when loading" → "renders LoadingState when loading"
- TDD Red-Green-Refactor followed
- Zero regressions: all 65 existing tests continue to pass
- Total frontend tests: 71 (was 65, +6 new)

### Change Log

- 2026-04-10: Story 4.2 implemented — LoadingState component with TDD, 6 new tests, 71/71 pass
- 2026-04-10: Code review — 1 finding (1L): test DRY suggestion, accepted as-is. 0 fixes needed. 71/71 pass.

### File List

**Created:**
- `bmad-todo/frontend/src/components/LoadingState.tsx` — presentational loading state component
- `bmad-todo/frontend/src/__tests__/components/LoadingState.test.tsx` — 6 component tests

**Modified:**
- `bmad-todo/frontend/src/components/TodoList.tsx` — imported LoadingState, replaced `return null` with `return <LoadingState />` for isLoading
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` — updated loading test to verify LoadingState renders
