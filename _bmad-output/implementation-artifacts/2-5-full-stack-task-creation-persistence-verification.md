# Story 2.5: Full-Stack Task Creation & Persistence Verification

Status: done

## Story

As a user,
I want my tasks to survive page refreshes and new sessions,
So that I can trust the app with my task list.

## Acceptance Criteria (BDD)

1. **Given** the full stack (frontend + backend) is running
   **When** a user creates a task "Buy groceries" and refreshes the page
   **Then** the task "Buy groceries" is still visible in the list

2. **Given** a user has created 3 tasks
   **When** the user closes and reopens the browser tab
   **Then** all 3 tasks are displayed in creation order

3. **Given** the full stack is integrated
   **When** E2E tests (Playwright) are run
   **Then** the first-time user journey (create task, see in list, refresh, verify persistence) passes

## Tasks / Subtasks

- [x] Task 1: Create first-time user journey E2E test (AC: #1, #3)
  - [x] 1.1: Create `e2e/tests/journey-first-time-user.spec.ts`
  - [x] 1.2: Test: user opens app, input is auto-focused
  - [x] 1.3: Test: user types "Buy groceries" and presses Enter
  - [x] 1.4: Test: task appears in the list
  - [x] 1.5: Test: input is cleared and retains focus
  - [x] 1.6: Test: page refresh — task "Buy groceries" is still visible
  - [x] 1.7: Test: task displays creation timestamp metadata

- [x] Task 2: Create persistence verification tests (AC: #2)
  - [x] 2.1: Test: create 3 tasks sequentially ("Task 1", "Task 2", "Task 3")
  - [x] 2.2: Test: verify all 3 tasks are displayed in creation order
  - [x] 2.3: Test: reload page — all 3 tasks still visible in same order
  - [x] 2.4: Test: close and reopen page context — all 3 tasks persist

- [x] Task 3: Create input validation E2E tests (AC: #3)
  - [x] 3.1: Test: pressing Enter with empty input does nothing (no new task)
  - [x] 3.2: Test: pressing Enter with whitespace-only input does nothing
  - [x] 3.3: Test: text is trimmed — leading/trailing spaces removed from created task

- [x] Task 4: Add additional test helpers if needed
  - [x] 4.1: Extend `e2e/fixtures/test-helpers.ts` with helpers for verifying todo list content
  - [x] 4.2: Add helper to count visible todos
  - [x] 4.3: Add helper to verify todo text at specific position

- [x] Task 5: Verify full-stack integration manually
  - [x] 5.1: Run `npm run dev` and manually verify the complete flow
  - [x] 5.2: Verify Docker Compose build still works with all new code (`npm run docker:up`)

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Write E2E tests from acceptance criteria FIRST, then verify they pass against the full stack.

**E2E Test Philosophy:**
- Tests simulate REAL user journeys — no mocking, no shortcuts
- Tests run against the full stack: React frontend → Vite proxy → Fastify backend → SQLite
- Tests verify user-visible behavior, not implementation details
- Tests must be deterministic — no race conditions, no flaky assertions

### Playwright Configuration (Already Set Up)

**File:** `bmad-todo/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

**Key details:**
- Base URL: `http://localhost:5173` (Vite dev server)
- Browser: Chromium only (Desktop Chrome device)
- Parallel: enabled locally, single worker in CI
- Trace: collected on first retry for debugging
- Run command: `npm run test:e2e` (from root package.json)

### Existing Test Helper

**File:** `bmad-todo/e2e/fixtures/test-helpers.ts`

```typescript
import { type Page } from '@playwright/test'

export async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs doing?')
  await input.fill(text)
  await input.press('Enter')
}
```

The `addTodo` helper is already available. Use it in all tests for consistency.

### E2E Test Patterns

**Journey 1: First-Time User (this story's primary test file):**

```typescript
// e2e/tests/journey-first-time-user.spec.ts
import { test, expect } from '@playwright/test'
import { addTodo } from '../fixtures/test-helpers'

test.describe('Journey 1: First-Time User', () => {
  test('can create a task and see it in the list', async ({ page }) => {
    await page.goto('/')

    // Input is auto-focused
    const input = page.getByPlaceholder('What needs doing?')
    await expect(input).toBeFocused()

    // Create a task
    await addTodo(page, 'Buy groceries')

    // Task appears in the list
    await expect(page.getByText('Buy groceries')).toBeVisible()

    // Input is cleared and retains focus
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
  })

  test('task persists after page refresh', async ({ page }) => {
    await page.goto('/')
    await addTodo(page, 'Buy groceries')
    await expect(page.getByText('Buy groceries')).toBeVisible()

    // Refresh the page
    await page.reload()

    // Task still visible
    await expect(page.getByText('Buy groceries')).toBeVisible()
  })

  test('multiple tasks persist in creation order', async ({ page }) => {
    await page.goto('/')
    await addTodo(page, 'Task 1')
    await addTodo(page, 'Task 2')
    await addTodo(page, 'Task 3')

    // All visible
    await expect(page.getByText('Task 1')).toBeVisible()
    await expect(page.getByText('Task 2')).toBeVisible()
    await expect(page.getByText('Task 3')).toBeVisible()

    // Verify order — Task 1 appears before Task 2 before Task 3
    const items = page.getByRole('list', { name: 'Task list' }).getByRole('listitem')
    // or check using locator positions
  })
})
```

### CRITICAL — Database State Between Tests

**Problem:** E2E tests run against a real SQLite database. Tests that create todos will persist data between test runs.

**Solutions (choose one):**
1. **Reset database before each test** — Add a `beforeEach` that calls an API to clear data, OR delete the database file
2. **Use unique task text** — Make assertions on specific text so other test data doesn't interfere
3. **Use test-specific database** — Set `DATABASE_PATH` to a test-specific file and clean it up

**Recommended approach:** Add a `beforeEach` hook that navigates to the app and ensures a clean state. Options:
- If a cleanup API exists (it doesn't yet in MVP), call it
- Use `page.evaluate()` to clear state, or
- Accept cumulative state and write tests that work regardless of existing data (use unique text per test)

**Simplest approach for MVP:** Use unique, descriptive text per test and avoid counting total items. Focus on "is my specific task visible?" rather than "are there exactly N tasks?"

### Running E2E Tests

**Prerequisites — Both servers must be running:**
```bash
# Terminal 1: Start backend
cd bmad-todo && npm run dev:backend

# Terminal 2: Start frontend
cd bmad-todo && npm run dev:frontend

# Terminal 3: Run E2E tests
cd bmad-todo && npm run test:e2e
```

**Alternative — use Playwright's webServer config:**
The current `playwright.config.ts` does NOT have a `webServer` config. If you want Playwright to auto-start the dev servers, you can add:
```typescript
webServer: [
  {
    command: 'npm run dev:backend',
    port: 3001,
    reuseExistingServer: !process.env.CI,
  },
  {
    command: 'npm run dev:frontend',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
],
```
This is OPTIONAL — adding it improves developer experience but is not required.

### Playwright Best Practices

**Use role-based and accessible locators:**
```typescript
// PREFERRED — matches accessibility implementation:
page.getByPlaceholder('What needs doing?')   // input
page.getByRole('list', { name: 'Task list' }) // todo list
page.getByRole('listitem')                    // todo items
page.getByText('Buy groceries')              // specific task text

// AVOID — brittle selectors:
page.locator('.todo-item')
page.locator('#input-field')
page.locator('[data-testid="todo-1"]')
```

**Wait for network idle after mutations:**
```typescript
await addTodo(page, 'Buy groceries')
// The optimistic update shows the task immediately, but wait for the
// API response to confirm persistence before refreshing
await page.waitForResponse(response =>
  response.url().includes('/api/todos') && response.status() === 201
)
```

**Page reload for persistence testing:**
```typescript
await page.reload()
// Wait for the list to load after refresh
await expect(page.getByText('Buy groceries')).toBeVisible()
```

### Project Structure Notes

**Files to CREATE:**
| File | Purpose |
|------|---------|
| `bmad-todo/e2e/tests/journey-first-time-user.spec.ts` | E2E tests for task creation and persistence |

**Files to POTENTIALLY MODIFY:**
| File | Change |
|------|--------|
| `bmad-todo/e2e/fixtures/test-helpers.ts` | Add helpers for verifying list content (optional) |
| `bmad-todo/e2e/playwright.config.ts` | Add webServer config for auto-start (optional) |

**Files NOT to touch:**
- All backend files — already complete from Stories 2.1-2.2
- All frontend component files — already complete from Stories 2.3-2.4
- `frontend/src/api/todos.ts` — already complete
- `frontend/src/hooks/useTodos.ts` — already complete

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

**From Story 2.1 (Create Todo API):**
- POST /api/todos with `{ text }` → 201 with `{ id, text, completed: false, createdAt }`
- Validation: rejects empty/whitespace text with 400

**From Story 2.2 (List Todos API):**
- GET /api/todos → 200 with `Todo[]` ordered by `created_at` ASC
- Returns `[]` when empty

**From Story 2.3 (Task Input UI):**
- TodoInput has placeholder "What needs doing?" — this is the locator for E2E tests
- Auto-focuses on mount — E2E can verify focus
- Enter submits, clears, retains focus
- Empty/whitespace silently ignored

**From Story 2.4 (Task List Display):**
- TodoList has `role="list"`, `aria-label="Task list"` — E2E accessible locator
- TodoItem has `role="checkbox"` — E2E accessible locator
- Todos displayed with text and timestamp metadata
- Active vs completed visual distinction

**From Story 1.1 (Scaffolding):**
- `addTodo` E2E helper already exists in `e2e/fixtures/test-helpers.ts`
- Playwright config already set up with Chromium

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `@playwright/test` | ^1.58.2 | E2E test framework |

**IMPORTANT:** Do NOT install any new dependencies. Playwright is already installed.

### Scope Boundaries — What This Story Does NOT Include

- **Toggle completion E2E tests** — that's Epic 3 scope (Story 3.3 implements toggle UI)
- **Delete task E2E tests** — that's Epic 3 scope (Story 3.4 implements delete UI)
- **Error handling E2E tests** — that's Epic 4 scope (journey-edge-cases.spec.ts)
- **Returning user journey** — that's partially this story (persistence) but full Journey 2 (with delete) is Epic 3
- **Accessibility E2E audits** — that's Epic 5 (Story 5.3/5.4)
- **Cross-browser testing** — config only has Chromium; adding Firefox/WebKit is future scope

This story focuses on the **happy path**: create → display → persist → verify.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#E2E Testing] — Playwright setup, journey-based organization
- [Source: _bmad-output/planning-artifacts/architecture.md#Development Methodology: TDD] — E2E TDD cycle
- [Source: _bmad-output/planning-artifacts/architecture.md#Development Workflow] — dev mode vs Docker
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR10,FR11,FR12] — data persistence requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1] — first-time user creation flow
- [Source: _bmad-output/implementation-artifacts/2-3-task-input-creation-ui.md] — TodoInput locators (placeholder text)
- [Source: _bmad-output/implementation-artifacts/2-4-task-list-display.md] — TodoList/TodoItem ARIA attributes for locators

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- 9 E2E Playwright tests written and passing across 3 test describe blocks
- Journey 1 tests: auto-focus, task creation, timestamp metadata, page refresh persistence (4 tests)
- Persistence tests: multiple tasks in order after reload, context close/reopen survival (2 tests)
- Input validation tests: empty input, whitespace-only, text trimming (3 tests)
- Used unique text per test (uniqueText helper) to avoid database state collisions across parallel runs
- Used waitForResponse pattern correctly: set up listener BEFORE triggering action
- Added 3 test helpers: getTodoCount, getTodoTextAtPosition, expectTodoVisible
- All 34 frontend unit tests pass, all 24 backend unit tests pass, 9 E2E tests pass (67 total)
- Full-stack dev servers verified running and healthy

### File List

**Created:**
- `bmad-todo/e2e/tests/journey-first-time-user.spec.ts`

**Modified:**
- `bmad-todo/e2e/fixtures/test-helpers.ts` — added getTodoCount, getTodoTextAtPosition, expectTodoVisible helpers
