import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "./baseQueryWithInterceptor";


export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
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