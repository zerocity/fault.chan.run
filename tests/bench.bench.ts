import { bench, describe } from "vitest";
import { defineError, ensure, match, trySync } from "../src/index";

const NotFoundError = defineError("NotFoundError");
const DbError = defineError("DbError");

describe("defineError", () => {
  bench("defineError", () => {
    defineError("BenchError");
  });

  bench("new Error (baseline)", () => {
    new Error("baseline");
  });

  bench("new FaultError", () => {
    new NotFoundError("bench");
  });
});

describe("ensure", () => {
  bench("ensure (pass)", () => {
    ensure("value", NotFoundError, "msg");
  });

  bench("nullish coalescing (baseline)", () => {
    const v: string | null = "value";
    if (v === null || v === undefined) throw new NotFoundError("msg");
  });
});

describe("trySync", () => {
  bench("trySync (success)", () => {
    trySync(() => 42);
  });

  bench("try/catch (baseline)", () => {
    try {
      (() => 42)();
    } catch {
      // noop
    }
  });

  bench("trySync (throw)", () => {
    trySync(() => {
      throw new NotFoundError("fail");
    });
  });

  bench("try/catch throw (baseline)", () => {
    try {
      throw new NotFoundError("fail");
    } catch {
      // noop
    }
  });
});

describe("match", () => {
  const err: Error = new NotFoundError("test");

  bench("match (fault error)", () => {
    match(err, {
      NotFoundError: (e) => e.message,
      _: () => "fallback",
    });
  });

  bench("instanceof chain (baseline)", () => {
    if (err instanceof NotFoundError) {
      void err.message;
    } else if (err instanceof DbError) {
      void err.message;
    }
  });
});
