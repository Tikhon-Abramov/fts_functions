/**
 * Tests for the reauth-aware baseQuery wrapper.
 *
 * The unit under test orchestrates three concerns:
 *   1. Pass-through: 200 responses are forwarded unchanged.
 *   2. 401 + valid refreshToken: refresh succeeds, original is retried.
 *   3. 401 + refresh also fails: state is moved to anonymous; no retry.
 *
 * We mock the global `fetch` rather than `fetchBaseQuery` itself — that way
 * we exercise the real RTK Query baseQuery code path.
 */
import { configureStore } from "@reduxjs/toolkit";
import authReducer, {
  loginSuccess,
  selectAuthStatus,
} from "src/shared/store/authSlice";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { baseQueryWithReauth } from "./baseQuery";

type FetchInit = RequestInit | undefined;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function makeStoreWithSession() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    loginSuccess({
      user: {
        id: 1,
        email: "u@e.com",
        login: null,
        firstName: "A",
        lastName: "B",
        patronymic: null,
        fullName: "A B",
        role: "USER",
        emailVerified: true,
        isActive: true,
        avatarKey: null,
      },
      accessToken: "access-1",
      refreshToken: "refresh-1",
    }),
  );
  return store;
}

const apiHelpers = (store: ReturnType<typeof makeStoreWithSession>) => ({
  signal: new AbortController().signal,
  abort: () => {},
  dispatch: store.dispatch,
  getState: store.getState,
  extra: undefined,
  endpoint: "test",
  type: "query" as const,
  forced: undefined,
});

describe("baseQueryWithReauth", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("forwards a 200 response without touching auth state", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const store = makeStoreWithSession();
    const result = await baseQueryWithReauth(
      { url: "/v1/something" },
      apiHelpers(store),
      {},
    );
    expect(result.data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(selectAuthStatus(store.getState())).toBe("authenticated");
  });

  it("on 401 — refreshes the tokens and retries the original request", async () => {
    fetchMock
      // 1st: original request — 401
      .mockResolvedValueOnce(
        jsonResponse({ code: "UNAUTHORIZED" }, { status: 401 }),
      )
      // 2nd: /v1/auth/refresh — 200 with new tokens
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "access-2",
          refreshToken: "refresh-2",
          expiresIn: 900,
        }),
      )
      // 3rd: original request retried — 200
      .mockResolvedValueOnce(jsonResponse({ retried: true }));

    const store = makeStoreWithSession();
    const result = await baseQueryWithReauth(
      { url: "/v1/protected" },
      apiHelpers(store),
      {},
    );
    expect(result.data).toEqual({ retried: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // 2nd call must be /auth/refresh with Bearer <refreshToken>.
    // RTK Query's fetchBaseQuery may invoke `fetch` with either a string URL
    // or a `Request` instance — handle both shapes.
    const refreshCall = fetchMock.mock.calls[1] as [
      string | Request,
      FetchInit,
    ];
    const url =
      typeof refreshCall[0] === "string" ? refreshCall[0] : refreshCall[0].url;
    expect(url).toMatch(/\/v1\/auth\/refresh$/);
    const reqHeaders =
      typeof refreshCall[0] === "string"
        ? refreshCall[1]?.headers
        : refreshCall[0].headers;
    let authHeader: string | null = null;
    if (reqHeaders instanceof Headers) {
      authHeader = reqHeaders.get("Authorization");
    } else if (reqHeaders && typeof reqHeaders === "object") {
      const obj = reqHeaders as Record<string, string>;
      authHeader = obj["Authorization"] ?? obj["authorization"] ?? null;
    }
    expect(authHeader).toBe("Bearer refresh-1");
    // Tokens were rotated.
    expect(store.getState().auth.accessToken).toBe("access-2");
    expect(store.getState().auth.refreshToken).toBe("refresh-2");
  });

  it("on 401 + refresh also failing — markAnonymous and surface the original error", async () => {
    fetchMock
      // original
      .mockResolvedValueOnce(
        jsonResponse({ code: "UNAUTHORIZED" }, { status: 401 }),
      )
      // refresh — also 401
      .mockResolvedValueOnce(
        jsonResponse({ code: "TOKEN_EXPIRED" }, { status: 401 }),
      );

    const store = makeStoreWithSession();
    const result = await baseQueryWithReauth(
      { url: "/v1/protected" },
      apiHelpers(store),
      {},
    );
    // Should NOT retry — only 2 fetches.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.error?.status).toBe(401);
    expect(selectAuthStatus(store.getState())).toBe("anonymous");
    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().auth.refreshToken).toBeNull();
  });
});
