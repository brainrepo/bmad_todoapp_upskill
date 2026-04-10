# Story 4.3: Error State & Error Notification

Status: done

## Story

As a user,
I want to see clear, calm error messages when something goes wrong,
So that I understand what happened without feeling alarmed.

## Acceptance Criteria (BDD)

1. **Given** the app loads and `GET /api/todos` fails (network error or server error)
   **When** the initial fetch fails
   **Then** the ErrorState component renders centered with "Something's not right" (1.25rem, weight 300, `text-secondary`) and a "Try again" text link in `accent` color

2. **Given** the ErrorState is displayed
   **When** the user clicks "Try again"
   **Then** a new `GET /api/todos` request is made
   **And** the loading state is shown during the retry

3. **Given** a mutation (create, complete, delete) fails after the list has loaded
   **When** the backend returns an error
   **Then** the ErrorNotification component appears fixed top-right with `surface` background, `border-left: 2px solid error`, and a brief message (e.g., "Task not saved — try again")
   **And** the notification auto-dismisses after 4 seconds
   **And** no manual dismiss button is shown

4. **Given** multiple mutations fail in sequence
   **When** a new error notification is triggered
   **Then** the latest notification replaces the previous one — no stacking

5. **Given** the ErrorState and ErrorNotification components are implemented
   **When** component tests are run
   **Then** error scenarios (initial load failure, retry, mutation error, auto-dismiss, replacement) pass

## Tasks / Subtasks

