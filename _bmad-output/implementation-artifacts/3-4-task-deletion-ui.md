# Story 3.4: Task Deletion UI

Status: done

## Story

As a user,
I want to delete a task by clicking a delete control,
So that I can remove tasks I no longer need without friction.

## Acceptance Criteria (BDD)

1. **Given** a todo is displayed in the list (on desktop, lg breakpoint+)
   **When** the user hovers over the task row
   **Then** a `×` delete button appears on the right side (position absolute, opacity transition)
   **And** the task row shows a left border in `border` color

2. **Given** a todo is displayed in the list (on mobile, below lg breakpoint)
   **When** the page renders
   **Then** the `×` delete button is always visible (no hover required)

3. **Given** the `×` button is visible
   **When** the user clicks the `×` button
   **Then** a `DELETE /api/todos/:id` request is sent
   **And** the task exits the list with a fade-out animation (~200ms)

4. **Given** the user clicks the `×` button
   **When** the delete action completes
   **Then** no confirmation dialog is shown — the deletion is immediate

5. **Given** the TodoItem delete interaction is implemented
   **When** component tests are run
   **Then** delete scenarios (hover reveal, click delete, fade-out, mobile always-visible) pass

## Tasks / Subtasks

- [x] Task 1: Add `deleteTodo` API function to api/todos.ts (AC: #3)
  - [x] 1.1: Write API unit tests FIRST (TDD Red phase) — test DELETE request format, 204 handling, and error handling
  - [x] 1.2: Implement `deleteTodo(id)` → sends `DELETE /api/todos/:id`, returns void (204 No Content)
  - [x] 1.3: Handle non-ok responses: extract `message` from error body, throw descriptive Error

- [x] Task 2: Add `useDeleteTodo` hook to hooks/useTodos.ts (AC: #3)
  - [x] 2.1: Write hook tests FIRST (TDD Red phase) — test mutation call and cache invalidation
  - [x] 2.2: Implement `useDeleteTodo()` → `useMutation` calling `deleteTodo` API, `onSettled` invalidates `QUERY_KEYS.TODOS`
  - [x] 2.3: No optimistic update pattern — simple mutation + invalidation (optimistic is Story 4.4)

- [x] Task 3: Add delete button to TodoItem component (AC: #1, #2, #3, #4)
  - [x] 3.1: Write TodoItem delete interaction tests FIRST (TDD Red phase) — test × button renders, click triggers onDelete, click does NOT trigger onToggle (event propagation)
  - [x] 3.2: Add `onDelete` prop to `TodoItemProps`: `(id: number) => void`
  - [x] 3.3: Add `×` button inside the `<li>`, positioned absolute right, with responsive visibility: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100` transition
  - [x] 3.4: Add `aria-label={`Delete task: ${todo.text}`}` to the × button
  - [x] 3.5: Add `onClick` handler on × button that calls `e.stopPropagation()` then `onDelete(todo.id)` — prevents toggle from firing
  - [x] 3.6: Ensure × button has minimum 44x44px touch target (w-11 h-11 or equivalent, flex items-center justify-center)

- [x] Task 4: Wire delete through TodoList → TodoItem (AC: #3, #4)
  - [x] 4.1: Update TodoList tests for delete integration
  - [x] 4.2: Import and call `useDeleteTodo()` in TodoList
  - [x] 4.3: Create `handleDelete` callback that calls `deleteTodo.mutate(id)`
  - [x] 4.4: Pass `handleDelete` as `onDelete` prop to each TodoItem

- [x] Task 5: Verify all existing tests still pass — zero regressions (AC: #5)
  - [x] 5.1: Run full frontend test suite — 59/59 pass across 7 test files
  - [x] 5.2: Verify TodoInput, App, AppHeader tests unchanged

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Write tests FIRST (Red), implement to pass (Green), then refactor. This is the established project methodology across all stories.

**Layer Boundaries — MANDATORY:**
- `api/todos.ts` — HTTP fetch wrappers only. No business logic.
- `hooks/useTodos.ts` — TanStack Query hooks. Manages mutations, cache invalidation.
- `components/TodoItem.tsx` — Presentational + callback consumption. Receives `onDelete` prop (same pattern as `onToggle`).
- `components/TodoList.tsx` — Mediates between hooks and presentational components.

**Component Prop Pattern (NOT direct hook usage in TodoItem):**
TodoItem stays presentational by receiving an `onDelete` callback prop from TodoList. This is the same pattern used for `onToggle` — keeps TodoItem testable without hook mocks (consistent with current test structure where TodoItem tests render the component directly with props, not wrapped in QueryClientProvider).

**No Optimistic Updates in This Story:**
Story 4.4 handles optimistic delete behavior (immediate fade-out with rollback on failure). This story uses simple mutation → `onSettled` cache invalidation → TanStack Query re-fetches → React re-renders → item disappears from list.

**Event Propagation — CRITICAL:**
The `×` button is INSIDE the `<li>` that has an `onClick` for toggle. Clicking `×` MUST call `e.stopPropagation()` BEFORE calling `onDelete(todo.id)`. Without this, clicking delete will also trigger the completion toggle.

### Existing Code to Reuse (DO NOT REINVENT)

**`toggleTodo` API function** (api/todos.ts:17-28):
Follow the same fetch pattern for error handling. However, `deleteTodo` differs: it uses DELETE method, has no request body, and returns 204 No Content (no JSON to parse on success).

**`useToggleTodo` hook** (hooks/useTodos.ts:48-58):
Follow the same `useMutation` + `onSettled` invalidation structure. The mutation function signature differs — `deleteTodo` takes a single `id: number` parameter, not an object.

**TodoItem component** (components/TodoItem.tsx):
Currently has `onToggle` prop. Add `onDelete` prop following the same callback pattern. The `group` class is already on the `<li>` — use `lg:group-hover:opacity-100` for the × button hover reveal.

**Test patterns** (from existing test files):
- API tests: mock `fetch` via `vi.stubGlobal('fetch', mockFetch)`, reset in `beforeEach`
- Hook tests: mock API module via `vi.mock`, use `renderHook` with `QueryClientProvider` wrapper
- Component tests: `render` + `screen.getBy*` + `fireEvent.click` for interactions
- TodoItem tests: render directly with props, no QueryClientProvider needed (presentational)

### DELETE API Differences from PATCH/POST

The DELETE endpoint returns **204 No Content** with an empty body. This means:
- Do NOT call `response.json()` on success — there's no body to parse
- Return type is `Promise<void>`, not `Promise<Todo>`
- Error handling is the same (non-ok responses still have JSON error bodies)

```typescript
export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? 'Failed to delete todo')
  }
}
```

### × Button Implementation Details

**From UX Spec — TodoItem anatomy:**
- `×` character (Unicode ×, not x) positioned absolute right
- Opacity 0 by default on lg breakpoint, opacity 1 on group-hover
- Always visible (opacity 1) below lg breakpoint (mobile)
- Minimum 44x44px touch target
- `aria-label="Delete task: [task text]"`
- Transition on opacity (~200ms ease)
- Text styling: `text-text-secondary text-lg` — the × should be subdued, not dominant (consistent with typographic design direction where interactive affordances stay quiet until engaged)

**Responsive visibility pattern (Tailwind):**
```
opacity-100 lg:opacity-0 lg:group-hover:opacity-100
transition-opacity duration-200
```
This means: always visible on mobile/tablet, hidden on desktop until row hover.

**Touch target sizing:**
The `×` glyph is small but the button must be 44x44px minimum. Use:
```
w-11 h-11 flex items-center justify-center
```

**Layout approach:**
The `<li>` currently uses `flex flex-col`. To position the × button absolutely on the right:
- Add `relative` to the `<li>` className
- Change `px-5` to `pl-5 pr-14` on the `<li>` — reserves right space so task text and timestamp never render behind the × button
- Position the button: `absolute right-2 top-1/2 -translate-y-1/2` (vertically centered)

**⚠️ Right padding is CRITICAL:** Without `pr-14` (or equivalent), long task text will overlap with the absolutely-positioned × button. The button is removed from flex flow, so the text spans have no awareness of it.

**Hover border note:**
The `<li>` already has `hover:border-border` in its className (added in Story 3.3). No changes needed for AC #1's left border requirement — it's already implemented.

### Files to MODIFY (no new files needed)

| File | Change |
|------|--------|
| `frontend/src/api/todos.ts` | Add `deleteTodo` function (DELETE, 204 No Content) |
| `frontend/src/hooks/useTodos.ts` | Add `useDeleteTodo` hook, import `deleteTodo` from API |
| `frontend/src/components/TodoItem.tsx` | Add `onDelete` prop, × button with responsive visibility, `stopPropagation` |
| `frontend/src/components/TodoList.tsx` | Import `useDeleteTodo`, pass delete handler to TodoItem |
| `frontend/src/__tests__/api/todos.test.ts` | Add `deleteTodo` API tests |
| `frontend/src/__tests__/hooks/useTodos.test.tsx` | Add `useDeleteTodo` hook tests |
| `frontend/src/__tests__/components/TodoItem.test.tsx` | Add × button tests (render, click, propagation, aria-label, touch target) |
| `frontend/src/__tests__/components/TodoList.test.tsx` | Add delete integration test, update hook mock |

**Files NOT to touch:**
- All backend files — this is a frontend-only story (DELETE endpoint is Story 3.2, already done)
- `frontend/src/types.ts` — `Todo` interface is unchanged
- `frontend/src/constants.ts` — `QUERY_KEYS` and `API_BASE_URL` are unchanged
- `frontend/src/components/App.tsx` — no changes needed
- `frontend/src/components/AppHeader.tsx` — no changes needed
- `frontend/src/components/TodoInput.tsx` — no changes needed
- `frontend/src/main.tsx` — no changes needed

### Testing Requirements

**API Unit Tests** (add to `frontend/src/__tests__/api/todos.test.ts`):

New `describe('deleteTodo API')` block:
- Sends `DELETE /api/todos/:id` with no body and returns void on 204
- Does NOT parse response body on success (204 has no body)
- Throws with server error message on 404 (todo not found)
- Throws generic message when server error response is not JSON

**Hook Tests** (add to `frontend/src/__tests__/hooks/useTodos.test.tsx`):

**⚠️ FIRST: Update the existing `vi.mock` factory at the top of the file.** The current mock (lines 7-14) declares `createTodo`, `getTodos`, `toggleTodo`. You MUST add `deleteTodo` to it:
```typescript
const mockDeleteTodo = vi.fn()
// ... add to vi.mock factory:
// deleteTodo: (...args: unknown[]) => mockDeleteTodo(...args),
```
Without this, `useDeleteTodo`'s import of `deleteTodo` will fail silently.

New `describe('useDeleteTodo')` block:
- Calls deleteTodo API with id
- Invalidates todos query on settled (success)
- Invalidates todos query on settled (error)

**TodoItem Component Tests** (add to `frontend/src/__tests__/components/TodoItem.test.tsx`):

New tests within existing `describe('TodoItem')`:
- Renders × delete button with correct aria-label "Delete task: [text]"
- Calls `onDelete` with todo id when × button is clicked
- Does NOT call `onToggle` when × button is clicked (stopPropagation)
- × button has minimum 44x44px touch target (w-11 h-11 classes)
- Delete button is keyboard-focusable (native `<button>` elements have `tabIndex=0` by default — no explicit attribute needed, but the test should verify focus is reachable)

**TodoList Component Tests** (update `frontend/src/__tests__/components/TodoList.test.tsx`):

Update mock to include delete function, verify delete integration:
- Mock `useDeleteTodo` in addition to `useTodos` and `useToggleTodo`
- Click × button triggers delete mutation with correct id
- Verify delete does not trigger toggle mutation

**Test Patterns to Follow:**
- API tests: mock `fetch` via `vi.stubGlobal('fetch', mockFetch)`, reset in `beforeEach`
- Hook tests: use `createWrapper()` with `QueryClientProvider`, `renderHook`, `waitFor`
- Component tests: `render`, `screen.getByRole/getByText/getByLabelText`, `fireEvent.click`
- Use `screen.getByLabelText('Delete task: Buy groceries')` to find the × button in tests
- TodoItem tests: render directly with props, no QueryClientProvider needed (presentational)

**Anti-patterns to AVOID:**
- Do NOT mock TanStack Query internals — mock the API module instead
- Do NOT add optimistic update logic (onMutate/onError) — that's Story 4.4
- Do NOT add keyboard delete (Delete/Backspace key) — that's Story 5.2
- Do NOT add error notification display — that's Story 4.3
- Do NOT add fade-out animation state management — CSS `transition-opacity` + conditional rendering handles it; true fade-before-remove is Story 4.4's optimistic pattern
- Do NOT modify any backend files
- Do NOT import hooks in TodoItem — keep it presentational with props
- Do NOT add `disabled` state or rapid-click prevention on the × button — if a user clicks × twice before the first DELETE resolves, the second request will 404 and the error is silently swallowed (error notifications are Story 4.3). This is acceptable for this story's scope.

### Previous Story Intelligence

**From Story 3.3 (Task Completion Toggle UI):**
- `onToggle` prop pattern: `(id: number, completed: boolean) => void` — `onDelete` follows same shape but simpler: `(id: number) => void`
- `handleClick` on `<li>` — the × button's click MUST `stopPropagation()` to avoid triggering this
- `group` class already on the `<li>` — enables `lg:group-hover:*` for × button visibility
- `hover:border-border` already on the `<li>` — AC #1's left border on hover is already implemented
- `cursor-pointer select-none` already on the `<li>` — no changes needed
- TodoItem test file has 9 tests currently — add 4-5 more for delete interactions
- TodoList mock pattern: `vi.mock('../../hooks/useTodos', () => ({...}))` — add `useDeleteTodo` to mock
- Total frontend tests after Story 3.3: 47 across 7 test files

**From Story 3.2 (Delete Todo API Endpoint):**
- Backend `DELETE /api/todos/:id` returns 204 No Content on success
- Backend returns 404 with `{ statusCode: 404, error: "Not Found", message: "Todo not found" }` for missing id
- TDD discipline maintained: 49 backend tests, zero regressions

**From Epic 2 Retrospective:**
- TDD discipline: maintained across all stories — zero regressions. Continue this.
- Test isolation: each describe block should be self-contained
- Code style: no semicolons, single quotes, 2-space indent, trailing commas

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Expected commit:** `feat: Story 3.4: Task Deletion UI`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas, print width 100

**Recent commits:**
- `bfdbcdb` feat: Story 3.3: Task Completion Toggle UI
- `c390d27` feat: Story 3.2: Delete Todo API Endpoint
- `2c2610f` feat: Story 3.1: Toggle Todo Completion API Endpoint

### Scope Boundaries — What This Story Does NOT Include

- **DELETE API endpoint** — that's Story 3.2 (already done)
- **PATCH API endpoint** — that's Story 3.1 (already done)
- **E2E tests** — that's Story 3.5
- **Optimistic updates (fade-out before server confirms)** — that's Epic 4 (Story 4.4)
- **Error notifications on delete failure** — that's Epic 4 (Story 4.3)
- **Keyboard delete (Delete/Backspace key)** — that's Epic 5 (Story 5.2)
- **Accessibility enhancements beyond aria-label** — that's Epic 5
- **Confirmation dialog** — explicitly rejected by UX spec. Deletion is immediate.

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
- `deleteTodo` API function sits in `api/todos.ts` alongside `createTodo`, `getTodos`, and `toggleTodo`
- `useDeleteTodo` hook sits in `hooks/useTodos.ts` alongside `useTodos`, `useCreateTodo`, and `useToggleTodo`
- TodoItem remains in `components/TodoItem.tsx` — gains `onDelete` prop and × button
- Test files remain in `__tests__/` mirroring source structure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — acceptance criteria (5 ACs, verified 1:1 against epics)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — TanStack Query as sole server-state manager
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — mutation pattern, QUERY_KEYS
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — DELETE /api/todos/:id → 204 No Content
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, test organization
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TodoItem] — × button anatomy, hover-only on desktop, always visible on mobile, position absolute right, opacity transition
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Interaction Patterns] — no confirmation on delete, immediate action
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Breakpoints] — lg (1024px+) for hover-dependent interactions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] — aria-label="Delete task: [text]", 44x44px touch target
- [Source: _bmad-output/planning-artifacts/prd.md#FR5] — user can delete a todo permanently
- [Source: _bmad-output/implementation-artifacts/3-3-task-completion-toggle-ui.md] — onToggle prop pattern, group class, hover border, test patterns
- [Source: _bmad-output/implementation-artifacts/3-2-delete-todo-api-endpoint.md] — DELETE endpoint spec (204, 404)
- [Source: bmad-todo/frontend/src/api/todos.ts] — existing API function pattern (createTodo, toggleTodo, getTodos)
- [Source: bmad-todo/frontend/src/hooks/useTodos.ts] — existing hook pattern (useToggleTodo for mutation reference)
- [Source: bmad-todo/frontend/src/components/TodoItem.tsx] — current component with group class, onToggle, handleClick
- [Source: bmad-todo/frontend/src/components/TodoList.tsx] — current list component, passes toggle handler

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase API tests: 3 failures (deleteTodo is not a function) → GREEN: 12/12 pass
- RED phase hook tests: 3 failures (useDeleteTodo is not exported) → GREEN: 12/12 pass
- RED phase TodoItem tests: 4 failures (no delete button / aria-label) → GREEN: 13/13 pass
- RED phase TodoList tests: 1 failure (delete mutation not wired) → GREEN: 9/9 pass
- Full regression suite: 59/59 pass across 7 test files

### Completion Notes List

- Added `deleteTodo` API function to api/todos.ts — DELETE method, no request body, no response parsing on 204 success, error handling with message extraction
- Added `useDeleteTodo` hook to hooks/useTodos.ts — simple `useMutation` + `onSettled` invalidation (no optimistic updates — deferred to Story 4.4)
- Added `onDelete` callback prop to TodoItem — keeps component presentational and testable without hook mocks
- Added × delete button to TodoItem with `absolute right-2 top-1/2 -translate-y-1/2` positioning, `w-11 h-11` touch target, `text-text-secondary text-lg` styling
- Responsive visibility: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100` — always visible on mobile, hover-only on desktop
- Added `e.stopPropagation()` on × button click to prevent toggle from firing
- Changed `<li>` padding from `px-5` to `pl-5 pr-14` to prevent text overlap with × button
- Added `relative` to `<li>` for absolute button positioning
- Updated TodoList to import `useDeleteTodo`, create `handleDelete` callback, pass to each TodoItem
- 3 new API unit tests: DELETE 204, error 404, generic error
- 3 new hook tests: mutation call, cache invalidation on success, cache invalidation on error
- 4 new TodoItem component tests: aria-label, click triggers onDelete, stopPropagation, touch target classes
- 2 new TodoList integration tests: × click triggers delete mutation, × click does not trigger toggle
- TDD Red-Green-Refactor followed for all 4 implementation tasks
- Zero regressions: all 47 existing frontend tests continue to pass
- Total frontend tests: 59 (was 47, +12 new)

