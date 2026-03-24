# CLAUDE.md — Agent Instructions

## BMAD Workflow Lessons

### AC Fidelity: Epics → Story → Review

When running BMAD workflows, every acceptance criterion in the epics file must be preserved with 1:1 fidelity through the entire pipeline:

- **create-story**: After generating ACs, count them against the epics source. Flag any mismatch before proceeding. Never collapse, summarize, or omit an AC.
- **dev-story**: If an AC references a specific tool (Postman MCP, Playwright, axe-core, etc.), verify the tool is available and execute that validation — do not silently skip it.
- **code-review**: Load the epics file as a second source of truth. Cross-reference the story's ACs against the original epic ACs. Do not trust the story file as the sole authority.

**Root cause**: In Story 3.1, the 5th AC (Postman MCP contract validation) was dropped during create-story. The gap propagated uncaught through dev-story and code-review — three chances to catch it, all missed.
