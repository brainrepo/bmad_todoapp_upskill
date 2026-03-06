---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-design-specification.md
---

# bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a new todo by entering a text description
FR2: User can view a list of all existing todos
FR3: User can mark an active todo as completed
FR4: User can mark a completed todo as active again (toggle)
FR5: User can delete a todo permanently
FR6: System assigns a creation timestamp to each new todo automatically
FR7: User can visually distinguish active todos from completed todos at a glance
FR8: User can scan the full todo list and understand the status of every item without interaction
FR9: System displays todos in a consistent, predictable order
FR10: System persists all todo data to a backend datastore
FR11: User can close the browser and return later to find all todos in their last known state
FR12: System maintains data consistency — no duplicate, orphaned, or corrupted records after normal operations
FR13: System prevents creation of todos with empty or whitespace-only descriptions
FR14: User can submit a new todo by pressing Enter or activating a submit control
FR15: System clears the input field after successful todo creation
FR16: System displays a meaningful empty state when no todos exist
FR17: System displays a loading indicator while fetching data from the backend
FR18: System displays a non-disruptive error message when a backend operation fails
FR19: System reflects user actions immediately via optimistic UI updates before backend confirmation
FR20: System exposes a REST API supporting create, read, update, and delete operations for todos
FR21: System returns appropriate error responses for invalid API requests
FR22: System validates all incoming API data before processing
FR23: User can perform all todo actions on both desktop and mobile devices
FR24: System adapts its layout to viewport sizes from 320px to 1920px without loss of functionality
FR25: User can perform all todo actions using only a keyboard
FR26: System provides appropriate ARIA attributes and semantic HTML for screen reader compatibility
FR27: System meets WCAG 2.1 AA compliance for color contrast, focus indicators, and interactive elements

### NonFunctional Requirements

NFR1: All REST API endpoints respond within 200ms under normal conditions
NFR2: UI interactions (create, complete, delete) reflect visually within 100ms via optimistic updates
NFR3: Initial page load renders the todo list within 1 second on a standard broadband connection
NFR4: No perceptible UI jank or layout shift during todo list operations
NFR5: All user input is sanitized before rendering to prevent XSS attacks
NFR6: API inputs are validated and sanitized to prevent injection vulnerabilities
NFR7: HTTP security headers are configured appropriately (Content-Security-Policy, X-Content-Type-Options, etc.)
NFR8: No sensitive data is exposed in API error responses or client-side logs
NFR9: All interactive elements are reachable and operable via keyboard alone
NFR10: Color contrast ratios meet WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text)
NFR11: Focus indicators are visible on all interactive elements
NFR12: Screen readers can announce todo items, their status, and all available actions
NFR13: Touch targets are at minimum 44x44px on mobile viewports
NFR14: Zero data loss during normal operations — all persisted todos survive server restarts and browser refreshes
NFR15: Failed backend operations do not corrupt existing data
NFR16: Optimistic UI updates roll back or surface errors clearly when backend confirmation fails
NFR17: Application remains functional (read-only at minimum) during transient backend failures
NFR18: Codebase follows consistent coding standards and conventions across frontend and backend
NFR19: Code is structured for readability by developers unfamiliar with the project
NFR20: Test suite (unit + E2E) achieves minimum 70% meaningful coverage
NFR21: Application can be started locally with a single `docker-compose up` command
NFR22: Dependencies are pinned to specific versions to ensure reproducible builds

### Additional Requirements

