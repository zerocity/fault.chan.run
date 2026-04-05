---
title: Quick Start
description: Get started with @chan.run/fault in under 5 minutes
---

# Quick Start

## Installation

```bash
pnpm add @chan.run/fault
```

## Define Errors

```ts
import { defineError } from "@chan.run/fault";

const NotFoundError = defineError("NotFoundError");
const ValidationError = defineError("ValidationError", { code: "VALIDATION" });
```

## Throw Errors

```ts
import { fault } from "@chan.run/fault";

fault(NotFoundError, "User not found");
fault("RATE_LIMITED", "Too many requests"); // inline code
```

## Assert Values

```ts
import { expect } from "@chan.run/fault";

const user = expect(db.find(id), NotFoundError, `No user: ${id}`);
```

## Safe Execution

```ts
import { tryAsync, match } from "@chan.run/fault";

const result = await tryAsync(() => getUser(id));

if (!result.ok) {
  match(result.error, {
    NotFoundError: (err) => respond(404, err.message),
    _: (err) => { throw err },
  });
}
```

## Declare Error Contracts

```ts
import { declares } from "@chan.run/fault";

const getUser = declares([NotFoundError, DatabaseError], async (id: string) => {
  const row = await db.users.findById(id);
  return expect(row, NotFoundError, `No user: ${id}`);
});
```
