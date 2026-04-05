import { defineError } from "./define-error";
import type { FaultErrorClass } from "./types";

const inlineCache = new Map<string, FaultErrorClass>();

/**
 * Throw a typed error — from a class or an inline string code.
 *
 * ```ts
 * fault(NotFoundError, "User not found");
 * fault("RATE_LIMITED", "Too many requests");
 * ```
 */
export function fault(
	target: FaultErrorClass | string,
	message: string,
	options?: { cause?: unknown },
): never {
	let ErrorClass: FaultErrorClass;

	if (typeof target === "string") {
		let cached = inlineCache.get(target);
		if (!cached) {
			cached = defineError(target);
			inlineCache.set(target, cached);
		}
		ErrorClass = cached;
	} else {
		ErrorClass = target;
	}

	throw new ErrorClass(message, options);
}