**From Architecture:**
- Starter template: Vite `react-ts` scaffold (frontend) + manual Fastify setup (backend) — monorepo structure
- Database: SQLite via better-sqlite3 v12.6.x, file-based at `/app/data/todos.db`, Docker volume-mounted
- Schema: Single `todos` table — `id` (INTEGER PRIMARY KEY), `text` (TEXT NOT NULL), `completed` (INTEGER DEFAULT 0), `created_at` (TEXT DEFAULT CURRENT_TIMESTAMP)
- Data access: Raw SQL through `@punkish/fastify-better-sqlite3` plugin — no ORM
- DB naming snake_case → API naming camelCase mapping at the services layer
- API prefix: `/api` with endpoints GET/POST `/api/todos`, PATCH/DELETE `/api/todos/:id`, GET `/api/health`
- Error contract: Standardized via `@fastify/sensible` — `{ statusCode, error, message }`
- Security: `@fastify/helmet` for HTTP headers, parameterized SQL, React JSX escaping
- Frontend state: TanStack Query as sole server-state manager with centralized QUERY_KEYS
- Routing: TanStack Router v1.x — single route for MVP
- Styling: Tailwind CSS v4.2 via `@tailwindcss/vite` plugin
- Testing: Vitest v4.x (unit/component), Playwright v1.58.x (E2E), @testing-library/react
- Development methodology: TDD — Red → Green → Refactor
- Test organization: `__tests__/` directories mirroring source structure
- Containerization: Multi-stage Docker builds, non-root users, health checks
- Frontend container: Vite build → Nginx, reverse-proxies `/api/*` to backend
- Backend container: Node.js multi-stage, health check via GET /api/health
- Docker Compose orchestrates both containers with SQLite volume mount
- Linting/formatting config (ESLint, Prettier) to be added in first implementation story

**From UX Design:**
- Design direction: Typographic — left accent bars, editorial feel, type as art
- Color system: Dark palette — `#141419` (bg), `#1c1c24` (surface), `#24242e` (surface-hover), `#e8e8ed` (text-primary), `#6b6b7b` (text-secondary), `#4a4a58` (text-placeholder), `#7c9cb5` (accent), `#c4756e` (error), `#2a2a35` (border)
- Typography: System font stack, weights 200/300/400, sizes 0.6875rem–2rem, no bold anywhere
- Spacing: 4px base unit, 640px max content width, single-column centered layout
- TodoInput: Left accent bar (`2px solid accent`), transparent bg, font-weight 300, 1.125rem, auto-focused
- TodoItem: Left border transparent → border on hover, delete `×` appears on hover (always visible on mobile), italic + strikethrough for completed
- AppHeader: Title "things to do" (2rem, weight 200), subtitle "a simple list" (0.8125rem, uppercase)
- EmptyState: "Nothing here yet" heading + "Type above and press Enter" subtext
- LoadingState: "Loading..." text only, no spinner
- ErrorState: "Something's not right" + "Try again" text link
- ErrorNotification: Fixed top-right, `border-left: 2px solid error`, auto-dismiss 4 seconds, no stacking
- Animations: Completion 300ms ease, deletion fade-out 200ms, notification fade 200ms, task creation instant
- Respect `prefers-reduced-motion` — disable all animations
- Responsive: Mobile-first, two meaningful breakpoints (sm: 640px for centering, lg: 1024px for hover behavior)
- Keyboard: Tab between input/list, Enter submit, Space/Enter toggle, Delete/Backspace delete, Escape clear, Arrow keys navigate
- Screen reader: ARIA labels on all elements, `role="alert"` for notifications, `aria-live="polite"`, `aria-checked` for completion
- Touch targets: minimum 44x44px on all interactive elements

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Create todo with text description |
| FR2 | Epic 2 | View list of all todos |
| FR3 | Epic 3 | Mark active todo as completed |
| FR4 | Epic 3 | Toggle completed todo back to active |
| FR5 | Epic 3 | Delete a todo permanently |
| FR6 | Epic 2 | Auto-assign creation timestamp |
| FR7 | Epic 2 | Visual distinction active/completed |
| FR8 | Epic 2 | Scan list status without interaction |
| FR9 | Epic 2 | Consistent, predictable order |
| FR10 | Epic 2 | Persist data to backend |
| FR11 | Epic 2 | Data survives browser close/return |
| FR12 | Epic 2 | No duplicates, orphans, or corruption |
| FR13 | Epic 2 | Prevent empty/whitespace todos |
| FR14 | Epic 2 | Submit via Enter key |
| FR15 | Epic 2 | Clear input after creation |
| FR16 | Epic 4 | Meaningful empty state |
| FR17 | Epic 4 | Loading indicator during fetch |
| FR18 | Epic 4 | Non-disruptive error messages |
| FR19 | Epic 4 | Optimistic UI updates |
| FR20 | Epic 2+3 | REST API CRUD operations |
| FR21 | Epic 4 | Appropriate error responses |
| FR22 | Epic 2 | Server-side input validation |
| FR23 | Epic 5 | All actions on desktop + mobile |
| FR24 | Epic 5 | Layout adapts 320px–1920px |
| FR25 | Epic 5 | Keyboard-only operation |
| FR26 | Epic 5 | ARIA + semantic HTML |
| FR27 | Epic 5 | WCAG 2.1 AA compliance |

