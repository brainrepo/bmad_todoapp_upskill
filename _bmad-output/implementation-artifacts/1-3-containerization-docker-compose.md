# Story 1.3: Containerization & Docker Compose

Status: done

## Story

As a developer,
I want Docker containers for frontend and backend orchestrated via Docker Compose,
so that the application can be started with a single `docker-compose up` command.

## Acceptance Criteria

1. **Given** the frontend and backend projects from Stories 1.1 and 1.2 **When** `docker-compose up` is executed **Then** the backend container builds via multi-stage Dockerfile (build → runtime), runs as non-root user, and exposes the API
2. **Given** `docker-compose up` is executed **Then** the frontend container builds via multi-stage Dockerfile (Vite build → Nginx), runs as non-root user
3. **Given** the containers are running **Then** Nginx serves static files and reverse-proxies `/api/*` requests to the backend container
4. **Given** the containers are running **Then** SQLite database file is persisted via Docker volume mount (`./data:/app/data`)
5. **Given** the containers are running **Then** `GET /api/health` is accessible through the Nginx proxy
6. **Given** the project is set up **Then** `.env.example` documents all required environment variables
7. **Given** containers have been run with data **When** `docker-compose down && docker-compose up` is executed **Then** existing todo data is preserved

## Tasks / Subtasks

- [x] Task 1: Create backend Dockerfile (AC: 1, 4)
  - [x] 1.1: Create `bmad-todo/backend/Dockerfile` — multi-stage: stage 1 (`node:22-alpine AS builder`) installs all deps and runs `npm run build`; stage 2 (`node:22-alpine`) installs only production deps, copies `dist/`, runs as non-root user (`node`), sets `CMD ["node", "dist/index.js"]`
  - [x] 1.2: Set `WORKDIR /app` in both stages, copy `package*.json` first for layer caching, then copy source/built files
  - [x] 1.3: Add health check instruction: `HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3001/api/health || exit 1`
  - [x] 1.4: Ensure non-root user: `USER node` in runtime stage
- [x] Task 2: Create frontend Dockerfile (AC: 2, 3)
  - [x] 2.1: Create `bmad-todo/frontend/Dockerfile` — multi-stage: stage 1 (`node:22-alpine AS builder`) runs `npm run build` producing `dist/`; stage 2 (`nginx:alpine`) copies `dist/` to `/usr/share/nginx/html`
  - [x] 2.2: Copy custom `nginx.conf` into the Nginx image at `/etc/nginx/conf.d/default.conf`
  - [x] 2.3: Ensure non-root user in Nginx stage — Nginx alpine already runs worker processes as `nginx` user
- [x] Task 3: Create Nginx configuration (AC: 3, 5)
  - [x] 3.1: Create `bmad-todo/frontend/nginx.conf` — serve static files from `/usr/share/nginx/html`, proxy `/api/` to `http://backend:3001`
  - [x] 3.2: Configure `try_files $uri $uri/ /index.html` for SPA routing
  - [x] 3.3: Set `proxy_pass http://backend:3001;` with appropriate proxy headers
- [x] Task 4: Create docker-compose.yml (AC: 1, 2, 4, 5, 7)
  - [x] 4.1: Create `bmad-todo/docker-compose.yml` — monorepo-aware build context (root `.`) with per-package Dockerfiles
  - [x] 4.2: Add bind mount `./data:/app/data` to backend service for SQLite persistence
  - [x] 4.3: Pass environment variables to backend: `DATABASE_PATH=/app/data/todos.db`, `PORT=3001`, `HOST=0.0.0.0`, `NODE_ENV=production`, `FRONTEND_URL=http://localhost`
  - [x] 4.4: Add `depends_on: backend` to frontend service
  - [x] 4.5: Add `restart: unless-stopped` to both services
- [x] Task 5: Create/verify data directory and .gitkeep (AC: 4)
  - [x] 5.1: Ensure `bmad-todo/data/.gitkeep` exists
  - [x] 5.2: Ensure `bmad-todo/.gitignore` excludes `data/*.db` but keeps `data/.gitkeep`
- [x] Task 6: Update .env.example (AC: 6)
  - [x] 6.1: Verified `.env.example` documents all required variables: `PORT`, `HOST`, `DATABASE_PATH`, `NODE_ENV`, `FRONTEND_URL`
- [x] Task 7: Verify end-to-end Docker flow (AC: 1-7)
  - [x] 7.1: `docker compose up -d` — both containers started successfully
  - [x] 7.2: `curl http://localhost/api/health` returns `{"status":"ok"}` through Nginx proxy
  - [x] 7.3: `docker compose down && docker compose up -d` — data persists (todos.db preserved via volume mount)

## Dev Notes

### Architecture Requirements

