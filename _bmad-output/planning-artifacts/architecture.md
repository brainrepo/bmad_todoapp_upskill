---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
lastStep: 8
status: 'complete'
completedAt: '2026-03-06'
inputDocuments:
  - planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'bmad'
user_name: 'Brainrepo'
date: '2026-03-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

27 functional requirements across 8 categories define the system's capability contract:

- **Task Management (FR1-FR6):** Single-entity CRUD — create todo with text description, view all, toggle completion, delete, auto-assign creation timestamp. No editing in MVP.
- **Task Display (FR7-FR9):** Visual distinction between active/completed, scannable without interaction, consistent ordering.
- **Data Persistence (FR10-FR12):** Backend datastore, cross-session survival, data consistency — no duplicates, orphans, or corruption.
- **Input Handling (FR13-FR15):** Reject empty/whitespace-only, Enter key submission, clear input after success.
- **State Communication (FR16-FR19):** Empty state, loading indicator, non-disruptive error messages, optimistic UI updates before backend confirmation.
- **API Operations (FR20-FR22):** REST API for CRUD, proper error responses, server-side input validation.
- **Responsiveness (FR23-FR24):** Full functionality across 320px–1920px viewports, desktop and mobile.
- **Accessibility (FR25-FR27):** Keyboard navigation, ARIA attributes, WCAG 2.1 AA compliance.

**Non-Functional Requirements:**

- **Performance:** API responses < 200ms, UI feedback < 100ms (optimistic updates), initial load < 1 second, no jank or layout shift.
- **Security:** XSS prevention via input sanitization, injection protection, HTTP security headers (CSP, X-Content-Type-Options), no sensitive data in error responses.
- **Accessibility:** WCAG 2.1 AA — 4.5:1 contrast ratios, visible focus indicators, screen reader support, 44x44px minimum touch targets.
- **Reliability:** Zero data loss in normal operations, failed operations never corrupt existing data, optimistic updates roll back on failure, read-only functionality during transient backend failures.
- **Maintainability:** Consistent coding standards, readable by unfamiliar developers, 70% test coverage (unit + E2E), single `docker-compose up` startup, pinned dependency versions.

**Scale & Complexity:**

- Primary domain: Full-stack web application (SPA + REST API)
- Complexity level: Low — single entity, single user, no auth, no real-time, no third-party integrations
- Estimated architectural components: Frontend SPA, Backend API server, Database, Docker orchestration layer

### Technical Constraints & Dependencies

- **No authentication in MVP** — single shared datastore, no user isolation. Architecture must remain extensible for auth in Phase 2.
- **Docker Compose required** — multi-stage builds, non-root containers, health check endpoints, single-command deployment.
- **Modern evergreen browsers only** — no legacy browser support needed (Chrome, Firefox, Safari, Edge).
- **No SEO requirements** — personal tool, no public-facing content.
- **No real-time requirements** — standard request/response sufficient for single-user CRUD.
- **Test infrastructure from day one** — Jest/Vitest for unit/integration, Playwright for E2E, 70% coverage target.

### Cross-Cutting Concerns Identified

- **Error handling strategy:** Consistent error contract between frontend and backend. Optimistic UI must handle rollback gracefully. Error states must be non-disruptive and informative.
- **Accessibility:** Pervasive across all UI components — semantic HTML, ARIA, keyboard navigation, focus management, contrast ratios. Shapes component architecture fundamentally.
- **Input validation:** Dual-layer — client-side for UX (instant feedback) and server-side for data integrity (security boundary).
- **Containerization:** Affects project structure, build process, environment configuration, and development workflow.
- **Testing:** Influences code structure (testable components, mockable services), CI readiness, and development workflow.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — SPA frontend (React) + REST API backend (Fastify), monorepo structure with independent frontend and backend packages, orchestrated via Docker Compose.

### Starter Options Considered

**Option A: TanStack Start (Full-Stack TanStack)**
TanStack now offers a full-stack meta-framework (TanStack Start) with Router, Query, and SSR built in. However, this is opinionated toward SSR/full-stack rendering and would replace Fastify as the backend — not aligned with the user's preference for a separate Fastify API server.

