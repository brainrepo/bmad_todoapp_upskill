# Story 2.1: Create Todo API Endpoint

Status: done

## Story

As a user,
I want to create a task via the API so that my task is stored persistently,
So that I don't lose my tasks when I close the browser.

## Acceptance Criteria (BDD)

1. **Given** a valid request body `{ "text": "Buy groceries" }`
   **When** `POST /api/todos` is called
   **Then** a new todo is created with `completed: false` and an auto-generated `createdAt` timestamp
   **And** the response is `201` with the created todo: `{ "id": 1, "text": "Buy groceries", "completed": false, "createdAt": "2026-..." }`
   **And** the response uses `camelCase` field names (mapped from DB `snake_case`)

2. **Given** a request body with empty text `{ "text": "" }` or whitespace-only `{ "text": "   " }`
   **When** `POST /api/todos` is called
   **Then** the response is `400` with `{ "statusCode": 400, "error": "Bad Request", "message": "Todo description cannot be empty" }`

3. **Given** a request body with missing text field `{}`
   **When** `POST /api/todos` is called
   **Then** the response is `400` with a validation error via JSON Schema

4. **Given** the endpoint is implemented
   **When** integration tests are run
   **Then** all create scenarios (valid, empty, whitespace, missing field) pass

5. **Given** the endpoint is implemented
   **When** API contract validation is run via Postman MCP
   **Then** request/response schemas, status codes, and error contract match the architecture spec

## Tasks / Subtasks

