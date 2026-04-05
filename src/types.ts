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

/** Result of trySync. */
export type SyncResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: unknown };

/** Result of tryAsync. */
export type AsyncResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: unknown };

/** A function annotated with declares(). */
export type DeclaredFn<
	TArgs extends unknown[],
	TReturn,
	TErrors extends FaultErrorClass[],
> = ((...args: TArgs) => TReturn) & {
	__faultErrors: TErrors;
};
