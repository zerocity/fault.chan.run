---
title: Quick Start
description: Get started with @chan.run/fault in under 5 minutes
---

# Quick Start

## Installation

```bash
pnpm add @chan.run/fault
```

## 1. Define Errors

```ts
import { defineError } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });
```

Every error has `name`, `code`, `isFault: true`, and full `Error` compatibility.

## 2. Throw Errors

```ts
import { fault } from "@chan.run/fault";

// From a defined class
fault(NotFoundError, "User not found");

// Inline string code (class created and cached automatically)
fault("RATE_LIMITED", "Too many requests");
```

## 3. Assert Values

```ts
import { expect } from "@chan.run/fault";

// Throws NotFoundError if null/undefined, returns narrowed value otherwise
const user = expect(db.find(id), NotFoundError, `No user: ${id}`);
```

## 4. Declare Error Surfaces

```ts
import { declares } from "@chan.run/fault";

const getUser = declares([NotFoundError, DbError], async (id: string) => {
  const row = await db.users.findById(id);
  return expect(row, NotFoundError, `No user: ${id}`);
});
```

## 5. Safe Execution with Typed Errors

```ts
import { tryAsync, match } from "@chan.run/fault";

// Pass declared function directly — error type narrows automatically
const result = await tryAsync(getUser, id);

if (!result.ok) {
  // result.error is NotFoundError | DbError (not unknown)
  match(result.error, [NotFoundError, DbError], {
    NotFoundError: (err) => respond(404, err.message),
    DbError: (err) => respond(503, "DB unavailable"),
  });
}
```

## 6. Ad-hoc Matching

For untyped errors, use the 2-arg form with string keys:

```ts
try {
  await riskyOperation();
} catch (e) {
  match(e, {
    ValidationError: (err) => respond(400, err.message),
    RATE_LIMITED: (err) => respond(429, "Slow down"),
    _: (err) => { throw err },
  });
}
```