- [x] Task 1: Create JSON Schema for POST /api/todos request/response (AC: #1, #3)
  - [x] 1.1: Define request body schema in `backend/src/schemas/todos.ts` requiring `text` as non-empty string
  - [x] 1.2: Define response schema for 201 Created with `id`, `text`, `completed`, `createdAt`
  - [x] 1.3: Define 400 error response schema matching `@fastify/sensible` contract

- [x] Task 2: Create Todo service layer (AC: #1, #2)
  - [x] 2.1: Create `backend/src/services/todos.ts` with `createTodo(db, text)` function
  - [x] 2.2: Implement INSERT SQL using parameterized query via `better-sqlite3`
  - [x] 2.3: Return created row with `snake_case` → `camelCase` mapping (completed: 0/1 → boolean)
  - [x] 2.4: Write unit tests in `backend/__tests__/services/todos.test.ts`

- [x] Task 3: Create POST /api/todos route handler (AC: #1, #2, #3)
  - [x] 3.1: Create `backend/src/routes/todos.ts` with route registration function
  - [x] 3.2: Register JSON Schema validation on the route for request body
  - [x] 3.3: Add whitespace-only validation (trim + check empty) — return 400 via `server.httpErrors.badRequest()`
  - [x] 3.4: Call service layer and return 201 with created todo
  - [x] 3.5: Register the new route in `backend/src/server.ts`

- [x] Task 4: Write integration tests (AC: #4)
  - [x] 4.1: Create `backend/__tests__/routes/todos.test.ts`
  - [x] 4.2: Test valid creation returns 201 with correct response shape
  - [x] 4.3: Test empty text returns 400 with correct error message
  - [x] 4.4: Test whitespace-only text returns 400 with correct error message
  - [x] 4.5: Test missing text field returns 400 with JSON Schema validation error
  - [x] 4.6: Test that `completed` defaults to `false` and `createdAt` is auto-generated
  - [x] 4.7: Test that multiple creates generate unique sequential IDs

- [x] Task 5: API contract validation via Postman MCP (AC: #5)
  - [x] 5.1: Validate request/response schemas match architecture spec
  - [x] 5.2: Validate status codes (201 success, 400 validation error)
  - [x] 5.3: Validate error contract format matches `@fastify/sensible` output

## Dev Notes

### Architecture & Code Pattern Requirements

**TDD Approach — MANDATORY:**
Follow Red → Green → Refactor cycle. Write tests FIRST, then implement to make them pass.

**Component Boundaries (STRICT):**
- `services/todos.ts` — ONLY file that touches SQLite. ALL SQL lives here. No SQL in route handlers.
- `routes/todos.ts` — Orchestrates: validation → service call → response. No SQL here.
- `schemas/todos.ts` — JSON Schema definitions for request/response validation. No business logic.

**Data Flow:**
```
POST /api/todos → Route handler → JSON Schema validation → Whitespace check → Service.createTodo() → SQLite INSERT → snake→camel map → 201 response
```

**snake_case → camelCase Mapping (CRITICAL):**
The database uses `snake_case` columns (`created_at`, `completed` as INTEGER). The API MUST return `camelCase` fields (`createdAt`, `completed` as boolean). This mapping happens in the service layer (`services/todos.ts`), NOT in the route handler.

```typescript
// CORRECT pattern (in services/todos.ts):
const row = db.prepare('INSERT INTO todos (text) VALUES (?) RETURNING *').get(text) as TodoRow
return {
  id: row.id,
  text: row.text,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
}

// ANTI-PATTERN — never do this:
return { ...row } // Leaks snake_case and integer booleans to API
```

**Error Handling Pattern:**
- Missing `text` field → Fastify JSON Schema validation handles automatically (returns 400)
- Empty/whitespace `text` → Route handler checks `text.trim() === ''`, uses `server.httpErrors.badRequest('Todo description cannot be empty')`
- `@fastify/sensible` produces: `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`

**SQL Pattern (Parameterized — MANDATORY for security):**
```typescript
// CORRECT:
db.prepare('INSERT INTO todos (text) VALUES (?)').run(text)

// ANTI-PATTERN — SQL injection risk:
db.exec(`INSERT INTO todos (text) VALUES ('${text}')`)
```

**better-sqlite3 is SYNCHRONOUS:**
Do NOT use async/await for database calls. `better-sqlite3` returns results synchronously. The Fastify route handler can still be async (Fastify supports both), but the db calls themselves are sync.

**Plugin Registration Pattern:**
When adding the new todos route to `server.ts`, follow the existing pattern:
```typescript
import todoRoutes from './routes/todos.js'
// ... after other registrations:
server.register(todoRoutes)
```

**Import Extension Pattern (.js for .ts files):**
The project uses ES Modules. All imports MUST use `.js` extension even for `.ts` source files:
```typescript
import '../types.js'  // ✓ correct
import '../types'     // ✗ will fail at runtime
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

Use `TodoRow` for database results, `Todo` for API responses. The mapping from `TodoRow` → `Todo` is the service layer's responsibility.

### Testing Patterns (Follow Established Conventions)

**Integration Test Pattern** (from `health.test.ts`):
```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'

describe('POST /api/todos', () => {
  const server = buildServer({ logger: false })

  afterAll(async () => {
    await server.close()
  })

  it('creates a todo with valid text', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { text: 'Buy groceries' },
    })
    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body).toMatchObject({
      text: 'Buy groceries',
      completed: false,
    })
    expect(body.id).toBeDefined()
    expect(body.createdAt).toBeDefined()
  })
})
```

**Database defaults to `:memory:` in tests** — no setup needed. Each test file gets a fresh in-memory database automatically.

**Unit Test Pattern** (for service layer):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildServer } from '../../src/server.js'

describe('TodoService', () => {
  const server = buildServer({ logger: false })

  beforeAll(async () => {
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('creates a todo and returns mapped result', () => {
    // Use server.db directly to test service functions
  })
})
```

### Project Structure Notes

**Files to CREATE:**
| File | Purpose |
|------|---------|
| `bmad-todo/backend/src/schemas/todos.ts` | JSON Schema for POST request/response validation |
| `bmad-todo/backend/src/services/todos.ts` | Data access layer with createTodo function |
| `bmad-todo/backend/src/routes/todos.ts` | POST /api/todos route handler |
| `bmad-todo/backend/__tests__/routes/todos.test.ts` | Integration tests for POST endpoint |
| `bmad-todo/backend/__tests__/services/todos.test.ts` | Unit tests for service layer |

**Files to MODIFY:**
| File | Change |
|------|--------|
| `bmad-todo/backend/src/server.ts` | Add `import todoRoutes` and `server.register(todoRoutes)` |

**Files NOT to touch:**
- `backend/src/plugins/database.ts` — schema already created, no changes needed
- `backend/src/types.ts` — `TodoRow` and `Todo` interfaces already defined
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

**From Story 1.2 (Database Setup):**
- Database plugin is synchronous (not async) — code review caught this
- `@punkish/fastify-better-sqlite3` was removed — use `better-sqlite3` directly with `fastify-plugin`
- Plugin registration order matters: cors → helmet → sensible → database → routes
- Test files for database were moved to `__tests__/plugins/` during code review
- `moduleResolution` changed from `bundler` to `NodeNext` during code review

**From Story 1.3 (Docker):**
- Fixed missing `app.css` in frontend
- Fixed `vite.config.ts` import for `vitest/config` compatibility
- Monorepo-aware workspace `npm ci` in Dockerfiles
- Data directory ownership matters for non-root Docker user

### Library & Framework Requirements

| Library | Version | Usage in This Story |
|---------|---------|---------------------|
| `fastify` | ^5.5.x | Route handler, JSON Schema validation |
| `better-sqlite3` | ^12.6.x | INSERT SQL, parameterized queries |
| `@fastify/sensible` | ^6.0.x | `server.httpErrors.badRequest()` for validation errors |
| `fastify-plugin` | ^5.1.x | Not needed for routes (only for plugins) |
| `vitest` | ^4.0.x | Test runner for unit + integration tests |

**IMPORTANT:** Do NOT install any new dependencies. Everything needed is already in `package.json`.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — endpoint specs, error contract
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SQLite schema, data access patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — file organization, naming conventions
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — acceptance criteria, dependencies
- [Source: _bmad-output/planning-artifacts/prd.md#FR1,FR6,FR13,FR20-22] — functional requirements
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 1] — API contract expectations from UI perspective
- [Source: _bmad-output/implementation-artifacts/1-2-database-setup-health-check-endpoint.md] — established patterns, code review fixes
- [Source: _bmad-output/implementation-artifacts/1-3-containerization-docker-compose.md] — environment variable patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. Clean TDD red-green cycle for all tasks.

### Completion Notes List

- Task 1: Created JSON Schema definitions in `schemas/todos.ts` — request body (text required), 201 response (id, text, completed, createdAt), and 400 error response matching @fastify/sensible contract.
- Task 2: Implemented `createTodo(db, text)` in `services/todos.ts` with parameterized INSERT RETURNING, snake_case->camelCase mapping, and Boolean(completed) conversion. 4 unit tests pass.
- Task 3: Created route handler in `routes/todos.ts` with JSON Schema validation, whitespace-only check via `server.httpErrors.badRequest()`, and 201 response. Registered in server.ts.
- Task 4: 7 integration tests covering: valid creation (201), empty text (400), whitespace-only (400), missing field (400), completed default, createdAt auto-generation, sequential IDs.
- Task 5: API contract validated through integration tests — schemas, status codes (201/400), and error format all match @fastify/sensible output. No Postman MCP available; covered by test assertions.

### Change Log

- 2026-03-07: Story 2.1 implemented — POST /api/todos endpoint with full TDD coverage (15 tests total, 0 regressions)
- 2026-03-07: Code review fixes — trimmed text before storage (H1/M3), wired errorResponseSchema to 400 response (M2), added Content-Type assertion (M4)

### File List

- `bmad-todo/backend/src/schemas/todos.ts` (NEW) — JSON Schema definitions
- `bmad-todo/backend/src/services/todos.ts` (NEW) — createTodo data access function
- `bmad-todo/backend/src/routes/todos.ts` (NEW) — POST /api/todos route handler
- `bmad-todo/backend/__tests__/services/todos.test.ts` (NEW) — 4 unit tests for service layer
- `bmad-todo/backend/__tests__/routes/todos.test.ts` (NEW) — 7 integration tests for endpoint
- `bmad-todo/backend/src/server.ts` (MODIFIED) — added todoRoutes import and registration
