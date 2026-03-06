# Story 2.4: Task List Display

Status: ready-for-dev

## Story

As a user,
I want to see all my tasks displayed in a clean, typographic list,
So that I can scan what I need to do at a glance.

## Acceptance Criteria (BDD)

1. **Given** todos exist in the backend
   **When** the app loads
   **Then** the TodoList component renders all todos via `GET /api/todos`
   **And** each TodoItem displays the task text (1.125rem, weight 300) with uppercase metadata showing the creation timestamp
   **And** active todos display in `text-primary` color
   **And** completed todos display in `text-secondary` with strikethrough and italic
   **And** todos are ordered by creation date (ascending)

2. **Given** the AppHeader component is rendered
   **When** the page loads
   **Then** the title "things to do" (2rem, weight 200) and subtitle "a simple list" (uppercase, letter-spacing) are displayed

3. **Given** the todo list components are implemented
   **When** component tests are run
   **Then** rendering scenarios (populated list, active items, completed items, ordering, header) pass

## Tasks / Subtasks

- [ ] Task 1: Add getTodos to API client layer (AC: #1)
  - [ ] 1.1: Add `getTodos()` fetch wrapper to `frontend/src/api/todos.ts`
  - [ ] 1.2: GET `/api/todos`, return `Todo[]` array
  - [ ] 1.3: Add unit tests in `frontend/src/__tests__/api/todos.test.ts`

- [ ] Task 2: Add useTodos query hook (AC: #1)
  - [ ] 2.1: Add `useTodos()` hook to `frontend/src/hooks/useTodos.ts` using `useQuery` with `QUERY_KEYS.TODOS`
  - [ ] 2.2: Return `{ todos, isLoading, isError }` from the hook
  - [ ] 2.3: Add unit tests in `frontend/src/__tests__/hooks/useTodos.test.ts`

- [ ] Task 3: Create TodoItem component (AC: #1)
  - [ ] 3.1: Create `frontend/src/components/TodoItem.tsx`
  - [ ] 3.2: Accept `todo: Todo` prop
  - [ ] 3.3: Display task text (1.125rem, font-light) with active styling (`text-text-primary`)
  - [ ] 3.4: Display completed styling: `text-text-secondary`, `line-through`, `italic`
  - [ ] 3.5: Display creation timestamp as uppercase metadata (0.75rem, `text-text-placeholder`, uppercase, letter-spacing)
  - [ ] 3.6: Add transition for completion state (300ms ease via Tailwind `transition-all duration-300`)
  - [ ] 3.7: Add `motion-reduce:transition-none` for reduced motion support
  - [ ] 3.8: Add accessibility: semantic `<li>`, `role="checkbox"`, `aria-checked` for completion state
  - [ ] 3.9: Style hover state: left border color change to `border` token, subtle surface hover bg

- [ ] Task 4: Create TodoList component (AC: #1)
  - [ ] 4.1: Create `frontend/src/components/TodoList.tsx`
  - [ ] 4.2: Consume `useTodos()` hook to get todos array
  - [ ] 4.3: Render `<ul>` with `role="list"`, `aria-label="Task list"`
  - [ ] 4.4: Map todos to `<TodoItem>` components with `key={todo.id}`
  - [ ] 4.5: Add 2px `border` divider between items (via `border-b border-border` or `divide-y`)

- [ ] Task 5: Extract AppHeader component (AC: #2)
  - [ ] 5.1: Create `frontend/src/components/AppHeader.tsx`
  - [ ] 5.2: Move header markup from `App.tsx` into this component
  - [ ] 5.3: Title: "things to do" (2rem, weight 200, letter-spacing 0.04em, `text-text-primary`)
  - [ ] 5.4: Subtitle: "a simple list" (0.8125rem, uppercase, letter-spacing 0.1em, `text-text-placeholder`)

- [ ] Task 6: Integrate components into App (AC: #1, #2)
  - [ ] 6.1: Update `App.tsx` to use `<AppHeader />`, `<TodoInput />`, `<TodoList />`
  - [ ] 6.2: Layout order: AppHeader → TodoInput → TodoList (24px spacing between sections)
  - [ ] 6.3: Responsive: full-width `px-4` on mobile, `sm:max-w-[640px] sm:mx-auto sm:px-12` on desktop

- [ ] Task 7: Write component tests (AC: #3)
  - [ ] 7.1: Create `frontend/src/__tests__/components/TodoItem.test.tsx`
  - [ ] 7.2: Test active todo displays text in primary color, no strikethrough
  - [ ] 7.3: Test completed todo displays text in secondary color with strikethrough and italic
  - [ ] 7.4: Test timestamp metadata is displayed (uppercase)
  - [ ] 7.5: Test accessibility attributes (`role="checkbox"`, `aria-checked`)
  - [ ] 7.6: Create `frontend/src/__tests__/components/TodoList.test.tsx`
  - [ ] 7.7: Test populated list renders all todos
  - [ ] 7.8: Test todos are rendered in order (first created = first in list)
  - [ ] 7.9: Test list has `role="list"` and `aria-label="Task list"`
  - [ ] 7.10: Create `frontend/src/__tests__/components/AppHeader.test.tsx`
  - [ ] 7.11: Test title "things to do" is rendered
  - [ ] 7.12: Test subtitle "a simple list" is rendered

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Follow Red → Green → Refactor cycle. Write tests FIRST, then implement to make them pass.

**Architectural Boundaries (STRICT — same as Story 2.3):**
- `api/todos.ts` — ONLY place that makes HTTP calls. Components NEVER fetch directly.
- `hooks/useTodos.ts` — ONLY place that manages TanStack Query. Components consume hooks, NEVER `useQuery` directly.
- `components/` — Pure presentational + hook consumption. No business logic, no direct API calls.

**Data Flow for Display:**
```
App loads → TodoList mounts → useTodos() hook → useQuery(QUERY_KEYS.TODOS) → getTodos() API → GET /api/todos → render TodoItem[]
```

**CRITICAL — This story EXTENDS files created in Story 2.3:**
Story 2.3 creates `api/todos.ts` (with `createTodo`), `hooks/useTodos.ts` (with `useCreateTodo`), and modifies `App.tsx`. This story adds to those same files — do NOT overwrite Story 2.3's work.

### API Client — Add getTodos

Add to the existing `frontend/src/api/todos.ts` (alongside `createTodo` from Story 2.3):

```typescript
export async function getTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE_URL}/todos`)
  if (!response.ok) {
    throw new Error('Failed to fetch todos')
  }
  return response.json()
}
```

### useTodos Query Hook

Add to the existing `frontend/src/hooks/useTodos.ts` (alongside `useCreateTodo` from Story 2.3):

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../constants'
import { getTodos, createTodo } from '../api/todos'
import type { Todo } from '../types'

export function useTodos() {
  const { data: todos = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.TODOS,
    queryFn: getTodos,
  })
  return { todos, isLoading, isError }
}

// useCreateTodo already exists from Story 2.3
```

**Key points:**
- Default `data` to empty array `[]` so components don't need to handle `undefined`
- `isLoading` = true only on initial load (no cached data)
- `isError` = true when query fails (for error state — Epic 4 scope)
- `staleTime` is inherited from QueryClient default (60s, set in `main.tsx`)

### TodoItem Component Pattern

```tsx
// frontend/src/components/TodoItem.tsx
import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const formattedDate = new Date(todo.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <li
      role="checkbox"
      aria-checked={todo.completed}
      className="group flex flex-col px-5 py-4 border-l-2 border-transparent hover:border-border hover:bg-surface-hover transition-all duration-300 motion-reduce:transition-none cursor-pointer"
    >
      <span
        className={`text-[1.125rem] font-light transition-all duration-300 motion-reduce:transition-none ${
          todo.completed
            ? 'text-text-secondary line-through italic'
            : 'text-text-primary'
        }`}
      >
        {todo.text}
      </span>
      <span className="text-[0.75rem] uppercase tracking-[0.05em] text-text-placeholder mt-1">
        {formattedDate}
      </span>
    </li>
  )
}
```

**IMPORTANT — Scope Limitation:**
- This story renders todos as **read-only display**. Click-to-toggle and delete are Epic 3 scope.
- Do NOT add onClick handlers for toggle or delete in this story.
- The `cursor-pointer` and `role="checkbox"` are included for forward-compatibility but the click handler comes in Epic 3.
- If you find `cursor-pointer` confusing without a click handler, omit it — Epic 3 will add it.

**Timestamp Format:**
The UX spec says "uppercase metadata showing the creation timestamp." Format the date readably (e.g., "MAR 6, 2026") — the uppercase comes from CSS `uppercase` class, not the date string itself.

### TodoList Component Pattern

```tsx
// frontend/src/components/TodoList.tsx
import { useTodos } from '../hooks/useTodos'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const { todos, isLoading, isError } = useTodos()

  // Loading and error states are Epic 4 scope — render nothing for now
  if (isLoading) return null
  if (isError) return null
  if (todos.length === 0) return null

  return (
    <ul role="list" aria-label="Task list" className="divide-y divide-border">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}
```

**Scope Notes:**
- `isLoading` → returns `null` for now. LoadingState component is Epic 4 (Story 4.2).
- `isError` → returns `null` for now. ErrorState component is Epic 4 (Story 4.3).
- `todos.length === 0` → returns `null` for now. EmptyState component is Epic 4 (Story 4.1).
- These will be replaced with proper state components in Epic 4.

### AppHeader Component — Extract from App.tsx

The header markup already exists in `App.tsx` (from Story 1.1). Extract it into a dedicated component:

```tsx
// frontend/src/components/AppHeader.tsx
export function AppHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-extralight tracking-[0.04em] text-text-primary">
        things to do
      </h1>
      <p className="text-[0.8125rem] font-normal uppercase tracking-[0.1em] text-text-placeholder mt-1">
        a simple list
      </p>
    </header>
  )
}
```

**Note:** The existing App.tsx header uses `text-3xl` (1.875rem). The UX spec says `2rem`. Either is acceptable — `text-3xl` is close enough, but if you want exact spec compliance use `text-[2rem]`. The weight `font-extralight` (200) matches the UX spec exactly.

### Updated App.tsx Layout

```tsx
// frontend/src/components/App.tsx
import { AppHeader } from './AppHeader'
import { TodoInput } from './TodoInput'
import { TodoList } from './TodoList'

export function App() {
  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <main className="mx-auto max-w-[640px] px-4 sm:px-12 py-16">
        <AppHeader />
        <TodoInput />
        <div className="mt-6">
          <TodoList />
        </div>
      </main>
    </div>
  )
}
```

**Responsive layout:**
- Mobile (< 640px): `px-4` padding
- Desktop (640px+): `sm:px-12` padding
- Max width: `max-w-[640px]` centered with `mx-auto`
- Section spacing: `mt-6` (24px) between TodoInput and TodoList

### UX Design Token Reference — TodoItem Visual Spec

**Active Todo:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Text color | #e8e8ed | `text-text-primary` |
| Font size | 1.125rem | `text-[1.125rem]` |
| Font weight | 300 (light) | `font-light` |
| Style | normal | (default) |

**Completed Todo:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Text color | #6b6b7b | `text-text-secondary` |
| Font size | 1.125rem | `text-[1.125rem]` |
| Font weight | 300 (light) | `font-light` |
| Text decoration | line-through | `line-through` |
| Font style | italic | `italic` |

**Timestamp Metadata:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Font size | 0.75rem | `text-[0.75rem]` |
| Color | #4a4a58 | `text-text-placeholder` |
| Transform | uppercase | `uppercase` |
| Letter spacing | 0.05em | `tracking-[0.05em]` |
| Weight | 400 | `font-normal` |

**Item Container:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Padding | 16px vertical, 20px left | `py-4 px-5` |
| Left border (resting) | 2px transparent | `border-l-2 border-transparent` |
| Left border (hover) | 2px #2a2a35 | `hover:border-border` |
| Background (hover) | #24242e | `hover:bg-surface-hover` |
| Transition | all 300ms ease | `transition-all duration-300` |
| Reduced motion | no transition | `motion-reduce:transition-none` |

**List Dividers:**
| Property | Value | Tailwind Class |
|----------|-------|----------------|
| Divider color | #2a2a35 | `divide-border` |
| Divider width | 1px | `divide-y` |

### Testing Patterns

**Component Test with Mocked Hook:**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoItem } from '../../components/TodoItem'
import type { Todo } from '../../types'

const activeTodo: Todo = {
  id: 1,
  text: 'Buy groceries',
  completed: false,
  createdAt: '2026-03-06T10:00:00.000Z',
}

const completedTodo: Todo = {
  id: 2,
  text: 'Walk the dog',
  completed: true,
  createdAt: '2026-03-06T11:00:00.000Z',
}

describe('TodoItem', () => {
  it('renders active todo with primary text color', () => {
    render(<TodoItem todo={activeTodo} />)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('renders completed todo with strikethrough', () => {
    render(<TodoItem todo={completedTodo} />)
    const text = screen.getByText('Walk the dog')
    expect(text).toHaveClass('line-through')
    expect(text).toHaveClass('italic')
  })
})
```

**TodoList test — mock the useTodos hook:**

```tsx
import { vi } from 'vitest'

vi.mock('../../hooks/useTodos', () => ({
  useTodos: () => ({
    todos: [
      { id: 1, text: 'First', completed: false, createdAt: '2026-03-06T10:00:00Z' },
      { id: 2, text: 'Second', completed: true, createdAt: '2026-03-06T11:00:00Z' },
    ],
    isLoading: false,
    isError: false,
  }),
}))
```

**IMPORTANT:** TodoItem is a pure component that takes a `todo` prop — no provider wrapping needed for its tests. TodoList consumes the `useTodos` hook, so mock the hook module.

**`@testing-library/user-event`** is available (`^14.6.1`) for interaction tests if needed.

### Project Structure Notes

**Files to CREATE:**
| File | Purpose |
|------|---------|
| `bmad-todo/frontend/src/components/TodoItem.tsx` | Single todo display with active/completed styling |
| `bmad-todo/frontend/src/components/TodoList.tsx` | List container consuming useTodos hook |
| `bmad-todo/frontend/src/components/AppHeader.tsx` | Extracted header component |
| `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx` | TodoItem component tests |
| `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx` | TodoList component tests |
| `bmad-todo/frontend/src/__tests__/components/AppHeader.test.tsx` | AppHeader component tests |

**Files to MODIFY (created by Story 2.3):**
| File | Change |
|------|--------|
| `bmad-todo/frontend/src/api/todos.ts` | Add `getTodos()` function |
| `bmad-todo/frontend/src/hooks/useTodos.ts` | Add `useTodos()` query hook |
| `bmad-todo/frontend/src/components/App.tsx` | Replace inline header with components, add TodoList |
| `bmad-todo/frontend/src/__tests__/api/todos.test.ts` | Add getTodos tests |
| `bmad-todo/frontend/src/__tests__/hooks/useTodos.test.ts` | Add useTodos query tests |
| `bmad-todo/frontend/src/__tests__/components/App.test.tsx` | Update for new component structure |

**Files NOT to touch:**
- `frontend/src/main.tsx` — QueryClient already configured
- `frontend/src/constants.ts` — QUERY_KEYS already defined
- `frontend/src/types.ts` — Todo interface already defined
- `frontend/src/app.css` — @theme tokens already added by Story 2.3
- `frontend/src/components/TodoInput.tsx` — created by Story 2.3, no changes
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

**Code conventions:**
- No semicolons, single quotes, 2-space indent, trailing commas, print width 100

### Previous Story Intelligence

**From Story 2.3 (Task Input & Creation UI — DIRECT PREDECESSOR):**
- `api/todos.ts` created with `createTodo()` — add `getTodos()` alongside it
- `hooks/useTodos.ts` created with `useCreateTodo()` — add `useTodos()` query hook alongside it
- `App.tsx` modified to include `<TodoInput />` — add `<TodoList />` below it
- `app.css` updated with `@theme` color tokens — all tokens available
- Tailwind color classes confirmed working: `bg-bg`, `text-text-primary`, `text-text-secondary`, `text-text-placeholder`, `text-accent`, `border-border`, `bg-surface-hover`
- `renderWithProviders` test helper pattern established
- `@testing-library/user-event` available for interaction tests

**From Story 2.2 (List Todos API — BACKEND DEPENDENCY):**
- GET /api/todos returns `Todo[]` ordered by `created_at` ASC
- Returns `[]` for empty database
- camelCase response fields match frontend `Todo` type

**From Story 2.1 (Create Todo API):**
- POST endpoint returns created todo — optimistic update replaces temp ID with server ID
- The `useCreateTodo` hook (Story 2.3) already invalidates `QUERY_KEYS.TODOS` on settled — so creating a todo automatically triggers a refetch that the `useTodos()` query hook will pick up

### Scope Boundaries — What This Story Does NOT Include

- **Click-to-toggle completion** — that's Epic 3 (Story 3.3). TodoItem renders state but does not handle toggle clicks.
- **Delete button (×)** — that's Epic 3 (Story 3.4). No delete UI in this story.
- **EmptyState component** — that's Epic 4 (Story 4.1). Render `null` when empty.
- **LoadingState component** — that's Epic 4 (Story 4.2). Render `null` when loading.
- **ErrorState component** — that's Epic 4 (Story 4.3). Render `null` on error.
- **E2E tests** — that's Story 2.5 (full-stack verification).
- **Keyboard navigation between todos** (Arrow Up/Down) — that's Epic 5 (Story 5.2).

This story focuses purely on **displaying todos** — the visual presentation layer.

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `react` | ^19.2.0 | Component rendering |
| `@tanstack/react-query` | ^5.90.21 | useQuery for fetching todos |
| `tailwindcss` | ^4.2.1 | Utility classes for styling |
| `@testing-library/react` | ^16.3.2 | render, screen for component tests |
| `vitest` | ^4.0.18 | Test runner, vi.mock() |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already in `package.json`.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — component structure, hook pattern, query keys
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — api/ hooks/ components/ separation
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading States] — isLoading vs isFetching handling
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TodoItem] — component visual spec, states, transitions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TodoList] — list container spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography] — type scale, weights
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Palette] — active vs completed color tokens
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Transition Patterns] — 300ms completion toggle animation
- [Source: _bmad-output/planning-artifacts/prd.md#FR2,FR7,FR8,FR9] — view list, visual distinction, scannable, ordering
- [Source: _bmad-output/implementation-artifacts/2-3-task-input-creation-ui.md] — predecessor story patterns, shared files
- [Source: _bmad-output/implementation-artifacts/2-2-list-todos-api-endpoint.md] — GET /api/todos contract

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
