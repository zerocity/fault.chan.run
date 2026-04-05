import type { FaultError, FaultErrorClass } from "./types";

/** Serialized representation of a FaultError for JSON transport. */
export interface FaultErrorJSON {
  name: string;
  code: string;
  message: string;
  cause?: string;
}

/**
 * Serialize a FaultError to a plain object for JSON transport (API responses, logs).
 *
 * ```ts
 * const err = new NotFoundError("User not found");
 * const json = toJSON(err);
 * // { name: "NotFoundError", code: "NotFoundError", message: "User not found" }
 * ```
 */
export function toJSON(error: FaultError): FaultErrorJSON {
  const serialized: FaultErrorJSON = {
    name: error.name,
    code: error.code,
    message: error.message,
  };
  if (error.cause instanceof Error) {
    serialized.cause = error.cause.message;
  }
  return serialized;
}

/**
 * Deserialize a plain object back into a FaultError instance.
 * Requires a registry mapping names to error classes.
 *
 * ```ts
 * const registry = { NotFoundError, DbError };
 * const err = fromJSON(json, registry);
 * // err instanceof NotFoundError === true
 * ```
 *
 * Returns a generic Error if the name isn't in the registry.
 */
export function fromJSON(
  data: FaultErrorJSON,
  registry: Record<string, FaultErrorClass>,
): Error {
  const ErrorClass = registry[data.name];
  if (ErrorClass) {
    return new ErrorClass(data.message);
  }
  // Name not in registry — return plain Error
  const err = new Error(data.message);
  err.name = data.name;
  return err;
}
