# BMAD Todo

A full-stack todo application built with the [BMAD methodology](https://github.com/bmadcode/BMAD-METHOD) — from product brief through architecture, UX design, and iterative story-driven development.

## Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Fastify + TypeScript
- **Database**: SQLite (file-based, in `data/`)
- **E2E Testing**: Playwright
- **Unit Testing**: Vitest
- **Containerization**: Docker Compose

## Getting Started

### Prerequisites

- Node.js >= 20.19.0
- Docker & Docker Compose (optional, for containerized run)

### Local Development

```bash
cd bmad-todo
npm install
npm run dev
```

This starts both the backend and frontend dev servers concurrently.

### Docker

```bash
cd bmad-todo
npm run docker:up
```

### Running Tests

```bash
# Unit tests (frontend + backend)
npm test

# E2E tests
npm run test:e2e
```

## Project Structure

```
bmad-todo/
├── backend/          # Fastify API server
├── frontend/         # React + Vite SPA
├── e2e/              # Playwright end-to-end tests
├── docker-compose.yml
└── package.json      # Workspace root

_bmad/                # BMAD methodology templates & config
_bmad-output/         # Generated planning & implementation artifacts
├── planning-artifacts/   # PRD, architecture, epics, UX design
└── implementation-artifacts/ # Story specs, sprint status, retros
```

## BMAD Artifacts

This project was planned and built using the BMAD workflow. Key artifacts:

- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **Epics & Stories**: `_bmad-output/planning-artifacts/epics.md`
- **UX Design**: `_bmad-output/planning-artifacts/ux-design-specification.md`
