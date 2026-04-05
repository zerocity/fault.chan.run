---
title: "Example: Wrapping Third-Party Code"
description: Turn untyped third-party errors into typed faults
---

# Wrapping Third-Party Code

Third-party libraries throw untyped errors. Wrap them with `fault` to bring them into your typed error system.

```ts
import { defineError, declares, fault, trySync } from "@chan.run/fault";

const ConfigError = defineError("ConfigError");

export const parseConfig = declares([ConfigError], (raw: string) => {
  const result = trySync(() => JSON.parse(raw));
  if (!result.ok) {
    // Rethrow as typed error — original error preserved as cause
    fault(ConfigError, "Invalid JSON config", { cause: result.error });
  }
  return result.data as Config;
});
```

This is `fault`'s primary use case — catch an untyped error and rethrow it as a typed fault with the original error as `cause`.

## HTTP client wrapper

```ts
import { defineError, declares, fault, tryAsync, match } from "@chan.run/fault";

const ApiError = defineError("ApiError");
const TimeoutError = defineError("TimeoutError");

export const fetchJson = declares([ApiError, TimeoutError], async (url: string) => {
  const result = await tryAsync(() => fetch(url));

  if (!result.ok) {
    // Match the caught error by name — no instanceof chains
    match(result.error, {
      AbortError: (e) => fault(TimeoutError, `Request to ${url} timed out`, { cause: e }),
      _: (e) => fault(ApiError, `Request to ${url} failed`, { cause: e }),
    });
  }

  const res = result.data;
  if (!res.ok) {
    fault(ApiError, `HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
});
```

## Why wrap?

- **Typed errors propagate** — callers know exactly what can fail
- **Cause chain preserved** — `err.cause` has the original error for debugging
- **`declares` + `tryAsync`** — error types flow through to callers automatically
