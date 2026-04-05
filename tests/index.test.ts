import { describe, expect, it } from "vitest";
import {
  combines,
  declares,
  defineError,
  EnsureError,
  ensure,
  fault,
  fromJSON,
  type MatchHandlers,
  match,
  toJSON,
  tryAsync,
  trySync,
} from "../src/index";

function given() {
  // ─────────────────────────────────────────────────────────────────────────
  // Test Data Scenarios
  // ─────────────────────────────────────────────────────────────────────────
  const scenarios = {
    errors: {
      notFound: defineError("NotFoundError"),
      validation: defineError("ValidationError", { code: "VALIDATION" }),
      db: defineError("DbError"),
      withCode: defineError("MyError", { code: "MY_CODE" }),
    },
    causes: {
      root: new Error("root cause"),
    },
    values: {
      present: "hello",
      zero: 0,
      emptyString: "",
      falseBool: false,
      missing: {
        null: null as string | null,
        undefined: undefined as string | undefined,
      },
    },
    json: {
      valid: '{"a":1}',
      parsed: { a: 1 },
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Terminal Actions
  // ─────────────────────────────────────────────────────────────────────────
  const when = {
    defineError: (name: string, options?: { code?: string }) =>
      defineError(name, options),
    throwFault: (target: Parameters<typeof fault>[0], message: string) => () =>
      fault(target, message),
    throwFaultWithCause:
      (target: Parameters<typeof fault>[0], message: string, cause: Error) =>
      () =>
        fault(target, message, { cause }),
    assertValue: <T>(
      value: T,
      errorClass: ReturnType<typeof defineError>,
      msg: string,
    ) => ensure(value, errorClass, msg),
    trySyncFn: <T>(fn: () => T) => trySync(fn),
    tryAsyncFn: <T>(fn: () => Promise<T>) => tryAsync(fn),
    matchError: <T>(error: unknown, handlers: MatchHandlers<T>) =>
      match(error, handlers),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Assertion Accessors
  // ─────────────────────────────────────────────────────────────────────────
  const then = {
    name: (err: Error) => err.name,
    code: (err: { code: string }) => err.code,
    message: (err: Error) => err.message,
    isFault: (err: { isFault: boolean }) => err.isFault,
    cause: (err: Error) => err.cause,
    isOk: <T>(result: { ok: boolean; data?: T }) =>
      result.ok === true ? result : undefined,
    isErr: <T>(result: { ok: boolean; error?: T }) =>
      result.ok === false ? result : undefined,
    errorOf: (result: { ok: false; error: unknown }) => result.error,
  };

  return { scenarios, when, then };
}

// ============================================================================
// defineError
// ============================================================================

describe("defineError", () => {
  it("creates an error class with name and code", () => {
    const { scenarios, then } = given();
    const err = new scenarios.errors.notFound("test");

    expect(err).toBeInstanceOf(Error);
    expect(then.name(err)).toBe("NotFoundError");
    expect(then.code(err)).toBe("NotFoundError");
    expect(then.isFault(err)).toBe(true);
    expect(then.message(err)).toBe("test");
  });

  it("accepts a custom code", () => {
    const { scenarios, then } = given();
    const err = new scenarios.errors.withCode("test");

    expect(then.code(err)).toBe("MY_CODE");
    expect(then.name(err)).toBe("MyError");
  });

  it("supports error cause chaining", () => {
    const { scenarios, then } = given();
    const err = new scenarios.errors.notFound("wrapped", {
      cause: scenarios.causes.root,
    });

    expect(then.cause(err)).toBe(scenarios.causes.root);
  });

  it("sets constructor name for stack traces", () => {
    const { scenarios } = given();
    expect(scenarios.errors.notFound.name).toBe("NotFoundError");
  });

  it("supports instanceof checks", () => {
    const { scenarios } = given();
    const err = new scenarios.errors.notFound("test");

    expect(err).toBeInstanceOf(scenarios.errors.notFound);
    expect(err).not.toBeInstanceOf(scenarios.errors.db);
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
    const { scenarios, when } = given();
    expect(when.throwFault(scenarios.errors.notFound, "boom")).toThrow("boom");
  });

  it("throws from an inline string code", () => {
    const { when, then } = given();
    expect(when.throwFault("INLINE_CODE", "oops")).toThrow("oops");

    try {
      fault("INLINE_CODE", "oops");
    } catch (e) {
      const err = e as Error & { code: string; isFault: boolean };
      expect(then.name(err)).toBe("INLINE_CODE");
      expect(then.code(err)).toBe("INLINE_CODE");
      expect(then.isFault(err)).toBe(true);
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
    const { scenarios, then } = given();
    try {
      fault(scenarios.errors.notFound, "wrapped", {
        cause: scenarios.causes.root,
      });
    } catch (e) {
      expect(then.cause(e as Error)).toBe(scenarios.causes.root);
    }
  });
});

// ============================================================================
// ensure
// ============================================================================

describe("ensure", () => {
  it("returns value when non-null", () => {
    const { scenarios, when } = given();
    const result = when.assertValue(
      scenarios.values.present,
      scenarios.errors.notFound,
      "fail",
    );
    expect(result).toBe("hello");
  });

  it("returns value when falsy but defined (0, empty string, false)", () => {
    const { scenarios, when } = given();
    const { notFound } = scenarios.errors;

    expect(when.assertValue(scenarios.values.zero, notFound, "fail")).toBe(0);
    expect(
      when.assertValue(scenarios.values.emptyString, notFound, "fail"),
    ).toBe("");
    expect(when.assertValue(scenarios.values.falseBool, notFound, "fail")).toBe(
      false,
    );
  });

  it("throws on null", () => {
    const { scenarios } = given();
    expect(() =>
      ensure(
        scenarios.values.missing.null,
        scenarios.errors.notFound,
        "was null",
      ),
    ).toThrow("was null");
  });

  it("throws on undefined", () => {
    const { scenarios } = given();
    expect(() =>
      ensure(
        scenarios.values.missing.undefined,
        scenarios.errors.notFound,
        "was undef",
      ),
    ).toThrow("was undef");
  });

  it("thrown error is an instance of the given class", () => {
    const { scenarios } = given();
    try {
      ensure(null, scenarios.errors.notFound, "test");
    } catch (e) {
      expect(e).toBeInstanceOf(scenarios.errors.notFound);
    }
  });

  it("supports cause option", () => {
    const { scenarios, then } = given();
    try {
      ensure(null, scenarios.errors.notFound, "test", {
        cause: scenarios.causes.root,
      });
    } catch (e) {
      expect(then.cause(e as Error)).toBe(scenarios.causes.root);
    }
  });

  it("string form — throws EnsureError with the message", () => {
    try {
      ensure(null, "Could not find user");
    } catch (e) {
      expect(e).toBeInstanceOf(EnsureError);
      expect((e as Error).message).toBe("Could not find user");
    }
  });

  it("class-only form — message defaults to error name", () => {
    const { scenarios } = given();
    try {
      ensure(null, scenarios.errors.notFound);
    } catch (e) {
      expect(e).toBeInstanceOf(scenarios.errors.notFound);
      expect((e as Error).message).toBe("NotFoundError");
    }
  });

  it("string form — matchable as EnsureError for remapping", () => {
    try {
      ensure(null, "Could not find user");
    } catch (e) {
      const result = match(e, {
        EnsureError: (err) => `remapped: ${err.message}`,
        _: () => "fallback",
      });
      expect(result).toBe("remapped: Could not find user");
    }
  });
});

// ============================================================================
// trySync
// ============================================================================

describe("trySync", () => {
  it("returns ok result on success", () => {
    const { when } = given();
    const result = when.trySyncFn(() => 42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("returns error result on throw", () => {
    const { when, then } = given();
    const result = when.trySyncFn(() => {
      throw new Error("fail");
    });

    const err = then.isErr(result);
    expect(err).toBeTruthy();
    if (err) expect((err.error as Error).message).toBe("fail");
  });

  it("captures non-Error throws", () => {
    const { when, then } = given();
    const result = when.trySyncFn(() => {
      throw "string error";
    });

    const err = then.isErr(result);
    expect(err).toBeTruthy();
    if (err) expect(err.error).toBe("string error");
  });
});

// ============================================================================
// tryAsync
// ============================================================================

describe("tryAsync", () => {
  it("returns ok result on success", async () => {
    const { when } = given();
    const result = await when.tryAsyncFn(async () => 42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("returns error result on rejection", async () => {
    const { when, then } = given();
    const result = await when.tryAsyncFn(async () => {
      throw new Error("async fail");
    });

    const err = then.isErr(result);
    expect(err).toBeTruthy();
    if (err) expect((err.error as Error).message).toBe("async fail");
  });

  it("captures rejected promises", async () => {
    const { when, then } = given();
    const result = await when.tryAsyncFn(() =>
      Promise.reject(new Error("rejected")),
    );

    const err = then.isErr(result);
    expect(err).toBeTruthy();
    if (err) expect((err.error as Error).message).toBe("rejected");
  });
});

// ============================================================================
// declares
// ============================================================================

describe("declares", () => {
  it("returns the same function reference", () => {
    const { scenarios } = given();
    const fn = (x: number) => x * 2;
    const declared = declares([scenarios.errors.notFound], fn);
    expect(declared(5)).toBe(10);
  });

  it("preserves async function behavior", async () => {
    const { scenarios } = given();
    const getUser = declares([scenarios.errors.db], async (id: string) => ({
      id,
      name: "Alice",
    }));

    const user = await getUser("123");
    expect(user).toEqual({ id: "123", name: "Alice" });
  });

  it("error type flows through trySync", () => {
    const { scenarios, when } = given();
    const safeParse = declares([scenarios.errors.validation], (raw: string) =>
      JSON.parse(raw),
    );

    const result = when.trySyncFn(() => safeParse(scenarios.json.valid));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(scenarios.json.parsed);
  });

  it("error type flows through tryAsync", async () => {
    const { scenarios, when } = given();
    const getItem = declares(
      [scenarios.errors.notFound],
      async (id: string) => {
        if (id === "missing") throw new scenarios.errors.notFound("not found");
        return { id };
      },
    );

    const okResult = await when.tryAsyncFn(() => getItem("exists"));
    expect(okResult.ok).toBe(true);

    const errResult = await when.tryAsyncFn(() => getItem("missing"));
    expect(errResult.ok).toBe(false);
    if (!errResult.ok)
      expect(errResult.error).toBeInstanceOf(scenarios.errors.notFound);
  });
});

// ============================================================================
// match
// ============================================================================

describe("match", () => {
  it("matches by error name", () => {
    const { scenarios, when } = given();
    const err = new scenarios.errors.notFound("test");

    const result = when.matchError(err, {
      NotFoundError: (e) => `matched: ${e.message}`,
      _: () => "fallback",
    });

    expect(result).toBe("matched: test");
  });

  it("matches by error code when name has no handler", () => {
    const { scenarios, when } = given();
    const err = new scenarios.errors.withCode("test");

    const result = when.matchError(err, {
      MY_CODE: (e) => `code: ${e.message}`,
      _: () => "fallback",
    });

    expect(result).toBe("code: test");
  });

  it("name takes priority over code when both have handlers", () => {
    const { scenarios, when } = given();
    const err = new scenarios.errors.withCode("test");

    const result = when.matchError(err, {
      MyError: () => "by name",
      MY_CODE: () => "by code",
      _: () => "fallback",
    });

    expect(result).toBe("by name");
  });

  it("falls back to _ handler", () => {
    const { when } = given();
    const result = when.matchError(new Error("plain"), {
      SomeError: () => "no",
      _: (e) => `fallback: ${(e as Error).message}`,
    });

    expect(result).toBe("fallback: plain");
  });

  it("re-throws when no match and no fallback", () => {
    const { when } = given();
    expect(() =>
      when.matchError(new Error("unmatched"), { SomeError: () => "no" }),
    ).toThrow("unmatched");
  });

  it("does not match plain Error by name — only fault errors", () => {
    const { when } = given();
    const result = when.matchError(new Error("plain"), {
      Error: () => "should not match",
      _: () => "fallback",
    });

    expect(result).toBe("fallback");
  });

  it("handles non-Error throws via fallback", () => {
    const { when } = given();
    const result = when.matchError("string error", {
      SomeError: () => "no",
      _: (e) => `caught: ${e}`,
    });

    expect(result).toBe("caught: string error");
  });

  it("re-throws non-Error when no fallback", () => {
    const { when } = given();
    expect(() =>
      when.matchError("string error", { SomeError: () => "no" }),
    ).toThrow("string error");
  });

  it("works with inline fault codes", () => {
    const { when } = given();
    try {
      fault("RATE_LIMITED", "slow down");
    } catch (e) {
      const result = when.matchError(e, {
        RATE_LIMITED: (err) => `matched: ${err.message}`,
        _: () => "fallback",
      });
      expect(result).toBe("matched: slow down");
    }
  });

  it("matches native errors by name (TypeError, SyntaxError, etc.)", () => {
    const { when } = given();
    const result = when.matchError(new TypeError("bad"), {
      TypeError: (e) => `type: ${e.message}`,
      _: () => "fallback",
    });
    expect(result).toBe("type: bad");
  });

  it("matches DOMException by name (AbortError)", () => {
    const { when } = given();
    const abort = new DOMException("aborted", "AbortError");
    const result = when.matchError(abort, {
      AbortError: (e) => `abort: ${e.message}`,
      _: () => "fallback",
    });
    expect(result).toBe("abort: aborted");
  });

  it("still falls through plain Error to _ (name is 'Error')", () => {
    const { when } = given();
    const result = when.matchError(new Error("plain"), {
      Error: () => "should not match",
      _: () => "fallback",
    });
    expect(result).toBe("fallback");
  });
});

// ============================================================================
// combines
// ============================================================================

describe("combines", () => {
  it("merges error surfaces from multiple declared functions", async () => {
    const { scenarios } = given();
    const getUser = declares(
      [scenarios.errors.notFound],
      async (id: string) => ({ id }),
    );
    const getDb = declares([scenarios.errors.db], async () => ({
      connected: true,
    }));

    const getUserWithDb = combines([getUser, getDb], async (id: string) => {
      const db = await getDb();
      const user = await getUser(id);
      return { ...user, ...db };
    });

    const result = await getUserWithDb("123");
    expect(result).toEqual({ id: "123", connected: true });
  });

  it("composed function works with tryAsync", async () => {
    const { scenarios } = given();
    const fn1 = declares([scenarios.errors.notFound], (x: string) => x);
    const fn2 = declares([scenarios.errors.db], (x: string) => x);

    const composed = combines([fn1, fn2], (x: string) => {
      fn1(x);
      return fn2(x);
    });

    const result = trySync(composed, "test");
    expect(result).toEqual({ ok: true, data: "test" });
  });
});

// ============================================================================
// serialize / deserialize
// ============================================================================

describe("toJSON", () => {
  it("serializes a fault error to plain object", () => {
    const { scenarios } = given();
    const err = new scenarios.errors.notFound("User not found");
    const json = toJSON(err);

    expect(json).toEqual({
      name: "NotFoundError",
      code: "NotFoundError",
      message: "User not found",
    });
  });

  it("includes cause message when present", () => {
    const { scenarios } = given();
    const err = new scenarios.errors.notFound("wrapped", {
      cause: scenarios.causes.root,
    });
    const json = toJSON(err);

    expect(json.cause).toBe("root cause");
  });

  it("omits cause when not an Error", () => {
    const { scenarios } = given();
    const err = new scenarios.errors.notFound("test");
    const json = toJSON(err);

    expect(json.cause).toBeUndefined();
  });
});

describe("fromJSON", () => {
  it("reconstructs a fault error from serialized data", () => {
    const { scenarios } = given();
    const registry = { NotFoundError: scenarios.errors.notFound };
    const err = fromJSON(
      { name: "NotFoundError", code: "NotFoundError", message: "gone" },
      registry,
    );

    expect(err).toBeInstanceOf(scenarios.errors.notFound);
    expect(err.message).toBe("gone");
  });

  it("returns plain Error when name not in registry", () => {
    const err = fromJSON(
      { name: "UnknownError", code: "UNKNOWN", message: "hmm" },
      {},
    );

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("UnknownError");
    expect(err.message).toBe("hmm");
  });

  it("round-trips: serialize → deserialize", () => {
    const { scenarios } = given();
    const original = new scenarios.errors.notFound("round trip");
    const json = toJSON(original);
    const restored = fromJSON(json, {
      NotFoundError: scenarios.errors.notFound,
    });

    expect(restored).toBeInstanceOf(scenarios.errors.notFound);
    expect(restored.message).toBe("round trip");
  });
});