**Option B: Vite `react-ts` template + manual Fastify setup**
Use Vite's official `react-ts` scaffold for the frontend and manually configure Fastify with TypeScript for the backend. Full control over both layers, no unnecessary abstractions, clean separation of concerns.

**Option C: Nx or Turborepo monorepo scaffold**
Full monorepo tooling with shared configs. Overkill for a low-complexity, single-entity CRUD app with two packages.

### Selected Starter: Vite `react-ts` + Manual Fastify Setup (Option B)

**Rationale for Selection:**
- Clean separation between frontend SPA and backend API — matches the PRD's architecture pattern
- No unnecessary abstractions or framework lock-in
- Full control over both layers for a deliberately minimal project
- Both Vite and Fastify are lightweight, fast, and well-maintained
- Simple monorepo structure (no Nx/Turborepo overhead for a 2-package project)

**Initialization Commands:**

```bash
# Project root
mkdir bmad-todo && cd bmad-todo

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install @tanstack/react-query @tanstack/react-router
cd ..

# Backend
mkdir -p backend && cd backend
npm init -y
npm install fastify @fastify/cors @fastify/sensible
npm install -D typescript @types/node vitest
npx tsc --init
cd ..

# E2E tests
npm install -D playwright @playwright/test
npx playwright install
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript across frontend and backend
- Node.js 20.19+ or 22.12+
- ES Modules (`"type": "module"`)

**Frontend Stack:**
- Vite v8.x (create-vite v8.3.0) — build tooling, dev server, HMR
- React 19.x with TypeScript
- TanStack Query v5.90.x — server state management, caching, optimistic updates
- TanStack Router v1.x — type-safe routing

**Backend Stack:**
- Fastify v5.5.x — HTTP framework, schema validation, serialization
- @fastify/cors — CORS for SPA-to-API communication
- @fastify/sensible — sensible defaults and error handling utilities

**Testing Framework:**
- Vitest v4.x — unit and component tests (frontend + backend)
- @testing-library/react — component testing
- Playwright v1.58.x — E2E tests covering all user journeys
- Integration tests per API endpoint during development

**Code Organization:**

```
bmad-todo/
├── frontend/           # Vite React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/        # API client layer
│   │   └── routes/
│   ├── vite.config.ts
│   └── package.json
├── backend/            # Fastify REST API
│   ├── src/
│   │   ├── routes/
│   │   ├── plugins/
│   │   ├── schemas/
│   │   └── services/
│   ├── tsconfig.json
│   └── package.json
├── e2e/                # Playwright E2E tests
│   └── tests/
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── package.json        # Root workspace scripts
```

**Development Experience:**
- Vite HMR for instant frontend feedback
- Fastify watch mode for backend auto-reload
- Vitest watch mode for continuous testing
- Chrome DevTools MCP for debugging and performance profiling
- Playwright MCP for browser automation
- Postman MCP for API contract validation

**QA Integration:**
- Test coverage analysis targeting 70% minimum meaningful coverage
- Performance testing via Chrome DevTools MCP
- Accessibility audits via Lighthouse/axe-core automated through Playwright
- AI-assisted security review for XSS, injection patterns

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database: SQLite via better-sqlite3
- Data Access: Raw SQL with Fastify plugin
- API Design: REST with JSON Schema validation
- Frontend State: TanStack Query as sole server-state manager
- Development Methodology: TDD (test-first)

**Important Decisions (Shape Architecture):**
- Styling: Tailwind CSS v4.2 (Vite plugin)
- Error Contract: Standardized JSON error responses via @fastify/sensible
- Containerization: Docker Compose with Nginx frontend + Node.js backend
- Logging: Fastify/Pino structured logging

**Deferred Decisions (Post-MVP):**
- Authentication method and authorization patterns
- Multi-user data isolation
- External monitoring/APM
- CI/CD pipeline
- Cloud hosting provider

### Data Architecture

- **Database:** SQLite via `better-sqlite3` v12.6.x — file-based, in-process, zero-config
- **Data Access:** Raw SQL through `@punkish/fastify-better-sqlite3` Fastify plugin — no ORM abstraction
- **Schema:** Single `todos` table: `id` (INTEGER PRIMARY KEY), `text` (TEXT NOT NULL), `completed` (INTEGER DEFAULT 0), `created_at` (TEXT DEFAULT CURRENT_TIMESTAMP)
- **Persistence:** SQLite file stored at `/app/data/todos.db`, Docker volume-mounted for container restarts
- **Migration:** Simple schema initialization on first boot — single table, no migration tool needed for MVP
- **Extensibility:** Schema and data access layer structured so PostgreSQL can replace SQLite in Phase 2 with minimal refactoring

### Authentication & Security

- **Authentication:** Deferred to Phase 2 — no auth in MVP
- **MVP Security Measures:**
  - Input sanitization: Fastify JSON Schema validation on all request bodies
  - XSS prevention: Parameterized SQL queries (better-sqlite3 native), React's default JSX escaping
  - HTTP security headers: `@fastify/helmet` (CSP, X-Content-Type-Options, X-Frame-Options)
  - Error responses: No stack traces or internal details exposed to client

### API & Communication Patterns

- **Pattern:** RESTful JSON API with versioned-ready prefix `/api`
- **Validation:** Fastify's built-in JSON Schema validation for request bodies and params
- **Error Contract:** Standardized via `@fastify/sensible`:
  ```json
  { "statusCode": 400, "error": "Bad Request", "message": "Description required" }
  ```
- **Endpoints:**

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/todos` | List all todos |
  | POST | `/api/todos` | Create a todo |
  | PATCH | `/api/todos/:id` | Toggle completion |
  | DELETE | `/api/todos/:id` | Delete a todo |
  | GET | `/api/health` | Health check |

