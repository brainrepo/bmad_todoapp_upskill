# Story 4.4: Optimistic Updates & Rollback

Status: done

<!-- Validation: optional — run validate-create-story before dev-story. -->

## Story

As a user,
I want my actions to feel instant even on slow connections,
So that the app feels responsive and trustworthy.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 4.4)**

**Given** the user creates a new task  
**When** Enter is pressed  
**Then** the task appears in the list immediately (optimistic update with temporary client ID)  
**And** when the server responds with `201`, the temporary ID is replaced with the server ID  
**And** no visual change occurs on success — the update is silent

**Given** the user creates a task and the server returns an error  
**When** the `POST /api/todos` request fails  
**Then** the optimistic task is removed from the list  
**And** an error notification is shown: "Task not saved — try again"

**Given** the user toggles a task completion  
**When** the task row is clicked  
**Then** the visual transition happens immediately (optimistic)  
**And** if the `PATCH` fails, the toggle is reverted and an error notification is shown

**Given** the user deletes a task  
**When** the `×` button is clicked  
**Then** the task fades out immediately (optimistic)  
**And** if the `DELETE` fails, the task reappears in the list and an error notification is shown

**Given** TanStack Query optimistic mutations are implemented  
**When** the mutation hooks (create, toggle, delete) are tested  
**Then** all optimistic update and rollback scenarios pass using the standardized pattern (onMutate → onError → onSettled)

## Tasks / Subtasks

- [x] Task 1: Create mutation — silent ID swap + rollback (AC: #1, #2, #5)
  - [x] 1.1: Ensure optimistic row uses temporary negative/client ID (`-Date.now()` or equivalent) until server responds
  - [x] 1.2: On success (`201`): replace optimistic entry with server `Todo` from `createTodo` response (via `onSuccess` and/or cache `setQueryData`) so temp ID → real ID **without** success toast or layout jump
  - [x] 1.3: Keep `onMutate` cancel + snapshot `previous`; `onError` restore `previous` + `onError?.('Task not saved — try again')`; `onSettled` invalidate as today
  - [x] 1.4: Tests: success path replaces temp id; failure path rolls back + notification (mock `onError`)

- [x] Task 2: Toggle mutation — optimistic completed state + rollback (AC: #3, #5)
  - [x] 2.1: Add `onMutate`: snapshot `previous`, optimistically flip `completed` for the matching `id` in `QUERY_KEYS.TODOS`
  - [x] 2.2: `onError`: restore `context.previous`, call `onError?.('Update failed — try again')`
  - [x] 2.3: `onSettled`: keep `invalidateQueries` (align with architecture)
  - [x] 2.4: Tests: optimistic cache flip before resolve; rollback + notify on reject

- [x] Task 3: Delete mutation — optimistic remove + reappear on failure (AC: #4, #5)
  - [x] 3.1: Add `onMutate`: snapshot `previous`, remove todo with matching `id` from cache
  - [x] 3.2: `onError`: restore `context.previous`, `onError?.('Couldn\'t delete — try again')`
  - [x] 3.3: **Fade-out UX** (~200ms per `ux-design-specification.md`): user-visible fade before/while removal without new dependencies — e.g. `transition-opacity duration-200` on row + timing that matches “fades out immediately (optimistic)” (if pure instant removal is unavoidable, document trade-off in Dev Agent Record)
  - [x] 3.4: Tests: item absent from cache after mutate (optimistic); after failed delete, list matches `previous`

- [x] Task 4: Regression + full suite
  - [x] 4.1: `npm test` — all existing tests green; extend `useTodos.test.tsx` / `TodoItem` tests as needed
  - [x] 4.2: No new npm dependencies (per project rules)

## Dev Notes

### Epic & UX context

- **Epic 4** theme: empty → loading → error surfaces → **instant feedback** with rollback ([Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 intro & Story 4.4])
- **UX:** optimistic-first, ~100ms perceived response, delete journey with ~200ms fade ([Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Optimistic-First, flowcharts])

### Architecture guardrails (must follow)

- Standard mutation shape: `onMutate` (cancel queries, snapshot `previous`, apply optimistic cache update) → `onError` (rollback from `context.previous`, UI notification) → `onSettled` (`invalidateQueries`) ([Source: `_bmad-output/planning-artifacts/architecture.md` — State Management Patterns / Optimistic Update Pattern])
- **Query key:** `QUERY_KEYS.TODOS` from `frontend/src/constants.ts`
- **No React Context / no new global stores** for this — extend existing hooks
- Tests live under `frontend/src/__tests__/` (not co-located)

### Current implementation snapshot (do not reinvent)

| Hook | Today | Story 4.4 work |
|------|--------|----------------|
| `useCreateTodo` | Already has `onMutate` + rollback + `onError` notify | Harden **success** path: temp ID → server todo **silently**; verify no double-fetch flicker |
| `useToggleTodo` | **No** optimistic `onMutate` | Add full pattern |
| `useDeleteTodo` | **No** optimistic `onMutate` | Add full pattern + fade UX |

Files to touch (expected):

- `bmad-todo/frontend/src/hooks/useTodos.ts` — primary
- `bmad-todo/frontend/src/components/TodoItem.tsx` — fade/delete presentation if needed
- `bmad-todo/frontend/src/components/TodoList.tsx` — only if local state needed for exit animation
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` — primary test expansion
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx` — if behavior/CSS contract tested

### Previous story (4.3) intelligence

- Error notifications wired via `onError` callback from `App` → `TodoInput` / `TodoList`; messages are fixed strings matching ACs
- `useTodos` exposes `isFetching` — retry after error shows `LoadingState` when `isError && isFetching`
- **Do not** remove error notification behavior when adding optimistic rollback

### API contracts (unchanged)

- `POST /api/todos` → `201` + body `Todo`
- `PATCH /api/todos/:id` → updated `Todo`
- `DELETE /api/todos/:id` → `204` ([Source: `bmad-todo/frontend/src/api/todos.ts`])

### Testing requirements

- **Hook-level:** For each mutation, prove (1) cache after `onMutate`, (2) `previous` restored on error, (3) `onError` message callback invoked with exact string where applicable
- **Pattern:** Assertions should reference `onMutate` / `onError` / `onSettled` behavior, not only “mutation settled”
- Prefer `QueryClient` + `renderHook` patterns already used in `useTodos.test.tsx`

### Anti-patterns

- Do **not** skip `cancelQueries` before optimistic writes if the rest of the codebase uses it for create
- Do **not** show success toasts for create/toggle/delete — success is silent (FR / UX)
- Do **not** add E2E here — Story **4.5** covers journey-level error edge cases

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.4 Acceptance Criteria]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Optimistic Update Pattern, QUERY_KEYS]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — optimistic flows, ~200ms delete fade]
- [Source: `_bmad-output/implementation-artifacts/4-3-error-state-error-notification.md` — error wiring]

