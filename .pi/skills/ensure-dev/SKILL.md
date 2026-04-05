---
name: ensure-dev
description: "Use when working on any @chan.run/ensure implementation task. Covers dev workflow, architecture checks, and implementation guidelines."
---

# Ensure Development Skill

Use this skill when working on any @chan.run/ensure implementation task.

## Before Starting Work

1. Read `docs/PLAN.md` → find current slice and next unchecked task
2. Read `SESSION.md` → pick up context from last session (if exists)
3. Read `AGENTS.md` → project rules and conventions

## Process

### Starting a Session

1. Read the current plan: `docs/PLAN.md`
2. Find a task with status unchecked
3. Mark it as in-progress before starting

### Working a Task

1. **Understand the task** — read its description and dependencies
2. **Implement** — write code following project conventions
3. **Test** — `pnpm run test`
4. **Verify** — `mise run check`
5. **Review** — load `/skill:review code` on changed files
6. **Fix review findings** — if any, fix and re-verify
7. **Gate** — run `mise run check` — do not commit until it passes
8. **Commit** — use conventional commits, always ask user first

### Verification Gate

A task is only done when `mise run check` passes:

1. `pnpm run format:check` — biome formatting
2. `pnpm run lint` — biome linting
3. `pnpm run typecheck` — tsc strict mode
4. `pnpm run test` — vitest (all tests pass)
5. `pnpm run build` — tsdown (ESM + CJS output)

Rules:

- Run `mise run check` after every code change before marking done
- If any check fails, fix before moving on
- Never commit code that fails checks

## Key References

| Doc            | Purpose                          |
|----------------|----------------------------------|
| `docs/PLAN.md` | Development plan with checkboxes |
| `SESSION.md`   | Session context handoff          |
| `AGENTS.md`    | Project rules and conventions    |
| `CHANGELOG.md` | Completed work log               |
