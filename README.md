# @chan.run/fault

Type-safe errors without the boilerplate.

```bash
pnpm add @chan.run/fault
```

## Why?

JavaScript error handling is broken by default. Functions throw, but callers have no idea what. `@chan.run/fault` makes error contracts explicit — with zero ceremony.

```ts
import { defineError, declares, fault, expect, tryAsync, match } from "@chan.run/fault";

// Define typed errors
const NotFoundError = defineError("NotFoundError");
const DbError = defineError("DbError");

// Annotate what a function can throw
const getUser = declares([NotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return expect(row, NotFoundError, `No user: ${id}`);
});

// Safe execution — error type flows through
const result = await tryAsync(getUser, id);

if (!result.ok) {
  // TypeScript knows: result.error is NotFoundError | DbError
  match(result.error, [NotFoundError, DbError], {
    NotFoundError: (err) => respond(404, err.message),
    DbError: (err) => respond(503, "DB unavailable"),
  });
}
```

## API

### `defineError(name, options?)`

Define a reusable typed error class. The name string literal is preserved in the type system.

```ts
const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });

const err = new NotFoundError("User not found");
err.name;    // "NotFoundError" (literal type)
err.code;    // "NotFoundError" (or custom code)
err.isFault; // true
```

Options: `{ code?: string, base?: typeof Error }`

### `fault(target, message, options?)`

Throw a typed error. Target is a class from `defineError` or an inline string code.

```ts
// From a defined class
fault(NotFoundError, "User not found");
fault(ValidationError, `Invalid: ${val}`, { cause: originalError });

// Inline — creates and caches a class keyed by the string
fault("RATE_LIMITED", "Too many requests");
```

### `expect(value, ErrorClass, message, options?)`

Assert non-null/undefined. Returns the narrowed value or throws. Also exported as `ensure` to avoid collision with test framework `expect`.

```ts
const user = expect(db.find(id), NotFoundError, `No user: ${id}`);
const token = expect(req.headers.authorization, AuthError, "Missing token");

// Or use the alias:
import { ensure } from "@chan.run/fault";
const user = ensure(db.find(id), NotFoundError, `No user: ${id}`);
```

### `trySync(fn)` / `tryAsync(fn)`

Run code safely — always returns, never throws/rejects. Returns a discriminated union.

```ts
const result = trySync(() => JSON.parse(raw));

if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error); // unknown
}
```

Pass a declared function directly to get typed errors:

```ts
const safeParse = declares([ParseError], (raw: string) => JSON.parse(raw));
const result = trySync(safeParse, raw);
// result.error is ParseError, not unknown
```

### `declares(errorClasses, fn)`

Annotate a function's error surface. Purely type-level — zero runtime cost.

```ts
const getUser = declares([NotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return expect(row, NotFoundError, `No user: ${id}`);
});

// Error types flow through trySync/tryAsync
const result = await tryAsync(getUser, id);
if (!result.ok) {
  result.error; // NotFoundError | DbError
}
```

### `match(error, handlers)` — untyped

Match an error by name or code with a handler map. The `_` key is the fallback.

```ts
match(error, {
  NotFoundError: (err) => respond(404, err.message),
  RATE_LIMITED: (err) => respond(429, "Slow down"),
  _: (err) => { throw err },
});
```

Only fault-created errors (with `isFault === true`) are matched by name/code. Plain `Error` objects fall through to `_`.

### `match(error, errorClasses, handlers)` — exhaustive

Pass the error classes array for compile-time exhaustiveness checking. TypeScript will error if you miss a handler.

```ts
match(result.error, [NotFoundError, DbError], {
  NotFoundError: (err) => respond(404, err.message),
  DbError: (err) => respond(503, "DB unavailable"),
  // TypeScript errors if you remove either handler ↑
});
```

Each handler receives the error narrowed to its specific type — `err.name` is a string literal.

## Patterns

### Module-scoped error catalog

```ts
// errors.ts
export const UserNotFoundError = defineError("UserNotFoundError", { code: "USER_NOT_FOUND" });
export const InvalidInputError = defineError("InvalidInputError", { code: "INVALID_INPUT" });
export const UnauthorizedError = defineError("UnauthorizedError", { code: "UNAUTHORIZED" });
```

### Declared function with typed catch

```ts
const getUser = declares([UserNotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return expect(row, UserNotFoundError, `No user: ${id}`);
});

// Route handler
const result = await tryAsync(getUser, req.params.id);

if (!result.ok) {
  return match(result.error, [UserNotFoundError, DbError], {
    UserNotFoundError: () => res.status(404).json({ error: "Not found" }),
    DbError: () => res.status(503).json({ error: "DB unavailable" }),
  });
}

res.json(result.data);
```

### Wrapping third-party code

```ts
const parseConfig = declares([ValidationError], (raw: string) => {
  const result = trySync(() => JSON.parse(raw));
  if (!result.ok) fault(ValidationError, "Config is not valid JSON", { cause: result.error });
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
