import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import qs from "qs";
import { ENV } from "src/shared/config/env";
import {
  loginSuccess as _loginSuccess,
  markAnonymous,
  refreshTokens,
  selectAccessToken,
  selectRefreshToken,
} from "src/shared/store/authSlice";

/* `_loginSuccess` is imported only so the slice's TS module gets pulled in by
 * direct dependency analysis on this file (helps tree-shaking + makes the
 * slice's effect on auth state visible from this module).  It is not used at
 * runtime here. */
void _loginSuccess;

import type { AuthState } from "src/shared/store/authSlice";

type RootStateForAuth = { auth: AuthState };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: ENV.API_BASE_URL,
  paramsSerializer: (params) => qs.stringify(params),
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    // If a caller (e.g. the /auth/refresh dance below) has already pre-set
    // Authorization, keep it — that path uses the refreshToken explicitly
    // and must not be overwritten with the (likely-stale) accessToken.
    if (headers.has("Authorization")) return headers;
    const token = selectAccessToken(getState() as RootStateForAuth);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/**
 * Module-scoped promise to coalesce concurrent refreshes — if 5 requests
 * 401 simultaneously, we want exactly one POST /auth/refresh in flight
 * and all 5 to await its result.
 */
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
} | null> | null = null;

/**
 * baseQuery wrapper that on 401:
 *   1. reads refreshToken from auth slice
 *   2. POSTs /v1/auth/refresh with `Authorization: Bearer <refreshToken>`
 *   3. on success — dispatches `refreshTokens(...)`, retries original request
 *   4. on failure — dispatches `markAnonymous()` (NOT `logout()`: the refresh
 *      token is already dead, so calling /auth/logout would just 401 again).
 *
 * Edge cases handled:
 *   - No refresh token → forward original 401, do not attempt refresh.
 *   - The original request was itself /auth/refresh → never recurse.
 *   - Concurrent 401s → only one /auth/refresh in flight (refreshPromise).
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) return result;

  const url = typeof args === "string" ? args : args.url;
  // Don't try to refresh while the failing request *is* the refresh call —
  // that would loop forever.
  if (url.includes("/auth/refresh")) return result;

  const refreshToken = selectRefreshToken(api.getState() as RootStateForAuth);
  if (!refreshToken) return result;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshResult = await rawBaseQuery(
        {
          url: "/v1/auth/refresh",
          method: "POST",
          // Refresh-strategy on the backend reads `Authorization: Bearer <refreshToken>`.
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
        api,
        extraOptions,
      );
      if (refreshResult.data) {
        const data = refreshResult.data as {
          accessToken: string;
          refreshToken: string;
        };
        api.dispatch(
          refreshTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }),
        );
        return data;
      }
      api.dispatch(markAnonymous());
      return null;
    })().finally(() => {
      // Reset for next time, regardless of outcome.
      refreshPromise = null;
    });
  }

  const refreshOutcome = await refreshPromise;
  if (!refreshOutcome) return result;

  // Retry the original request — `prepareHeaders` will pick up the new
  // accessToken from the freshly-updated state.
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};