## Epic List

### Epic 1: Project Foundation & Infrastructure
The project is scaffolded with test infrastructure, Docker Compose orchestration, and a verified health check endpoint. All development tools are configured for the TDD workflow.
**FRs covered:** None directly (infrastructure enables all FRs)

### Epic 2: Task Capture & Display
Users can open the app and immediately begin capturing tasks. Tasks persist to the backend and are displayed in a clean, typographic list with creation timestamps, ordered consistently.
**FRs covered:** FR1, FR2, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR20 (create + read), FR22

### Epic 3: Task Lifecycle Management
Users can mark tasks as complete (with clear visual distinction) and toggle them back to active. Users can delete tasks they no longer need. The complete CRUD lifecycle is functional.
**FRs covered:** FR3, FR4, FR5, FR20 (update + delete)

### Epic 4: Resilient User Experience
The app communicates its state clearly — empty list, loading data, and backend errors — and provides instant feedback through optimistic updates that gracefully roll back on failure.
**FRs covered:** FR16, FR17, FR18, FR19, FR21

### Epic 5: Responsive Design & Accessibility
The app delivers a seamless experience across all devices (320px–1920px) and is fully accessible via keyboard navigation, screen reader support, and WCAG 2.1 AA compliance.
**FRs covered:** FR23, FR24, FR25, FR26, FR27

## Epic 1: Project Foundation & Infrastructure

The project is scaffolded with test infrastructure, Docker Compose orchestration, and a verified health check endpoint. All development tools are configured for the TDD workflow.

### Story 1.1: Project Scaffolding & Development Environment

As a developer,
I want a fully configured monorepo with frontend (Vite React TypeScript) and backend (Fastify TypeScript) packages with testing infrastructure,
So that I can begin TDD development immediately.

**Acceptance Criteria:**

**Given** no existing project
**When** the scaffolding is complete
**Then** `frontend/` contains a Vite React TypeScript project with TanStack Query, TanStack Router, and Tailwind CSS v4.2 configured
**And** `backend/` contains a Fastify TypeScript project with `@fastify/cors`, `@fastify/sensible`, and `@fastify/helmet` as dependencies
**And** `e2e/` contains a Playwright configuration
**And** Vitest is configured in both frontend and backend packages
**And** `@testing-library/react` is installed in the frontend
**And** ESLint and Prettier are configured with consistent rules
**And** a root `package.json` provides workspace scripts for dev, test, and build
**And** `npm run test` in both packages executes Vitest successfully (with zero tests passing is acceptable)
**And** TypeScript strict mode is enabled in both packages
**And** design tokens (colors, typography, spacing from UX spec) are configured in Tailwind's `theme.extend`

### Story 1.2: Database Setup & Health Check Endpoint

As a developer,
I want SQLite initialized with the todos schema and a health check endpoint,
So that the backend data layer and operational monitoring are verified from day one.

**Acceptance Criteria:**

**Given** the backend project from Story 1.1
**When** the backend server starts
**Then** SQLite database is initialized via `better-sqlite3` with `@punkish/fastify-better-sqlite3` plugin
**And** the `todos` table is created if it doesn't exist with columns: `id` (INTEGER PRIMARY KEY), `text` (TEXT NOT NULL), `completed` (INTEGER DEFAULT 0), `created_at` (TEXT DEFAULT CURRENT_TIMESTAMP)
**And** `GET /api/health` returns `200` with `{ "status": "ok" }`
**And** Fastify plugins are registered: cors, helmet, sensible, database
**And** integration tests verify the health check endpoint responds correctly
**And** integration tests verify the database table exists with the correct schema

