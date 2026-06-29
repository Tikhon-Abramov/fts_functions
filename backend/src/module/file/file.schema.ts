import { createZodDto } from "@anatine/zod-nestjs";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { BaseResponseSchema } from "@common/schemas/base-response.schema";
import { z } from "zod";

extendZodWithOpenApi(z);

export const FileViewResponseSchema = z.object({
  objectKey: z.string(),
  originalName: z.string().nullable(),
  mimeType: z.string().nullable(),
  size: z.number().nullable()
});

export const GetAllFilesQuerySchema = z.object({
  ftsFunctionDetailId: z.number(),
});

export const InitUploadSchema = z.object({
  fileName: z.string().max(255),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024),
  mimeType: z.string().optional(),
});

export const ConfirmUploadSchema = z.object({
  objectKey: z.string().uuid(),
  ftsFunctionDetailId: z.number().int().positive(),
  originalName: z.string().max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().optional(),
});

export const GetFilesByOwnerSchema = z.object({
  ftsFunctionDetailId: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()),
});

export const UserInfoSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
});

export const FileBaseEntityResponseSchema = z.object({
  id: z.number(),
  objectKey: z.string().uuid(),
  originalName: z.string().nullable(),
  mimeType: z.string().nullable(),
  size: z.number().nullable(),
  createdAt: z.date(),
});

export const UploadDataEntitySchema = z.object({
  objectKey: z.string().uuid(),
  url: z.string().url(),
  expiresAt: z.date(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});

export const PresignedUrlEntitySchema = z.object({
  url: z.string().url(),
  expiresAt: z.date(),
});

export const DeleteFilePayloadSchema = z.object({
  success: z.boolean(),
  objectKey: z.string().uuid(),
  deletedAt: z.date().optional(),
});

// ==================== Response DTOs with BaseResponse ====================

export const FileResponseSchema = BaseResponseSchema.extend({
  data: FileBaseEntityResponseSchema
});

export const UploadDataResponseSchema = BaseResponseSchema.extend({
  data: UploadDataEntitySchema
});

export const PresignedUrlResponseSchema = BaseResponseSchema.extend({
  data: PresignedUrlEntitySchema
});

export const FilesListResponseSchema = BaseResponseSchema.extend({
  data: z.array(FileBaseEntityResponseSchema)
});

export const DeleteFileResponseSchema = BaseResponseSchema.extend({
  data: DeleteFilePayloadSchema.optional()
});

// ==================== DTO классы ====================

export class InitUploadDto extends createZodDto(InitUploadSchema) { }
export class ConfirmUploadDto extends createZodDto(ConfirmUploadSchema) { }
export class GetFilesByOwnerDto extends createZodDto(GetFilesByOwnerSchema) { }

export class FileBaseEntityResponseDto extends createZodDto(FileBaseEntityResponseSchema) { }
export class UploadDataEntityDto extends createZodDto(UploadDataEntitySchema) { }
export class PresignedUrlEntityDto extends createZodDto(PresignedUrlEntitySchema) { }
export class DeleteFilePayloadDto extends createZodDto(DeleteFilePayloadSchema) { }

export class FileResponseDto extends createZodDto(FileResponseSchema) { }
export class UploadDataResponseDto extends createZodDto(UploadDataResponseSchema) { }
export class PresignedUrlResponseDto extends createZodDto(PresignedUrlResponseSchema) { }
export class FilesListResponseDto extends createZodDto(FilesListResponseSchema) { }
export class DeleteFileResponseDto extends createZodDto(DeleteFileResponseSchema) { }
export class GetAllFilesQueryDto extends createZodDto(GetAllFilesQuerySchema) { }
