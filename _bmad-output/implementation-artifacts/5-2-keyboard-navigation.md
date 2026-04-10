# Story 5.2: Keyboard Navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to use the app entirely with my keyboard,
So that I can manage tasks without needing a mouse or touchscreen.

## Acceptance Criteria

**(1:1 with `_bmad-output/planning-artifacts/epics.md` — Story 5.2 — 9 criteria)**

1. **Given** the app loads  
   **When** the page renders  
   **Then** the input field is auto-focused

2. **Given** the input is focused  
   **When** the user presses Tab  
   **Then** focus moves to the first task in the list

3. **Given** a task in the list is focused  
   **When** the user presses Arrow Down  
   **Then** focus moves to the next task

4. **Given** a task in the list is focused  
   **When** the user presses Arrow Up  
   **Then** focus moves to the previous task

5. **Given** a task in the list is focused  
   **When** the user presses Space or Enter  
   **Then** the task completion is toggled

6. **Given** a task in the list is focused  
   **When** the user presses Delete or Backspace  
   **Then** the task is deleted

7. **Given** the input is focused with text  
   **When** the user presses Escape  
   **Then** the input text is cleared

8. **Given** any focusable element is focused  
   **When** it receives focus  
   **Then** a visible focus ring (2px solid `accent`, 2px offset) is displayed

9. **Given** keyboard navigation is implemented  
   **When** component tests are run  
   **Then** all keyboard scenarios (Tab, Arrow, Enter, Space, Delete, Escape, focus ring) pass

## Tasks / Subtasks