### Story 1.3: Containerization & Docker Compose

As a developer,
I want Docker containers for frontend and backend orchestrated via Docker Compose,
So that the application can be started with a single `docker-compose up` command.

**Acceptance Criteria:**

**Given** the frontend and backend projects from Stories 1.1 and 1.2
**When** `docker-compose up` is executed
**Then** the backend container builds via multi-stage Dockerfile (build → runtime), runs as non-root user, and exposes the API
**And** the frontend container builds via multi-stage Dockerfile (Vite build → Nginx), runs as non-root user
**And** Nginx serves static files and reverse-proxies `/api/*` requests to the backend container
**And** SQLite database file is persisted via Docker volume mount (`./data:/app/data`)
**And** `GET /api/health` is accessible through the Nginx proxy
**And** `.env.example` documents all required environment variables
**And** `docker-compose down && docker-compose up` preserves existing todo data

## Epic 2: Task Capture & Display

Users can open the app and immediately begin capturing tasks. Tasks persist to the backend and are displayed in a clean, typographic list with creation timestamps, ordered consistently.

### Story 2.1: Create Todo API Endpoint

As a user,
I want to create a task via the API so that my task is stored persistently,
So that I don't lose my tasks when I close the browser.

**Acceptance Criteria:**

**Given** a valid request body `{ "text": "Buy groceries" }`
**When** `POST /api/todos` is called
**Then** a new todo is created with `completed: false` and an auto-generated `createdAt` timestamp
**And** the response is `201` with the created todo: `{ "id": 1, "text": "Buy groceries", "completed": false, "createdAt": "2026-..." }`
**And** the response uses `camelCase` field names (mapped from DB `snake_case`)

**Given** a request body with empty text `{ "text": "" }` or whitespace-only `{ "text": "   " }`
**When** `POST /api/todos` is called
**Then** the response is `400` with `{ "statusCode": 400, "error": "Bad Request", "message": "Todo description cannot be empty" }`

**Given** a request body with missing text field `{}`
**When** `POST /api/todos` is called
**Then** the response is `400` with a validation error via JSON Schema

**Given** the endpoint is implemented
**When** integration tests are run
**Then** all create scenarios (valid, empty, whitespace, missing field) pass

**Given** the endpoint is implemented
**When** API contract validation is run via Postman MCP
**Then** request/response schemas, status codes, and error contract match the architecture spec

### Story 2.2: List Todos API Endpoint

As a user,
I want to retrieve all my tasks from the API,
So that I can see everything I need to do when I open the app.

**Acceptance Criteria:**

**Given** multiple todos exist in the database
**When** `GET /api/todos` is called
**Then** the response is `200` with an array of all todos ordered by `created_at` ascending
**And** each todo has `camelCase` fields: `id`, `text`, `completed` (boolean), `createdAt` (ISO 8601)

**Given** no todos exist in the database
**When** `GET /api/todos` is called
**Then** the response is `200` with an empty array `[]`

**Given** the endpoint is implemented
**When** integration tests are run
**Then** list scenarios (populated, empty, ordering) pass

**Given** the endpoint is implemented
**When** API contract validation is run via Postman MCP
**Then** response schema, status codes, and field naming (camelCase) match the architecture spec

### Story 2.3: Task Input & Creation UI

As a user,
I want to type a task and press Enter to add it to my list,
So that I can capture thoughts as fast as I can type them.

**Acceptance Criteria:**

**Given** the app is loaded
**When** the page renders
**Then** the TodoInput component is visible with a left accent bar (`2px solid accent`), placeholder "What needs doing?", and is auto-focused

**Given** the input is focused and contains text "Buy groceries"
**When** the user presses Enter
**Then** a `POST /api/todos` request is sent with the text
**And** the input is cleared immediately
**And** the input retains focus for the next task

