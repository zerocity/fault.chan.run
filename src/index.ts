/**
 * @chan.run/fault — Type-safe errors without the boilerplate.
 *
 * @module
 */

export { declares } from "./declares";
export { defineError } from "./define-error";
export { expect, expect as ensure } from "./expect";
export { fault } from "./fault";
export { match } from "./match";
export { tryAsync, trySync } from "./try";
export type {
  AsyncResult,
  DeclaredFn,
  FaultError,
  FaultErrorClass,
  InferFaultErrors,
  MatchHandlers,
  SyncResult,
} from "./types";
