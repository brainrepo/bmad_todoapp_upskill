# Story 3.1: Toggle Todo Completion API Endpoint

Status: done

## Story

As a user,
I want to mark a task as complete or revert it to active via the API,
So that I can track what I've accomplished.

## Acceptance Criteria (BDD)

1. **Given** an active todo with `id: 1` exists (`completed: false`)
   **When** `PATCH /api/todos/1` is called with `{ "completed": true }`
   **Then** the response is `200` with the updated todo: `{ "id": 1, "text": "...", "completed": true, "createdAt": "..." }`

2. **Given** a completed todo with `id: 1` exists (`completed: true`)
   **When** `PATCH /api/todos/1` is called with `{ "completed": false }`
   **Then** the response is `200` with the updated todo showing `completed: false`

3. **Given** no todo with `id: 999` exists
   **When** `PATCH /api/todos/999` is called
   **Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Todo not found" }`

4. **Given** the endpoint is implemented
   **When** integration tests are run
   **Then** toggle scenarios (complete, uncomplete, not found) pass

## Tasks / Subtasks

- [x] Task 1: Add PATCH schema to schemas/todos.ts (AC: #1, #2, #3)
  - [x] 1.1: Add `patchTodoBodySchema` — `{ completed: boolean }`, required, no additionalProperties
  - [x] 1.2: Add `patchTodoParamsSchema` — `{ id: integer }`, required
  - [x] 1.3: Reuse existing `createTodoResponseSchema` for 200 response (same shape)
  - [x] 1.4: Reuse existing `errorResponseSchema` for 404 response

- [x] Task 2: Add `toggleTodo` service function to services/todos.ts (AC: #1, #2, #3)
  - [x] 2.1: Write service unit tests FIRST (TDD Red phase)
  - [x] 2.2: Implement `toggleTodo(db, id, completed)` → returns `Todo | null`
  - [x] 2.3: Use `UPDATE ... SET completed = ? WHERE id = ? RETURNING ...` SQL
  - [x] 2.4: Reuse existing `mapTodoRow` for snake_case → camelCase mapping
  - [x] 2.5: Return `null` if no row affected (id not found)

- [x] Task 3: Add PATCH route handler to routes/todos.ts (AC: #1, #2, #3)
  - [x] 3.1: Write route integration tests FIRST (TDD Red phase)
  - [x] 3.2: Register `PATCH /api/todos/:id` with schema validation
  - [x] 3.3: Extract `id` from params and `completed` from body
  - [x] 3.4: Call `toggleTodo` service
  - [x] 3.5: Return 200 with updated todo, or throw `server.httpErrors.notFound('Todo not found')`

- [x] Task 4: Verify all existing tests still pass (AC: #4)
  - [x] 4.1: Run full backend test suite — zero regressions (35/35 pass)
  - [x] 4.2: Verify GET and POST endpoints unchanged (13 existing route tests + 7 service tests all pass)

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Write tests FIRST (Red), implement to pass (Green), then refactor. This is the established project methodology.

**Layer Boundaries — MANDATORY:**
- `routes/todos.ts` — HTTP orchestration only (validation → service → response). NO SQL here.
- `services/todos.ts` — Data access layer. ALL SQL lives here. Uses `mapTodoRow` for mapping.
- `schemas/todos.ts` — JSON Schema definitions for Fastify validation.

### Existing Code to Reuse (DO NOT REINVENT)

**`mapTodoRow` helper** (services/todos.ts:4-11):
```typescript
function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  }
}
```
This is already extracted as a DRY helper from Story 2.2. Use it directly — do NOT create a new mapping function.

**`createTodoResponseSchema`** (schemas/todos.ts:10-19):
The PATCH 200 response has the same shape as POST 201 (id, text, completed, createdAt). Reuse this schema — do NOT create a duplicate.

**`errorResponseSchema`** (schemas/todos.ts:26-34):
Already defined for 400 errors. Reuse for 404 responses.

**Types** (types.ts):
`TodoRow` and `Todo` interfaces are already defined. No changes needed.

### Files to MODIFY (no new files needed)

| File | Change |
|------|--------|
| `backend/src/schemas/todos.ts` | Add `patchTodoBodySchema`, `patchTodoParamsSchema` |
| `backend/src/services/todos.ts` | Add `toggleTodo` function |
| `backend/src/routes/todos.ts` | Add PATCH `/api/todos/:id` route handler |
| `backend/__tests__/services/todos.test.ts` | Add `toggleTodo` service tests |
| `backend/__tests__/routes/todos.test.ts` | Add `PATCH /api/todos/:id` route tests |

**Files NOT to touch:**
- All frontend files — this is a backend-only story
- `backend/src/plugins/database.ts` — schema already has `completed` column
- `backend/src/types.ts` — `TodoRow` and `Todo` already support completion
- `backend/src/server.ts` — no changes needed
- `backend/src/index.ts` — no changes needed

### Implementation Details

**New Schema — `patchTodoBodySchema`:**
```typescript
export const patchTodoBodySchema = {
  type: 'object',
  required: ['completed'],
  properties: {
    completed: { type: 'boolean' },
  },
  additionalProperties: false,
} as const
```

**New Schema — `patchTodoParamsSchema`:**
```typescript
export const patchTodoParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer' },
  },
} as const
```

**New Service — `toggleTodo`:**
```typescript
export function toggleTodo(db: BetterSqlite3.Database, id: number, completed: boolean): Todo | null {
  const row = db
    .prepare('UPDATE todos SET completed = ? WHERE id = ? RETURNING id, text, completed, created_at')
    .get(completed ? 1 : 0, id) as TodoRow | undefined

  return row ? mapTodoRow(row) : null
}
```

Key decisions:
- SQLite stores booleans as 0/1 integers, so convert `completed ? 1 : 0` before SQL
- Use `RETURNING` clause (already established in createTodo) for atomic update+fetch
- Return `null` for not-found instead of throwing — let the route layer decide the HTTP error

**New Route — `PATCH /api/todos/:id`:**
```typescript
server.patch(
  '/api/todos/:id',
  {
    schema: {
      params: patchTodoParamsSchema,
      body: patchTodoBodySchema,
      response: {
        200: createTodoResponseSchema,
        404: errorResponseSchema,
      },
    },
  },
  async (request) => {
    const { id } = request.params as { id: number }
    const { completed } = request.body as { completed: boolean }

    const todo = toggleTodo(server.db, id, completed)
    if (!todo) {
      throw server.httpErrors.notFound('Todo not found')
    }

    return todo
  },
)
```

### Testing Requirements

**Service Unit Tests** (add to `backend/__tests__/services/todos.test.ts`):

New `describe('TodoService - toggleTodo')` block with self-contained server instance:
- `toggleTodo` updates active → completed and returns mapped result
- `toggleTodo` updates completed → active and returns mapped result
- `toggleTodo` returns null for non-existent ID
- Result uses camelCase (createdAt, not created_at)
- `completed` is boolean, not integer

**Route Integration Tests** (add to `backend/__tests__/routes/todos.test.ts`):

New `describe('PATCH /api/todos/:id')` block with self-contained server instance:
- Returns 200 with updated todo when marking as completed
- Returns 200 with updated todo when reverting to active
- Returns 404 with error contract for non-existent ID
- Response has `application/json` content-type
- Response fields are camelCase (not snake_case)
- `completed` field is boolean (not integer)

**Test Patterns to Follow** (from Epic 2):
- Each `describe` block uses its own `buildServer({ logger: false })` instance for isolation
- Use `server.inject()` for HTTP-level testing
- Assert on full error contract shape: `{ statusCode, error, message }`
- Verify content-type header includes `application/json`
- Verify camelCase field names and boolean typing explicitly

**Anti-patterns to AVOID:**
- Do NOT share server instances across describe blocks (causes test pollution)
- Do NOT use `server.db.prepare()` in route tests to verify DB state — test via API responses
- Do NOT test internal SQL in route tests — that's the service test's job

### Previous Story Intelligence

**From Epic 2 Retrospective:**
- TDD discipline was maintained across all 5 stories — zero regressions. Continue this.
- Code reviews found Content-Type assertions and test isolation issues repeatedly. Pre-emptively include these checks.
- The `mapTodoRow` DRY helper was extracted in Story 2.2 — reuse it here.
- Commit after completing this story (action item from retro — Epic 2 had no intermediate commits).

**From Story 2.1 (Create Todo API):**
- POST route pattern: schema → body extraction → trim → validate → service call → reply.status().send()
- Error handling: `server.httpErrors.badRequest()` for validation errors
- Integration test pattern: `server.inject({ method, url, payload })` → assert statusCode, headers, body

**From Story 2.2 (List Todos API):**
- GET route pattern: schema → service call → return
- Self-contained server per describe block for test isolation
- `mapTodoRow` established as the single mapping point

### Git Intelligence

**Recent commit pattern:** `feat: Story X.Y: Description`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas, print width 100

**Commit after this story:** `feat: Story 3.1: Toggle Todo Completion API Endpoint`

### Scope Boundaries — What This Story Does NOT Include

- **Delete endpoint** — that's Story 3.2
- **Frontend UI toggle** — that's Story 3.3
- **Frontend UI delete** — that's Story 3.4
- **E2E tests** — that's Story 3.5
- **Optimistic updates** — that's Epic 4 (Story 4.4)
- **Error notifications** — that's Epic 4 (Story 4.3)
- **Accessibility** — that's Epic 5

This story is **backend-only**: schema + service + route + tests.

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `fastify` | ^5.5.x | Route handler, httpErrors |
| `better-sqlite3` | ^12.6.x | SQL UPDATE with RETURNING |
| `@fastify/sensible` | (installed) | httpErrors.notFound() |
| `vitest` | ^4.x | Unit and integration tests |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already installed.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — PATCH /api/todos/:id endpoint definition
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SQLite schema, snake_case → camelCase mapping
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Patterns] — @fastify/sensible error helpers
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, test organization
- [Source: _bmad-output/planning-artifacts/prd.md#FR3,FR4,FR20] — toggle completion, REST API update
- [Source: _bmad-output/implementation-artifacts/epic-2-retrospective.md] — patterns to carry forward, action items
- [Source: bmad-todo/backend/src/services/todos.ts] — mapTodoRow helper, existing service pattern
- [Source: bmad-todo/backend/src/routes/todos.ts] — existing route pattern
- [Source: bmad-todo/backend/src/schemas/todos.ts] — existing schema pattern, reusable schemas

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase service tests: 5 failures (toggleTodo not a function) → GREEN: 12/12 pass
- RED phase route tests: 6 failures (404 — no PATCH route) → GREEN: 19/19 pass
- Full regression suite: 35/35 pass across 4 test files
- Code review: 6 findings (3M, 3L) — all fixed, 38/38 pass after fixes

### Completion Notes List

- Added `patchTodoParamsSchema` and `patchTodoBodySchema` to schemas/todos.ts
- Added `toggleTodo` service function reusing existing `mapTodoRow` helper
- Added PATCH `/api/todos/:id` route handler with schema validation and 404 error handling
- 5 new service unit tests: toggle active→completed, completed→active, null for missing ID, camelCase fields, boolean typing
- 6 new route integration tests: mark completed, revert to active, 404 error contract, camelCase fields, boolean typing, missing field validation
- Reused `todoResponseSchema` (renamed from `createTodoResponseSchema`) for both POST and PATCH responses
- Reused `errorResponseSchema` for 404 response
- TDD Red-Green-Refactor followed for both service and route layers
- Code review fixes: renamed schema for clarity, added 3 edge case tests (additionalProperties stripping, non-boolean type, non-integer ID), updated stale comment in GET test to use PATCH endpoint, added additionalProperties to params schema
- Zero regressions: all existing backend tests continue to pass
- Total backend tests: 38 (was 24, +14 new)

### Change Log

- 2026-03-24: Story 3.1 implemented — PATCH /api/todos/:id endpoint with TDD, 11 new tests
- 2026-03-24: Code review — 6 findings fixed (3M, 3L): renamed schema, added edge case tests, updated stale comment, 3 additional tests

### File List

**Modified:**
- `bmad-todo/backend/src/schemas/todos.ts` — added patchTodoParamsSchema, patchTodoBodySchema; renamed createTodoResponseSchema → todoResponseSchema
- `bmad-todo/backend/src/services/todos.ts` — added toggleTodo function
- `bmad-todo/backend/src/routes/todos.ts` — added PATCH /api/todos/:id route handler; updated schema import name
- `bmad-todo/backend/__tests__/services/todos.test.ts` — added 5 toggleTodo service tests
- `bmad-todo/backend/__tests__/routes/todos.test.ts` — added 9 PATCH route tests; updated GET test to use PATCH endpoint instead of raw DB