**Given** the input is focused and empty (or whitespace-only)
**When** the user presses Enter
**Then** nothing happens — no request, no error, no visual feedback

**Given** the input contains " Buy groceries "
**When** the user presses Enter
**Then** the text is trimmed to "Buy groceries" before submission

**Given** the TodoInput component is implemented
**When** component tests are run
**Then** all input scenarios (submit, clear, focus retention, empty rejection, trimming) pass

### Story 2.4: Task List Display

As a user,
I want to see all my tasks displayed in a clean, typographic list,
So that I can scan what I need to do at a glance.

**Acceptance Criteria:**

**Given** todos exist in the backend
**When** the app loads
**Then** the TodoList component renders all todos via `GET /api/todos`
**And** each TodoItem displays the task text (1.125rem, weight 300) with uppercase metadata showing the creation timestamp
**And** active todos display in `text-primary` color
**And** completed todos display in `text-secondary` with strikethrough and italic
**And** todos are ordered by creation date (ascending)

**Given** the AppHeader component is rendered
**When** the page loads
**Then** the title "things to do" (2rem, weight 200) and subtitle "a simple list" (uppercase, letter-spacing) are displayed

**Given** the todo list components are implemented
**When** component tests are run
**Then** rendering scenarios (populated list, active items, completed items, ordering, header) pass

### Story 2.5: Full-Stack Task Creation & Persistence Verification

As a user,
I want my tasks to survive page refreshes and new sessions,
So that I can trust the app with my task list.

**Acceptance Criteria:**

**Given** the full stack (frontend + backend) is running
**When** a user creates a task "Buy groceries" and refreshes the page
**Then** the task "Buy groceries" is still visible in the list

**Given** a user has created 3 tasks
**When** the user closes and reopens the browser tab
**Then** all 3 tasks are displayed in creation order

**Given** the full stack is integrated
**When** E2E tests (Playwright) are run
**Then** the first-time user journey (create task, see in list, refresh, verify persistence) passes

## Epic 3: Task Lifecycle Management

Users can mark tasks as complete (with clear visual distinction) and toggle them back to active. Users can delete tasks they no longer need. The complete CRUD lifecycle is functional.

### Story 3.1: Toggle Todo Completion API Endpoint

As a user,
I want to mark a task as complete or revert it to active via the API,
So that I can track what I've accomplished.

**Acceptance Criteria:**

**Given** an active todo with `id: 1` exists (`completed: false`)
**When** `PATCH /api/todos/1` is called with `{ "completed": true }`
**Then** the response is `200` with the updated todo: `{ "id": 1, "text": "...", "completed": true, "createdAt": "..." }`

**Given** a completed todo with `id: 1` exists (`completed: true`)
**When** `PATCH /api/todos/1` is called with `{ "completed": false }`
**Then** the response is `200` with the updated todo showing `completed: false`

**Given** no todo with `id: 999` exists
**When** `PATCH /api/todos/999` is called
**Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Todo not found" }`

**Given** the endpoint is implemented
**When** integration tests are run
**Then** toggle scenarios (complete, uncomplete, not found) pass

**Given** the endpoint is implemented
**When** API contract validation is run via Postman MCP
**Then** request/response schemas, status codes, and error contract match the architecture spec

### Story 3.2: Delete Todo API Endpoint

As a user,
I want to permanently remove a task via the API,
So that I can clean up tasks I no longer need.

**Acceptance Criteria:**

**Given** a todo with `id: 1` exists
**When** `DELETE /api/todos/1` is called
**Then** the response is `204 No Content` with an empty body
**And** the todo is permanently removed from the database

**Given** no todo with `id: 999` exists
**When** `DELETE /api/todos/999` is called
**Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Todo not found" }`

**Given** the endpoint is implemented
**When** integration tests are run
**Then** delete scenarios (success, not found) pass

**Given** the endpoint is implemented
**When** API contract validation is run via Postman MCP
**Then** response status codes (204, 404) and error contract match the architecture spec

