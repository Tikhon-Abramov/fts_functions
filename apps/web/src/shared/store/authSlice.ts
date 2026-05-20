import type { ProfileDto } from "src/shared/api/authApi";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Auth slice — owns the in-memory portion of the auth session:
 *   - `accessToken` lives only in Redux (re-fetched via /refresh after reload)
 *   - `refreshToken` is mirrored to `localStorage` so a reload can re-hydrate
 *     the session without forcing the user to log in again
 *   - `user` is the result of GET /v1/auth/me
 *   - `status` is a state machine: idle → authenticated | anonymous
 *
 * `idle` is the initial state and means: "we don't yet know whether the
 * stored refresh token is still valid." `<RequireAuth>` resolves this on
 * first mount by either calling `/auth/me` (success → authenticated) or
 * watching the baseQuery refresh-on-401 dance fail (→ markAnonymous).
 */

const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

export type AuthStatus = "idle" | "authenticated" | "anonymous";

export type AuthState = {
  status: AuthStatus;
  user: ProfileDto | null;
  accessToken: string | null;
  refreshToken: string | null;
};

function loadRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    /* storage unavailable — non-fatal */
    return null;
  }
}

function persistRefreshToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function buildInitialState(): AuthState {
  const refreshToken = loadRefreshToken();
  return {
    // We have a token but haven't yet validated it — `idle` until /me resolves.
    // No token → user is definitely anonymous; skip the bootstrap fetch.
    status: refreshToken ? "idle" : "anonymous",
    user: null,
    accessToken: null,
    refreshToken,
  };
}

const initialState: AuthState = buildInitialState();

type LoginSuccessPayload = {
  /**
   * The user payload — when omitted (login flow returns tokens only), the
   * caller is expected to follow up with a `/me` query that fires
   * `updateUser`. Status is still flipped to `authenticated` so RequireAuth
   * lets the caller through; `selectCurrentUser` may be `null` for a brief
   * window between login and the `/me` response landing.
   */
  user?: ProfileDto | null;
  accessToken: string;
  refreshToken: string;
};

type RefreshTokensPayload = {
  accessToken: string;
  refreshToken: string;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<LoginSuccessPayload>) {
      state.status = "authenticated";
      state.user = action.payload.user ?? state.user ?? null;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persistRefreshToken(action.payload.refreshToken);
    },
    refreshTokens(state, action: PayloadAction<RefreshTokensPayload>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persistRefreshToken(action.payload.refreshToken);
    },
    updateUser(state, action: PayloadAction<ProfileDto>) {
      state.user = action.payload;
      // If we get a user, status is by definition authenticated.
      state.status = "authenticated";
    },
    /**
     * Full sign-out — used after the user clicks "logout" or the backend
     * `/v1/auth/logout` mutation succeeds. Clears tokens and persisted state.
     */
    logout(state) {
      state.status = "anonymous";
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      persistRefreshToken(null);
    },
    /**
     * Soft sign-out — used by `baseQuery` after `/v1/auth/refresh` fails.
     * Distinct from `logout()` because it must NOT call the backend logout
     * endpoint (the refresh token is already invalid; calling it would 401
     * and fire another reauth attempt).
     */
    markAnonymous(state) {
      state.status = "anonymous";
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      persistRefreshToken(null);
    },
  },
});

export const {
  loginSuccess,
  logout,
  refreshTokens,
  updateUser,
  markAnonymous,
} = authSlice.actions;

export const selectAuthStatus = (state: { auth: AuthState }) =>
  state.auth.status;
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) =>
  state.auth.refreshToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.status === "authenticated";

// Re-exported so tests that need to clear the localStorage key can do so
// without hard-coding the literal.
export const REFRESH_TOKEN_KEY = REFRESH_TOKEN_STORAGE_KEY;

export default authSlice.reducer;