- **CORS:** `@fastify/cors` configured for frontend origin in development, same-origin via Nginx proxy in production

### Frontend Architecture

- **State Management:** TanStack Query as sole server-state manager — query cache is the source of truth for todo data. Local UI state (input value, error visibility) via React `useState`
- **Optimistic Updates:** TanStack Query `useMutation` with `onMutate` (optimistic cache update), `onError` (rollback), `onSettled` (refetch) — built-in pattern
- **Routing:** TanStack Router v1.x — type-safe, single route for MVP (extensible for Phase 2 views)
- **Styling:** Tailwind CSS v4.2 via `@tailwindcss/vite` plugin — utility-first, no component library
- **Component Library:** None — custom components. UI surface is minimal (input, list, button, states)
- **Bundle Optimization:** Vite's tree-shaking and code splitting handle production builds automatically

### Infrastructure & Deployment

- **Container Architecture:**
  - `backend`: Multi-stage Node.js build, non-root user, health check via `GET /api/health`, SQLite volume mount
  - `frontend`: Multi-stage build (Vite build → Nginx), non-root user, reverse-proxies `/api/*` to backend
  - No separate database container — SQLite runs in-process
- **Environment Configuration:** `.env` files per environment, Docker Compose profiles for dev/test
- **Logging:** Fastify/Pino structured JSON logging, accessible via `docker-compose logs`
- **Monitoring:** Deferred to post-MVP — structured logs sufficient for single-user app

### Development Methodology: TDD

- **Approach:** Test-Driven Development — Red → Green → Refactor
- **Backend TDD cycle:** Write API integration test (expected request/response) → implement route to pass test → refactor
- **Frontend TDD cycle:** Write component test (expected rendering/behavior) → implement component to pass test → refactor
- **E2E TDD cycle:** Write Playwright test from story acceptance criteria → implement full flow to pass test → refactor
- **Test infrastructure set up in first story** before any feature code

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffolding (Vite + Fastify + Docker Compose + test infrastructure)
2. Database schema initialization and health check endpoint
3. Backend API routes (TDD: test → implement per endpoint)
4. Frontend components and API integration (TDD: test → implement per component)
5. E2E tests covering all user journeys
6. Docker production builds and compose orchestration
7. QA: coverage analysis, performance, accessibility, security review

