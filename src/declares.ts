import type { DeclaredFn, FaultErrorClass } from "./types";

/**
 * Annotate a function's error surface — purely type-level, zero runtime cost.
 *
 * ```ts
 * const getUser = declares([NotFoundError, DatabaseError], async (id: string) => {
 *   const row = await db.users.findById(id);
 *   return expect(row, NotFoundError, `No user: ${id}`);
 * });
 * ```
 */
export function declares<
	TArgs extends unknown[],
	TReturn,
	TErrors extends FaultErrorClass[],
>(
	_errorClasses: [...TErrors],
	fn: (...args: TArgs) => TReturn,
): DeclaredFn<TArgs, TReturn, TErrors> {
	return fn as DeclaredFn<TArgs, TReturn, TErrors>;
}
