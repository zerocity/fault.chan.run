import type { AsyncResult, SyncResult } from "./types";

/**
 * Run sync code, return a discriminated result — never throws.
 *
 * ```ts
 * const result = trySync(() => JSON.parse(raw));
 * if (result.ok) console.log(result.data);
 * ```
 */
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
 * ```ts
 * const result = await tryAsync(() => fetchUser(id));
 * if (result.ok) render(result.data);
 * ```
 */
export async function tryAsync<T>(
	fn: () => Promise<T>,
): Promise<AsyncResult<T>> {
	try {
		return { ok: true, data: await fn() };
	} catch (error) {
		return { ok: false, error };
	}
}