**Cross-Component Dependencies:**
- Error contract (API → Frontend): Frontend error states depend on consistent backend error shape
- Optimistic updates (Frontend → API): TanStack Query mutation config must align with API response format
- CORS/Proxy (Docker → Both): Development uses CORS, production uses Nginx reverse proxy — both must be configured consistently

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 areas where AI agents could make different choices — naming, structure, formats, state management, and error handling. All resolved below.

### Naming Patterns

**Database Naming Conventions:**
- Table names: lowercase plural — `todos`
- Column names: `snake_case` — `id`, `text`, `completed`, `created_at`
- Primary keys: `id` (INTEGER)

**API Naming Conventions:**
- Endpoints: lowercase plural — `/api/todos`, `/api/todos/:id`
- Route parameters: `:id` (Fastify colon convention)
- JSON fields: `camelCase` — `createdAt`, `todoId`
- Mapping: Data access layer maps DB `snake_case` → API `camelCase`

**Code Naming Conventions:**
- Directories: `kebab-case` — `components/`, `todo-list/`
- React components: `PascalCase` files and exports — `TodoList.tsx`, `TodoItem.tsx`
- Utilities/hooks: `camelCase` — `apiClient.ts`, `useTodos.ts`
- Functions: `camelCase` — `getTodos`, `createTodo`, `toggleTodo`
- Variables: `camelCase` with auxiliary verbs — `isLoading`, `hasError`, `isFetching`
- Constants: `UPPER_SNAKE_CASE` — `API_BASE_URL`, `QUERY_KEYS`

### Structure Patterns

**Project Organization:**
- By type within each package (components, hooks, routes, services)
- Shared constants and types at package root level (`types.ts`, `constants.ts`)

**Test Organization:**
- Separate `__tests__/` directories mirroring source structure
- Test files named `[source-file].test.ts(x)`

```
frontend/src/
├── components/
│   ├── TodoList.tsx
│   └── TodoItem.tsx
├── __tests__/
│   └── components/
│       ├── TodoList.test.tsx
│       └── TodoItem.test.tsx

backend/src/
├── routes/
│   └── todos.ts
├── __tests__/
│   └── routes/
│       └── todos.test.ts
```

**Config Files:**
- Root: `docker-compose.yml`, root `package.json`
- Per-package: `tsconfig.json`, `package.json`, `vite.config.ts` (frontend only)
- Environment: `.env.development`, `.env.test`, `.env.production`

### Format Patterns

**API Response Formats:**

Success — direct payload, no wrapper:
```json
GET  /api/todos     → [{ "id": 1, "text": "...", "completed": false, "createdAt": "..." }]
POST /api/todos     → { "id": 2, "text": "...", "completed": false, "createdAt": "..." }
PATCH /api/todos/1  → { "id": 1, "text": "...", "completed": true, "createdAt": "..." }
DELETE /api/todos/1 → 204 No Content
```

Errors — standardized via `@fastify/sensible`:
```json
{ "statusCode": 400, "error": "Bad Request", "message": "Todo description cannot be empty" }
```

**Data Exchange Formats:**
- Dates: ISO 8601 strings — `"2026-03-06T10:00:00.000Z"`
- Booleans: `true`/`false` in JSON, `0`/`1` in SQLite only
- IDs: integers
- Null fields: omit from response rather than sending `null`

### State Management Patterns

**Query Keys:** Centralized constants — `QUERY_KEYS.TODOS = ['todos']`

**Optimistic Update Pattern (all mutations follow this shape):**
```typescript
const mutation = useMutation({
  mutationFn: apiCall,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TODOS })
    const previous = queryClient.getQueryData(QUERY_KEYS.TODOS)
    queryClient.setQueryData(QUERY_KEYS.TODOS, (old) => /* optimistic update */)
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(QUERY_KEYS.TODOS, context.previous)
    // show non-disruptive error notification
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS })
  }
})
```

