/**
 * @chan.run/fault — Type-safe errors without the boilerplate.
 *
 * @module
 */

export { defineError } from "./define-error";
export { fault } from "./fault";
export { expect } from "./expect";
export { trySync, tryAsync } from "./try";
export { declares } from "./declares";
export { match } from "./match";
export type {
	FaultError,
	FaultErrorClass,
	SyncResult,
	AsyncResult,
	DeclaredFn,
} from "./types";
