# QA reports (generated)

This directory holds **local** test and QA artifacts. Generated files are gitignored; only this README is tracked.

## Prerequisites

- **Node** version from root `package.json` `engines` (e.g. 22.x). If backend coverage fails with `better-sqlite3` native module errors, run `npm rebuild better-sqlite3` from `bmad-todo` (or reinstall deps) so the binary matches your Node version.

## Regenerate everything (coverage + security)

From `bmad-todo`:

```bash
npm run qa:reports
```

Runs frontend coverage, backend coverage, and `npm-audit.json`. Lighthouse runs only if `LIGHTHOUSE_URL` is set or `RUN_LIGHTHOUSE=1`.

### Full stack: coverage + audit + Lighthouse + Playwright

1. Start **backend** (port `3001`) and **frontend** (Vite; often `5173`, or another port if busy).
2. From `bmad-todo`, run (adjust URLs to match your Vite port):

```bash
npm run qa:reports
LIGHTHOUSE_URL=http://localhost:5174 npm run lighthouse:a11y
PLAYWRIGHT_BASE_URL=http://localhost:5174 npm run test:e2e
```

Or fold Lighthouse into the first step:

```bash
LIGHTHOUSE_URL=http://localhost:5174 RUN_LIGHTHOUSE=1 npm run qa:reports
PLAYWRIGHT_BASE_URL=http://localhost:5174 npm run test:e2e
```

### View HTML reports locally

- **Coverage:** open `coverage-frontend/index.html` or `coverage-backend/index.html` in a browser.
- **Playwright:** open `playwright-html/index.html`.

Partial runs:

```bash
npm run qa:reports:frontend
npm run qa:reports:backend
npm run qa:security
```

## Artifacts

| Report | Path (after generation) | Command / notes |
|--------|---------------------------|-----------------|
| Frontend unit coverage (HTML + JSON summary) | `coverage-frontend/` | `npm run test:coverage --workspace=frontend` |
| Backend unit coverage | `coverage-backend/` | `npm run test:coverage --workspace=backend` |
| npm dependency audit (JSON) | `npm-audit.json` | `npm run qa:security` |
| Lighthouse accessibility (JSON LHR) | `lighthouse-a11y.json` | `npm run lighthouse:a11y` — **requires** app up at `LIGHTHOUSE_URL` (default `http://localhost:5173`) |
| Playwright E2E HTML | `playwright-html/index.html` | `npm run test:e2e` (from `bmad-todo`). If Vite is not on 5173, set `PLAYWRIGHT_BASE_URL` (e.g. `http://localhost:5174`). |
| Playwright traces / failures | `playwright-test-results/` | Screenshots, traces, etc. |

## Accessibility (other)

- **axe** runs in Playwright E2E; failures appear in the Playwright report and terminal (no separate axe HTML by default).

## Security

- `npm-audit.json` is an **npm audit** snapshot, not a full penetration test or SAST. Review severities and `npm audit fix` as appropriate.