**Loading States:**
- Initial load (`isLoading`, no data yet): centered spinner or skeleton
- Background refetch (`isFetching` while data exists): silent — no visual indicator
- Optimistic update: shown immediately, no spinner

### Error Handling Patterns

**Backend:**
- Fastify global error handler catches all uncaught errors, returns standardized JSON
- Route-level validation errors return 400 with descriptive message
- Not-found errors return 404
- No stack traces or internals in any error response

**Frontend:**
- TanStack Query `onError` callbacks per mutation for optimistic rollback
- Non-disruptive inline error notification (simple React state + Tailwind-styled component, no library)
- Error messages are user-friendly, never technical — "Couldn't save your task. Please try again."
- Errors auto-dismiss after 4 seconds or on user dismiss

**Error Notification Component Pattern:**
- Positioned top-right
- Appears with subtle animation
- Displays message + dismiss button
- Does not block interaction with the rest of the UI

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming conventions exactly — no deviations for "preference"
- Place tests in `__tests__/` directories, never co-located
- Use the standardized optimistic update pattern for all mutations
- Map DB `snake_case` to API `camelCase` at the data access layer — never leak DB naming to the frontend
- Use `@fastify/sensible` error helpers, never craft custom error JSON

**Pattern Verification:**
- Vitest + Playwright tests enforce behavior
- Code review (AI-assisted) checks naming and structure compliance

### Pattern Examples

**Good:**
```typescript
const todo = db.prepare('SELECT id, text, completed, created_at FROM todos WHERE id = ?').get(id)
return { id: todo.id, text: todo.text, completed: Boolean(todo.completed), createdAt: todo.created_at }
```

**Anti-Pattern:**
```typescript
return { id: todo.id, text: todo.text, completed: todo.completed, created_at: todo.created_at }
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-todo/
├── README.md
├── package.json                          # Root workspace scripts (dev, test, build, docker)
├── docker-compose.yml                    # Orchestrates frontend + backend containers
├── .env.example                          # Template for environment variables
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                    # React plugin + Tailwind plugin
│   ├── index.html                        # Vite entry point
│   ├── Dockerfile                        # Multi-stage: build → nginx
│   ├── nginx.conf                        # Serves static + reverse-proxies /api
│   ├── .env.development
│   ├── .env.production
│   ├── src/
│   │   ├── main.tsx                      # React entry, QueryClient + Router providers
│   │   ├── app.css                       # @import "tailwindcss"
│   │   ├── constants.ts                  # QUERY_KEYS, API_BASE_URL
│   │   ├── types.ts                      # Todo type definition
│   │   ├── api/
│   │   │   └── todos.ts                  # Fetch wrappers: getTodos, createTodo, toggleTodo, deleteTodo
│   │   ├── hooks/
│   │   │   └── useTodos.ts               # useQuery + useMutation hooks with optimistic updates
│   │   ├── components/
│   │   │   ├── App.tsx                   # Root layout component
│   │   │   ├── TodoInput.tsx             # Input field + submit (Enter key)
│   │   │   ├── TodoList.tsx              # List container
│   │   │   ├── TodoItem.tsx              # Single todo: text, toggle, delete
│   │   │   ├── EmptyState.tsx            # "No todos yet" message
│   │   │   ├── LoadingState.tsx          # Centered spinner for initial load
│   │   │   └── ErrorNotification.tsx     # Top-right non-disruptive error toast
│   │   └── routes/
│   │       └── index.tsx                 # Single route for MVP
│   └── __tests__/
│       ├── components/
│       │   ├── App.test.tsx
│       │   ├── TodoInput.test.tsx
│       │   ├── TodoList.test.tsx
│       │   ├── TodoItem.test.tsx
│       │   ├── EmptyState.test.tsx
│       │   ├── LoadingState.test.tsx
│       │   └── ErrorNotification.test.tsx
│       ├── hooks/
│       │   └── useTodos.test.ts
│       └── api/
│           └── todos.test.ts
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                        # Multi-stage: build → runtime, non-root user
│   ├── .env.development
│   ├── .env.test
│   ├── .env.production
│   ├── src/
│   │   ├── server.ts                     # Fastify instance creation + plugin registration
│   │   ├── index.ts                      # Entry point: start server
│   │   ├── plugins/
│   │   │   ├── database.ts               # better-sqlite3 plugin: init DB, create table if not exists
│   │   │   ├── cors.ts                   # @fastify/cors configuration
│   │   │   ├── helmet.ts                 # @fastify/helmet security headers
│   │   │   └── sensible.ts              # @fastify/sensible error helpers
│   │   ├── routes/
│   │   │   ├── todos.ts                  # CRUD route handlers for /api/todos
│   │   │   └── health.ts                 # GET /api/health
│   │   ├── schemas/
│   │   │   └── todos.ts                  # JSON Schema for request/response validation
│   │   ├── services/
│   │   │   └── todos.ts                  # Data access: raw SQL queries, snake→camel mapping
│   │   └── types.ts                      # Shared backend types
│   └── __tests__/
│       ├── routes/
│       │   ├── todos.test.ts             # Integration tests for each API endpoint
│       │   └── health.test.ts
│       └── services/
│           └── todos.test.ts             # Unit tests for data access layer
│
├── e2e/
│   ├── playwright.config.ts
│   ├── tests/
│   │   ├── journey-first-time-user.spec.ts    # Journey 1: create, complete, scan
│   │   ├── journey-returning-user.spec.ts     # Journey 2: persistence, delete, cross-session
│   │   └── journey-edge-cases.spec.ts         # Journey 3: errors, validation, loading
│   └── fixtures/
│       └── test-helpers.ts
│
└── data/                                 # SQLite database (Docker volume mount, gitignored)
    └── .gitkeep
```

