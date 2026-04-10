# Phase 3 — Log

Ongoing log. Use dated entries. Be concise.

---

## 1. Agent usage

- Tasks with AI:  story creation, impl, review
- Issues: 
  - Composer 2 fast can cause missing stories; sprint status not set automatically.
  - Composer 2 fast: may duplicate stories if not stopped; may forget to mark tickets done.

---

## 2. MCP server usage
- Used: tessl, playwright, postman, chrome-devtools, context7 
- Actual use: No direct use of Postman/Playwright/DevTools MCP; E2E tests gave sufficient feedback after each task.

---

## Limitations

- Architecture changes require explicit/manual doc updates.
- AC dropped between epics and story; fix: count ACs at create-story, reference epics at code-review, verify tool ACs and execute if possible.
- Epic QA steps occasionally mismatched active dev work; note these.
- Framework churn (e.g. `MutableRefObject` deprecation): track API changes and log agent mistakes vs. upstream breaks.

- Human input needed for judgment, product/security, prioritization, AC completeness checks vs. epics.

---

## Quick capture (unfiled)

- Install mcollina/skills: `npx skills add mcollina/skills` (check current relevance)