### Story 3.3: Task Completion Toggle UI

As a user,
I want to click anywhere on a task to mark it complete (or toggle it back to active),
So that I feel a sense of accomplishment with a satisfying visual transition.

**Acceptance Criteria:**

**Given** an active todo is displayed in the list
**When** the user clicks/taps anywhere on the task row
**Then** a `PATCH /api/todos/:id` request is sent with `{ "completed": true }`
**And** the task visually transitions: text color changes to `text-secondary`, strikethrough and italic are applied (~300ms ease transition)

**Given** a completed todo is displayed in the list
**When** the user clicks/taps anywhere on the task row
**Then** a `PATCH /api/todos/:id` request is sent with `{ "completed": false }`
**And** the task visually transitions back to active state: `text-primary` color, no strikethrough, no italic

**Given** the TodoItem completion toggle is implemented
**When** component tests are run
**Then** toggle scenarios (complete, uncomplete, visual states) pass

### Story 3.4: Task Deletion UI

As a user,
I want to delete a task by clicking a delete control,
So that I can remove tasks I no longer need without friction.

**Acceptance Criteria:**

**Given** a todo is displayed in the list (on desktop, lg breakpoint+)
**When** the user hovers over the task row
**Then** a `×` delete button appears on the right side (position absolute, opacity transition)
**And** the task row shows a left border in `border` color

**Given** a todo is displayed in the list (on mobile, below lg breakpoint)
**When** the page renders
**Then** the `×` delete button is always visible (no hover required)

**Given** the `×` button is visible
**When** the user clicks the `×` button
**Then** a `DELETE /api/todos/:id` request is sent
**And** the task exits the list with a fade-out animation (~200ms)

**Given** the user clicks the `×` button
**When** the delete action completes
**Then** no confirmation dialog is shown — the deletion is immediate

**Given** the TodoItem delete interaction is implemented
**When** component tests are run
**Then** delete scenarios (hover reveal, click delete, fade-out, mobile always-visible) pass

### Story 3.5: Task Lifecycle E2E Tests

As a user,
I want to complete, uncomplete, and delete tasks in a full end-to-end flow,
So that the entire task lifecycle is verified across the full stack.

**Acceptance Criteria:**

**Given** the full stack is running with existing tasks
**When** a user completes a task
**Then** the task shows strikethrough + italic + dimmed color
**And** refreshing the page preserves the completed state

**Given** a completed task exists
**When** a user clicks the task to uncomplete it
**Then** the task returns to active visual state
**And** refreshing the page preserves the active state

**Given** a task exists
**When** a user deletes it via the `×` button
**Then** the task disappears from the list
**And** refreshing the page confirms the task is permanently gone

**Given** the E2E tests are run
**When** the returning user journey (Journey 2) is executed
**Then** all lifecycle scenarios (complete, uncomplete, delete, persistence) pass

## Epic 4: Resilient User Experience

The app communicates its state clearly — empty list, loading data, and backend errors — and provides instant feedback through optimistic updates that gracefully roll back on failure.

### Story 4.1: Empty State

As a user,
I want to see a welcoming message when I have no tasks,
So that the app feels intentional even when empty, not broken.

**Acceptance Criteria:**

**Given** no todos exist in the backend
**When** the app loads and `GET /api/todos` returns an empty array
**Then** the EmptyState component renders with heading "Nothing here yet" (1.25rem, weight 300, `text-secondary`) and subtext "Type above and press Enter" (0.875rem, `text-placeholder`)
**And** the input field is auto-focused above the empty state

**Given** the empty state is displayed
**When** the user creates a new task
**Then** the empty state disappears instantly and the new task is displayed

**Given** the last remaining task is deleted
**When** the list becomes empty
**Then** the empty state reappears

**Given** the EmptyState component is implemented
**When** component tests are run
**Then** empty state scenarios (display, disappear on add, reappear on last delete) pass

### Story 4.2: Loading State

As a user,
I want to see a calm loading indicator while my tasks are being fetched,
So that I know the app is working even on slow connections.

