# Story 5.3: Screen Reader & ARIA Support

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user relying on a screen reader,
I want all app elements properly announced with their roles and states,
So that I can use the app effectively without visual cues.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 5.3 — 8 criteria)**

1. **Given** the app renders  
   **When** a screen reader traverses the page  
   **Then** the `<html>` element has `lang="en"`  
   **And** the page `<title>` is "things to do"  
   **And** a single `<main>` landmark wraps the app content

2. **Given** the TodoInput is rendered  
   **When** a screen reader reaches it  
   **Then** it announces `aria-label="Add a new task"`

3. **Given** the TodoList is rendered  
   **When** a screen reader reaches it  
   **Then** it announces `role="list"` with `aria-label="Task list"`

4. **Given** a TodoItem is rendered  
   **When** a screen reader reaches it  
   **Then** it announces `role="listitem"` with the task text  
   **And** the completion state is announced via `role="checkbox"` and `aria-checked="true"` or `"false"`

5. **Given** a delete button is rendered on a TodoItem  
   **When** a screen reader reaches it  
   **Then** it announces `aria-label="Delete task: [task text]"`

6. **Given** an ErrorNotification appears  
   **When** the notification renders  
   **Then** it is announced via `role="alert"` and `aria-live="polite"`

7. **Given** the LoadingState is displayed  
   **When** data is loading  
   **Then** `aria-live="polite"` and `aria-busy="true"` are set on the **list region**

8. **Given** ARIA support is implemented  
   **When** component tests are run  
   **Then** all ARIA attribute scenarios pass

## Tasks / Subtasks