### Change Log

- 2026-04-10: Story 3.4 implemented — Task deletion UI with TDD, 12 new tests, 59/59 pass
- 2026-04-10: Code review — 4 findings (4M, 2L): added cursor-pointer and hover:text-text-primary to × button, fixed React.MouseEvent import, strengthened API 204 test. M3 (fade-out) deferred to Story 4.4, M4 (ARIA nesting) deferred to Story 5.3. 59/59 pass after fixes.

### File List

**Modified:**
- `bmad-todo/frontend/src/api/todos.ts` — added `deleteTodo` function (DELETE /api/todos/:id, 204 No Content)
- `bmad-todo/frontend/src/hooks/useTodos.ts` — added `useDeleteTodo` hook with mutation + cache invalidation
- `bmad-todo/frontend/src/components/TodoItem.tsx` — added `onDelete` prop, × button with responsive visibility, `stopPropagation`, `relative` positioning, `pl-5 pr-14` padding
- `bmad-todo/frontend/src/components/TodoList.tsx` — imported `useDeleteTodo`, passes `handleDelete` to TodoItem
- `bmad-todo/frontend/src/__tests__/api/todos.test.ts` — added 3 deleteTodo API tests
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` — added 3 useDeleteTodo hook tests, added `deleteTodo` to API mock factory
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx` — added 4 delete interaction tests, updated all renders to include `onDelete` prop
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` — added 2 delete integration tests, added `useDeleteTodo` to hook mock, renamed `mockMutate` → `mockToggleMutate`
