---
title: "Route Handler"
description: A complete route handler with typed error handling
---

# Route Handler

A complete route handler showing `defineError`, `ensure`, `declares`, `tryAsync`, and exhaustive `match` working together.

```ts
import { defineError, ensure, declares, tryAsync, match } from "@chan.run/ensure";

// Error catalog for the users domain
const UserNotFoundError = defineError("UserNotFoundError");
const DbError = defineError("DbError");

// Declare what getUser can throw — type flows through tryAsync
const getUser = declares([UserNotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return ensure(row, UserNotFoundError, `No user: ${id}`);
});

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

## What's happening

1. **`defineError`** creates typed error classes with `isFault: true`
2. **`declares`** annotates `getUser` with the errors it can throw — zero runtime cost
3. **`ensure`** guards the nullable database result — throws `UserNotFoundError` if `null`
4. **`tryAsync(getUser, id)`** passes the declared function directly, so `result.error` is typed as `UserNotFoundError | DbError`
5. **`match` with 3 args** is exhaustive — TypeScript errors if you forget a handler
