---
title: "@chan.run/ensure"
description: "Type-safe errors without the boilerplate"
---

# @chan.run/ensure

Type-safe errors without the boilerplate. Make error contracts explicit with zero ceremony.

## Why?

JavaScript error handling is broken by default. Functions throw, but callers have no idea what. `@chan.run/ensure` makes errors part of the contract — with zero friction.

## Install

```bash
pnpm add @chan.run/ensure
```

## Quick Start

```ts
import { defineError, ensure, tryAsync, match } from "@chan.run/ensure";

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
| `ensure`      | Assert non-null/undefined — class, string, or class+message |
| `EnsureError`  | Built-in error for string-form ensure        |
| `defineError` | Define a reusable typed error class          |
| `fault()`     | Throw a typed error with cause chaining      |
| `trySync()`   | Run sync code, return `{ ok, data/error }`   |
| `tryAsync()`  | Run async code, return `{ ok, data/error }`  |
| `declares()`  | Annotate a function's error surface          |
| `match()`     | Handle errors by type with a handler map     |
| `combines()`  | Compose error surfaces from declared functions |
| `toJSON()`    | Serialize a fault error for JSON transport   |
| `fromJSON()`  | Reconstruct a fault error from JSON          |

See the full [API reference](/docs/products/fault/api) and [examples](/docs/products/fault/examples/route-handler).

## Environment Support

| Environment        | Supported |
|--------------------|-----------|
| Node.js 18+        | ✅        |
| Deno               | ✅        |
| Bun                | ✅        |
| Browser            | ✅        |
| Cloudflare Workers | ✅        |