- [x] Task 1: Create ErrorState component with TDD (AC: #1, #2)
  - [x] 1.1: Write ErrorState tests FIRST — 5 tests (RED: module not found → GREEN: 5/5)
  - [x] 1.2: Create `ErrorState.tsx` with `onRetry` callback prop
  - [x] 1.3: Heading: "Something's not right" as `<h2>` with `text-xl font-light text-text-secondary`
  - [x] 1.4: Retry: `<button>` "Try again" with `text-sm text-accent hover:underline cursor-pointer mt-2`
  - [x] 1.5: Container: `text-center py-12`

- [x] Task 2: Integrate ErrorState into TodoList (AC: #1, #2)
  - [x] 2.1: Updated TodoList test — "renders nothing on error" → "renders ErrorState on error with retry" + refetch test
  - [x] 2.2: Import ErrorState in TodoList.tsx
  - [x] 2.3: Exposed `refetch` from `useTodos` hook
  - [x] 2.4: Replace `if (isError) return null` with `if (isError) return <ErrorState onRetry={refetch} />`
  - [x] 2.5: Updated all TodoList test mocks to include `refetch: mockRefetch`

- [x] Task 3: Create ErrorNotification component with TDD (AC: #3, #4)
  - [x] 3.1: Write ErrorNotification tests FIRST — 5 tests (RED → GREEN: 5/5)
  - [x] 3.2: Create `ErrorNotification.tsx` with `message: string | null` prop
  - [x] 3.3: Fixed position: `fixed top-4 right-4 z-50`
  - [x] 3.4: Styling: `bg-surface border-l-2 border-error px-4 py-3 rounded-r`
  - [x] 3.5: Renders nothing when `message` is null
  - [x] 3.6: ARIA: `role="alert"` `aria-live="polite"`
  - [x] 3.7: Animation: `transition-opacity duration-200 motion-reduce:transition-none`

- [x] Task 4: Create useErrorNotification hook (AC: #3, #4)
  - [x] 4.1: Write hook tests FIRST — 5 tests with `vi.useFakeTimers()` (RED → GREEN: 5/5)
  - [x] 4.2: Created `useErrorNotification` — `useState` + `useRef` timer + `useCallback` notify
  - [x] 4.3: Returns `{ errorMessage, notify }`, auto-clears after 4000ms
  - [x] 4.4: New `notify()` clears previous timer and starts fresh (replacement, no stacking)

- [x] Task 5: Wire ErrorNotification into App and mutation hooks (AC: #3, #4)
  - [x] 5.1: App.tsx — added `useErrorNotification`, renders `<ErrorNotification message={errorMessage} />`
  - [x] 5.2: Passed `notify` as `onError` prop to both TodoInput and TodoList
  - [x] 5.3: TodoList accepts `onError` prop, passes to `useToggleTodo(onError)` and `useDeleteTodo(onError)`
  - [x] 5.4: `useCreateTodo(onError)` — calls `onError?.('Task not saved — try again')`
  - [x] 5.5: `useToggleTodo(onError)` — calls `onError?.('Update failed — try again')`
  - [x] 5.6: `useDeleteTodo(onError)` — calls `onError?.('Couldn\'t delete — try again')`
  - [x] 5.7: TodoInput accepts `onError` prop, passes to `useCreateTodo(onError)`

- [x] Task 6: Run full regression suite (AC: #5)
  - [x] 6.1: Full frontend test suite — 92/92 pass across 12 test files
  - [x] 6.2: Zero regressions in TodoInput, TodoItem, EmptyState, LoadingState, App tests

## Dev Notes

### Architecture & Code Pattern Requirements

**Two distinct error surfaces — DO NOT confuse them:**

| | ErrorState | ErrorNotification |
|---|---|---|
| **When** | Initial `GET /api/todos` fails | Mutation (create/toggle/delete) fails |
| **Where** | Replaces list area (inside TodoList) | Fixed overlay top-right (inside App) |
| **Content** | "Something's not right" + "Try again" | Brief message like "Task not saved — try again" |
| **Dismiss** | User clicks "Try again" → retry | Auto-dismiss after 4 seconds |
| **Stacking** | N/A (single instance) | No stacking — latest replaces previous |

**ErrorState is simple** — presentational with `onRetry` prop, rendered by TodoList when `isError`.

**ErrorNotification is stateful** — needs a timer for auto-dismiss, message replacement logic, and a trigger mechanism from mutation hooks. The cleanest approach consistent with the architecture spec ("local UI state via `useState`"):

1. Create `useErrorNotification` hook — manages `message` state + 4s timer
2. Use it in `App.tsx` — renders `<ErrorNotification message={errorMessage} />`
3. Pass `notify` callback down to TodoList → mutation hooks via prop

**Why props instead of Context:** The app has exactly 1 prop-threading path (App → TodoList). Adding React Context for a single callback is over-engineering. If this were deeper nesting, Context would make sense. Keep it simple.

### UX Spec — Exact Styling

**ErrorState:**
```
Container: text-center py-12
Heading:   text-xl font-light text-text-secondary
Retry:     text-sm text-accent hover:underline cursor-pointer mt-2
```

**ErrorNotification:**
```
Position:  fixed top-4 right-4 z-50
Box:       bg-surface border-l-2 border-error px-4 py-3 rounded-r
Text:      text-sm text-text-primary
Animation: transition-opacity duration-200 motion-reduce:transition-none
ARIA:      role="alert" aria-live="polite"
```

**Error color token:** `--color-error: #c4756e` (warm terracotta)

### Hook Changes — `useTodos` needs `refetch`

`useTodos` returns `refetch` and `isFetching` from `useQuery` so ErrorState's "Try again" can trigger a retry and **LoadingState** can show while refetching after an error (TanStack Query v5 keeps `isLoading` false on retry).

```typescript
export function useTodos() {
  const { data: todos = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.TODOS,
    queryFn: getTodos,
  })
  return { todos, isLoading, isError, isFetching, refetch }
}
```

### Hook Changes — Mutation `onError` callbacks

The mutation hooks need to accept an `onError` notification callback. The pattern:

```typescript
export function useCreateTodo(onError?: (message: string) => void) {
  // ... existing code ...
  onError: (_err, _text, context) => {
    if (context?.previous) {
      queryClient.setQueryData(QUERY_KEYS.TODOS, context.previous)
    }
    onError?.('Task not saved — try again')
  },
}
```

Similarly for `useToggleTodo` and `useDeleteTodo` — add optional `onError` parameter.

### `useErrorNotification` Hook Design

```typescript
export function useErrorNotification() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setErrorMessage(message)
    timerRef.current = setTimeout(() => setErrorMessage(null), 4000)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return { errorMessage, notify }
}
```

### Files to CREATE (4 new files)

| File | Description |
|------|-------------|
| `frontend/src/components/ErrorState.tsx` | Error state with "Try again" retry |
| `frontend/src/components/ErrorNotification.tsx` | Fixed top-right error toast |
| `frontend/src/hooks/useErrorNotification.ts` | Hook managing notification state + timer |
| `frontend/src/__tests__/components/ErrorState.test.tsx` | ErrorState tests |
| `frontend/src/__tests__/components/ErrorNotification.test.tsx` | ErrorNotification tests |
| `frontend/src/__tests__/hooks/useErrorNotification.test.tsx` | Hook tests |

### Files to MODIFY

| File | Change |
|------|--------|
| `frontend/src/hooks/useTodos.ts` | Expose `refetch` from `useTodos`; add `onError` param to mutation hooks |
| `frontend/src/components/TodoList.tsx` | Import ErrorState, render on isError with refetch; accept `onError` prop for mutations |
| `frontend/src/components/App.tsx` | Add `useErrorNotification`, render ErrorNotification, pass `notify` to TodoList |
| `frontend/src/__tests__/components/TodoList.test.tsx` | Update error test, add onError prop |
| `frontend/src/__tests__/components/App.test.tsx` | Update for ErrorNotification rendering |
| `frontend/src/__tests__/hooks/useTodos.test.tsx` | Add refetch test, onError callback tests |

### Files NOT to touch

- All backend files
- `EmptyState.tsx`, `LoadingState.tsx` — no changes
- `TodoInput.tsx` — wire only: accepts `onError` and passes to `useCreateTodo` (create errors surface via mutation hook + notification)
- `TodoItem.tsx` — no changes
- `api/todos.ts` — no changes (error throwing already works)

### Testing Requirements

**ErrorState Tests:**
- Renders "Something's not right" heading with correct classes
- Renders "Try again" link with `text-accent` class
- Calls `onRetry` when "Try again" is clicked
- Container is centered (`text-center`)

**ErrorNotification Tests:**
- Renders message text when `message` is non-null
- Renders nothing when `message` is null
- Has `role="alert"` and `aria-live="polite"`
- Has correct styling classes (fixed, top-4, right-4, bg-surface, border-l-2, border-error)
- Auto-dismisses after 4 seconds (use `vi.useFakeTimers`)

**useErrorNotification Hook Tests:**
- `notify(message)` sets errorMessage state
- errorMessage clears after 4 seconds (fake timers)
- New `notify()` replaces previous message (no stacking)
- Timer cleanup on unmount

**TodoList Error Test Update:**
- "renders nothing on error" → "renders ErrorState on error with retry"
- Verify "Something's not right" and "Try again" visible on error

**Anti-patterns to AVOID:**
- Do NOT use React Context — prop-threading is sufficient for 1-level depth
- Do NOT add Zustand/Jotai — architecture says `useState`
- Do NOT add a dismiss button — UX spec explicitly says no manual dismiss
- Do NOT stack notifications — latest replaces previous
- Do NOT add optimistic update rollback in this story — that's Story 4.4

### Previous Story Intelligence

**From Story 4.1/4.2 (EmptyState/LoadingState):**
- Presentational component pattern: pure, minimal props
- TodoList conditional rendering: `isLoading → LoadingState`, `isError → ErrorState`, `empty → EmptyState`
- Test pattern: `render()` directly, `screen.getByText()`, `toHaveClass()`
- Code review lesson: use `<h2>` for headings (ErrorState heading should be `<h2>`)

**From Story 3.3/3.4 (Toggle/Delete UI):**
- Mutation hooks: `useToggleTodo`, `useDeleteTodo` use `onSettled` only
- `useCreateTodo` has `onError` for cache rollback but no UI notification

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 4.3: Error State & Error Notification`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas

### Scope Boundaries

- **Optimistic update rollback** — Story 4.4 (this story adds the error notification trigger, 4.4 adds the optimistic cache manipulation)
- **E2E error tests** — Story 4.5
- **ARIA enhancements** — Story 5.3 (basic role="alert" added here)

### Library & Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| `react` | ^19.x | `useState`, `useEffect`, `useRef`, `useCallback` |
| `@testing-library/react` | (installed) | Component + hook tests |
| `vitest` | ^4.x | Tests, `vi.useFakeTimers()` for auto-dismiss |

**IMPORTANT:** Do NOT install any new dependencies.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] — acceptance criteria (5 ACs, verified 1:1)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ErrorState] — "Something's not right", "Try again" link, 1.25rem weight 300
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ErrorNotification] — fixed top-right, surface bg, border-left error, auto-dismiss 4s, no stacking
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Patterns] — local UI state via useState, onError callbacks
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — non-disruptive inline error notification
- [Source: _bmad-output/planning-artifacts/prd.md#FR18,FR21] — non-disruptive error messages, appropriate error responses
- [Source: bmad-todo/frontend/src/hooks/useTodos.ts] — current mutation hooks, need onError + refetch
- [Source: bmad-todo/frontend/src/components/App.tsx] — ErrorNotification placement
- [Source: bmad-todo/frontend/src/components/TodoList.tsx:12] — current error guard to replace
- [Source: bmad-todo/frontend/src/app.css:11] — --color-error: #c4756e

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase ErrorState: module not found → GREEN: 5/5
- RED phase ErrorNotification: module not found → GREEN: 5/5
- RED phase useErrorNotification: module not found → GREEN: 5/5
- RED phase TodoList error test: "Something's not right" not found → GREEN: 10/10
- Full regression suite: 92/92 pass across 12 test files

### Completion Notes List

- Created `ErrorState.tsx` — `<h2>` heading "Something's not right" + `<button>` "Try again" with `onRetry` prop
- Created `ErrorNotification.tsx` — fixed top-right overlay, `bg-surface border-l-2 border-error`, `role="alert"`, renders nothing when message is null
- Created `useErrorNotification` hook — `useState` + `useRef` timer + `useCallback` notify, 4s auto-dismiss, replacement (no stacking)
- Updated `useTodos` to expose `refetch` for ErrorState retry
- Updated `useCreateTodo`, `useToggleTodo`, `useDeleteTodo` — added optional `onError` callback parameter for notification trigger
- Updated `TodoList` — renders ErrorState on isError with refetch, accepts `onError` prop for mutation hooks
- Updated `TodoInput` — accepts `onError` prop, passes to `useCreateTodo`
- Updated `App` — uses `useErrorNotification`, renders `<ErrorNotification>`, passes `notify` as `onError` to TodoInput and TodoList
- Error messages: "Task not saved — try again" (create), "Update failed — try again" (toggle), "Couldn't delete — try again" (delete)
- 16 new tests: 5 ErrorState + 5 ErrorNotification + 5 useErrorNotification + 1 TodoList refetch
- TDD Red-Green-Refactor followed for all 4 creation tasks
- `TodoList` shows `LoadingState` when `isError && isFetching` (retry after failed initial load)
- Code review: mutation `onError` callback coverage added in `useTodos.test.tsx` (create/toggle/delete)
- Total frontend tests: 92

### Change Log

- 2026-04-10: Story 4.3 implemented — ErrorState, ErrorNotification, useErrorNotification with TDD, 16 new tests, 87/87 pass
- 2026-04-10: Code review — `isFetching` retry loading, `onError` message tests, story File List + counts synced, status → done

### File List

**Created:**
- `bmad-todo/frontend/src/components/ErrorState.tsx` — error state with retry
- `bmad-todo/frontend/src/components/ErrorNotification.tsx` — fixed top-right error toast
- `bmad-todo/frontend/src/hooks/useErrorNotification.ts` — notification state + 4s timer
- `bmad-todo/frontend/src/__tests__/components/ErrorState.test.tsx` — 5 tests
- `bmad-todo/frontend/src/__tests__/components/ErrorNotification.test.tsx` — 5 tests
- `bmad-todo/frontend/src/__tests__/hooks/useErrorNotification.test.tsx` — 5 tests

**Modified:**
- `bmad-todo/frontend/src/hooks/useTodos.ts` — exposed refetch, isFetching, added onError param to all mutation hooks
- `bmad-todo/frontend/src/components/TodoList.tsx` — ErrorState on error, LoadingState on error+refetch, accepts onError prop
- `bmad-todo/frontend/src/components/TodoInput.tsx` — accepts onError prop, passes to useCreateTodo
- `bmad-todo/frontend/src/components/App.tsx` — uses useErrorNotification, renders ErrorNotification, passes notify
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` — error state, refetch, loading-while-retry mocks
- `bmad-todo/frontend/src/__tests__/components/App.test.tsx` — shell smoke tests (title/subtitle)
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` — refetch-after-error, isFetching, mutation `onError` message tests
