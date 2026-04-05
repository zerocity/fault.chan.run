---
title: "Error Catalog"
description: Organize errors by domain in a shared module
---

# Error Catalog

Define all errors for a domain in one file. Import them everywhere.

```ts
// errors.ts
import { defineError } from "@chan.run/ensure";

// Auth
export const UnauthorizedError = defineError("UnauthorizedError");
export const ForbiddenError = defineError("ForbiddenError");
export const TokenExpiredError = defineError("TokenExpiredError");

// Users
export const UserNotFoundError = defineError("UserNotFoundError");
export const UserExistsError = defineError("UserExistsError");

// Validation
export const ValidationError = defineError("ValidationError", { code: "VALIDATION" });
export const InvalidEmailError = defineError("InvalidEmailError", { code: "INVALID_EMAIL" });
```

Then use them across your codebase:

```ts
// user-service.ts
import { declares, ensure } from "@chan.run/ensure";
import { UserNotFoundError, UnauthorizedError } from "./errors";

export const getUser = declares(
  [UserNotFoundError, UnauthorizedError],
  async (id: string, token: string) => {
    const session = ensure(verifyToken(token), UnauthorizedError, "Invalid token");
    const user = await db.users.findById(id);
    return ensure(user, UserNotFoundError, `No user: ${id}`);
  },
);
```

## Why a catalog?

- **Single source of truth** — error names and codes defined once
- **Autocomplete** — import shows all available errors
- **Refactoring** — rename an error and TypeScript catches every usage
- **`declares`** — the error classes are right there to list
