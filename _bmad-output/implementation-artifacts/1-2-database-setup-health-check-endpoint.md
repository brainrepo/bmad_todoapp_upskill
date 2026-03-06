# Story 1.2: Database Setup & Health Check Endpoint

Status: done

## Story

As a developer,
I want SQLite initialized with the todos schema and a health check endpoint,
so that the backend data layer and operational monitoring are verified from day one.

## Acceptance Criteria

1. **Given** the backend project from Story 1.1 **When** the backend server starts **Then** SQLite database is initialized via `better-sqlite3` with `@punkish/fastify-better-sqlite3` plugin
2. **Given** the server starts **Then** the `todos` table is created if it doesn't exist with columns: `id` (INTEGER PRIMARY KEY), `text` (TEXT NOT NULL), `completed` (INTEGER DEFAULT 0), `created_at` (TEXT DEFAULT CURRENT_TIMESTAMP)
3. **Given** the server is running **When** `GET /api/health` is called **Then** it returns `200` with `{ "status": "ok" }`
4. **Given** the server starts **Then** Fastify plugins are registered: cors, helmet, sensible, database
5. **Given** the endpoint is implemented **When** integration tests are run **Then** they verify the health check endpoint responds correctly
6. **Given** the endpoint is implemented **When** integration tests are run **Then** they verify the database table exists with the correct schema

## Tasks / Subtasks

- [x] Task 1: Implement database plugin (AC: 1, 2, 4)
  - [x] 1.1: Install `better-sqlite3` and `@punkish/fastify-better-sqlite3` and `fastify-plugin` dependencies
  - [x] 1.2: Create `backend/src/plugins/database.ts` — initialize DB from `DATABASE_PATH` env var (defaults to `:memory:` for tests), run CREATE TABLE IF NOT EXISTS with correct schema, enable WAL mode, decorate `server.db`, close on `onClose` hook
  - [x] 1.3: Augment FastifyInstance type in `backend/src/types.ts` to expose `db: BetterSqlite3.Database`
  - [x] 1.4: Register `databasePlugin` in `backend/src/server.ts`
- [x] Task 2: Implement health check route (AC: 3, 4)
  - [x] 2.1: Create `backend/src/routes/health.ts` — register `GET /api/health` returning `{ status: 'ok' }`
  - [x] 2.2: Register `healthRoutes` in `backend/src/server.ts`
- [x] Task 3: Register remaining plugins (AC: 4)
  - [x] 3.1: Confirm `corsPlugin`, `helmetPlugin`, `sensiblePlugin` are all registered in `server.ts`
- [x] Task 4: Write integration tests (AC: 5, 6)
  - [x] 4.1: Create `backend/__tests__/routes/health.test.ts` — test `GET /api/health` returns 200 `{ status: 'ok' }`
  - [x] 4.2: Create `backend/__tests__/services/database.test.ts` — test todos table exists with correct columns, correct default values (`completed` = 0, `created_at` = CURRENT_TIMESTAMP), verify `db` and `httpErrors` decorators are registered
- [x] Task 5: Run tests and verify all pass

## Dev Notes

### Architecture Requirements

- **Database:** `better-sqlite3` v12.6.x — synchronous, in-process SQLite. Do NOT use async patterns with it.
- **Fastify Plugin Pattern:** Use `fastify-plugin` (`fp`) to unwrap the plugin scope so decorators are visible on the parent instance. All plugins in `src/plugins/` must use `fp(fn, { name: '...' })`.
- **Database Path:** Use `process.env['DATABASE_PATH'] ?? ':memory:'` so tests use in-memory DB automatically (no env var needed in CI).
- **WAL Mode:** Always enable `db.pragma('journal_mode = WAL')` for better concurrent read performance.
- **Schema init:** Use `CREATE TABLE IF NOT EXISTS` — idempotent. No migration framework needed.
- **Plugin registration order in server.ts:** cors → helmet → sensible → database → routes. Order matters for plugin dependency resolution.
- **`@fastify/sensible`** decorates `server.httpErrors` — tests verify this is present.

### Type Augmentation Pattern

