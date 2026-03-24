# Story 3.3: Task Completion Toggle UI

Status: done

## Story

As a user,
I want to click anywhere on a task to mark it complete (or toggle it back to active),
So that I feel a sense of accomplishment with a satisfying visual transition.

## Acceptance Criteria (BDD)

1. **Given** an active todo is displayed in the list
   **When** the user clicks/taps anywhere on the task row
   **Then** a `PATCH /api/todos/:id` request is sent with `{ "completed": true }`
   **And** the task visually transitions: text color changes to `text-secondary`, strikethrough and italic are applied (~300ms ease transition)

2. **Given** a completed todo is displayed in the list
   **When** the user clicks/taps anywhere on the task row
   **Then** a `PATCH /api/todos/:id` request is sent with `{ "completed": false }`
   **And** the task visually transitions back to active state: `text-primary` color, no strikethrough, no italic

3. **Given** the TodoItem completion toggle is implemented
   **When** component tests are run
   **Then** toggle scenarios (complete, uncomplete, visual states) pass

## Tasks / Subtasks

- [x] Task 1: Add `toggleTodo` API function to api/todos.ts (AC: #1, #2)
  - [x] 1.1: Write API unit tests FIRST (TDD Red phase) — test PATCH request format and error handling
  - [x] 1.2: Implement `toggleTodo(id, completed)` → sends `PATCH /api/todos/:id` with `{ completed }` body, returns `Todo`
  - [x] 1.3: Handle non-ok responses: extract `message` from error body, throw descriptive Error

- [x] Task 2: Add `useToggleTodo` hook to hooks/useTodos.ts (AC: #1, #2)
  - [x] 2.1: Write hook tests FIRST (TDD Red phase) — test mutation call and cache invalidation
  - [x] 2.2: Implement `useToggleTodo()` → `useMutation` calling `toggleTodo` API, `onSettled` invalidates `QUERY_KEYS.TODOS`
  - [x] 2.3: No optimistic update pattern — simple mutation + invalidation (optimistic is Story 4.4)

- [x] Task 3: Add click handler to TodoItem component (AC: #1, #2)
  - [x] 3.1: Write TodoItem toggle interaction tests FIRST (TDD Red phase) — test click triggers onToggle callback
  - [x] 3.2: Add `onToggle` prop to `TodoItemProps`: `(id: number, completed: boolean) => void`
  - [x] 3.3: Add `onClick` handler that calls `onToggle(todo.id, !todo.completed)`
  - [x] 3.4: Add `cursor-pointer` class to the `<li>` element (UX spec: "Entire row is the affordance — cursor: pointer")

- [x] Task 4: Wire toggle through TodoList → TodoItem (AC: #1, #2)
  - [x] 4.1: Update TodoList tests for toggle integration
  - [x] 4.2: Import and call `useToggleTodo()` in TodoList
  - [x] 4.3: Create `handleToggle` callback that calls `toggleTodo.mutate({ id, completed })`
  - [x] 4.4: Pass `handleToggle` as `onToggle` prop to each TodoItem

- [x] Task 5: Verify all existing tests still pass — zero regressions (AC: #3)
  - [x] 5.1: Run full frontend test suite — 46/46 pass
  - [x] 5.2: Verify TodoInput, TodoList, App, AppHeader, API, hooks tests unchanged

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Write tests FIRST (Red), implement to pass (Green), then refactor. This is the established project methodology.

**Layer Boundaries — MANDATORY:**
- `api/todos.ts` — HTTP fetch wrappers only. No business logic.
- `hooks/useTodos.ts` — TanStack Query hooks. Manages mutations, cache invalidation.
- `components/TodoItem.tsx` — Presentational + callback consumption. Receives `onToggle` prop.
- `components/TodoList.tsx` — Mediates between hooks and presentational components.

**Component Prop Pattern (NOT direct hook usage in TodoItem):**
TodoItem stays presentational by receiving an `onToggle` callback prop from TodoList. This keeps TodoItem testable without hook mocks (consistent with current test structure where TodoItem tests render the component directly with props, not wrapped in QueryClientProvider).

**No Optimistic Updates in This Story:**
Story 4.4 handles optimistic toggle behavior. This story uses simple mutation → `onSettled` cache invalidation → TanStack Query re-fetches → React re-renders → CSS transition animates the state change. The existing `transition-all duration-300` on TodoItem already handles the visual animation.

### Existing Code to Reuse (DO NOT REINVENT)

**`createTodo` API function** (api/todos.ts:4-15):
Follow the same fetch pattern: method, headers, JSON body, error handling with message extraction. The `toggleTodo` function is structurally similar but uses PATCH method and different URL.

**`useCreateTodo` hook** (hooks/useTodos.ts:14-46):
Follow the same `useMutation` structure BUT without the `onMutate`/`onError` optimistic pattern. Only use `onSettled` → `invalidateQueries`. Optimistic behavior is Story 4.4.

**TodoItem CSS classes** (components/TodoItem.tsx:18-26):
The completed/active visual states are ALREADY implemented:
- Active: `text-text-primary` (no strikethrough, no italic)
- Completed: `text-text-secondary line-through italic`
- Transition: `transition-all duration-300 motion-reduce:transition-none`
These do NOT need any changes — they animate automatically when the `completed` prop changes.

**Test patterns** (from existing test files):
- API tests: mock `fetch` via `vi.stubGlobal`, assert on request URL/method/body/headers
- Hook tests: mock API module via `vi.mock`, use `renderHook` with `QueryClientProvider` wrapper
- Component tests: `render` + `screen.getBy*` + `expect` assertions, use `@testing-library/react`
- TodoItem tests: render directly with props, no QueryClientProvider needed (presentational)

### Files to MODIFY (no new files needed)

| File | Change |
|------|--------|
| `frontend/src/api/todos.ts` | Add `toggleTodo` function |
| `frontend/src/hooks/useTodos.ts` | Add `useToggleTodo` hook, import `toggleTodo` from API |
| `frontend/src/components/TodoItem.tsx` | Add `onToggle` prop, click handler, `cursor-pointer` |
| `frontend/src/components/TodoList.tsx` | Import `useToggleTodo`, pass toggle handler to TodoItem |
| `frontend/src/__tests__/api/todos.test.ts` | Add `toggleTodo` API tests |
| `frontend/src/__tests__/hooks/useTodos.test.tsx` | Add `useToggleTodo` hook tests |
| `frontend/src/__tests__/components/TodoItem.test.tsx` | Add click/toggle interaction tests |
| `frontend/src/__tests__/components/TodoList.test.tsx` | Update for toggle integration |

**Files NOT to touch:**
- All backend files — this is a frontend-only story
- `frontend/src/types.ts` — `Todo` interface is unchanged
- `frontend/src/constants.ts` — `QUERY_KEYS` and `API_BASE_URL` are unchanged
- `frontend/src/components/App.tsx` — no changes needed
- `frontend/src/components/AppHeader.tsx` — no changes needed
- `frontend/src/components/TodoInput.tsx` — no changes needed
- `frontend/src/main.tsx` — no changes needed

### Implementation Details

**New API — `toggleTodo`:**
```typescript
export async function toggleTodo(id: number, completed: boolean): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? 'Failed to update todo')
  }
  return response.json()
}
```

**New Hook — `useToggleTodo`:**
```typescript
export function useToggleTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodo(id, completed),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}
```
No `onMutate`/`onError` — optimistic updates are Story 4.4.

**Updated TodoItem props and handler:**
```typescript
interface TodoItemProps {
  todo: Todo
  onToggle: (id: number, completed: boolean) => void
}
```
Add `onClick={handleClick}` on the `<li>` where `handleClick = () => onToggle(todo.id, !todo.completed)`.
Add `cursor-pointer` to className.

**Updated TodoList:**
```typescript
const toggleTodo = useToggleTodo()
const handleToggle = (id: number, completed: boolean) => {
  toggleTodo.mutate({ id, completed })
}
// ... pass onToggle={handleToggle} to each TodoItem
```

### Testing Requirements

**API Unit Tests** (add to `frontend/src/__tests__/api/todos.test.ts`):

New `describe('toggleTodo API')` block:
- Sends `PATCH /api/todos/:id` with JSON body `{ completed: true }` and returns updated todo
- Sends `PATCH /api/todos/:id` with `{ completed: false }` for uncomplete
- Throws with server error message on non-ok response
- Throws generic message when server response is not JSON

**Hook Tests** (add to `frontend/src/__tests__/hooks/useTodos.test.tsx`):

New `describe('useToggleTodo')` block:
- Calls toggleTodo API with id and completed
- Invalidates todos query on settled (success)
- Invalidates todos query on settled (error)

**TodoItem Component Tests** (add to `frontend/src/__tests__/components/TodoItem.test.tsx`):

New tests within existing `describe('TodoItem')`:
- Calls `onToggle` with `(id, true)` when clicking an active todo
- Calls `onToggle` with `(id, false)` when clicking a completed todo
- Has `cursor-pointer` class for click affordance
- Does NOT call `onToggle` when not clicked (no spurious calls)

**TodoList Component Tests** (update `frontend/src/__tests__/components/TodoList.test.tsx`):

Update mock to include toggle function, verify toggle integration:
- Need to mock `useToggleTodo` in addition to `useTodos`
- Verify TodoItem receives onToggle prop (can test via click interaction)

**Test Patterns to Follow:**
- API tests: mock `fetch` via `vi.stubGlobal('fetch', mockFetch)`, reset in `beforeEach`
- Hook tests: use `createWrapper()` with `QueryClientProvider`, `renderHook`, `waitFor`
- Component tests: `render`, `screen.getByRole/getByText`, `userEvent.click` or `fireEvent.click`
- Import `userEvent` from `@testing-library/user-event` for click simulation (or use `fireEvent.click` from `@testing-library/react`)

**Anti-patterns to AVOID:**
- Do NOT mock TanStack Query internals — mock the API module instead
- Do NOT add optimistic update logic (onMutate/onError) — that's Story 4.4
- Do NOT add keyboard toggle (Space/Enter) — that's Story 5.2
- Do NOT add error notification display — that's Story 4.3
- Do NOT modify any backend files
- Do NOT import hooks in TodoItem — keep it presentational with props

### Previous Story Intelligence

**From Story 3.2 (Delete Todo API):**
- TDD discipline maintained: 49 backend tests, zero regressions
- Backend CRUD is complete: GET, POST, PATCH, DELETE all working
- PATCH endpoint: `PATCH /api/todos/:id` with `{ completed: boolean }` → returns updated todo or 404
- Error contract: `{ statusCode, error, message }` from `@fastify/sensible`

**From Story 2.4 (Task List Display):**
- TodoList renders TodoItems via `useTodos` hook
- TodoItem is purely presentational — receives `todo` prop only
- Test pattern: mock `useTodos` hook via `vi.mock`, render TodoList
- TodoItem test pattern: render directly with todo prop, no hook mocking

**From Story 2.3 (Task Input & Creation UI):**
- `useCreateTodo` hook already established the TanStack Query mutation pattern
- API function pattern: fetch with method/headers/body, error handling with message extraction
- Hook test pattern: mock API module, use `renderHook` with QueryClientProvider wrapper
- Frontend already has `@testing-library/react` and `vitest` configured with `happy-dom`

**From Epic 2 Retrospective:**
- TDD discipline: maintained across all stories — zero regressions. Continue this.
- Test isolation: each describe block should be self-contained
- Code style: no semicolons, single quotes, 2-space indent, trailing commas

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 3.3: Task Completion Toggle UI`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas, print width 100

**Recent commits:**
- `c390d27` feat: Story 3.2: Delete Todo API Endpoint
- `2c2610f` feat: Story 3.1: Toggle Todo Completion API Endpoint
- `2f8286c` feat: Story 2.4: Task List Display
- `f2649eb` feat: Story 2.3: Task Input & Creation UI

### Scope Boundaries — What This Story Does NOT Include

- **PATCH API endpoint** — that's Story 3.1 (already done)
- **DELETE API endpoint** — that's Story 3.2 (already done)
- **Frontend UI delete** — that's Story 3.4
- **E2E tests** — that's Story 3.5
- **Optimistic updates** — that's Epic 4 (Story 4.4)
- **Error notifications** — that's Epic 4 (Story 4.3)
- **Keyboard toggle (Space/Enter)** — that's Epic 5 (Story 5.2)
- **Accessibility enhancements** — that's Epic 5

This story is **frontend-only**: API function + hook + component updates + tests.

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `@tanstack/react-query` | ^5.90.x | `useMutation`, `useQueryClient`, `invalidateQueries` |
| `@testing-library/react` | (installed) | `render`, `screen`, `fireEvent` |
| `vitest` | ^4.x | Unit and component tests |
| `react` | ^19.x | Component rendering, event handling |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already installed.

### Project Structure Notes

- Alignment with unified project structure: all modifications in existing files, no new files
- `toggleTodo` API function sits in `api/todos.ts` alongside `createTodo` and `getTodos`
- `useToggleTodo` hook sits in `hooks/useTodos.ts` alongside `useTodos` and `useCreateTodo`
- TodoItem remains in `components/TodoItem.tsx` — gains `onToggle` prop and click handler
- Test files remain in `__tests__/` mirroring source structure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — acceptance criteria (3 ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — TanStack Query as sole server-state manager
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — mutation pattern, QUERY_KEYS
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, test organization
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TodoItem] — click/tap anywhere on row toggles completion, cursor:pointer, ~300ms ease
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Interaction Patterns] — completion is a toggle, not a checkbox, entire todo item is the tap target
- [Source: _bmad-output/planning-artifacts/prd.md#FR3,FR4] — mark active todo as completed, toggle back to active
- [Source: _bmad-output/implementation-artifacts/3-2-delete-todo-api-endpoint.md] — patterns to carry forward, backend tests at 49
- [Source: bmad-todo/frontend/src/api/todos.ts] — existing API function pattern
- [Source: bmad-todo/frontend/src/hooks/useTodos.ts] — existing hook pattern with useCreateTodo
- [Source: bmad-todo/frontend/src/components/TodoItem.tsx] — current presentational component, already has visual states
- [Source: bmad-todo/frontend/src/components/TodoList.tsx] — current list component, passes todo props

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase API tests: 4 failures (toggleTodo is not a function) → GREEN: 9/9 pass
- RED phase hook tests: 3 failures (useToggleTodo is not exported) → GREEN: 9/9 pass
- RED phase TodoItem tests: 3 failures (click handler + cursor-pointer missing) → GREEN: 8/8 pass
- RED phase TodoList tests: 1 failure (toggle mutation not wired) → GREEN: 7/7 pass
- Full regression suite: 46/46 pass across 7 test files

### Completion Notes List

- Added `toggleTodo` API function to api/todos.ts following existing `createTodo` fetch pattern (PATCH method, error extraction)
- Added `useToggleTodo` hook to hooks/useTodos.ts — simple `useMutation` + `onSettled` invalidation (no optimistic updates — deferred to Story 4.4)
- Added `onToggle` callback prop to TodoItem — keeps component presentational and testable without hook mocks
- Added `onClick` handler and `cursor-pointer` class to TodoItem `<li>` for click affordance
- Updated TodoList to import `useToggleTodo`, create `handleToggle` callback, pass to each TodoItem
- 4 new API unit tests: PATCH complete, PATCH uncomplete, server error message, generic error
- 3 new hook tests: mutation call, cache invalidation on success, cache invalidation on error
- 4 new TodoItem component tests: click active todo, click completed todo, cursor-pointer class, no spurious calls
- 1 new TodoList integration test: click triggers toggle mutation with correct args
- TDD Red-Green-Refactor followed for all 4 implementation tasks
- Zero regressions: all 34 existing frontend tests continue to pass
- Total frontend tests: 46 (was 34, +12 new)
- Code review: 5 findings (2M, 3L) — 2M + 1L fixed, 47/47 pass after fixes

### Change Log

- 2026-03-24: Story 3.3 implemented — Task completion toggle UI with TDD, 12 new tests
- 2026-03-24: Code review — 5 findings (2M, 3L): added select-none and tabIndex={0} to TodoItem, added mockUseTodos reset to TodoList test, added tabIndex test

### File List

**Modified:**
- `bmad-todo/frontend/src/api/todos.ts` — added `toggleTodo` function (PATCH /api/todos/:id)
- `bmad-todo/frontend/src/hooks/useTodos.ts` — added `useToggleTodo` hook with mutation + cache invalidation
- `bmad-todo/frontend/src/components/TodoItem.tsx` — added `onToggle` prop, click handler, `cursor-pointer` class
- `bmad-todo/frontend/src/components/TodoList.tsx` — imported `useToggleTodo`, passes `handleToggle` to TodoItem
- `bmad-todo/frontend/src/__tests__/api/todos.test.ts` — added 4 toggleTodo API tests
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` — added 3 useToggleTodo hook tests
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx` — added 4 toggle interaction tests
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` — added toggle integration test, updated hook mock
