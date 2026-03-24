# Story 3.2: Delete Todo API Endpoint

Status: done

## Story

As a user,
I want to permanently remove a task via the API,
So that I can clean up tasks I no longer need.

## Acceptance Criteria (BDD)

1. **Given** a todo with `id: 1` exists
   **When** `DELETE /api/todos/1` is called
   **Then** the response is `204 No Content` with an empty body
   **And** the todo is permanently removed from the database

2. **Given** no todo with `id: 999` exists
   **When** `DELETE /api/todos/999` is called
   **Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Todo not found" }`

3. **Given** the endpoint is implemented
   **When** integration tests are run
   **Then** delete scenarios (success, not found) pass

4. **Given** the endpoint is implemented
   **When** API contract validation is run via Postman MCP
   **Then** response status codes (204, 404) and error contract match the architecture spec

## Tasks / Subtasks

- [x] Task 1: Add DELETE params schema to schemas/todos.ts (AC: #1, #2)
  - [x] 1.1: Add `deleteTodoParamsSchema` — `{ id: integer }`, required, additionalProperties false
  - [x] 1.2: No body schema needed (DELETE has no request body)
  - [x] 1.3: No 204 response schema needed (empty body); reuse `errorResponseSchema` for 404

- [x] Task 2: Add `deleteTodo` service function to services/todos.ts (AC: #1, #2)
  - [x] 2.1: Write service unit tests FIRST (TDD Red phase)
  - [x] 2.2: Implement `deleteTodo(db, id)` → returns `boolean` (true if deleted, false if not found)
  - [x] 2.3: Use `DELETE FROM todos WHERE id = ?` SQL — check `changes > 0` from `run()` result
  - [x] 2.4: No `mapTodoRow` needed (204 returns no body)

- [x] Task 3: Add DELETE route handler to routes/todos.ts (AC: #1, #2)
  - [x] 3.1: Write route integration tests FIRST (TDD Red phase)
  - [x] 3.2: Register `DELETE /api/todos/:id` with params schema validation
  - [x] 3.3: Extract `id` from params
  - [x] 3.4: Call `deleteTodo` service
  - [x] 3.5: Return `reply.status(204).send()` on success, or throw `server.httpErrors.notFound('Todo not found')`

- [x] Task 4: Verify all existing tests still pass (AC: #3)
  - [x] 4.1: Run full backend test suite — zero regressions (47/47 pass)
  - [x] 4.2: Verify GET, POST, and PATCH endpoints unchanged (all 38 existing tests pass)

- [x] Task 5: API contract validation (AC: #4)
  - [x] 5.1: Validate DELETE /api/todos/:id returns 204 with empty body for existing todo
  - [x] 5.2: Validate DELETE /api/todos/:id returns 404 with `{ statusCode, error, message }` for non-existent ID
  - [x] 5.3: Validate error contract shape matches architecture spec (`@fastify/sensible` format)

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Write tests FIRST (Red), implement to pass (Green), then refactor. This is the established project methodology.

**Layer Boundaries — MANDATORY:**
- `routes/todos.ts` — HTTP orchestration only (validation → service → response). NO SQL here.
- `services/todos.ts` — Data access layer. ALL SQL lives here.
- `schemas/todos.ts` — JSON Schema definitions for Fastify validation.

**204 No Content Pattern:**
Unlike POST (201 with body) and PATCH (200 with body), DELETE returns 204 with an empty body on success. This means:
- No response schema needed for 204
- Service function returns `boolean` not `Todo | null`
- Use `reply.status(204).send()` — Fastify requires explicit `.send()` for empty responses

### Existing Code to Reuse (DO NOT REINVENT)

**`patchTodoParamsSchema`** (schemas/todos.ts:26-33):
```typescript
export const patchTodoParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer' },
  },
  additionalProperties: false,
} as const
```
Same shape needed for DELETE params. Create a separate `deleteTodoParamsSchema` for semantic clarity, OR reuse `patchTodoParamsSchema`. Either is acceptable — prefer a new `deleteTodoParamsSchema` for readability.

**`errorResponseSchema`** (schemas/todos.ts:44-52):
Already defined for 400/404 errors. Reuse for 404 response.

**Types** (types.ts):
`TodoRow` and `Todo` interfaces exist but are NOT needed here — DELETE doesn't return a todo.

### Files to MODIFY (no new files needed)

| File | Change |
|------|--------|
| `backend/src/schemas/todos.ts` | Add `deleteTodoParamsSchema` |
| `backend/src/services/todos.ts` | Add `deleteTodo` function |
| `backend/src/routes/todos.ts` | Add DELETE `/api/todos/:id` route handler |
| `backend/__tests__/services/todos.test.ts` | Add `deleteTodo` service tests |
| `backend/__tests__/routes/todos.test.ts` | Add `DELETE /api/todos/:id` route tests |

**Files NOT to touch:**
- All frontend files — this is a backend-only story
- `backend/src/plugins/database.ts` — no schema changes needed
- `backend/src/types.ts` — no new types needed
- `backend/src/server.ts` — no changes needed
- `backend/src/index.ts` — no changes needed

### Implementation Details

**New Schema — `deleteTodoParamsSchema`:**
```typescript
export const deleteTodoParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer' },
  },
  additionalProperties: false,
} as const
```

**New Service — `deleteTodo`:**
```typescript
export function deleteTodo(db: BetterSqlite3.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return result.changes > 0
}
```

Key decisions:
- Returns `boolean` not `Todo | null` — 204 response has no body
- Uses `run()` not `get()` — we only need the `changes` count, not row data
- No `RETURNING` clause needed (unlike createTodo and toggleTodo)
- No `mapTodoRow` needed since we don't return a todo object

**New Route — `DELETE /api/todos/:id`:**
```typescript
server.delete(
  '/api/todos/:id',
  {
    schema: {
      params: deleteTodoParamsSchema,
      response: {
        404: errorResponseSchema,
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: number }

    const deleted = deleteTodo(server.db, id)
    if (!deleted) {
      throw server.httpErrors.notFound('Todo not found')
    }

    return reply.status(204).send()
  },
)
```

### Testing Requirements

**Service Unit Tests** (add to `backend/__tests__/services/todos.test.ts`):

New `describe('TodoService - deleteTodo')` block with self-contained server instance:
- `deleteTodo` returns `true` for existing todo
- `deleteTodo` returns `false` for non-existent ID
- After `deleteTodo`, the todo no longer appears in `getAllTodos` result
- Deleting an already-deleted todo returns `false`

**Route Integration Tests** (add to `backend/__tests__/routes/todos.test.ts`):

New `describe('DELETE /api/todos/:id')` block with self-contained server instance:
- Returns 204 with empty body for existing todo
- Returns 404 with error contract for non-existent ID
- Todo is no longer returned by GET /api/todos after deletion
- Returns 400 for non-integer id parameter (e.g., `/api/todos/abc`)
- Response body is empty on 204 (not JSON)

**Test Patterns to Follow** (from Story 3.1):
- Each `describe` block uses its own `buildServer({ logger: false })` instance for isolation
- Use `server.inject()` for HTTP-level testing
- Assert on full error contract shape: `{ statusCode, error, message }`
- Verify content-type header behavior (no content-type on 204)
- Service tests use `server.ready()` in `beforeAll` for DB access

**Anti-patterns to AVOID:**
- Do NOT share server instances across describe blocks (causes test pollution)
- Do NOT use `server.db.prepare()` in route tests to verify DB state — test via API responses (e.g., GET after DELETE)
- Do NOT test internal SQL in route tests — that's the service test's job
- Do NOT send a request body on DELETE — the endpoint has no body schema

### Previous Story Intelligence

**From Story 3.1 (Toggle Todo API):**
- PATCH route pattern: params schema + body schema → extract → service call → return/throw
- DELETE is simpler: params schema only, no body, no response body
- Error handling: `server.httpErrors.notFound('Todo not found')` — use identical message for consistency
- Service unit tests: self-contained server per describe block, `beforeAll(server.ready())`, `afterAll(server.close())`
- Route integration tests: `server.inject({ method, url })` → assert statusCode, body
- Code review found importance of: additionalProperties on params schema, edge case tests for invalid types
- Total tests after 3.1: 38 (expect ~44-48 after this story)

**From Epic 2 Retrospective:**
- TDD discipline: maintained across all stories — zero regressions. Continue this.
- Content-Type assertions: important for route tests (though 204 has no content-type)
- Test isolation: each describe block must have its own server instance
- Commit after completing this story: `feat: Story 3.2: Delete Todo API Endpoint`

### Git Intelligence

**Commit pattern:** `feat: Story X.Y: Description`
**Code style:** No semicolons, single quotes, 2-space indent, trailing commas, print width 100

### Scope Boundaries — What This Story Does NOT Include

- **Toggle endpoint** — that's Story 3.1 (already done)
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
| `fastify` | ^5.5.x | Route handler, httpErrors, reply.status(204).send() |
| `better-sqlite3` | ^12.6.x | SQL DELETE with .run() changes check |
| `@fastify/sensible` | (installed) | httpErrors.notFound() |
| `vitest` | ^4.x | Unit and integration tests |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already installed.

### Project Structure Notes

- Alignment with unified project structure: all modifications in existing files, no new files
- DELETE handler sits in `routes/todos.ts` alongside GET, POST, PATCH — completing the CRUD set
- Service function sits in `services/todos.ts` alongside createTodo, getAllTodos, toggleTodo
- Test files remain in `__tests__/routes/` and `__tests__/services/` mirroring source structure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — acceptance criteria (4 ACs)
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — DELETE /api/todos/:id → 204 No Content
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SQLite schema
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Patterns] — @fastify/sensible error helpers
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, test organization
- [Source: _bmad-output/planning-artifacts/prd.md#FR5,FR20] — delete todo, REST API CRUD
- [Source: _bmad-output/implementation-artifacts/3-1-toggle-todo-completion-api-endpoint.md] — patterns to carry forward
- [Source: bmad-todo/backend/src/services/todos.ts] — existing service pattern
- [Source: bmad-todo/backend/src/routes/todos.ts] — existing route pattern
- [Source: bmad-todo/backend/src/schemas/todos.ts] — existing schema pattern, reusable schemas

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- RED phase service tests: 4 failures (deleteTodo is not a function) → GREEN: 16/16 pass
- RED phase route tests: 4 failures (404 — Route DELETE not found) → GREEN: 27/27 pass
- Full regression suite: 47/47 pass across 4 test files
- Postman MCP contract validation: 9/9 assertions pass via Newman (collection ID: 77b72556-ab8f-446f-b143-efe518566c8f)
- Code review: 5 findings (3M, 2L) — all fixed, 49/49 pass after fixes

### Completion Notes List

- Added `todoIdParamsSchema` (shared) to schemas/todos.ts with `minimum: 1` for ID validation
- Added `deleteTodo` service function using `run().changes > 0` pattern (no RETURNING needed)
- Added DELETE `/api/todos/:id` route handler with params validation and 404 error handling
- 4 new service unit tests: delete existing, delete non-existent, verify removal via getAllTodos, double-delete
- 7 new route integration tests: 204 empty body + content-type absence, 404 error contract + content-type, verify removal via GET, invalid id param, negative id param, body ignored on DELETE, double-delete
- TDD Red-Green-Refactor followed for both service and route layers
- Reused `errorResponseSchema` for 404 response
- Postman MCP collection created and validated via Newman CLI against live server
- Code review fixes: consolidated duplicate params schemas into `todoIdParamsSchema`, added `minimum: 1`, added content-type assertions, added edge case tests
- Zero regressions: all existing backend tests continue to pass
- Total backend tests: 49 (was 38, +11 new)

### Change Log

- 2026-03-24: Story 3.2 implemented — DELETE /api/todos/:id endpoint with TDD, 9 new tests
- 2026-03-24: Code review — 5 findings fixed (3M, 2L): consolidated params schemas with minimum:1, added content-type and edge case tests, 2 additional tests
- 2026-03-24: AC #4 validated — Postman MCP collection created, Newman CLI 9/9 assertions pass

### File List

**Modified:**
- `bmad-todo/backend/src/schemas/todos.ts` — replaced `patchTodoParamsSchema` + `deleteTodoParamsSchema` with shared `todoIdParamsSchema` (with `minimum: 1`)
- `bmad-todo/backend/src/services/todos.ts` — added deleteTodo function
- `bmad-todo/backend/src/routes/todos.ts` — added DELETE /api/todos/:id route handler; updated PATCH + DELETE to use shared `todoIdParamsSchema`
- `bmad-todo/backend/__tests__/services/todos.test.ts` — added 4 deleteTodo service tests
- `bmad-todo/backend/__tests__/routes/todos.test.ts` — added 7 DELETE route integration tests (including review fixes)
