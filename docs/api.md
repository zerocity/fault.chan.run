---
title: API Reference
description: Complete API reference for @chan.run/fault
---

# API Reference

## Basic API

These work standalone — no type annotations needed.

### `ensure(value, ErrorClass, message, options?)`

Assert that a value is not `null` or `undefined`. Returns the narrowed value, or throws.

```ts
import { ensure, defineError } from "@chan.run/fault";

const NotFound = defineError("NotFound");

const user = ensure(db.find(id), NotFound, `No user: ${id}`);
// user is guaranteed non-null here — TypeScript knows it
```

Falsy values like `0`, `""`, and `false` pass through — only `null` and `undefined` throw.

Supports error cause chaining via `options`:

```ts
const config = ensure(parseResult, ConfigError, "parse failed", { cause: originalError });
```

### `defineError(name, options?)`

Create a reusable typed error class. Every instance has `name`, `code`, `isFault: true`, and full `Error` compatibility. The name string literal is preserved in the type system.

```ts
import { defineError } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });

const err = new NotFoundError("User not found");
err.name;    // "NotFoundError" (literal type, not string)
err.code;    // "NotFoundError" (or custom code)
err.isFault; // true
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `code` | `string` | same as `name` | Custom error code for matching |
| `base` | `typeof Error` | `Error` | Base class to extend |

### `fault(target, message, options?)`

Throw a typed error with cause chaining. Use `fault` when you're catching an error and rethrowing it as a typed fault. For null-guards, use `ensure` instead.

```ts
import { fault, defineError } from "@chan.run/fault";

const ApiError = defineError("ApiError");

// Wrap a caught error with a typed fault + cause chain
try {
  await thirdPartyApi();
} catch (e) {
  fault(ApiError, "upstream request failed", { cause: e });
}

// Quick inline error — no defineError needed
fault("RATE_LIMITED", "Too many requests");
```

**When to use what:**

| Situation | Use |
|---|---|
| Value might be null/undefined | `ensure(val, Err, msg)` |
| Catch + rethrow with typed error | `fault(Err, msg, { cause: e })` |
| Quick one-off, no class needed | `fault("CODE", msg)` |
| Everything else | `throw new MyError(msg)` |

### `trySync(fn)` / `tryAsync(fn)`

Run code safely. Always returns — never throws or rejects. The result is a discriminated union that forces you to handle both cases.

```ts
import { trySync, tryAsync } from "@chan.run/fault";

// Sync
const result = trySync(() => JSON.parse(raw));

if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Async
const userResult = await tryAsync(() => fetchUser(id));
```

### `match(error, handlers)`

Match an error by name or code. The `_` key is the fallback.

- **Fault errors** — matched by `name` first, then `code`
- **Native errors** (`TypeError`, `AbortError`, `SyntaxError`, etc.) — matched by `name`
- **Plain `Error`** (name is `"Error"`) — always falls through to `_`

```ts
import { match } from "@chan.run/fault";

match(error, {
  NotFoundError: (err) => respond(404, err.message),
  RATE_LIMITED: (err) => respond(429, "Slow down"),
  _: (err) => { throw err },
});
```

## Typed Error Flow

Adds compile-time safety to the basic API.

### `declares(errorClasses, fn)`

Annotate a function's error surface. Zero runtime cost — purely type-level.

```ts
import { declares, defineError, ensure } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");
const DbError = defineError("DbError");

const getUser = declares([NotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return ensure(row, NotFoundError, `No user: ${id}`);
});
```

### `tryAsync(fn, ...args)` — direct pass

Pass a declared function directly (not wrapped in a lambda) to get typed errors:

```ts
const result = await tryAsync(getUser, "user-123");

if (!result.ok) {
  result.error; // NotFoundError | DbError — not unknown
}
```

Works with `trySync` too:

```ts
const safeParse = declares([ParseError], (raw: string) => JSON.parse(raw));
const result = trySync(safeParse, raw);
// result.error is ParseError
```

### `match(error, errorClasses, handlers)` — exhaustive

Pass the error classes array for compile-time exhaustiveness. TypeScript errors if you miss a handler.

```ts
match(result.error, [NotFoundError, DbError], {
  NotFoundError: (err) => respond(404, err.message),
  DbError: (err) => respond(503, "DB unavailable"),
  // Remove either handler ↑ and TypeScript complains
});
```

Each handler receives the error narrowed to its specific type — `err.name` is a string literal, not `string`.

### `combines(sources, fn)` — compose error surfaces

When a function calls multiple declared functions, combine their error surfaces into one:

```ts
import { combines, declares } from "@chan.run/fault";

const getUser = declares([NotFoundError, DbError], ...);
const getOrder = declares([OrderError, DbError], ...);

const getUserOrder = combines([getUser, getOrder], async (userId, orderId) => {
  const user = await getUser(userId);
  const order = await getOrder(orderId);
  return { user, order };
});
// getUserOrder can throw NotFoundError | DbError | OrderError
```

### `toJSON(error)` / `fromJSON(data, registry)`

Serialize fault errors for JSON transport (API responses, logs). Reconstruct on the other side with a registry.

```ts
import { toJSON, fromJSON } from "@chan.run/fault";

// Serialize
const json = toJSON(err);
// { name: "NotFoundError", code: "NotFoundError", message: "No user: 123" }

// Deserialize — registry maps names to error classes
const registry = { NotFoundError, DbError };
const err = fromJSON(json, registry);
// err instanceof NotFoundError === true
```

Returns a plain `Error` if the name isn't in the registry.

## Types

All types are exported for advanced use:

| Type | Description |
|------|-------------|
| `FaultError` | Marker interface — `name`, `code`, `isFault: true` |
| `NamedFaultError<N>` | Fault error with literal name type |
| `FaultErrorClass` | Shorthand for `NamedFaultErrorClass<string>` |
| `NamedFaultErrorClass<N>` | Constructor with literal name |
| `SyncResult<T, E>` | `{ ok: true, data: T } \| { ok: false, error: E }` |
| `AsyncResult<T, E>` | Same as `SyncResult`, for async |
| `DeclaredFn<TArgs, TReturn, TErrors>` | Function annotated with `declares()` |
| `InferFaultErrors<TErrors>` | Extract error union from class tuple |
| `ErrorNames<TErrors>` | Extract name string literals from class tuple |
| `MatchHandlers<T>` | Handler map for untyped `match()` |
| `TypedMatchHandlers<T, TErrors>` | Handler map for exhaustive `match()` |
| `MergeErrors<TFns>` | Merge error tuples from declared functions |
| `FaultErrorJSON` | Serialized representation for JSON transport |
