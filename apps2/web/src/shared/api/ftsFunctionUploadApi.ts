import type { FtsFunctionDetailDetailedResponseDto } from "./ftsFunctionsApi";

import { baseApi } from "./baseApi";

function stripGeneratedFilePrefixes(fileName: string): string {
  return fileName.replace(/^(?:\d{10,17}-)+/, "");
}

function normalizeDownloadFileName(fileName: string | undefined): string {
  const trimmed = fileName?.trim() ?? "";

  if (!trimmed) return "download";

  return stripGeneratedFilePrefixes(trimmed) || "download";
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = normalizeDownloadFileName(fileName);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

export const ftsFunctionUploadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    uploadDetailAlgorithmFile: build.mutation<
        FtsFunctionDetailDetailedResponseDto,
        {
          detailId: number;
          file: File;
        }
    >({
      query: ({ detailId, file }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: `/v1/fts-functions/details/${detailId}/algorithm-file`,
          method: "POST",
          body: formData,
        };
      },
    }),

    downloadDetailAlgorithmFile: build.mutation<
        void,
        {
          detailId: number;
          fallbackFileName?: string;
        }
    >({
      query: ({ detailId, fallbackFileName }) => ({
        url: `/v1/fts-functions/details/${detailId}/algorithm-file`,
        method: "GET",
        cache: "no-cache",
        responseHandler: async (response) => {
          if (!response.ok) {
            const message = await response.text();

            throw new Error(message || "Не удалось скачать файл");
          }

          const contentType = response.headers.get("Content-Type") ?? "";

          if (contentType.includes("application/json")) {
            const message = await response.text();

            throw new Error(message || "Не удалось скачать файл");
          }

          const blob = await response.blob();

          downloadBlob(blob, fallbackFileName || "download");

          return undefined;
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadDetailAlgorithmFileMutation,
  useDownloadDetailAlgorithmFileMutation,
} = ftsFunctionUploadApi;