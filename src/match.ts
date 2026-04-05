import type {
  FaultError,
  MatchHandlers,
  NamedFaultErrorClass,
  TypedMatchHandlers,
} from "./types";

/**
 * Handle an error by matching against a handler map keyed by name or code.
 * Only fault-created errors (with isFault === true) are matched by name/code.
 * Non-fault errors fall through to the _ handler or are re-thrown.
 *
 * When the error type is known (from declares + tryAsync), handlers are
 * exhaustiveness-checked — TypeScript will error if you miss one:
 *
 * ```ts
 * const result = await tryAsync(getUser, id);
 * if (!result.ok) {
 *   // TypeScript requires handlers for NotFoundError AND DbError
 *   match(result.error, [NotFoundError, DbError], {
 *     NotFoundError: (err) => respond(404, err.message),
 *     DbError: (err) => respond(503, "DB unavailable"),
 *   });
 * }
 * ```
 *
 * For untyped errors, use the two-arg form with string keys + fallback:
 *
 * ```ts
 * match(error, {
 *   ValidationError: (err) => respond(400, err.message),
 *   _: (err) => { throw err },
 * });
 * ```
 */
export function match<T>(error: unknown, handlers: MatchHandlers<T>): T;
export function match<
  TErrors extends NamedFaultErrorClass<string>[],
  THandlers extends TypedMatchHandlers<unknown, TErrors>,
>(
  error: unknown,
  errorClasses: readonly [...TErrors],
  handlers: THandlers,
): ReturnType<Extract<THandlers[keyof THandlers], (...args: never) => unknown>>;
export function match<T>(
  error: unknown,
  handlersOrClasses: MatchHandlers<T> | readonly NamedFaultErrorClass<string>[],
  typedHandlers?: Record<string, (error: FaultError) => T>,
): T {
  // Resolve overload: 3-arg (typed) vs 2-arg (untyped)
  const handlers: MatchHandlers<T> = Array.isArray(handlersOrClasses)
    ? (typedHandlers as unknown as MatchHandlers<T>)
    : (handlersOrClasses as MatchHandlers<T>);

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
  return "isFault" in error && (error as { isFault: unknown }).isFault === true;
}
