import type { FaultError, MatchHandlers } from "./types";

/**
 * Handle an error by matching against a handler map keyed by name or code.
 * Only fault-created errors (with isFault === true) are matched by name/code.
 * Non-fault errors fall through to the _ handler or are re-thrown.
 *
 * ```ts
 * match(error, {
 *   ValidationError: (err) => respond(400, err.message),
 *   PaymentError: (err) => respond(402, "Payment failed"),
 *   _: (err) => { throw err },
 * });
 * ```
 */
export function match<T>(error: unknown, handlers: MatchHandlers<T>): T {
  if (error instanceof Error && isFaultError(error)) {
    // Match by name first, then by code
    const nameHandler = handlers[error.name];
    if (nameHandler) {
      return nameHandler(error);
    }

    const codeHandler = handlers[error.code];
    if (codeHandler) {
      return codeHandler(error);
    }
  }

  // Fallback handler
  if (handlers._) {
    return handlers._(error);
  }

  // No match and no fallback — re-throw
  throw error;
}

/** Type guard: checks isFault marker without casting to any. */
function isFaultError(error: Error): error is FaultError {
  return "isFault" in error && (error as FaultError).isFault === true;
}
