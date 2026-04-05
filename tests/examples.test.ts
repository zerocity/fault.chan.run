/**
 * Tests that verify the code examples from docs/ actually work.
 * Each describe block corresponds to a docs file.
 */
import { describe, expect, it, vi } from "vitest";
import {
  combines,
  declares,
  defineError,
  ensure,
  fault,
  fromJSON,
  match,
  toJSON,
  tryAsync,
  trySync,
} from "../src/index";

// ============================================================================
// docs/examples/route-handler.md
// ============================================================================

describe("example: route handler", () => {
  const UserNotFoundError = defineError("UserNotFoundError");
  const DbError = defineError("DbError");

  const getUser = declares([UserNotFoundError, DbError], async (id: string) => {
    if (id === "missing") throw new UserNotFoundError(`No user: ${id}`);
    return { id, name: "Alice" };
  });

  it("returns data on success", async () => {
    const result = await tryAsync(getUser, "123");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: "123", name: "Alice" });
  });

  it("matches error exhaustively", async () => {
    const result = await tryAsync(getUser, "missing");
    expect(result.ok).toBe(false);

    if (!result.ok) {
      const msg = match(result.error, [UserNotFoundError, DbError], {
        UserNotFoundError: (err) => `404: ${err.message}`,
        DbError: (err) => `503: ${err.message}`,
      });
      expect(msg).toBe("404: No user: missing");
    }
  });
});

// ============================================================================
// docs/examples/error-catalog.md
// ============================================================================

describe("example: error catalog", () => {
  // errors.ts
  const UnauthorizedError = defineError("UnauthorizedError");
  const UserNotFoundError = defineError("UserNotFoundError");

  const verifyToken = (token: string) =>
    token === "valid" ? { userId: "1" } : null;

  const getUser = declares(
    [UserNotFoundError, UnauthorizedError],
    async (id: string, token: string) => {
      const session = ensure(
        verifyToken(token),
        UnauthorizedError,
        "Invalid token",
      );
      const user = id === "1" ? { id, name: "Alice" } : null;
      return ensure(user, UserNotFoundError, `No user: ${id}`);
    },
  );

  it("returns user with valid token", async () => {
    const result = await tryAsync(getUser, "1", "valid");
    expect(result.ok).toBe(true);
  });

  it("throws UnauthorizedError with bad token", async () => {
    const result = await tryAsync(getUser, "1", "bad");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(UnauthorizedError);
  });

  it("throws UserNotFoundError for missing user", async () => {
    const result = await tryAsync(getUser, "999", "valid");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(UserNotFoundError);
  });
});

// ============================================================================
// docs/examples/wrapping.md — parseConfig
// ============================================================================

describe("example: wrapping — parseConfig", () => {
  const ConfigError = defineError("ConfigError");

  const parseConfig = declares([ConfigError], (raw: string) => {
    const result = trySync(() => JSON.parse(raw));
    if (!result.ok) {
      fault(ConfigError, "Invalid JSON config", { cause: result.error });
    }
    return result.data as Record<string, unknown>;
  });

  it("parses valid JSON", () => {
    const result = trySync(parseConfig, '{"port": 3000}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ port: 3000 });
  });

  it("throws ConfigError on invalid JSON with cause chain", () => {
    const result = trySync(parseConfig, "{bad");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ConfigError);
      expect(result.error.message).toBe("Invalid JSON config");
      expect(result.error.cause).toBeInstanceOf(SyntaxError);
    }
  });
});

// ============================================================================
// docs/examples/wrapping.md — fetchJson (tryAsync + match version)
// ============================================================================

