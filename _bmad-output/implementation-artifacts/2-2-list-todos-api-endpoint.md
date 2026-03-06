# Story 2.2: List Todos API Endpoint

Status: done

## Story

As a user,
I want to retrieve all my tasks from the API,
So that I can see everything I need to do when I open the app.

## Acceptance Criteria (BDD)

1. **Given** multiple todos exist in the database
   **When** `GET /api/todos` is called
   **Then** the response is `200` with an array of all todos ordered by `created_at` ascending
   **And** each todo has `camelCase` fields: `id`, `text`, `completed` (boolean), `createdAt` (ISO 8601)

2. **Given** no todos exist in the database
   **When** `GET /api/todos` is called
   **Then** the response is `200` with an empty array `[]`

3. **Given** the endpoint is implemented
   **When** integration tests are run
   **Then** list scenarios (populated, empty, ordering) pass

4. **Given** the endpoint is implemented
   **When** API contract validation is run via Postman MCP
   **Then** response schema, status codes, and field naming (camelCase) match the architecture spec

## Tasks / Subtasks

- [x] Task 1: Add GET response schema to schemas/todos.ts (AC: #1)
  - [x] 1.1: Add response schema for GET /api/todos — array of todo objects with `id`, `text`, `completed` (boolean), `createdAt` (string)
  - [x] 1.2: Reuse the single todo response schema from Story 2.1 as array item type

- [x] Task 2: Add getAllTodos service function (AC: #1, #2)
  - [x] 2.1: Add `getAllTodos(db)` function to `backend/src/services/todos.ts`
  - [x] 2.2: Implement SELECT SQL with `ORDER BY created_at ASC` using parameterized query
  - [x] 2.3: Map each row from `TodoRow` → `Todo` (snake_case → camelCase, integer → boolean)
  - [x] 2.4: Return empty array `[]` when no rows exist
  - [x] 2.5: Add unit tests for `getAllTodos` in `backend/__tests__/services/todos.test.ts`

- [x] Task 3: Add GET /api/todos route handler (AC: #1, #2)
  - [x] 3.1: Add GET route to existing `backend/src/routes/todos.ts`
  - [x] 3.2: Attach response schema for serialization
  - [x] 3.3: Call `getAllTodos(server.db)` and return result with 200

- [x] Task 4: Write integration tests (AC: #3)
  - [x] 4.1: Add GET tests to `backend/__tests__/routes/todos.test.ts`
  - [x] 4.2: Test empty database returns 200 with `[]`
  - [x] 4.3: Test populated database returns 200 with array of todos
  - [x] 4.4: Test response fields are camelCase (`createdAt`, not `created_at`)
  - [x] 4.5: Test `completed` is boolean (`false`), not integer (`0`)
  - [x] 4.6: Test ordering is by `created_at` ascending (first created = first in array)
  - [x] 4.7: Test multiple todos with mix of completed/active are all returned

- [x] Task 5: API contract validation via Postman MCP (AC: #4)
  - [x] 5.1: Validate response schema matches architecture spec
  - [x] 5.2: Validate status code 200 for both empty and populated responses
  - [x] 5.3: Validate camelCase field naming in response

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Follow Red → Green → Refactor cycle. Write tests FIRST, then implement to make them pass.

**Component Boundaries (STRICT — same as Story 2.1):**
- `services/todos.ts` — ONLY file that touches SQLite. ALL SQL lives here. No SQL in route handlers.
- `routes/todos.ts` — Orchestrates: service call → response. No SQL here.
- `schemas/todos.ts` — JSON Schema definitions for response validation. No business logic.

**Data Flow:**
```
GET /api/todos → Route handler → Service.getAllTodos() → SQLite SELECT → snake→camel map → 200 response with array
```

**CRITICAL — This story EXTENDS files created in Story 2.1:**
Story 2.1 creates `services/todos.ts`, `routes/todos.ts`, and `schemas/todos.ts`. This story adds to those same files — do NOT create duplicate files or overwrite Story 2.1's work. Add the GET handler alongside the existing POST handler.

**snake_case → camelCase Mapping (CRITICAL):**
Reuse the same mapping pattern established in Story 2.1's `createTodo` function:

```typescript
// CORRECT pattern (in services/todos.ts):
function mapTodoRow(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  }
}

export function getAllTodos(db: BetterSqlite3.Database): Todo[] {
  const rows = db.prepare('SELECT id, text, completed, created_at FROM todos ORDER BY created_at ASC').all() as TodoRow[]
  return rows.map(mapTodoRow)
}
```

**Consider extracting a shared `mapTodoRow` helper** if Story 2.1 didn't already — both `createTodo` and `getAllTodos` need the same mapping. DRY principle applies here.

**Response Format — Direct Array, No Wrapper:**
```json
// CORRECT:
[{ "id": 1, "text": "...", "completed": false, "createdAt": "..." }]

// ANTI-PATTERN — no wrapper objects:
{ "data": [...], "count": 1 }
```

**Empty Response — Empty Array, Not Null:**
```json
// CORRECT:
[]

// ANTI-PATTERN:
null
```

**SQL Pattern (Parameterized — MANDATORY for security):**
```typescript
// CORRECT:
db.prepare('SELECT id, text, completed, created_at FROM todos ORDER BY created_at ASC').all()

// NOTE: No parameters needed for this query, but always use .prepare() not .exec()
```

**better-sqlite3 is SYNCHRONOUS:**
Do NOT use async/await for database calls. The `.all()` method returns results synchronously.

**Import Extension Pattern (.js for .ts files):**
All imports MUST use `.js` extension even for `.ts` source files:
```typescript
import { getAllTodos } from '../services/todos.js'  // correct
import { getAllTodos } from '../services/todos'      // will fail
```

### Existing Types to Use

Already defined in `backend/src/types.ts`:
```typescript
export interface TodoRow {
  id: number
  text: string
  completed: number   // SQLite integer 0/1
  created_at: string
}

export interface Todo {
  id: number
  text: string
  completed: boolean  // mapped boolean for API
  createdAt: string   // camelCase for API
}
```

### Testing Patterns (Follow Established Conventions)

**Integration Test Pattern — Add to existing test file:**

Story 2.1 creates `backend/__tests__/routes/todos.test.ts` with POST tests. Add a new `describe('GET /api/todos')` block in the SAME file.

```typescript
describe('GET /api/todos', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('returns empty array when no todos exist', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/todos',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('returns todos ordered by created_at ascending', async () => {
    // Create todos first via POST, then verify GET ordering
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'First' } })
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Second' } })

    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todos = response.json()
    expect(todos).toHaveLength(2)
    expect(todos[0].text).toBe('First')
    expect(todos[1].text).toBe('Second')
  })

  it('returns camelCase fields with correct types', async () => {
    await server.inject({ method: 'POST', url: '/api/todos', payload: { text: 'Test' } })
    const response = await server.inject({ method: 'GET', url: '/api/todos' })
    const todo = response.json()[0]

    expect(todo).toHaveProperty('id')
    expect(todo).toHaveProperty('text')
    expect(todo).toHaveProperty('completed')
    expect(todo).toHaveProperty('createdAt')
    expect(todo).not.toHaveProperty('created_at')  // No snake_case leak
    expect(typeof todo.completed).toBe('boolean')   // Not integer
  })
})
```

**IMPORTANT — Test Isolation:**
Each `describe` block creates its own `buildServer()` instance with a fresh `:memory:` database. Tests within a block share the same database state, so order matters. If needed, use `beforeEach` to reset state, or account for cumulative state in assertions.

**Database defaults to `:memory:` in tests** — no setup needed. Each server instance gets a fresh in-memory database automatically.

### Project Structure Notes

**Files to MODIFY (created by Story 2.1):**
| File | Change |
|------|--------|
| `bmad-todo/backend/src/schemas/todos.ts` | Add GET response schema (array of todo objects) |
| `bmad-todo/backend/src/services/todos.ts` | Add `getAllTodos()` function, extract shared `mapTodoRow` helper |
| `bmad-todo/backend/src/routes/todos.ts` | Add GET /api/todos route handler |
| `bmad-todo/backend/__tests__/routes/todos.test.ts` | Add GET integration tests |
| `bmad-todo/backend/__tests__/services/todos.test.ts` | Add `getAllTodos` unit tests |

**Files NOT to create:**
- NO new files needed — everything extends Story 2.1's files

**Files NOT to touch:**
- `backend/src/server.ts` — todos route already registered by Story 2.1
- `backend/src/plugins/database.ts` — no changes needed
- `backend/src/types.ts` — types already defined
- `backend/src/index.ts` — entry point unchanged
- Any frontend files — this is a backend-only story

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

**From Story 2.1 (Create Todo — DIRECT PREDECESSOR):**
- `services/todos.ts` created with `createTodo()` — add `getAllTodos()` alongside it
- `routes/todos.ts` created with POST handler — add GET handler alongside it
- `schemas/todos.ts` created with POST schemas — add GET response schema alongside it
- `server.ts` already registers `todoRoutes` — no change needed
- snake_case → camelCase mapping pattern established — reuse/extract helper
- Integration test file created at `__tests__/routes/todos.test.ts` — add to it
- Service test file created at `__tests__/services/todos.test.ts` — add to it

**From Story 1.2 (Database Setup):**
- Database plugin is synchronous — don't use async for db calls
- Plugin registration order: cors → helmet → sensible → database → routes
- Test pattern: `buildServer({ logger: false })` + `server.inject()`

**From Story 1.3 (Docker):**
- Environment variable `DATABASE_PATH` defaults to `:memory:` in tests

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `fastify` | ^5.5.x | Route handler, response schema |
| `better-sqlite3` | ^12.6.x | SELECT SQL query |
| `vitest` | ^4.0.x | Test runner for unit + integration tests |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already in `package.json`.

### Key Difference from Story 2.1

This is a simpler story than 2.1:
- No request body validation needed (GET has no body)
- No error cases to handle (just return data or empty array)
- No new files to create (extend existing ones)
- Main complexity: correct ordering and field mapping

The biggest risk is **breaking Story 2.1's work** by incorrectly modifying shared files. Be careful when adding to existing files.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — GET endpoint spec, response format
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SQLite schema, ordering
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — file organization, naming conventions
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — acceptance criteria, dependencies
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — frontend consumer expectations
- [Source: _bmad-output/planning-artifacts/prd.md#FR2,FR10,FR11,FR20] — functional requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1] — UI data loading expectations
- [Source: _bmad-output/implementation-artifacts/2-1-create-todo-api-endpoint.md] — predecessor story patterns, shared files

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. Clean TDD red-green cycle.

### Completion Notes List

- Task 1: Added `listTodosResponseSchema` to `schemas/todos.ts` — array type reusing `createTodoResponseSchema` as item type.
- Task 2: Added `getAllTodos(db)` to `services/todos.ts` with SELECT ORDER BY created_at ASC. Extracted shared `mapTodoRow` helper used by both `createTodo` and `getAllTodos` (DRY refactor). 3 unit tests added.
- Task 3: Added GET /api/todos route to `routes/todos.ts` with response schema. Returns `getAllTodos()` result with 200.
- Task 4: 6 integration tests added: empty array, populated array, camelCase fields, boolean completed, ascending order, mixed completed/active.
- Task 5: API contract validated through integration tests — response schema, 200 status, camelCase naming all verified.

### Change Log

- 2026-03-07: Story 2.2 implemented — GET /api/todos endpoint with 9 new tests (24 total, 0 regressions)
- 2026-03-07: Code review fixes — explicit RETURNING columns in createTodo (M1), self-contained GET tests with isolated server instances (M2/M3), Content-Type assertion on GET (L1)

### File List

- `bmad-todo/backend/src/schemas/todos.ts` (MODIFIED) — added listTodosResponseSchema
- `bmad-todo/backend/src/services/todos.ts` (MODIFIED) — added getAllTodos(), extracted mapTodoRow helper
- `bmad-todo/backend/src/routes/todos.ts` (MODIFIED) — added GET /api/todos route
- `bmad-todo/backend/__tests__/services/todos.test.ts` (MODIFIED) — added 3 getAllTodos unit tests
- `bmad-todo/backend/__tests__/routes/todos.test.ts` (MODIFIED) — added 6 GET integration tests
