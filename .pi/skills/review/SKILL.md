---
name: review
description: "Review project documents for consistency or architectural issues. Use with /skill:review docs, /skill:review arch, /skill:review code, or /skill:review design."
---

# Review Skill

Four modes: **docs**, **arch**, **code**, **design**.

## Mode: docs — Document Consistency Review

Read ALL of these files completely:

- `AGENTS.md`
- `README.md`
- `docs/PLAN.md`
- `SESSION.md` (if exists)
- `CHANGELOG.md` (if exists)
- `.pi/skills/*/SKILL.md`

Then check for contradictions, terminology drift, stale references, missing coverage,
and code-vs-docs drift.

## Mode: arch — Architectural Review

Read structural entry points:

- `src/index.ts` — public API surface
- `src/types.ts` — core type definitions
- `src/define-error.ts` — error class factory
- `src/fault.ts` — throw helper with inline cache
- `src/expect.ts` — null assertion
- `src/try.ts` — safe execution wrappers
- `src/declares.ts` — type-level function annotation
- `src/match.ts` — error handler dispatch

Check for hidden dependencies, type leaks, export consistency, and missing edge cases.

## Mode: code — Strict Code Review

TypeScript library checklist:

- **Type safety** — no `any` escapes in public API, minimal internal `any`
- **Error handling** — all thrown errors are FaultError instances
- **Exports** — every public symbol exported from `src/index.ts`
- **Bundle size** — no unnecessary dependencies, tree-shakeable
- **Edge cases** — null, undefined, non-Error throws, async rejection
- **Tests** — every public API function has test coverage
- **Documentation** — JSDoc on all exports
- **Naming** — consistent with spec (defineError, fault, expect, trySync, tryAsync, declares, match)

## Mode: design

This product has no frontend. Skip design reviews.

### check-command

```sh
mise run check
```
