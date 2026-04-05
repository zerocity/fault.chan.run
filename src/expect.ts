import type { FaultErrorClass } from "./types";

/**
 * Assert non-null/undefined. Returns the narrowed value or throws.
 *
 * ```ts
 * const user = expect(db.find(id), NotFoundError, `No user: ${id}`);
 * ```
 */
export function expect<T>(
	value: T,
	ErrorClass: FaultErrorClass,
	message: string,
	options?: { cause?: unknown },
): NonNullable<T> {
	if (value === null || value === undefined) {
		throw new ErrorClass(message, options);
	}
	return value as NonNullable<T>;
}
