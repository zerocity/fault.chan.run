import type { FaultError, FaultErrorClass } from "./types";

/** Any class that extends Error and can be subclassed. */
type ErrorBaseClass = abstract new (
  message?: string,
  options?: { cause?: unknown },
) => Error;

export interface DefineErrorOptions {
  /** Custom code. Defaults to name. */
  code?: string;
  /** Base class to extend. Defaults to Error. */
  base?: ErrorBaseClass;
}

// V8 engines expose captureStackTrace on the Error constructor.
// Declared here so we can reference it without `any`.
interface ErrorWithCaptureStackTrace {
  captureStackTrace(
    target: object,
    // biome-ignore lint/complexity/noBannedTypes: V8's captureStackTrace accepts any callable
    ctor?: Function,
  ): void;
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
      // Ensure instanceof works correctly even when transpiled to ES5
      Object.setPrototypeOf(this, new.target.prototype);
      this.name = name;
      if ("captureStackTrace" in Error) {
        (Error as unknown as ErrorWithCaptureStackTrace).captureStackTrace(
          this,
          ErrorClass,
        );
      }
    }
  };

  Object.defineProperty(ErrorClass, "name", { value: name });

  return ErrorClass as unknown as FaultErrorClass;
}
