# @chan.run/fault

Type-safe errors without the boilerplate.

```bash
pnpm add @chan.run/fault
```

## Why?

JavaScript error handling is broken by default. Functions throw, but callers have no idea what. `@chan.run/fault` makes error contracts explicit — with zero ceremony.

## Quick Start

```ts
import { defineError, ensure, tryAsync, match } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");

// Guard a nullable value — throws NotFoundError if null/undefined
const user = ensure(db.find(id), NotFoundError, `No user: ${id}`);

// Safe async execution — never rejects
const result = await tryAsync(() => fetchUser(id));

if (!result.ok) {
  match(result.error, {
    NotFoundError: (err) => respond(404, err.message),
    _: (err) => { throw err },
  });
}
```

## Example

A complete route handler showing every part of the library working together:

```ts
import { defineError, ensure, declares, tryAsync, match } from "@chan.run/fault";

// Define typed errors — each carries its name in the type system
const UserNotFoundError = defineError("UserNotFoundError");
const DbError = defineError("DbError");

// Declare what a function can throw — purely type-level, zero runtime cost
const getUser = declares([UserNotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return ensure(row, UserNotFoundError, `No user: ${id}`);
});

// Safe execution — error type flows through automatically
export async function handleGetUser(req: Request): Promise<Response> {
  const result = await tryAsync(getUser, req.params.id);

  if (result.ok) {
    return Response.json(result.data);
  }

  // TypeScript enforces you handle both error types
  return match(result.error, [UserNotFoundError, DbError], {
    UserNotFoundError: (err) => Response.json({ error: err.message }, { status: 404 }),
    DbError: (err) => Response.json({ error: "Service unavailable" }, { status: 503 }),
  });
}
```

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

### `defineError(name, options?)`

Create a reusable typed error class. Every instance has `name`, `code`, `isFault: true`, and full `Error` compatibility.

```ts
import { defineError } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });

const err = new NotFoundError("User not found");
err.name;    // "NotFoundError"
err.code;    // "NotFoundError"
err.isFault; // true
```

Options: `{ code?: string, base?: typeof Error }`

### `fault(target, message, options?)`

Throw a typed error with cause chaining. Use `fault` when you're catching an error and rethrowing it as a typed fault — this is its primary purpose. For null-guards, use `ensure` instead.

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

Match an error by name or code. The `_` key is the fallback. Works with fault errors (by name + code), native errors like `TypeError` and `AbortError` (by name), and plain `Error` (always falls through to `_`).

```ts
import { match } from "@chan.run/fault";

match(error, {
  NotFoundError: (err) => respond(404, err.message),
  RATE_LIMITED: (err) => respond(429, "Slow down"),
  _: (err) => { throw err },
});
```

## Typed Error Flow

The advanced story. Adds compile-time safety to the basic API.

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

When a function calls multiple declared functions, combine their error surfaces:

```ts
const getUser = declares([NotFoundError, DbError], ...);
const getOrder = declares([OrderError, DbError], ...);

const getUserOrder = combines([getUser, getOrder], async (userId, orderId) => {
  const user = await getUser(userId);
  const order = await getOrder(orderId);
  return { user, order };
});
// getUserOrder can throw NotFoundError | DbError | OrderError
```

### `toJSON(error)` / `fromJSON(data, registry)` — serialization

Serialize fault errors for API responses, reconstruct on the client:

```ts
// Server
res.json(toJSON(err));
// { name: "NotFoundError", code: "NotFoundError", message: "No user: 123" }

// Client
const err = fromJSON(body.error, { NotFoundError, DbError });
// err instanceof NotFoundError === true
```

## Patterns

### Error catalog

```ts
// errors.ts — define once, import everywhere
export const UserNotFoundError = defineError("UserNotFoundError");
export const InvalidInputError = defineError("InvalidInputError", { code: "INVALID_INPUT" });
export const UnauthorizedError = defineError("UnauthorizedError");
```

### Wrapping third-party code

`fault` shines here — catch an untyped error and rethrow it as a typed fault with the original as `cause`:

```ts
const parseConfig = declares([ConfigError], (raw: string) => {
  const result = trySync(() => JSON.parse(raw));
  if (!result.ok) fault(ConfigError, "Invalid JSON", { cause: result.error });
  return result.data as Config;
});
```

## Environment Support

| Environment        | Supported |
|--------------------|-----------|
| Node.js 18+        | ✅        |
| Deno               | ✅        |
| Bun                | ✅        |
| Browser            | ✅        |
| Cloudflare Workers | ✅        |

## License

MIT — [chan.run](https://chan.run)
