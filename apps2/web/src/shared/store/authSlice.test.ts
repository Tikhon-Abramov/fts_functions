import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import authReducer, {
  loginSuccess,
  logout,
  markAnonymous,
  REFRESH_TOKEN_KEY,
  refreshTokens,
  selectAccessToken,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
  selectRefreshToken,
  updateUser,
} from "./authSlice";

const SAMPLE_USER = {
  id: 1,
  email: "user@example.com",
  login: null,
  firstName: "Иван",
  lastName: "Иванов",
  patronymic: "Иванович",
  fullName: "Иванов Иван Иванович",
  role: "USER",
  emailVerified: true,
  isActive: true,
  avatarKey: null,
};

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("loginSuccess sets authenticated state and persists refresh token", () => {
    const store = makeStore();
    store.dispatch(
      loginSuccess({
        user: SAMPLE_USER,
        accessToken: "ACCESS_1",
        refreshToken: "REFRESH_1",
      }),
    );
    const s = store.getState();
    expect(selectAuthStatus(s)).toBe("authenticated");
    expect(selectIsAuthenticated(s)).toBe(true);
    expect(selectCurrentUser(s)).toEqual(SAMPLE_USER);
    expect(selectAccessToken(s)).toBe("ACCESS_1");
    expect(selectRefreshToken(s)).toBe("REFRESH_1");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("REFRESH_1");
  });

  it("refreshTokens overwrites both tokens and re-persists refresh token", () => {
    const store = makeStore();
    store.dispatch(
      loginSuccess({
        user: SAMPLE_USER,
        accessToken: "A1",
        refreshToken: "R1",
      }),
    );
    store.dispatch(refreshTokens({ accessToken: "A2", refreshToken: "R2" }));
    const s = store.getState();
    expect(selectAccessToken(s)).toBe("A2");
    expect(selectRefreshToken(s)).toBe("R2");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("R2");
  });

  it("updateUser replaces the user object and forces authenticated status", () => {
    const store = makeStore();
    const next = { ...SAMPLE_USER, firstName: "Пётр" };
    store.dispatch(updateUser(next));
    expect(selectCurrentUser(store.getState())).toEqual(next);
    expect(selectAuthStatus(store.getState())).toBe("authenticated");
  });

  it("logout clears state and removes the persisted refresh token", () => {
    const store = makeStore();
    store.dispatch(
      loginSuccess({
        user: SAMPLE_USER,
        accessToken: "A1",
        refreshToken: "R1",
      }),
    );
    store.dispatch(logout());
    const s = store.getState();
    expect(selectAuthStatus(s)).toBe("anonymous");
    expect(selectIsAuthenticated(s)).toBe(false);
    expect(selectCurrentUser(s)).toBeNull();
    expect(selectAccessToken(s)).toBeNull();
    expect(selectRefreshToken(s)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("markAnonymous behaves like logout but is semantically distinct (no backend call expected)", () => {
    const store = makeStore();
    store.dispatch(
      loginSuccess({
        user: SAMPLE_USER,
        accessToken: "A1",
        refreshToken: "R1",
      }),
    );
    store.dispatch(markAnonymous());
    expect(selectAuthStatus(store.getState())).toBe("anonymous");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("initial state with no persisted token is anonymous", async () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    vi.resetModules();
    const fresh = await import("./authSlice");
    const storeA = configureStore({ reducer: { auth: fresh.default } });
    expect(storeA.getState().auth.status).toBe("anonymous");
    expect(storeA.getState().auth.refreshToken).toBeNull();
  });

  it("initial state with persisted refresh token is idle (pending /me bootstrap)", async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, "stored-rt");
    vi.resetModules();
    const fresh = await import("./authSlice");
    const storeB = configureStore({ reducer: { auth: fresh.default } });
    expect(storeB.getState().auth.status).toBe("idle");
    expect(storeB.getState().auth.refreshToken).toBe("stored-rt");
  });
});
