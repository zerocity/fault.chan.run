import { describe, expect, it } from "vitest";
import {
  declares,
  defineError,
  ensure,
  fault,
  expect as faultExpect,
  match,
  tryAsync,
  trySync,
} from "../src/index";

// ============================================================================
// defineError
// ============================================================================

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
    expect(err.name).toBe("MyError");
  });

  it("supports error cause chaining", () => {
    const MyError = defineError("MyError");
    const rootCause = new Error("root");
    const err = new MyError("wrapped", { cause: rootCause });
    expect(err.cause).toBe(rootCause);
  });

  it("sets constructor name for stack traces", () => {
    const MyError = defineError("MyError");
    expect(MyError.name).toBe("MyError");
  });

  it("supports instanceof checks", () => {
    const FooError = defineError("FooError");
    const BarError = defineError("BarError");
    const err = new FooError("test");
    expect(err).toBeInstanceOf(FooError);
    expect(err).not.toBeInstanceOf(BarError);
  });

  it("supports custom base class", () => {
    class CustomBase extends Error {
      readonly custom = true;
    }
    const MyError = defineError("MyError", { base: CustomBase });
    const err = new MyError("test");
    expect(err).toBeInstanceOf(CustomBase);
    expect(err).toBeInstanceOf(Error);
  });
});

// ============================================================================
// fault
// ============================================================================

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
      const err = e as InstanceType<ReturnType<typeof defineError>>;
      expect(err.name).toBe("INLINE_CODE");
      expect(err.code).toBe("INLINE_CODE");
      expect(err.isFault).toBe(true);
    }
  });

  it("caches inline codes — same class for same string", () => {
    try {
      fault("CACHED_CODE", "first");
    } catch (e1) {
      try {
        fault("CACHED_CODE", "second");
      } catch (e2) {
        expect((e1 as Error).constructor).toBe((e2 as Error).constructor);
      }
    }
  });

  it("supports cause option", () => {
    const MyError = defineError("MyError");
    const cause = new Error("root");
    try {
      fault(MyError, "wrapped", { cause });
    } catch (e) {
      expect((e as Error).cause).toBe(cause);
    }
  });
});

// ============================================================================
// expect / ensure
// ============================================================================

describe("expect", () => {
  const NotFound = defineError("NotFound");

  it("returns value when non-null", () => {
    expect(faultExpect("hello", NotFound, "fail")).toBe("hello");
  });

  it("returns value when falsy but defined (0, empty string, false)", () => {
    expect(faultExpect(0, NotFound, "fail")).toBe(0);
    expect(faultExpect("", NotFound, "fail")).toBe("");
    expect(faultExpect(false, NotFound, "fail")).toBe(false);
  });

  it("throws on null", () => {
    expect(() => faultExpect(null, NotFound, "was null")).toThrow("was null");
  });

  it("throws on undefined", () => {
    expect(() => faultExpect(undefined, NotFound, "was undef")).toThrow(
      "was undef",
    );
  });

  it("thrown error is an instance of the given class", () => {
    try {
      faultExpect(null, NotFound, "test");
    } catch (e) {
      expect(e).toBeInstanceOf(NotFound);
    }
  });

  it("supports cause option", () => {
    const cause = new Error("root");
    try {
      faultExpect(null, NotFound, "test", { cause });
    } catch (e) {
      expect((e as Error).cause).toBe(cause);
    }
  });
});

describe("ensure (alias for expect)", () => {
  it("is the same function as expect", () => {
    expect(ensure).toBe(faultExpect);
  });
});

// ============================================================================
// trySync
// ============================================================================

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

  it("captures non-Error throws", () => {
    const result = trySync(() => {
      throw "string error";
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("string error");
    }
  });
});

// ============================================================================
// tryAsync
// ============================================================================

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

  it("captures rejected promises", async () => {
    const result = await tryAsync(() => Promise.reject(new Error("rejected")));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect((result.error as Error).message).toBe("rejected");
    }
  });
});

// ============================================================================
// declares
// ============================================================================

describe("declares", () => {
  it("returns the same function reference", () => {
    const fn = (x: number) => x * 2;
    const SomeError = defineError("SomeError");
    const declared = declares([SomeError], fn);
    // Runtime identity — declares is a passthrough
    expect(declared(5)).toBe(10);
  });

  it("preserves async function behavior", async () => {
    const DbError = defineError("DbError");
    const getUser = declares([DbError], async (id: string) => ({
      id,
      name: "Alice",
    }));
    const user = await getUser("123");
    expect(user).toEqual({ id: "123", name: "Alice" });
  });

  it("error type flows through trySync", () => {
    const ParseError = defineError("ParseError");
    const safeParse = declares([ParseError], (raw: string) => JSON.parse(raw));
    const result = trySync(() => safeParse('{"a":1}'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ a: 1 });
    }
  });

  it("error type flows through tryAsync", async () => {
    const NotFoundError = defineError("NotFoundError");
    const getItem = declares([NotFoundError], async (id: string) => {
      if (id === "missing") {
        throw new NotFoundError("not found");
      }
      return { id };
    });

    const okResult = await tryAsync(() => getItem("exists"));
    expect(okResult.ok).toBe(true);

    const errResult = await tryAsync(() => getItem("missing"));
    expect(errResult.ok).toBe(false);
    if (!errResult.ok) {
      expect(errResult.error).toBeInstanceOf(NotFoundError);
    }
  });
});

// ============================================================================
// match
// ============================================================================

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

  it("matches by error code when name has no handler", () => {
    const MyError = defineError("MyError", { code: "MY_CODE" });
    const err = new MyError("test");
    const result = match(err, {
      MY_CODE: (e) => `code: ${e.message}`,
      _: () => "fallback",
    });
    expect(result).toBe("code: test");
  });

  it("name takes priority over code when both have handlers", () => {
    const MyError = defineError("MyError", { code: "MY_CODE" });
    const err = new MyError("test");
    const result = match(err, {
      MyError: () => "by name",
      MY_CODE: () => "by code",
      _: () => "fallback",
    });
    expect(result).toBe("by name");
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

  it("does not match plain Error by name — only fault errors", () => {
    // A plain Error has name === "Error", but match() should not
    // dispatch to an "Error" handler since it's not a fault error.
    const plainError = new Error("plain");
    const result = match(plainError, {
      Error: () => "should not match",
      _: () => "fallback",
    });
    expect(result).toBe("fallback");
  });

  it("handles non-Error throws via fallback", () => {
    const result = match("string error", {
      SomeError: () => "no",
      _: (e) => `caught: ${e}`,
    });
    expect(result).toBe("caught: string error");
  });

  it("re-throws non-Error when no fallback", () => {
    expect(() =>
      match("string error", {
        SomeError: () => "no",
      }),
    ).toThrow("string error");
  });

  it("works with inline fault codes", () => {
    try {
      fault("RATE_LIMITED", "slow down");
    } catch (e) {
      const result = match(e, {
        RATE_LIMITED: (err) => `matched: ${err.message}`,
        _: () => "fallback",
      });
      expect(result).toBe("matched: slow down");
    }
  });
});
