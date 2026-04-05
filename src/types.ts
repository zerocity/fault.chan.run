/** Marker interface for errors created by fault. */
export interface FaultError extends Error {
  readonly name: string;
  readonly code: string;
  readonly isFault: true;
}

/** Constructor for a FaultError class. */
export interface FaultErrorClass {
  new (message?: string, options?: { cause?: unknown }): FaultError;
  readonly prototype: FaultError;
}

/** Result of trySync — error type narrows when wrapping a declared function. */
export type SyncResult<T, E = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** Result of tryAsync — error type narrows when wrapping a declared function. */
export type AsyncResult<T, E = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** A function annotated with declares(). */
export type DeclaredFn<
  TArgs extends unknown[],
  TReturn,
  TErrors extends FaultErrorClass[],
> = ((...args: TArgs) => TReturn) & {
  readonly __faultErrors: TErrors;
};

/**
 * Extract the error union from a declared function's error classes.
 * Maps [typeof NotFoundError, typeof DbError] → NotFoundError | DbError.
 */
export type InferFaultErrors<TErrors extends FaultErrorClass[]> = InstanceType<
  TErrors[number]
>;

/** Handler map for match(). Named keys match fault errors; _ is the fallback. */
export interface MatchHandlers<T> {
  [nameOrCode: string]: ((error: FaultError) => T) | undefined;
  _?: (error: unknown) => T;
}
