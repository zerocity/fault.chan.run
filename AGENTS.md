# @chan.run/ensure

Type-safe errors without the boilerplate.

## Overview

JavaScript error handling is broken by default. Functions throw, but callers have no idea what. `@chan.run/ensure` makes errors explicit — with zero ceremony.

This is a **TypeScript library** distributed on npm as `@chan.run/ensure`. It provides typed error classes, safe execution wrappers, and error matching — everything needed to make error contracts visible in the type system.

## API Surface

| Export        | File              | Purpose                                        |
|---------------|-------------------|------------------------------------------------|
| `ensure()`    | `src/ensure.ts`   | Assert non-null/undefined — class, string, or class+message |
| `EnsureError`  | `src/ensure.ts`   | Built-in error for string-form ensure          |
| `defineError` | `src/define-error.ts` | Define a reusable typed error class        |
| `fault()`     | `src/fault.ts`    | Throw a typed error with cause chaining        |
| `trySync()`   | `src/try.ts`      | Run sync code, return `{ ok, data/error }`     |
| `tryAsync()`  | `src/try.ts`      | Run async code, return `{ ok, data/error }`    |
| `declares()`  | `src/declares.ts` | Annotate a function's error surface            |
| `combines()`  | `src/declares.ts` | Compose error surfaces from declared functions |
| `match()`     | `src/match.ts`    | Handle errors by type — fault, native, or fallback |
| `toJSON()`    | `src/serialize.ts`| Serialize a fault error for JSON transport     |
| `fromJSON()`  | `src/serialize.ts`| Reconstruct a fault error from JSON            |

## Structure

```
ensure/
├── src/              ← library source
│   ├── index.ts      ← public barrel (re-exports only)
│   ├── types.ts      ← FaultError, FaultErrorClass, result types
│   ├── ensure.ts
│   ├── define-error.ts
│   ├── fault.ts
│   ├── try.ts
│   ├── declares.ts
│   ├── match.ts
│   └── serialize.ts
├── tests/            ← vitest tests
├── docs/             ← documentation
├── dist/             ← build output (ESM + CJS + .d.ts)
├── .pi/skills/       ← agent skills
└── .github/workflows/
```

## Technology Stack

| Tool       | Choice     | Why                                  |
|------------|------------|--------------------------------------|
| Language   | TypeScript | Target ecosystem                     |
| Build      | tsdown     | Zero-config ESM + CJS dual output    |
| Test       | vitest     | Fast, native TS/ESM support          |
| Lint       | biome      | Single tool for lint + format        |
| Package    | pnpm       | Workspace-aware, fast                |
| Task runner| mise       | Polyglot, declarative                |
| CI         | GitHub Actions | Standard for GitHub repos        |

## Dependencies

- **External:** None — zero runtime dependencies by design
- **Ecosystem:** None — standalone OSS package
- **System:** Node.js 18+ (also works in Deno, Bun, browsers, Cloudflare Workers)

## Development Workflow

Load `.pi/skills/ensure-dev/SKILL.md` for the full development protocol.

## Verification Gate

```sh
mise run check
```

Runs: format:check → lint → typecheck → test → build

## Hard Rules

- **No `any` in public API** — use `unknown` and narrow
- **Zero runtime dependencies** — this is a core library principle
- **All errors are FaultError** — `isFault: true`, `name`, `code` always present
- **One file per API function** — `src/index.ts` is re-exports only
- **Tests before commit** — never commit code that fails `mise run check`
- **Conventional commits** — `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

## Review Configuration

### docs — files to cross-check

- `AGENTS.md`
- `README.md`
- `docs/PLAN.md`
- `docs/api.md`
- `docs/examples/*.md`

### arch — structural entry points

- `src/index.ts`
- `src/types.ts`
- `src/define-error.ts`
- `src/ensure.ts`
- `src/fault.ts`
- `src/declares.ts`
- `src/match.ts`
- `src/serialize.ts`
- `src/try.ts`

### design

No frontend — skip design reviews.

### check-command

```sh
mise run check
```
