/**
 * @chan.run/fault — Type-safe errors without the boilerplate.
 *
 * @module
 */

export { combines, declares } from "./declares";
export { defineError } from "./define-error";
export { ensure } from "./ensure";
export { fault } from "./fault";
export { match } from "./match";
export {
  type FaultErrorJSON,
  fromJSON,
  toJSON,
} from "./serialize";
export { tryAsync, trySync } from "./try";
export type {
  AsyncResult,
  DeclaredFn,
  ErrorNames,
  FaultError,
  FaultErrorClass,
  InferFaultErrors,
  MatchHandlers,
  MergeErrors,
  NamedFaultError,
  NamedFaultErrorClass,
  SyncResult,
  TypedMatchHandlers,
} from "./types";