```typescript
// backend/src/types.ts
import type BetterSqlite3 from 'better-sqlite3'

declare module 'fastify' {
  interface FastifyInstance {
    db: BetterSqlite3.Database
  }
}

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

### Database Plugin Pattern

```typescript
// backend/src/plugins/database.ts
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import type { FastifyInstance } from 'fastify'
import '../types.js'  // ensure augmentation is in scope

async function databasePlugin(server: FastifyInstance) {
  const dbPath = process.env['DATABASE_PATH'] ?? ':memory:'
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.exec(SCHEMA)
  server.decorate('db', db)
  server.addHook('onClose', () => { db.close() })
}
export default fp(databasePlugin, { name: 'database' })
```

### Testing Pattern

- Tests use `buildServer({ logger: false })` from `../../src/server.js`
- Use `server.inject()` for HTTP testing — no real HTTP server needed
- Use `afterAll(async () => { await server.close() })` for cleanup
- Database tests use `server.ready()` before accessing `server.db`
- Use `pragma_table_info` SQL to inspect schema in tests

### File Locations

| File | Purpose |
|------|---------|
| `bmad-todo/backend/src/plugins/database.ts` | DB init plugin |
| `bmad-todo/backend/src/plugins/cors.ts` | CORS plugin |
| `bmad-todo/backend/src/plugins/helmet.ts` | Helmet plugin |
| `bmad-todo/backend/src/plugins/sensible.ts` | Sensible plugin |
| `bmad-todo/backend/src/routes/health.ts` | Health check route |
| `bmad-todo/backend/src/server.ts` | Server factory: registers all plugins + routes |
| `bmad-todo/backend/src/types.ts` | FastifyInstance augmentation + TodoRow/Todo interfaces |
| `bmad-todo/backend/__tests__/routes/health.test.ts` | Health endpoint integration test |
| `bmad-todo/backend/__tests__/services/database.test.ts` | DB schema + plugin registration tests |

### Previous Story Learnings (from Story 1.1)

- Project uses ES Modules (`"type": "module"`) — all imports must use `.js` extension even for `.ts` source files
- Backend uses `tsx` for dev (`tsx watch src/index.ts`) and `tsc` for build
- Vitest configured in `backend/vitest.config.ts`
- ESLint configured with `typescript-eslint` flat config in `backend/eslint.config.js`
- `@punkish/fastify-better-sqlite3` is listed as a dependency but the actual database plugin is hand-written using `better-sqlite3` directly with `fastify-plugin`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SQLite schema definition
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — health check endpoint
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — test organization in `__tests__/`
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

N/A — story file created after implementation was already in progress.

### Completion Notes List

- All tasks marked complete: implementation was already present in uncommitted code when story file was created.
- Health check route returns `{ status: 'ok' }` with 200.
- Database plugin uses `:memory:` by default (safe for tests), WAL mode enabled.
- All 4 plugins registered in server.ts.
- Two test files cover health endpoint and database schema validation.

### File List

- bmad-todo/backend/src/plugins/database.ts
- bmad-todo/backend/src/plugins/cors.ts
- bmad-todo/backend/src/plugins/helmet.ts
- bmad-todo/backend/src/plugins/sensible.ts
- bmad-todo/backend/src/routes/health.ts
- bmad-todo/backend/src/server.ts
- bmad-todo/backend/src/types.ts
- bmad-todo/backend/tsconfig.json
- bmad-todo/backend/__tests__/routes/health.test.ts
- bmad-todo/backend/__tests__/plugins/database.test.ts
- bmad-todo/backend/eslint.config.js
- bmad-todo/backend/package.json
- bmad-todo/frontend/src/__tests__/components/App.test.tsx
- bmad-todo/frontend/tsconfig.json
- bmad-todo/package-lock.json

## Change Log

| Date | Change |
|------|--------|
| 2026-03-06 | Story file created (implementation already in progress) — database plugin, health route, all plugins, integration tests |
| 2026-03-06 | Code review fixes: H1 tsconfig moduleResolution bundler→NodeNext; M1 database plugin async→sync; M2 removed unused @punkish/fastify-better-sqlite3; M3 File List updated with missing files; M4 database.test.ts moved to __tests__/plugins/ |