**Acceptance Criteria:**

**Given** the app is loading and `GET /api/todos` has not yet responded
**When** the page renders
**Then** the LoadingState component displays "Loading..." centered in the list area (0.875rem, `text-placeholder`)

**Given** the `GET /api/todos` request completes successfully
**When** data is received
**Then** the loading state is replaced by the todo list (or empty state)

**Given** the LoadingState is displayed
**When** the loading state is visible
**Then** no spinner, no progress bar, no skeleton screen is shown — text only

**Given** the LoadingState component is implemented
**When** component tests are run
**Then** loading scenarios (display during fetch, replace on completion) pass

### Story 4.3: Error State & Error Notification

As a user,
I want to see clear, calm error messages when something goes wrong,
So that I understand what happened without feeling alarmed.

**Acceptance Criteria:**

**Given** the app loads and `GET /api/todos` fails (network error or server error)
**When** the initial fetch fails
**Then** the ErrorState component renders centered with "Something's not right" (1.25rem, weight 300, `text-secondary`) and a "Try again" text link in `accent` color

**Given** the ErrorState is displayed
**When** the user clicks "Try again"
**Then** a new `GET /api/todos` request is made
**And** the loading state is shown during the retry

**Given** a mutation (create, complete, delete) fails after the list has loaded
**When** the backend returns an error
**Then** the ErrorNotification component appears fixed top-right with `surface` background, `border-left: 2px solid error`, and a brief message (e.g., "Task not saved — try again")
**And** the notification auto-dismisses after 4 seconds
**And** no manual dismiss button is shown

**Given** multiple mutations fail in sequence
**When** a new error notification is triggered
**Then** the latest notification replaces the previous one — no stacking

**Given** the ErrorState and ErrorNotification components are implemented
**When** component tests are run
**Then** error scenarios (initial load failure, retry, mutation error, auto-dismiss, replacement) pass

### Story 4.4: Optimistic Updates & Rollback

As a user,
I want my actions to feel instant even on slow connections,
So that the app feels responsive and trustworthy.

**Acceptance Criteria:**

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

### Story 4.5: Error & Edge Case E2E Tests

As a user,
I want the app to handle all edge cases gracefully,
So that my trust in the app holds even when things go wrong.

**Acceptance Criteria:**

**Given** the full stack is running
**When** a user submits an empty input
**Then** nothing happens — no request, no error

**Given** the full stack is running
**When** the backend is temporarily unavailable during a mutation
**Then** the optimistic update is reverted and an error notification appears

**Given** the app loads with no tasks
**When** the empty state is displayed
**Then** the user can create a task and the empty state disappears

**Given** the E2E tests are run
**When** the edge case journey (Journey 3) is executed
**Then** all resilience scenarios (empty input, error notification, empty state, loading state) pass

## Epic 5: Responsive Design & Accessibility

The app delivers a seamless experience across all devices (320px–1920px) and is fully accessible via keyboard navigation, screen reader support, and WCAG 2.1 AA compliance.

### Story 5.1: Responsive Layout

As a user,
I want the app to look and work great on my phone, tablet, and desktop,
So that I can manage my tasks on any device.

**Acceptance Criteria:**

**Given** the app is viewed on a mobile viewport (< 640px)
**When** the page renders
**Then** content fills the available width with 16px side padding (`px-4`)
**And** the delete `×` button is always visible on each task (no hover required)
**And** all interactive elements have a minimum 44x44px touch target
**And** the task row has a minimum height of 44px

**Given** the app is viewed on a viewport >= 640px
**When** the page renders
**Then** content is centered with max-width 640px (`sm:max-w-[640px] sm:mx-auto`)
**And** side padding increases to 48px (`sm:px-12`)

**Given** the app is viewed on a viewport >= 1024px
**When** the user hovers over a task
**Then** the delete `×` button appears (progressive affordance via `lg:` breakpoint)
**And** the task row shows a left border on hover

**Given** responsive layout is implemented
**When** tested across viewports from 320px to 1920px
**Then** no horizontal scrolling, no content overflow, no broken layouts occur

