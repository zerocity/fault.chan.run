import type { FaultError, FaultErrorClass } from "./types";

export interface DefineErrorOptions {
	/** Custom code. Defaults to name. */
	code?: string;
	/** Base class to extend. Defaults to Error. */
	base?: typeof Error;
}

/**
 * Define a reusable typed error class.
 *
 * ```ts
 * const NotFoundError = defineError("NotFoundError");
 * const ValidationError = defineError("ValidationError", { code: "VALIDATION" });
 * ```
 */
export function defineError(
	name: string,
	options?: DefineErrorOptions,
): FaultErrorClass {
	const code = options?.code ?? name;
	const Base = options?.base ?? Error;

	const ErrorClass = class extends Base implements FaultError {
		readonly code = code;
		readonly isFault = true as const;

		constructor(message?: string, opts?: { cause?: unknown }) {
			super(message, opts);
			this.name = name;
			if ("captureStackTrace" in Error) {
				(Error as any).captureStackTrace(this, ErrorClass);
			}
		}
	};

	Object.defineProperty(ErrorClass, "name", { value: name });

	return ErrorClass as unknown as FaultErrorClass;
}
