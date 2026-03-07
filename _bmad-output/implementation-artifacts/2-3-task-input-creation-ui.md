# Story 2.3: Task Input & Creation UI

Status: done

## Story

As a user,
I want to type a task and press Enter to add it to my list,
So that I can capture thoughts as fast as I can type them.

## Acceptance Criteria (BDD)

1. **Given** the app is loaded
   **When** the page renders
   **Then** the TodoInput component is visible with a left accent bar (`2px solid accent`), placeholder "What needs doing?", and is auto-focused

2. **Given** the input is focused and contains text "Buy groceries"
   **When** the user presses Enter
   **Then** a `POST /api/todos` request is sent with the text
   **And** the input is cleared immediately
   **And** the input retains focus for the next task

3. **Given** the input is focused and empty (or whitespace-only)
   **When** the user presses Enter
   **Then** nothing happens — no request, no error, no visual feedback

4. **Given** the input contains " Buy groceries "
   **When** the user presses Enter
   **Then** the text is trimmed to "Buy groceries" before submission

5. **Given** the TodoInput component is implemented
   **When** component tests are run
   **Then** all input scenarios (submit, clear, focus retention, empty rejection, trimming) pass

## Tasks / Subtasks

- [x] Task 1: Define Tailwind design system tokens (AC: #1)
  - [x] 1.1: Add `@theme` block to `frontend/src/app.css` with all color tokens from UX spec (`bg`, `surface`, `surface-hover`, `text-primary`, `text-secondary`, `text-placeholder`, `accent`, `error`, `border`)
  - [x] 1.2: Verify existing App.tsx classes (`bg-bg`, `text-text-primary`, `text-text-placeholder`) work with the new theme definition
  - [x] 1.3: Verify color contrast ratios meet WCAG AA (already validated in UX spec)

- [x] Task 2: Create API client layer (AC: #2)
  - [x] 2.1: Create `frontend/src/api/todos.ts` with `createTodo(text: string)` fetch wrapper
  - [x] 2.2: Use `API_BASE_URL` from `constants.ts` for endpoint URL
  - [x] 2.3: Handle POST to `/api/todos` with JSON body `{ text }`, expect 201 response
  - [x] 2.4: Parse and return response as `Todo` type
  - [x] 2.5: Write unit tests in `frontend/src/__tests__/api/todos.test.ts`

- [x] Task 3: Create useTodos hook with create mutation (AC: #2)
  - [x] 3.1: Create `frontend/src/hooks/useTodos.ts`
  - [x] 3.2: Implement `useCreateTodo` mutation using `useMutation` from TanStack Query
  - [x] 3.3: Implement optimistic update pattern: `onMutate` → cancel queries, snapshot, add optimistic todo with temp ID; `onError` → rollback; `onSettled` → invalidate
  - [x] 3.4: Write unit tests in `frontend/src/__tests__/hooks/useTodos.test.ts`

- [x] Task 4: Create TodoInput component (AC: #1, #2, #3, #4)
  - [x] 4.1: Create `frontend/src/components/TodoInput.tsx`
  - [x] 4.2: Implement single `<input>` element with left accent border, placeholder "What needs doing?", auto-focus on mount
  - [x] 4.3: Handle Enter key: trim text, reject empty/whitespace, call `createTodo` mutation, clear input, retain focus
  - [x] 4.4: Handle Escape key: clear input text
  - [x] 4.5: Add accessibility: `aria-label="Add a new task"`, visible focus ring
  - [x] 4.6: Apply UX design tokens: transparent bg, `border-left: 2px solid accent`, font-weight 300, font-size 1.125rem

- [x] Task 5: Integrate TodoInput into App component (AC: #1)
  - [x] 5.1: Import and render `TodoInput` below the header in `App.tsx`
  - [x] 5.2: Ensure proper spacing between header and input (24px / `mb-6`)

- [x] Task 6: Write component tests (AC: #5)
  - [x] 6.1: Create `frontend/src/__tests__/components/TodoInput.test.tsx`
  - [x] 6.2: Test input renders with placeholder "What needs doing?"
  - [x] 6.3: Test input is auto-focused on mount
  - [x] 6.4: Test Enter with text calls createTodo mutation and clears input
  - [x] 6.5: Test Enter with empty input does nothing (no API call)
  - [x] 6.6: Test Enter with whitespace-only input does nothing
  - [x] 6.7: Test text is trimmed before submission
  - [x] 6.8: Test Escape key clears input text
  - [x] 6.9: Test input retains focus after submission
  - [x] 6.10: Test `aria-label="Add a new task"` is present

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Follow Red → Green → Refactor cycle. Write tests FIRST, then implement to make them pass.

**Architectural Boundaries (STRICT):**
- `api/todos.ts` — ONLY place that makes HTTP calls. Components NEVER fetch directly.
- `hooks/useTodos.ts` — ONLY place that manages TanStack Query. Components consume hooks, NEVER `useQuery`/`useMutation` directly.
- `components/TodoInput.tsx` — Pure presentational + hook consumption. No business logic, no direct API calls.

**Data Flow:**
```
User types → Enter key → TodoInput component → useCreateTodo() hook → createTodo() API → POST /api/todos → Backend
                                                    ↓
                                         onMutate: optimistic add to cache
                                         onError: rollback + show error
                                         onSettled: invalidate & refetch
```

### CRITICAL: Tailwind v4 Theme Setup

The existing App.tsx already uses custom color tokens (`bg-bg`, `text-text-primary`, `text-text-placeholder`) but they are **NOT YET DEFINED** in `app.css`. The current `app.css` only has `@import "tailwindcss"`.

You MUST add a `@theme` block to `app.css` to define all design system tokens. Tailwind v4 uses CSS-based configuration, NOT `tailwind.config.js`.

```css
@import "tailwindcss";

@theme {
  --color-bg: #141419;
  --color-surface: #1c1c24;
  --color-surface-hover: #24242e;
  --color-text-primary: #e8e8ed;
  --color-text-secondary: #6b6b7b;
  --color-text-placeholder: #4a4a58;
  --color-accent: #7c9cb5;
  --color-error: #c4756e;
  --color-border: #2a2a35;
}
```

This enables Tailwind classes like: `bg-bg`, `bg-surface`, `text-text-primary`, `text-accent`, `border-accent`, `border-error`, etc.

**VERIFY** after adding tokens: the existing App.tsx classes (`bg-bg`, `text-text-primary`, `text-text-placeholder`) must still work. If Tailwind v4 generates `bg-bg` from `--color-bg`, this should be automatic.

### API Client Pattern

```typescript
// frontend/src/api/todos.ts
import { API_BASE_URL } from '../constants'
import type { Todo } from '../types'

export async function createTodo(text: string): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) {
    throw new Error('Failed to create todo')
  }
  return response.json()
}
```

**IMPORTANT:**
- Use plain `fetch` — no axios or other HTTP library
- Throw on non-ok responses so TanStack Query's `onError` can handle them
- Return typed `Todo` from response

### Optimistic Update Pattern (MANDATORY for create mutation)

```typescript
// frontend/src/hooks/useTodos.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../constants'
import { createTodo } from '../api/todos'
import type { Todo } from '../types'

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TODOS })
      const previous = queryClient.getQueryData<Todo[]>(QUERY_KEYS.TODOS)

      const optimisticTodo: Todo = {
        id: -Date.now(), // temporary negative ID
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Todo[]>(QUERY_KEYS.TODOS, (old) => [
        ...(old ?? []),
        optimisticTodo,
      ])

      return { previous }
    },
    onError: (_err, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.TODOS, context.previous)
      }
      // Error notification will be handled in a later story (Epic 4)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
    },
  })
}
```

**Key points:**
- Temporary ID uses `-Date.now()` (negative to avoid collision with server IDs)
- `onMutate` snapshots previous state for rollback
- `onError` restores previous state (honest recovery pattern)
- `onSettled` always invalidates to sync with server truth
- Error notification component is NOT part of this story (Epic 4 scope)

### TodoInput Component Pattern

```tsx
// frontend/src/components/TodoInput.tsx
import { useState, useRef, useEffect } from 'react'
import { useCreateTodo } from '../hooks/useTodos'

export function TodoInput() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createTodo = useCreateTodo()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = text.trim()
      if (!trimmed) return // Silent rejection
      createTodo.mutate(trimmed)
      setText('')
      // Focus is retained because we never blur
    } else if (e.key === 'Escape') {
      setText('')
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="What needs doing?"
      aria-label="Add a new task"
      className="w-full bg-transparent border-l-2 border-accent pl-5 py-4 text-[1.125rem] font-light text-text-primary placeholder:text-text-placeholder outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
    />
  )
}
```

**Design decisions:**
- `useState` for local input text (not TanStack Query — this is UI state)
- `useRef` + `useEffect` for auto-focus on mount
- `onKeyDown` for Enter/Escape handling
- Controlled input for trim-before-submit pattern
- No submit button — Enter key only (per UX spec)
- Silent validation: empty/whitespace → early return, no error state

### UX Design Token Reference

**TodoInput Visual Spec:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Background | transparent | `bg-transparent` |
| Left border | 2px solid accent (#7c9cb5) | `border-l-2 border-accent` |
| Left padding | 20px | `pl-5` |
| Vertical padding | 16px | `py-4` |
| Font size | 1.125rem (18px) | `text-[1.125rem]` |
| Font weight | 300 (light) | `font-light` |
| Text color | #e8e8ed | `text-text-primary` |
| Placeholder color | #4a4a58 | `placeholder:text-text-placeholder` |
| Focus ring | 2px solid accent, 2px offset | `focus:ring-2 focus:ring-accent focus:ring-offset-2` |
| Focus ring offset bg | #141419 | `focus:ring-offset-bg` |

**Full Color Palette (for @theme block):**
| Token | Value | Role |
|-------|-------|------|
| `bg` | `#141419` | Page background |
| `surface` | `#1c1c24` | Todo item surface |
| `surface-hover` | `#24242e` | Item hover/focus |
| `text-primary` | `#e8e8ed` | Active todo text |
| `text-secondary` | `#6b6b7b` | Completed text, metadata |
| `text-placeholder` | `#4a4a58` | Input placeholder |
| `accent` | `#7c9cb5` | Interactive elements, focus rings |
| `error` | `#c4756e` | Error notification border |
| `border` | `#2a2a35` | Subtle dividers |

### Testing Patterns (Follow Established Conventions)

**Component Test Pattern** (from `App.test.tsx`):
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TodoInput } from '../../components/TodoInput'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('TodoInput', () => {
  it('renders with placeholder', () => {
    renderWithProviders(<TodoInput />)
    expect(screen.getByPlaceholderText('What needs doing?')).toBeInTheDocument()
  })

  it('auto-focuses on mount', () => {
    renderWithProviders(<TodoInput />)
    expect(screen.getByPlaceholderText('What needs doing?')).toHaveFocus()
  })
})
```

**IMPORTANT — Mocking API calls in component tests:**
You need to mock the `useTodos` hook or the `api/todos` module in component tests to avoid actual HTTP calls. Use `vi.mock()`:
```typescript
vi.mock('../../hooks/useTodos', () => ({
  useCreateTodo: () => ({ mutate: vi.fn() }),
}))
```

Or mock at the fetch level for integration-style component tests.

**`@testing-library/user-event` is already installed** (`^14.6.1`) — use `userEvent` for simulating user interactions (typing, pressing Enter) instead of `fireEvent`. It more closely simulates real user behavior.

```typescript
const user = userEvent.setup()
await user.type(input, 'Buy groceries')
await user.keyboard('{Enter}')
```

### Project Structure Notes

**Files to CREATE:**
| File | Purpose |
|------|---------|
| `bmad-todo/frontend/src/api/todos.ts` | Fetch wrapper for `POST /api/todos` |
| `bmad-todo/frontend/src/hooks/useTodos.ts` | `useCreateTodo` mutation hook with optimistic updates |
| `bmad-todo/frontend/src/components/TodoInput.tsx` | Input component with Enter submit, auto-focus |
| `bmad-todo/frontend/src/__tests__/api/todos.test.ts` | API client unit tests |
| `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.ts` | Hook unit tests |
| `bmad-todo/frontend/src/__tests__/components/TodoInput.test.tsx` | Component tests |

**Files to MODIFY:**
| File | Change |
|------|--------|
| `bmad-todo/frontend/src/app.css` | Add `@theme` block with all design system color tokens |
| `bmad-todo/frontend/src/components/App.tsx` | Import and render `<TodoInput />` below header |

**Files NOT to touch:**
- `frontend/src/main.tsx` — QueryClient already configured
- `frontend/src/constants.ts` — `API_BASE_URL` and `QUERY_KEYS` already defined
- `frontend/src/types.ts` — `Todo` interface already defined
- `frontend/vite.config.ts` — dev proxy already configured
- Any backend files — this is a frontend-only story

### Existing Types to Use

Already defined in `frontend/src/types.ts`:
```typescript
export interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}
```

Already defined in `frontend/src/constants.ts`:
```typescript
export const API_BASE_URL = '/api'
export const QUERY_KEYS = {
  TODOS: ['todos'] as const,
} as const
```

### Git Intelligence

**Recent commits (last 5):**
```
4fd2afc feat: Story 1.3: Containerization & Docker Compose
1be7528 chore: fix tslint
f665b68 chore: move to claude code
a987d43 feat: Story 1.2: Database Setup & Health Check Endpoint
88ceb3e feat: story 1.1: Project Scaffolding & Development Environment
```

**Commit message pattern:** `feat: Story X.Y: Description`

**Code conventions observed:**
- No semicolons (Prettier: `semi: false`)
- Single quotes (Prettier: `singleQuote: true`)
- 2-space indentation
- Trailing commas everywhere
- Arrow parens always
- Print width 100

### Previous Story Intelligence

**From Story 2.1 (Create Todo API — BACKEND DEPENDENCY):**
- POST /api/todos expects `{ "text": "..." }` body
- Returns 201 with `{ id, text, completed: false, createdAt: "..." }`
- Returns 400 for empty/whitespace text: `{ statusCode: 400, error: "Bad Request", message: "Todo description cannot be empty" }`
- Returns 400 for missing text field (JSON Schema validation)
- camelCase response fields match the frontend `Todo` type

**From Story 2.2 (List Todos API — DATA SOURCE):**
- GET /api/todos returns array of todos ordered by `created_at` ASC
- Returns `[]` for empty database
- The `useCreateTodo` optimistic update appends to this cached array

**From Story 1.1 (Project Scaffolding):**
- React 19, TanStack Query v5 already configured
- Tailwind CSS v4.2 via @tailwindcss/vite plugin
- `@testing-library/react` and `@testing-library/user-event` installed
- `happy-dom` test environment configured in vitest
- Existing `renderWithProviders` test helper pattern

**From Story 1.3 (Docker):**
- Vite dev proxy routes `/api` → `http://localhost:3001`
- In production, Nginx handles the proxy

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `react` | ^19.2.0 | Component, useState, useRef, useEffect |
| `@tanstack/react-query` | ^5.90.21 | useMutation, useQueryClient, QueryClientProvider |
| `tailwindcss` | ^4.2.1 | Utility classes, @theme color tokens |
| `@testing-library/react` | ^16.3.2 | render, screen for component tests |
| `@testing-library/user-event` | ^14.6.1 | userEvent for simulating typing/keyboard |
| `vitest` | ^4.0.18 | Test runner, vi.mock() for mocking |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already in `package.json`.

### Scope Boundaries — What This Story Does NOT Include

- **ErrorNotification component** — deferred to Epic 4 (Story 4.3). The `onError` callback should rollback optimistic state but NOT show a notification UI yet.
- **TodoList / TodoItem display** — that's Story 2.4. This story only handles input and creation.
- **EmptyState component** — that's Epic 4 (Story 4.1).
- **LoadingState component** — that's Epic 4 (Story 4.2).
- **E2E tests** — that's Story 2.5 (full-stack integration verification).

The TodoInput component can work independently — it submits to the API and clears. The created todo will appear in the list once Story 2.4 is implemented.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — component structure, hook pattern, API client pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Update Pattern] — mutation shape with onMutate/onError/onSettled
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — api/ hooks/ components/ separation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TodoInput] — component visual spec, states, accessibility
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — auto-focus, silent validation, clearing
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Palette] — all design system color tokens
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1] — first-time task creation flow
- [Source: _bmad-output/planning-artifacts/prd.md#FR1,FR13,FR14,FR15] — functional requirements
- [Source: _bmad-output/implementation-artifacts/2-1-create-todo-api-endpoint.md] — API contract for POST /api/todos
- [Source: _bmad-output/implementation-artifacts/2-2-list-todos-api-endpoint.md] — API contract for GET /api/todos (cache key)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Hook test required `.tsx` extension (JSX in wrapper function). TanStack Query v5 passes mutation context as second arg to `mutationFn` — test assertions updated to use `expect.anything()`.

### Completion Notes List

- Task 1: Added `@theme` block to `app.css` with 9 color tokens. Existing App.tsx classes verified working (App.test.tsx passes).
- Task 2: Created `api/todos.ts` with `createTodo()` fetch wrapper using `API_BASE_URL`. Throws on non-ok response. 2 unit tests.
- Task 3: Created `hooks/useTodos.ts` with `useCreateTodo()` mutation — optimistic add with temp negative ID, error rollback, settlement invalidation. 3 unit tests (mutation call, optimistic success, error rollback).
- Task 4: Created `TodoInput.tsx` — controlled input with auto-focus, Enter submit (trim + empty rejection), Escape clear, left accent border, aria-label, focus ring.
- Task 5: Integrated `<TodoInput />` into App.tsx below header (mb-6 spacing via existing header class).
- Task 6: 9 component tests covering all ACs: placeholder, auto-focus, Enter submit + clear, empty rejection, whitespace rejection, trimming, Escape clear, focus retention, aria-label.

### Change Log

- 2026-03-07: Story 2.3 implemented — TodoInput component with API client, TanStack Query hook, and design tokens (16 frontend tests, 0 regressions)
- 2026-03-07: Code review fixes — API error now includes server message (M1), optimistic update test verifies cache during in-flight mutation (M2), removed unnecessary QueryClientProvider from component tests (M3)

### File List

- `bmad-todo/frontend/src/app.css` (MODIFIED) — added @theme block with design system color tokens
- `bmad-todo/frontend/src/components/App.tsx` (MODIFIED) — added TodoInput import and render
- `bmad-todo/frontend/src/api/todos.ts` (NEW) — createTodo fetch wrapper
- `bmad-todo/frontend/src/hooks/useTodos.ts` (NEW) — useCreateTodo mutation with optimistic updates
- `bmad-todo/frontend/src/components/TodoInput.tsx` (NEW) — input component with Enter/Escape handling
- `bmad-todo/frontend/src/__tests__/api/todos.test.ts` (NEW) — 2 API client tests
- `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.tsx` (NEW) — 3 hook tests
- `bmad-todo/frontend/src/__tests__/components/TodoInput.test.tsx` (NEW) — 9 component tests