### Architectural Boundaries

**API Boundary:**
- Single boundary: Frontend ↔ Backend via `/api/*`
- Development: Frontend `vite.config.ts` proxy → `localhost:3001`
- Production: Nginx reverse proxy → backend container

**Component Boundaries:**
- `api/` layer: Only place that makes HTTP calls — components never fetch directly
- `hooks/` layer: Only place that manages TanStack Query — components consume hooks, never `useQuery` directly
- `components/`: Pure presentational + hook consumption — no business logic

**Data Boundaries:**
- `services/todos.ts`: Only file that touches SQLite — all SQL lives here
- `plugins/database.ts`: Owns DB connection lifecycle and schema initialization
- `routes/todos.ts`: Orchestrates validation → service call → response — no SQL here

### Requirements to Structure Mapping

| FR Category | Backend Location | Frontend Location |
|---|---|---|
| Task Management (FR1-FR6) | `routes/todos.ts`, `services/todos.ts` | `hooks/useTodos.ts`, `api/todos.ts` |
| Task Display (FR7-FR9) | — | `components/TodoList.tsx`, `TodoItem.tsx` |
| Data Persistence (FR10-FR12) | `plugins/database.ts`, `services/todos.ts` | — |
| Input Handling (FR13-FR15) | `schemas/todos.ts` | `components/TodoInput.tsx` |
| State Communication (FR16-FR19) | — | `EmptyState.tsx`, `LoadingState.tsx`, `ErrorNotification.tsx` |
| API Operations (FR20-FR22) | `routes/todos.ts`, `schemas/todos.ts` | `api/todos.ts` |
| Responsiveness (FR23-FR24) | — | Tailwind responsive classes across all components |
| Accessibility (FR25-FR27) | — | Semantic HTML + ARIA across all components |

### Data Flow

```
User Action → Component → useTodos hook → api/todos.ts → HTTP → Fastify route → service → SQLite
                ↑                                                                          ↓
          Optimistic update ←── onMutate                              Response ──→ onSettled → cache update
```

### Development Workflow Integration

**Dev mode (no Docker):**
- `cd frontend && npm run dev` → Vite on port 3000, proxies `/api` to 3001
- `cd backend && npm run dev` → Fastify with watch mode on port 3001
- `npm run test` → Vitest watch mode (per package)