- [x] Task 1: Tab order and roving focus (AC: #2, #3, #4)
  - [x] 1.1: Ensure **one** logical tab stop from `TodoInput` to the **first** task row (avoid an extra tab chain through every inner control before “first task” feels primary — e.g. roving `tabIndex` on `<li>` items, `tabIndex={-1}` on non-active rows / delete button if needed per design)
  - [x] 1.2: Implement Arrow Down / Arrow Up to move focus between task rows; define behavior when list has 0 tasks (Tab from input should not violate AC #2 — document actual behavior)
  - [x] 1.3: Optionally move focus from last task back toward input with Up / from first row with Shift+Tab — only if required to avoid focus traps (epic silent here; keep minimal)

- [x] Task 2: Key handlers on task rows (AC: #5, #6)
  - [x] 2.1: `onKeyDown` on focused task row: `Space` and `Enter` call the same toggle path as click (prevent duplicate toggles / form submit if applicable)
  - [x] 2.2: `Delete` and `Backspace` trigger delete for the **focused task row** (align with `TodoList` optimistic delete timing / `DELETE_FADE_MS` behavior)
  - [x] 2.3: If focus lands on the delete `×` button, ensure keys do not cause double-delete or inconsistent behavior

- [x] Task 3: Input focus and Escape (AC: #1, #7)
  - [x] 3.1: Confirm auto-focus on load (`TodoInput` already uses `useEffect` + `focus()` — verify with loading / error / empty states so input is focused when the main input is on screen)
  - [x] 3.2: Escape clears text when input has content (already partially implemented — keep and test)

- [x] Task 4: Focus ring styling (AC: #8)
  - [x] 4.1: Align **input** ring with spec: 2px solid `accent`, 2px offset (`focus:ring-*` / `ring-offset-*` in Tailwind maps to design tokens — verify against `accent` and `bg` tokens)
  - [x] 4.2: Add matching visible focus styles for **task rows** and **delete button** (and any other focusables) — consistent 2px / 2px offset

- [x] Task 5: Tests (AC: #9)
  - [x] 5.1: Extend `TodoInput.test.tsx`, `TodoItem.test.tsx`, `TodoList` tests (or add `keyboard-navigation` focused tests) using `@testing-library/user-event` for Tab, arrows, Space, Enter, Delete, Backspace, Escape
  - [x] 5.2: Assert focus ring classes or computed styles where the project already tests Tailwind classes
  - [x] 5.3: `npm run test --workspace=frontend` and `npm run lint --workspace=frontend` pass

## Dev Notes

### Architecture & code patterns

- **Stack:** Vite + React; TanStack Query mutations for toggle/delete; no new deps unless justified.
- **Roving tabindex:** Common pattern for list widgets: one item has `tabIndex={0}`, others `tabIndex={-1}`; arrows update roving target. Matches “Tab → first task” + “Arrows between tasks.”
- **Enter on `TodoInput`:** Already submits new task; do not conflate with AC #5 (toggle on **task** row). Keep input Enter behavior for create.
- **Story 5.1:** Touch targets and responsive delete affordance remain; keyboard work should not regress hover/mobile behavior.

### Epic cross-story scope

- **Out of this story (per epic sequencing):** Screen reader copy, `lang`, `<main>` landmark-only changes, axe/Lighthouse (Stories 5.3–5.4). This story may add **minimal** `tabIndex`/keyboard behavior without rewriting ARIA from 5.3.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 5.2 (authoritative ACs)
- `_bmad-output/planning-artifacts/architecture.md` — Accessibility NFRs, testing (Vitest/Jest + Playwright)
- `_bmad-output/implementation-artifacts/5-1-responsive-layout.md` — prior layout/touch/delete patterns

### Previous story intelligence (5.1)

- `App.tsx` shell: `main` uses `sm:max-w-[640px]`, `px-4` / `sm:px-12`.
- `TodoItem`: `min-h-[44px]`, delete button `w-11 h-11`, `lg:` hover disclosure for delete.
- `TodoInput`: `min-h-[44px]`, `aria-label="Add a new task"`, auto-focus on mount, Escape clears text, `focus:ring-2 focus:ring-accent focus:ring-offset-2`.
- E2E pattern: `e2e/tests/responsive-layout.spec.ts` for viewport checks — optional E2E for keyboard could follow similar structure later; **AC #9** asks for **component** tests.

### Git intelligence (recent)

- Latest work: Story 5.1 responsive layout (`App`, `TodoItem`, `TodoInput`, tests, `responsive-layout.spec.ts`). Preserve those files when adding keyboard behavior.

### Latest tech notes

- Use **`@testing-library/user-event`** (already in project) for realistic keyboard sequences; `user.keyboard('{Tab}')`, `{ArrowDown}`, etc.
- Prefer **`Element.focus()`** and **roving tabindex** over adding heavy focus libraries.

## Technical requirements

- Tailwind v4 utilities; use existing design tokens (`accent`, `bg`, `ring-offset-bg`).
- No new production dependencies unless necessary for testing or a11y primitives.

## File structure (expected touches)

| Path | Action |
|------|--------|
| `bmad-todo/frontend/src/components/TodoInput.tsx` | Likely — focus on load, Escape, focus ring audit |
| `bmad-todo/frontend/src/components/TodoItem.tsx` | Likely — key handlers, tabindex/roving, focus ring |
| `bmad-todo/frontend/src/components/TodoList.tsx` | Likely — coordinate list-level roving state, refs to items |
| `bmad-todo/frontend/src/components/App.tsx` | Possible — only if focus orchestration must live at shell |
| `bmad-todo/frontend/src/__tests__/components/*.test.tsx` | Extend / add |

## Project context reference

- No `project-context.md` found in repo; rely on epics, architecture, and this file.

## Story completion status

- Code review complete — **done**; sprint `5-2-keyboard-navigation` → **done**

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- **Roving focus:** `TodoList` tracks `rovingIndex`; only the active row has `tabIndex={0}`; other rows and the delete control use `-1` so Tab moves from `TodoInput` to the first task only.
- **Arrow Up** on the first task moves focus back to the input via `inputRef` from `App`.
- **Arrow keys / Space / Enter / Delete / Backspace** on rows use `onKeyDown` on the row; Space/Enter call the same toggle path as click; Delete/Backspace use the existing optimistic delete flow (`DELETE_FADE_MS`).
- **Delete button:** `tabIndex={-1}`; `Delete`/`Backspace` on the button handled so a single delete fires (no propagation to row).
- **TodoInput:** `forwardRef` so `App` can pass `todoInputRef` into `TodoList` for Arrow Up; auto-focus unchanged.
- **Focus rings:** `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg` on input, task row, and delete button.
- **Empty list:** With no tasks, Tab from the input does not move to a list row (no list in the tab order); aligns with AC #2 applying when tasks exist.
- **Tests:** `TodoList.test.tsx` covers Tab, arrows, Space, Enter, Delete, Backspace, roving `tabIndex`; `TodoInput`/`TodoItem` tests cover focus rings and Escape; **117** frontend unit tests; **lint** clean.

### File List

- `bmad-todo/frontend/src/components/App.tsx`
- `bmad-todo/frontend/src/components/TodoInput.tsx`
- `bmad-todo/frontend/src/components/TodoItem.tsx`
- `bmad-todo/frontend/src/components/TodoList.tsx`
- `bmad-todo/frontend/src/components/ErrorState.tsx` (code review: AC #8 focus ring on retry control)
- `bmad-todo/frontend/src/__tests__/components/TodoInput.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/TodoItem.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/TodoList.test.tsx`
- `bmad-todo/frontend/src/__tests__/components/ErrorState.test.tsx`
- `_bmad-output/implementation-artifacts/5-2-keyboard-navigation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-04-10: Story 5.2 — keyboard navigation (roving tabindex, list key handlers, input ref, focus rings, tests).
- 2026-04-10: Code review — `TodoList` layout effect deps stabilized (`todoIdsKey`); `ErrorState` retry button focus ring + test (AC #8).

---

## Code Review (2026-04-10)

**Sources:** `_bmad-output/planning-artifacts/epics.md` Story 5.2 (authoritative ACs), this story file, changed frontend files.

### AC fidelity (epics → implementation)

| # | Epic criterion | Verdict |
|---|----------------|---------|
| 1 | Auto-focus input on load | Met — `TodoInput` `useEffect` + `focus()` |
| 2 | Tab from input → first task | Met — roving `tabIndex`; N/A when list empty or error UI replaces list |
| 3 | Arrow Down → next task | Met — `TodoList.handleRowKeyDown` |
| 4 | Arrow Up → previous task | Met when a previous row exists; on first row, focus moves to input (no prior row — avoids trap; epic silent on this edge) |
| 5 | Space/Enter toggles task | Met — row `onKeyDown` + `preventDefault` |
| 6 | Delete/Backspace deletes task | Met — row + delete button handlers; optimistic delay unchanged |
| 7 | Escape clears input when text | Met — `TodoInput` |
| 8 | Visible focus ring 2px accent, 2px offset | Met — input, row, delete; **review fix:** `ErrorState` “Try again” aligned to same ring pattern (epic: “any focusable element”) |
| 9 | Component tests pass keyboard scenarios | Met — **117** tests |

**Count:** 9 epic AC groups ↔ 9 story AC blocks — aligned.

### Findings (review)

**Fixed in review**

1. **MEDIUM — `useLayoutEffect` deps:** Depended on `todos` by reference, so React Query refetches could re-run the effect unnecessarily. **Fix:** depend on `todoIdsKey` (`id` join) + `todos.length`.
2. **MEDIUM — AC #8 gap:** `ErrorState` retry `button` had no focus ring while epic requires rings on focusables. **Fix:** add `focus:ring-*` / `outline-none` + test.

**Low (informational)**

3. **Documentation:** Story File List initially omitted `sprint-status.yaml` updates — recorded above.
4. **Tests:** Delete/Backspace row tests use `fireEvent.keyDown` (works with fake timers); user-event used elsewhere — acceptable.

### Decision

**Approve and mark done** — Epics ACs satisfied after review fixes; optional follow-ups only.
