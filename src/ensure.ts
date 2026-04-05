import { defineError } from "./define-error";
import type { FaultErrorClass } from "./types";

/**
 * Built-in error for string-form ensure calls.
 * Match on "EnsureError" to remap to a concrete typed error.
 */
export const EnsureError = defineError("EnsureError");

/**
 * Assert non-null/undefined. Returns the narrowed value or throws.
 *
 * Three forms:
 * ```ts
 * // Full — typed error class + message
 * const user = ensure(db.find(id), NotFoundError, `No user: ${id}`);
 *
 * // Class only — message defaults to error name
 * const user = ensure(db.find(id), NotFoundError);
 *
 * // String only — throws EnsureError with your message
 * const user = ensure(db.find(id), "Could not find user");
 * ```
 */
export function ensure<T>(
  value: T,
  errorOrMessage: FaultErrorClass | string,
  message?: string,
  options?: { cause?: unknown },
): NonNullable<T> {
  if (value !== null && value !== undefined) {
    return value as NonNullable<T>;
  }

  if (typeof errorOrMessage === "string") {
    throw new EnsureError(errorOrMessage, options);
  }

  throw new errorOrMessage(message ?? errorOrMessage.name, options);
}