**Production (Docker Compose):**
- `docker-compose up` → builds both containers, Nginx on port 80, backend on internal network
- SQLite persisted via `./data:/app/data` volume mount

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices verified compatible: Vite 8.x + React 19.x + TanStack Query 5.x + TanStack Router 1.x (frontend), Fastify 5.5.x + better-sqlite3 12.6.x + @fastify/cors + @fastify/sensible + @fastify/helmet (backend), Vitest 4.x + Playwright 1.58.x (testing), Tailwind CSS 4.2 via @tailwindcss/vite plugin. No version conflicts or incompatibilities.

**Pattern Consistency:**
Naming conventions consistent across all layers. snake_case → camelCase mapping point defined at single location (services layer). Error contract standardized via @fastify/sensible and consumed consistently by frontend onError handlers. Test organization (__tests__/ mirroring source) uniform across frontend and backend.

**Structure Alignment:**
Project structure enforces architectural boundaries — api/ → hooks/ → components/ (frontend), routes/ → services/ → SQLite (backend). No layer-skipping possible. Docker Compose structure supports both dev proxy and production Nginx patterns.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 27 functional requirements have explicit architectural support mapped to specific files and directories.

- FR1-FR6 (Task CRUD): routes/todos.ts + services/todos.ts + useTodos.ts ✅
- FR7-FR9 (Display): TodoList.tsx + TodoItem.tsx + Tailwind ✅
- FR10-FR12 (Persistence): SQLite + database.ts plugin + Docker volume ✅
- FR13-FR15 (Input): TodoInput.tsx + schemas/todos.ts ✅
- FR16-FR19 (State communication): EmptyState, LoadingState, ErrorNotification + TanStack Query optimistic ✅
- FR20-FR22 (API): Fastify routes + JSON Schema validation + sensible errors ✅
- FR23-FR24 (Responsive): Tailwind responsive classes, mobile-first ✅
- FR25-FR27 (Accessibility): Semantic HTML + ARIA, Playwright + axe-core audits ✅

**Non-Functional Requirements Coverage:**
- Performance (<200ms API, <100ms UI): SQLite in-process + optimistic updates ✅
- Security (XSS, injection, headers): @fastify/helmet + parameterized SQL + React JSX escaping + JSON Schema ✅
- Accessibility (WCAG 2.1 AA): Component patterns + automated audits ✅
- Reliability (zero data loss): SQLite ACID + optimistic rollback ✅
- Maintainability (70% coverage): Vitest + Playwright + TDD + __tests__/ structure ✅
- Docker (docker-compose up): Multi-stage Dockerfiles + compose with volumes + health checks ✅

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical and important decisions documented with specific versions and rationale.

**Structure Completeness:** Every file and directory named explicitly — no generic placeholders.

**Pattern Completeness:** Naming, structure, format, state management, and error handling specified with examples and anti-patterns.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps (resolved):**
- CORS origin: @fastify/cors accepts `http://localhost:3000` in development via `.env.development`
- Vite proxy: `vite.config.ts` proxies `/api` → `http://localhost:3001` in dev mode

**Nice-to-Have (deferred):**
- Linting/formatting config (ESLint, Prettier) — add in first implementation story
- Pre-commit hooks — post-MVP

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — low-complexity project with well-understood patterns, single entity, single user, standard CRUD.

**Key Strengths:**
- Deliberately minimal — no over-engineering for a simple Todo app
- Clear boundaries prevent AI agents from making conflicting decisions
- TDD methodology ensures quality from the first line of code
- Every FR and NFR traceable to specific files and patterns
- Docker Compose provides reproducible deployment from day one

**Areas for Future Enhancement:**
- Authentication and multi-user support (Phase 2)
- CI/CD pipeline and automated deployment
- External monitoring and APM
- Linting and formatting automation

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Map DB snake_case to API camelCase at the services layer only
- Use TDD: write test → implement → refactor for every feature
- Refer to this document for all architectural questions

**First Implementation Priority:**
Project scaffolding — run starter commands, set up test infrastructure, configure Docker Compose, verify health check endpoint. All subsequent stories build on this foundation.
