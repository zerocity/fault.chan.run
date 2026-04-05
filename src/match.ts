import type { FaultError } from "./types";

type MatchHandlers<T> = {
	[nameOrCode: string]: (error: FaultError) => T;
} & {
	_?: (error: unknown) => T;
};

/**
 * Handle an error by matching against a handler map keyed by name or code.
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
	if (error instanceof Error) {
		const faultError = error as FaultError;

		// Match by name first
		const nameHandler = faultError.name ? handlers[faultError.name] : undefined;
		if (nameHandler) {
			return nameHandler(faultError);
		}

		// Then by code
		const codeHandler = faultError.code ? handlers[faultError.code] : undefined;
		if (codeHandler) {
			return codeHandler(faultError);
		}
	}

	// Fallback handler
	if (handlers._) {
		return handlers._(error);
	}

	// No match and no fallback — re-throw
	throw error;
}
