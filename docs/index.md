---
title: "@chan.run/fault"
description: "Type-safe errors without the boilerplate"
---

# @chan.run/fault

Type-safe errors without the boilerplate. Make error contracts explicit with zero ceremony.

## Why?

JavaScript error handling is broken by default. Functions throw, but callers have no idea what. `@chan.run/fault` makes errors part of the contract — with zero friction.

## Install

```bash
pnpm add @chan.run/fault
```

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

## API

| Export        | Purpose                                      |
|---------------|----------------------------------------------|
| `ensure`      | Assert non-null/undefined, throw if missing  |
| `defineError` | Define a reusable typed error class          |
| `fault()`     | Throw a typed error with cause chaining      |
| `trySync()`   | Run sync code, return `{ ok, data/error }`   |
| `tryAsync()`  | Run async code, return `{ ok, data/error }`  |
| `declares()`  | Annotate a function's error surface          |
| `match()`     | Handle errors by type with a handler map     |

See the full [API reference](/docs/products/fault/api) and [examples](/docs/products/fault/examples/route-handler).

## Environment Support

| Environment        | Supported |
|--------------------|-----------|
| Node.js 18+        | ✅        |
| Deno               | ✅        |
| Bun                | ✅        |
| Browser            | ✅        |
| Cloudflare Workers | ✅        |
