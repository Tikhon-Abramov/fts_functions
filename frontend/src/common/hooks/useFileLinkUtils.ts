import { type FileResponseDto, type UploadDataResponseDto, type FileControllerGetUploadUrlV1ApiArg, type FileControllerConfirmUploadV1ApiArg, type ConfirmUploadDto, type FileControllerGetDownloadUrlV1ApiArg, type FileControllerDeleteFileV1ApiArg, type DeleteFileResponseDto, type PresignedUrlResponseDto, useFileControllerGetUploadUrlV1Mutation, useFileControllerConfirmUploadV1Mutation, useFileControllerDeleteFileV1Mutation, useFileControllerGetDownloadUrlV1Mutation } from "../../store/ftsFunctionRegistry";



// Интерфейсы для наших утилит
export interface UploadFileParams {
  ftsFunctionDetailId: number;
  file: File;
}

export interface UploadFileResult {
  fileRecord: FileResponseDto['data'];
  uploadData: UploadDataResponseDto['data'];
}

export interface DownloadFileParams {
  objectKey: string;
  fileName?: string;
}

export async function uploadFile(
  params: UploadFileParams,
  mutations: {
    getUploadUrl: ReturnType<typeof useFileControllerGetUploadUrlV1Mutation>[0];
    confirmUpload: ReturnType<typeof useFileControllerConfirmUploadV1Mutation>[0];
    deleteFile: ReturnType<typeof useFileControllerDeleteFileV1Mutation>[0]; // добавили
  }
): Promise<FileResponseDto> {
  const { ftsFunctionDetailId, file } = params;

  const uploadArg: FileControllerGetUploadUrlV1ApiArg = {
    initUploadDto: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    }
  };

  const uploadResponse = await mutations.getUploadUrl(uploadArg).unwrap();
  const uploadData = uploadResponse.data;

  const uploadToMinioResponse = await fetch(uploadData.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    }
  });

  if (!uploadToMinioResponse.ok) {
    throw new Error(`Failed to upload file to MinIO: ${uploadToMinioResponse.statusText}`);
  }

  try {
    const confirmArg: FileControllerConfirmUploadV1ApiArg = {
      confirmUploadDto: {
        objectKey: uploadData.objectKey,
        ftsFunctionDetailId,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      } as ConfirmUploadDto
    };
    const confirmResponse = await mutations.confirmUpload(confirmArg).unwrap();
    return confirmResponse;
  } catch (error) {
    try {
      await mutations.deleteFile({ id: uploadData.objectKey }).unwrap();
    } catch (deleteError) {
      console.warn('Failed to delete orphaned file from MinIO:', deleteError);
    }
    throw error;
  }
}

/**
 * Утилита для скачивания файла
 */
export async function downloadFile(
  params: DownloadFileParams,
  getDownloadUrlMutation: ReturnType<typeof useFileControllerGetDownloadUrlV1Mutation>[0]
): Promise<void> {
  const { objectKey, fileName } = params;

  // ШАГ 1: Получаем presigned URL через мутацию (POST)
  const arg: FileControllerGetDownloadUrlV1ApiArg = {
    id: objectKey
  };

  const response = await getDownloadUrlMutation(arg).unwrap();
  const { url } = response.data;

  // ШАГ 2: Скачиваем файл по presigned URL
  const downloadResponse = await fetch(url);

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
  }

  const blob = await downloadResponse.blob();
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName || objectKey;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Утилита для удаления файла
 */
export async function deleteFile(
  params: FileControllerDeleteFileV1ApiArg,
  deleteFileMutation: ReturnType<typeof useFileControllerDeleteFileV1Mutation>[0]
): Promise<DeleteFileResponseDto> {
  const { id } = params;

  const arg: FileControllerDeleteFileV1ApiArg = {
    id,
  };

  const result = await deleteFileMutation(arg).unwrap();
  return result;
}

/**
 * Утилита для получения URL для скачивания (без автоматического скачивания)
 */
export async function getDownloadUrl(
  params: FileControllerGetDownloadUrlV1ApiArg,
  getDownloadUrl: ReturnType<typeof useFileControllerGetDownloadUrlV1Mutation>[0]
): Promise<PresignedUrlResponseDto> {
  const { id } = params;

  const arg: FileControllerGetDownloadUrlV1ApiArg = {
    id
  };

  const response = await getDownloadUrl(arg).unwrap();
  return response;
}


/**
 * Хук для работы с файлами (объединяет все необходимые мутации)
 */
export function useFileUtils() {
  const [getUploadUrl] = useFileControllerGetUploadUrlV1Mutation();
  const [confirmUpload] = useFileControllerConfirmUploadV1Mutation();
  const [getDownloadUrlMutation] = useFileControllerGetDownloadUrlV1Mutation();
  const [deleteFileMutation] = useFileControllerDeleteFileV1Mutation();

  return {
    uploadFile: (params: Omit<UploadFileParams, 'mutations'>) => uploadFile(
      params, {
        getUploadUrl,
        confirmUpload,
        deleteFile: deleteFileMutation,
      },
    ),

    downloadFile: (params: DownloadFileParams) => downloadFile(params, getDownloadUrlMutation),

    getDownloadUrl: (params: FileControllerGetDownloadUrlV1ApiArg) => getDownloadUrl(params, getDownloadUrlMutation),

    deleteFile: (params: FileControllerDeleteFileV1ApiArg) => deleteFile(params, deleteFileMutation),
  };
}
