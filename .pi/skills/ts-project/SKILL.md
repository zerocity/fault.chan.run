---
name: ts-project
description: "TypeScript library conventions for @chan.run/fault. Use when writing or reviewing TypeScript code."
---

# TypeScript Project Conventions

## Project Structure

```
fault/
├── src/              ← library source (one file per API function)
│   ├── index.ts      ← public re-exports only
│   ├── types.ts      ← shared type definitions
│   ├── ensure.ts
│   ├── define-error.ts
│   ├── fault.ts
│   ├── try.ts
│   ├── declares.ts
│   ├── match.ts
│   └── serialize.ts
├── tests/            ← vitest test files
├── docs/             ← product documentation
├── dist/             ← build output (ESM + CJS + .d.ts)
└── ...
```

## Error Handling

- All errors thrown by the library must be `FaultError` instances
- Use `Error.captureStackTrace` behind a capability check (`"captureStackTrace" in Error`)
- Support the `cause` option for error chaining
- Inline error codes are cached — never create duplicate classes for the same code

## Module Organization

- One file per public API function
- `src/index.ts` re-exports everything — no logic in the barrel file
- `src/types.ts` holds all shared interfaces and type aliases
- Internal helpers stay in the file that uses them (no `utils.ts`)

## Type Safety

- `strict: true` and `noUncheckedIndexedAccess: true` in tsconfig
- No `any` in public API signatures
- Minimize internal `any` — use `unknown` and narrow
- Generics for type-safe `declares()` and `trySync`/`tryAsync` results

## Testing

- Test files in `tests/` directory, named `*.test.ts`
- Use vitest (`describe`, `it`, `expect`)
- Test every public API function
- Cover edge cases: null, undefined, non-Error throws, async rejection
- Test type narrowing works (runtime behavior, not compile-time)

## Dependency Management

- Zero runtime dependencies — this is a core principle
- Dev dependencies: vitest, tsdown, typescript, biome
- Add dependencies only with explicit justification

## Pre-Commit Checklist

```sh
pnpm run format:check   # biome formatting
pnpm run lint            # biome linting
pnpm run typecheck       # tsc --noEmit
pnpm run test            # vitest run
pnpm run build           # tsdown (ESM + CJS)
```

Or just: `mise run check`