- [x] Task 1: Document shell & landmark (AC: #1)
  - [x] 1.1: Confirm `index.html` — `lang="en"`, `<title>things to do</title>` (already present; verify no regressions)
  - [x] 1.2: Ensure exactly one `<main>` wrapping primary app content; resolve `ErrorNotification` placement vs landmark rules (toast may stay outside `main` if product pattern requires — align with epic “single main wraps **app content**” wording)

- [x] Task 2: List / item / checkbox structure (AC: #3, #4, #5)
  - [x] 2.1: Keep `TodoList` `<ul role="list" aria-label="Task list">` (verify)
  - [x] 2.2: Refactor `TodoItem` so the row satisfies epic: **listitem** exposes task text; **checkbox** + `aria-checked` for completion (likely `role="listitem"` on `<li>` with inner control `role="checkbox"` — avoid putting `role="checkbox"` on the `<li>` alone if that conflicts with listitem semantics)
  - [x] 2.3: Delete button keeps `aria-label="Delete task: [task text]"` (verify)

- [x] Task 3: Error & loading regions (AC: #6, #7)
  - [x] 3.1: `ErrorNotification` — `role="alert"`, `aria-live="polite"` (verify)
  - [x] 3.2: **Loading:** Epic requires live region + busy on the **list region**. Today `LoadingState` is a standalone block; implement a pattern where the loading affordance applies to the list landmark (e.g. `aria-busy` / `aria-live` on a container that represents the list area, or render loading inside a list wrapper per UX — match epic literally)

- [x] Task 4: TodoInput label (AC: #2)
  - [x] 4.1: Confirm `aria-label="Add a new task"` on the input

- [x] Task 5: Tests (AC: #8)
  - [x] 5.1: Extend or add tests for `App`, `TodoInput`, `TodoList`, `TodoItem`, `ErrorNotification`, `LoadingState` — assert required roles, labels, live regions, and busy state
  - [x] 5.2: `npm run test --workspace=frontend` and `npm run lint --workspace=frontend` pass

## Dev Notes

### Post–5.3 implementation (reference)

- `index.html` — `lang="en"`, `<title>things to do</title>` (verified by `index-html.test.ts`).
- `App.tsx` — one `<main>`; `ErrorNotification` rendered **inside** `<main>` (AC #1).
- `TodoInput` — `aria-label="Add a new task"`.
- `TodoList` — `<ul role="list" aria-label="Task list">`; while loading, same `<ul>` carries `aria-live="polite"` and `aria-busy={true}` (AC #7).
- `TodoItem` — `<li>` (native listitem) + inner `role="checkbox"` + `aria-checked` (AC #4).
- `ErrorNotification` — `role="alert"`, `aria-live="polite"` (AC #6).
- `LoadingState` — loading copy only; live region attributes live on the list `<ul>` in `TodoList` when loading.

### Architecture

- React 19 + Vite; no new deps unless testing requires it.
- **Story 5.2:** Keyboard behavior (roving tabindex, key handlers) must keep working after any `TodoItem` DOM/role refactor — re-run keyboard tests.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 5.3 (authoritative ACs)
- `_bmad-output/implementation-artifacts/5-2-keyboard-navigation.md` — prior keyboard/list behavior
- [WAI-ARIA: Listbox patterns](https://www.w3.org/WAI/ARIA/apg/) — use APG list + checkbox patterns as needed

### Out of scope

- WCAG axe/Lighthouse automation (Story 5.4); keyboard-only specifics already in 5.2 unless regressions appear

## Technical requirements

- Semantic HTML first; ARIA only where native semantics are insufficient.
- Preserve existing visual design unless story requires markup changes.

## File structure (expected touches)

| Path | Action |
|------|--------|
| `bmad-todo/frontend/index.html` | Verify |
| `bmad-todo/frontend/src/components/App.tsx` | Possible — landmark / notification placement |
| `bmad-todo/frontend/src/components/TodoList.tsx` | Likely — loading list region |
| `bmad-todo/frontend/src/components/TodoItem.tsx` | Likely — listitem + checkbox structure |
| `bmad-todo/frontend/src/components/TodoInput.tsx` | Verify |
| `bmad-todo/frontend/src/components/LoadingState.tsx` | Likely — or move logic to parent |
| `bmad-todo/frontend/src/components/ErrorNotification.tsx` | Verify |
| `bmad-todo/frontend/src/__tests__/components/*.test.tsx` | Extend |

## Project context reference

- No `project-context.md` in repo; rely on epics and this file.

## Story completion status

- Code review complete — **done**; sprint `5-3-screen-reader-aria-support` → **done**

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- **`index.html`:** `lang="en"` and `<title>things to do</title>` asserted via `src/__tests__/index-html.test.ts`.
- **`App`:** Single `<main>` test; `ErrorNotification` moved **inside** `<main>` so toast is part of the same landmark as primary content (AC #1).
- **`TodoItem`:** `<li>` (native **listitem**) + inner `<div role="checkbox" aria-checked=...>` for completion; keyboard ref/focus remains on the checkbox div; delete `aria-label` unchanged.
- **`TodoList`:** Loading path renders `<ul role="list" aria-label="Task list" aria-live="polite" aria-busy={true}>` with one `<li>` containing `LoadingState` text (AC #7).
- **`LoadingState`:** Reduced to loading copy only; live/busy live on the list `<ul>` in `TodoList` while loading.
- **Tests:** `TodoItem` listitem + checkbox test; `TodoList` list busy/live when loading; `App` single main; **118** frontend unit tests; **lint** clean.

### File List

- `bmad-todo/frontend/index.html` (verified; covered by test)
- `bmad-todo/frontend/src/components/App.tsx`
- `bmad-todo/frontend/src/components/TodoList.tsx`
- `bmad-todo/frontend/src/components/TodoItem.tsx`
- `bmad-todo/frontend/src/components/LoadingState.tsx`
- `bmad-todo/frontend/src/__tests__/components/App.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/LoadingState.test.tsx`
- `bmad-todo/frontend/src/__tests__/index-html.test.ts`
- `_bmad-output/implementation-artifacts/5-3-screen-reader-aria-support.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-10: Story 5.3 — ARIA (listitem/checkbox split, list-region loading, main + notification, tests).
- 2026-04-10: Code review — stale Dev Notes corrected; AC table vs epics; story marked done.

---

## Code Review (2026-04-10)

**Sources:** `_bmad-output/planning-artifacts/epics.md` Story 5.3 (authoritative ACs), this story file, changed frontend files.

### AC fidelity (epics → implementation)

| # | Epic criterion | Verdict |
|---|----------------|---------|
| 1 | `lang="en"`, title **things to do**, single `<main>` | Met — `index.html` + tests; `App` one `main`; toast inside `main` |
| 2 | TodoInput `aria-label="Add a new task"` | Met — unchanged; covered by `TodoInput` tests |
| 3 | TodoList `role="list"` + `aria-label="Task list"` | Met — `TodoList` |
| 4 | Listitem + task text; checkbox + `aria-checked` | Met — native `<li>` + inner `role="checkbox"` |
| 5 | Delete `aria-label="Delete task: [text]"` | Met — `TodoItem` |
| 6 | ErrorNotification `role="alert"` + `aria-live="polite"` | Met |
| 7 | Loading: `aria-live` + `aria-busy` on **list region** | Met — loading `<ul>` carries attributes; `LoadingState` is inner copy |
| 8 | Component tests — ARIA scenarios | Met — **118** tests |

**Count:** 8 epic AC groups ↔ 8 story AC blocks — aligned.

### Findings

**Fixed in review**

1. **Medium (documentation)** — Story **Dev Notes** still described pre–5.3 behavior (toast outside `main`, old `TodoItem` structure). **Corrected** the “Post–5.3 implementation” subsection so the story matches the codebase.

**Low (informational)**

2. **`role="list"` on `<ul>`** — Redundant with native list semantics; epic explicitly calls for it — left as-is.

3. **Git vs File List** — `index-html.test.ts` was implied in completion notes; **confirmed** in File List below.

### Decision

**Approve and mark done** — Epics ACs satisfied; tests green; documentation drift addressed.