describe("example: wrapping — fetchJson (tryAsync + match)", () => {
  const ApiError = defineError("ApiError");
  const TimeoutError = defineError("TimeoutError");

  const fetchJson = declares(
    [ApiError, TimeoutError],
    async (url: string, mockFetch: () => Promise<Response>) => {
      const result = await tryAsync(mockFetch);

      if (!result.ok) {
        return match(result.error, {
          AbortError: (e) =>
            fault(TimeoutError, `Request to ${url} timed out`, { cause: e }),
          _: (e) => fault(ApiError, `Request to ${url} failed`, { cause: e }),
        });
      }

      const res = result.data;
      if (!res.ok) {
        fault(ApiError, `HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
  );

  it("returns JSON on success", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 });

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ ok: true });
  });

  it("throws ApiError on HTTP error", async () => {
    const mockFetch = async () =>
      new Response("", { status: 503, statusText: "Service Unavailable" });

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      expect(result.error.message).toBe("HTTP 503: Service Unavailable");
    }
  });

  it("throws ApiError on network failure", async () => {
    const mockFetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      expect(result.error.message).toBe(
        "Request to https://api.example.com failed",
      );
      expect((result.error as Error).cause).toBeInstanceOf(TypeError);
    }
  });

  it("throws TimeoutError on abort", async () => {
    const mockFetch = async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    };

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(TimeoutError);
      expect(result.error.message).toBe(
        "Request to https://api.example.com timed out",
      );
    }
  });
});

// ============================================================================
// docs/examples/wrapping.md — fetchJson (try/catch version)
// ============================================================================

describe("example: wrapping — fetchJson (try/catch + match)", () => {
  const ApiError = defineError("ApiError");
  const TimeoutError = defineError("TimeoutError");

  const fetchJson = declares(
    [ApiError, TimeoutError],
    async (url: string, mockFetch: () => Promise<Response>) => {
      try {
        const res = await mockFetch();
        if (!res.ok) {
          fault(ApiError, `HTTP ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (e) {
        match(e, {
          AbortError: (err) =>
            fault(TimeoutError, `Request to ${url} timed out`, { cause: err }),
          _: (err) =>
            fault(ApiError, `Request to ${url} failed`, { cause: err }),
        });
      }
    },
  );

  it("returns JSON on success", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ data: 1 }), { status: 200 });

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ data: 1 });
  });

  it("throws ApiError on HTTP error", async () => {
    const mockFetch = async () =>
      new Response("", { status: 500, statusText: "Internal Server Error" });

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      // try/catch re-wraps the fault thrown inside the try block —
      // this is the trade-off vs tryAsync. Original is in cause chain.
      expect(result.error.message).toContain("api.example.com");
    }
  });

  it("throws ApiError on network failure with cause", async () => {
    const mockFetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      expect((result.error as Error).cause).toBeInstanceOf(TypeError);
    }
  });

  it("throws TimeoutError on abort", async () => {
    const mockFetch = async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    };

    const result = await tryAsync(
      fetchJson,
      "https://api.example.com",
      mockFetch,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(TimeoutError);
      expect(result.error.message).toBe(
        "Request to https://api.example.com timed out",
      );
    }
  });
});

// ============================================================================
// README — combines example
// ============================================================================

describe("example: combines", () => {
  const NotFoundError = defineError("NotFoundError");
  const DbError = defineError("DbError");
  const OrderError = defineError("OrderError");

  const getUser = declares([NotFoundError, DbError], async (id: string) => ({
    id,
    name: "Alice",
  }));
  const getOrder = declares([OrderError, DbError], async (id: string) => ({
    id,
    total: 99,
  }));

  const getUserOrder = combines(
    [getUser, getOrder],
    async (userId: string, orderId: string) => {
      const user = await getUser(userId);
      const order = await getOrder(orderId);
      return { user, order };
    },
  );

  it("returns combined data", async () => {
    const result = await tryAsync(getUserOrder, "u1", "o1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.name).toBe("Alice");
      expect(result.data.order.total).toBe(99);
    }
  });
});

// ============================================================================
// README — toJSON / fromJSON example
// ============================================================================

describe("example: toJSON / fromJSON", () => {
  const NotFoundError = defineError("NotFoundError");
  const DbError = defineError("DbError");

  it("round-trips through JSON", () => {
    const err = new NotFoundError("No user: 123");
    const json = toJSON(err);

    expect(json).toEqual({
      name: "NotFoundError",
      code: "NotFoundError",
      message: "No user: 123",
    });

    const restored = fromJSON(json, { NotFoundError, DbError });
    expect(restored).toBeInstanceOf(NotFoundError);
    expect(restored.message).toBe("No user: 123");
  });
});