- **Multi-stage builds:** CRITICAL — reduces image size significantly. Builder stage includes all devDependencies; runtime stage only has production deps.
- **Non-root users:** Backend uses `USER node` (built into node:alpine), frontend Nginx uses `nginx` user (built into nginx:alpine).
- **Backend port:** `3001` internal, exposed as `3001` externally (or can be internal-only if accessed only via Nginx — both approaches valid, exposing makes debugging easier).
- **Frontend port:** Nginx listens on `80`, mapped to host `80:80`.
- **Docker network:** Docker Compose creates a default network automatically. Services reference each other by service name — backend is reachable at `http://backend:3001` from the frontend Nginx container.
- **SQLite persistence:** Volume mount `./data:/app/data` means the DB file at `/app/data/todos.db` persists across container restarts. The `data/` directory must exist on the host (guaranteed by `data/.gitkeep`).
- **Health check:** Backend Dockerfile includes `HEALTHCHECK` using `wget` (available in Alpine). Frontend `depends_on: backend` ensures startup order.

### Backend Dockerfile Pattern

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER node
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile Pattern

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx Configuration Pattern

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### docker-compose.yml Pattern

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - HOST=0.0.0.0
      - DATABASE_PATH=/app/data/todos.db
      - FRONTEND_URL=http://localhost
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Important: Frontend Build Context

The frontend `Dockerfile` must be placed at `bmad-todo/frontend/Dockerfile`. When building, the build context is `./frontend` — so `COPY package*.json ./` copies from `frontend/package*.json`. The `nginx.conf` is also in the `frontend/` directory.

### Important: Backend TypeScript Build

The backend uses `"type": "module"` (ES Modules). The `tsconfig.json` must output to `dist/`. Verify `tsconfig.json` has `"outDir": "./dist"` and `"module": "NodeNext"` or `"ESNext"`. The entrypoint after build is `dist/index.js`.

### .gitignore Considerations

```gitignore
# SQLite DB (volume-mounted in Docker)
data/*.db

# Keep the directory
!data/.gitkeep
```

### Environment Variable Summary

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Backend HTTP port |
| `HOST` | `0.0.0.0` | Backend bind address |
| `DATABASE_PATH` | `./data/todos.db` | SQLite file path |
| `NODE_ENV` | `development` | Runtime environment |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin for backend |

### File Locations

| File | Purpose |
|------|---------|
| `bmad-todo/backend/Dockerfile` | Backend multi-stage build |
| `bmad-todo/frontend/Dockerfile` | Frontend multi-stage build |
| `bmad-todo/frontend/nginx.conf` | Nginx SPA + API proxy config |
| `bmad-todo/docker-compose.yml` | Orchestrates both containers |
| `bmad-todo/data/.gitkeep` | Ensures data/ dir exists in git |
| `bmad-todo/.env.example` | Documents all env variables |

### Previous Story Learnings (from Stories 1.1 & 1.2)

- Backend uses ES Modules (`"type": "module"`) — compiled output uses `.js` extensions
- Backend `index.ts` entrypoint reads `PORT` (default `3001`) and `HOST` (default `0.0.0.0`) from env
- Backend `plugins/database.ts` reads `DATABASE_PATH` from env (defaults to `:memory:` for tests — in production Docker, set to `/app/data/todos.db`)
- Backend `plugins/cors.ts` reads `FRONTEND_URL` from env
- Root `package.json` already has `docker:up` and `docker:down` scripts
- Vite proxy (`/api` → `http://localhost:3001`) is only for local dev — in production Docker, Nginx handles the proxy

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — container architecture details
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — file locations
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Dockerfiles use monorepo-aware build context: root `package.json` + `package-lock.json` + all workspace `package.json` files copied, then `npm ci --workspace=<name>` used instead of plain `npm ci`
- `docker-compose.yml` uses `context: .` (monorepo root) with `dockerfile: backend/Dockerfile` / `dockerfile: frontend/Dockerfile`
- Fixed 3 pre-existing issues from Story 1.1 during Docker build: missing `app.css`, `vite.config.ts` import from `vitest/config`, monorepo-aware workspace npm ci
- All 7 acceptance criteria verified: containers build, start, health check through Nginx, data persists across restarts
- Code review fixes applied: data dir ownership for non-root user, EXPOSE 3001, X-Forwarded-Proto header, dockerignore data/ exclusion, gitignore data/* pattern

### File List

| File | Action | Purpose |
|------|--------|---------|
| `bmad-todo/backend/Dockerfile` | Created | Multi-stage backend build (monorepo-aware) |
| `bmad-todo/frontend/Dockerfile` | Created | Multi-stage frontend build → Nginx |
| `bmad-todo/frontend/nginx.conf` | Created | SPA routing + API reverse proxy |
| `bmad-todo/docker-compose.yml` | Created | Orchestrates backend + frontend containers |
| `bmad-todo/.dockerignore` | Created | Excludes node_modules, dist, etc. from build context |
| `bmad-todo/data/.gitkeep` | Created | Ensures data/ directory exists in git |
| `bmad-todo/.gitignore` | Modified | Changed `data/` to `data/*.db` with `!data/.gitkeep` |
| `bmad-todo/frontend/src/app.css` | Created | Missing Tailwind CSS import (Story 1.1 fix) |
| `bmad-todo/frontend/vite.config.ts` | Modified | Import from `vitest/config` for tsc -b compatibility |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-06 | Story file created |
| 2026-03-06 | All tasks implemented and verified, status → review |
| 2026-03-06 | Code review: 1 HIGH, 4 MEDIUM, 1 LOW found — all fixed automatically |
