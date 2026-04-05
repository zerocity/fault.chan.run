import { describe, expect, it } from "vitest";
import {
	defineError,
	expect as faultExpect,
	fault,
	match,
	tryAsync,
	trySync,
} from "../src/index";

describe("defineError", () => {
	it("creates an error class with name and code", () => {
		const MyError = defineError("MyError");
		const err = new MyError("test");
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("MyError");
		expect(err.code).toBe("MyError");
		expect(err.isFault).toBe(true);
		expect(err.message).toBe("test");
	});

	it("accepts a custom code", () => {
		const MyError = defineError("MyError", { code: "MY_CODE" });
		const err = new MyError("test");
		expect(err.code).toBe("MY_CODE");
	});
});

describe("fault", () => {
	it("throws from a defined class", () => {
		const MyError = defineError("MyError");
		expect(() => fault(MyError, "boom")).toThrow("boom");
	});

	it("throws from an inline string code", () => {
		expect(() => fault("INLINE_CODE", "oops")).toThrow("oops");
		try {
			fault("INLINE_CODE", "oops");
		} catch (e) {
			expect((e as any).name).toBe("INLINE_CODE");
			expect((e as any).code).toBe("INLINE_CODE");
		}
	});
});

describe("expect", () => {
	const NotFound = defineError("NotFound");

	it("returns value when non-null", () => {
		expect(faultExpect("hello", NotFound, "fail")).toBe("hello");
	});

	it("throws on null", () => {
		expect(() => faultExpect(null, NotFound, "was null")).toThrow("was null");
	});

	it("throws on undefined", () => {
		expect(() => faultExpect(undefined, NotFound, "was undef")).toThrow(
			"was undef",
		);
	});
});

describe("trySync", () => {
	it("returns ok result on success", () => {
		const result = trySync(() => 42);
		expect(result).toEqual({ ok: true, data: 42 });
	});

	it("returns error result on throw", () => {
		const result = trySync(() => {
			throw new Error("fail");
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect((result.error as Error).message).toBe("fail");
		}
	});
});

describe("tryAsync", () => {
	it("returns ok result on success", async () => {
		const result = await tryAsync(async () => 42);
		expect(result).toEqual({ ok: true, data: 42 });
	});

	it("returns error result on rejection", async () => {
		const result = await tryAsync(async () => {
			throw new Error("async fail");
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect((result.error as Error).message).toBe("async fail");
		}
	});
});

describe("match", () => {
	it("matches by error name", () => {
		const MyError = defineError("MyError");
		const err = new MyError("test");
		const result = match(err, {
			MyError: (e) => `matched: ${e.message}`,
			_: () => "fallback",
		});
		expect(result).toBe("matched: test");
	});

	it("matches by error code", () => {
		const MyError = defineError("MyError", { code: "MY_CODE" });
		const err = new MyError("test");
		const result = match(err, {
			MY_CODE: (e) => `code: ${e.message}`,
			_: () => "fallback",
		});
		expect(result).toBe("code: test");
	});

	it("falls back to _ handler", () => {
		const result = match(new Error("plain"), {
			SomeError: () => "no",
			_: (e) => `fallback: ${(e as Error).message}`,
		});
		expect(result).toBe("fallback: plain");
	});

	it("re-throws when no match and no fallback", () => {
		expect(() =>
			match(new Error("unmatched"), {
				SomeError: () => "no",
			}),
		).toThrow("unmatched");
	});
});