## Technical requirements

- **TanStack Query:** `^5.90.x` — use mutation lifecycle hooks; `context` typed for `{ previous: Todo[] | undefined }` where applicable
- **TypeScript:** strict typing for mutation variables and context; no `any`
- **Styling:** Tailwind utilities; respect `motion-reduce:` for transitions

## Architecture compliance

- Single source of server truth: React Query cache for todos list
- Optimistic updates are cache-only until server confirms; rollback restores last known good snapshot
- Aligns with FR19 / NFR2 / NFR16 (optimistic + rollback) from architecture PRD summary

## Library & framework requirements

| Package | Notes |
|---------|--------|
| `@tanstack/react-query` | Mutations: `onMutate`, `onError`, `onSuccess` (optional), `onSettled` |
| `vitest` + `@testing-library/react` | Hook tests with fake timers where needed |

**No new dependencies** unless product owner approves (not in scope).

## File structure requirements

- Hooks: `bmad-todo/frontend/src/hooks/useTodos.ts`
- Components: `bmad-todo/frontend/src/components/TodoItem.tsx`, `TodoList.tsx` as needed
- Tests: `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` (+ component tests if warranted)

## Previous story intelligence

- Story 4.3 established `ErrorNotification`, `useErrorNotification`, and mutation `onError` callbacks — **reuse** those strings and wiring
- 4.3 tests: baseline superseded by current suite; Story 4.4 completion at **98** frontend tests — preserve or increase coverage

## Git intelligence summary

- Recent epic 4 commits: `feat: Story 4.3: Error State & Error Notification`, `feat: 4.2 Loading state`, `feat: 4.1 empty-state` — follow same **conventional commit** style: `feat: Story 4.4: Optimistic Updates & Rollback`

## Latest technical information

- TanStack Query v5 mutations: `onMutate` return value is passed as `context` to `onError` / `onSettled`; use for rollback snapshots ([TanStack Query docs — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations))
- Prefer replacing optimistic create in `onSuccess` with server `Todo` to satisfy “silent” success without unnecessary refetch jitter; still call `invalidateQueries` in `onSettled` if team standard requires eventual consistency

## Project context reference

- No `project-context.md` in repo — rely on this story + architecture + epics

## Story completion status

- Implementation complete — `4-4-optimistic-updates-rollback` → **done** in `sprint-status.yaml`; Epic 4 all stories **done**

## Change Log

- 2026-04-10: Story 4.4 implemented — optimistic create/toggle/delete with rollback, 200ms delete fade, `onSuccess` ID swap for create, 98 frontend tests passing
- 2026-04-10: Code review — flush pending delete when switching to another row before fade; `useMutation` generics; TodoItem transition class cleanup

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- Frontend `npm test` — 98/98 pass; `npm run lint` — clean

### Completion Notes List

- `useCreateTodo`: `onSuccess` maps `optimisticId` → server `Todo`; `mutationFn: (text) => createTodo(text)` so the API is not passed TanStack’s extra mutation context arg; `onError` restores `context.previous ?? []`
- `useToggleTodo` / `useDeleteTodo`: full `onMutate` / `onError` rollback + existing notification strings; `onSettled` still invalidates
- **Delete fade:** `TodoList` defers `deleteTodo.mutate` by 200ms after click; `TodoItem` `isExiting` applies `opacity-0` + `transition-opacity duration-200` so the row fades before cache removal runs
- Tests: create success ID replace; toggle/delete optimistic + rollback cache assertions; `TodoList` delete tests use fake timers for 200ms delay

### File List

**Modified:**
- `bmad-todo/frontend/src/hooks/useTodos.ts`
- `bmad-todo/frontend/src/components/TodoList.tsx`
- `bmad-todo/frontend/src/components/TodoItem.tsx`
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx`