**Given** responsive layout is implemented
**When** component tests are run
**Then** responsive scenarios (mobile full-width, desktop centered, touch targets) pass

### Story 5.2: Keyboard Navigation

As a user,
I want to use the app entirely with my keyboard,
So that I can manage tasks without needing a mouse or touchscreen.

**Acceptance Criteria:**

**Given** the app loads
**When** the page renders
**Then** the input field is auto-focused

**Given** the input is focused
**When** the user presses Tab
**Then** focus moves to the first task in the list

**Given** a task in the list is focused
**When** the user presses Arrow Down
**Then** focus moves to the next task

**Given** a task in the list is focused
**When** the user presses Arrow Up
**Then** focus moves to the previous task

**Given** a task in the list is focused
**When** the user presses Space or Enter
**Then** the task completion is toggled

**Given** a task in the list is focused
**When** the user presses Delete or Backspace
**Then** the task is deleted

**Given** the input is focused with text
**When** the user presses Escape
**Then** the input text is cleared

**Given** any focusable element is focused
**When** it receives focus
**Then** a visible focus ring (2px solid `accent`, 2px offset) is displayed

**Given** keyboard navigation is implemented
**When** component tests are run
**Then** all keyboard scenarios (Tab, Arrow, Enter, Space, Delete, Escape, focus ring) pass

### Story 5.3: Screen Reader & ARIA Support

As a user relying on a screen reader,
I want all app elements properly announced with their roles and states,
So that I can use the app effectively without visual cues.

**Acceptance Criteria:**

**Given** the app renders
**When** a screen reader traverses the page
**Then** the `<html>` element has `lang="en"`
**And** the page `<title>` is "things to do"
**And** a single `<main>` landmark wraps the app content

**Given** the TodoInput is rendered
**When** a screen reader reaches it
**Then** it announces `aria-label="Add a new task"`

**Given** the TodoList is rendered
**When** a screen reader reaches it
**Then** it announces `role="list"` with `aria-label="Task list"`

**Given** a TodoItem is rendered
**When** a screen reader reaches it
**Then** it announces `role="listitem"` with the task text
**And** the completion state is announced via `role="checkbox"` and `aria-checked="true"` or `"false"`

**Given** a delete button is rendered on a TodoItem
**When** a screen reader reaches it
**Then** it announces `aria-label="Delete task: [task text]"`

**Given** an ErrorNotification appears
**When** the notification renders
**Then** it is announced via `role="alert"` and `aria-live="polite"`

**Given** the LoadingState is displayed
**When** data is loading
**Then** `aria-live="polite"` and `aria-busy="true"` are set on the list region

**Given** ARIA support is implemented
**When** component tests are run
**Then** all ARIA attribute scenarios pass

### Story 5.4: Accessibility Testing & WCAG Verification

As a user,
I want the app to meet WCAG 2.1 AA standards,
So that the app is usable by everyone regardless of ability.

**Acceptance Criteria:**

**Given** all components are implemented
**When** axe-core is run via `@axe-core/playwright` on each E2E test
**Then** zero critical or serious accessibility violations are reported

**Given** the color palette is implemented
**When** contrast ratios are verified
**Then** `text-primary` on `bg` achieves ~15:1 (passes AA)
**And** `text-secondary` on `bg` achieves ~4.5:1 (passes AA)
**And** `accent` on `bg` achieves ~5.5:1 (passes AA)
**And** `error` on `surface` achieves ~4.8:1 (passes AA)

**Given** `prefers-reduced-motion: reduce` is set
**When** the app renders
**Then** all animations (completion transition, deletion fade-out, notification enter/exit) are disabled — state changes are instant

**Given** the Lighthouse accessibility audit is run
**When** the audit completes
**Then** the accessibility score is 90+ with no critical issues

**Given** the full accessibility test suite is run
**When** E2E tests with axe-core execute across all user journeys
**Then** keyboard navigation, screen reader, contrast, and motion-sensitivity scenarios all pass
