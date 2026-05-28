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
  endpoints: (builder) => ({
    
    exportFtsFunctions: builder.mutation<void, void>({
      query: () => ({
        url: `/v1/fts-functions/download`,
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();

          let filename = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
          const contentDisposition = response.headers.get('Content-Disposition');

          if (contentDisposition) {
            const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (match?.[1]) {
              filename = decodeURIComponent(match[1]);
            }
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => window.URL.revokeObjectURL(url), 1000);

          return undefined;
        },


        cache: 'no-cache',
      }),
    }),

  }),
});

export const { useExportFtsFunctionsMutation } = baseApi;