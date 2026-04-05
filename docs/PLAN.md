# Development Plan

## Overview

Development plan for @chan.run/fault. Tasks are organized in phases.
Check off tasks as they're completed.

## Phase 1: Foundation

- [x] Project setup (scaffold, CI, mise.toml)
- [x] Core API implementation (defineError, fault, expect, trySync, tryAsync, declares, match)
- [x] Initial test suite (15 tests)
- [ ] Comprehensive test coverage (edge cases, error chaining, inline codes)
- [ ] JSDoc on all public exports
- [ ] Type-level tests for `declares()` + `tryAsync()` error flow

## Phase 2: Type Refinement

- [ ] Typed error flow: `declares()` → `tryAsync()` → `result.error` narrowing
- [ ] `match()` handler type inference from declared errors
- [ ] Ensure `match()` works with both name and code lookups
- [ ] Inline fault code caching correctness

## Phase 3: Polish

- [ ] README with comprehensive examples
- [ ] API reference documentation
- [ ] Package publishing setup (npm)
- [ ] Bundle size tracking
- [ ] Changelog

---

_Update this plan as the project evolves. Each task should be a vertical slice —
independently demoable when possible._
