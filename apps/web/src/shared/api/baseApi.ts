import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQueryWithReauth } from "./baseQuery";

/**
 * Root RTK Query API for the registry web app. The `baseQuery` is the
 * reauth-aware wrapper from `./baseQuery.ts` — every endpoint (including
 * the codegen'd ones in `ftsFunctionsApi.ts`) gets automatic
 * Authorization-header injection and refresh-on-401 behaviour for free.
 *
 * Codegen note: `ftsFunctionsApi.ts` is regenerated from the backend's
 * OpenAPI spec via `pnpm web:codegen`. The codegen file uses
 * `injectEndpoints` against this `baseApi` re-export, so re-running
 * codegen will not overwrite the wrapped baseQuery configuration.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: () => ({}),
});
