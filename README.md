# @chan.run/fault

Type-safe errors without the boilerplate.

## Install

```bash
pnpm add @chan.run/fault
```

## Quick Start

```ts
import { defineError, fault, expect, tryAsync, match } from "@chan.run/fault";

// Define typed errors
const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });

// Throw with full type info
fault(NotFoundError, "User not found");

// Assert non-null
const user = expect(db.find(id), NotFoundError, `No user: ${id}`);

// Safe async execution
const result = await tryAsync(() => getUser(id));

if (!result.ok) {
  match(result.error, {
    NotFoundError: (err) => console.log("Not found:", err.message),
    _: (err) => { throw err },
  });
}
```

## API

| Export        | Purpose                                      |
|---------------|----------------------------------------------|
| `defineError` | Define a reusable typed error class          |
| `fault()`     | Throw a typed error — inline or from a class |
| `expect()`    | Assert non-null/undefined, throw if missing  |
| `trySync()`   | Run sync code, return `{ ok, data/error }`   |
| `tryAsync()`  | Run async code, return `{ ok, data/error }`  |
| `declares()`  | Annotate a function's error surface          |
| `match()`     | Handle errors by type with a handler map     |

## License

MIT
