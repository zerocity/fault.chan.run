import type {
  AsyncResult,
  DeclaredFn,
  FaultErrorClass,
  InferFaultErrors,
  SyncResult,
} from "./types";

/**
 * Run sync code, return a discriminated result — never throws.
 *
 * When wrapping a declared function, the error type narrows automatically:
 * ```ts
 * const parse = declares([ValidationError], (raw: string) => JSON.parse(raw));
 * const result = trySync(() => parse(input));
 * // result.error is ValidationError, not unknown
 * ```
 */
export function trySync<T, TErrors extends FaultErrorClass[]>(
  fn: DeclaredFn<[], T, TErrors>,
): SyncResult<T, InferFaultErrors<TErrors>>;
export function trySync<T>(fn: () => T): SyncResult<T>;
export function trySync<T>(fn: () => T): SyncResult<T> {
  try {
    return { ok: true, data: fn() };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Run async code, return a discriminated result — never rejects.
 *
 * When wrapping a declared function, the error type narrows automatically:
 * ```ts
 * const getUser = declares([NotFoundError], async (id: string) => fetchUser(id));
 * const result = await tryAsync(() => getUser("123"));
 * // result.error is NotFoundError, not unknown
 * ```
 */
export function tryAsync<T, TErrors extends FaultErrorClass[]>(
  fn: DeclaredFn<[], Promise<T>, TErrors>,
): Promise<AsyncResult<T, InferFaultErrors<TErrors>>>;
export function tryAsync<T>(fn: () => Promise<T>): Promise<AsyncResult<T>>;
export async function tryAsync<T>(
  fn: () => Promise<T>,
): Promise<AsyncResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
}
