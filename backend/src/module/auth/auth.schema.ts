import { createZodDto } from "@anatine/zod-nestjs";
import { z } from "zod";
import { BaseResponseSchema } from "@common/schemas/base-response.schema";
import { UserRole, FtsPositionRole, FtsFunctionRole, FtsBranchType } from 'src/generated/prisma/client'



export const LoginSchema = z.object({
  username: z
    .string()
    .nonempty('Обязательное поле')
    .max(50, 'Логин должен содержать не более 50 символов')
    .transform((value) => value.replace(/\s+/g, ' ').trim()),

  password: z
    .string()
    .nonempty('Обязательное поле')
    .max(128, 'Пароль должен содержать не более 128 символов')
    .transform((value) => value.replace(/\s+/g, ' ').trim()),
});

export const UserPayloadSchema = z.object({
  id: z.number(),
  ftsInteractionUsersId: z.number().nullable(),
  role: z.nativeEnum(UserRole),
  ftsPositionRole: z.nativeEnum(FtsPositionRole).nullable(),
  ftsFunctionRole: z.nativeEnum(FtsFunctionRole).nullable(),
  ftsBranchType: z.nativeEnum(FtsBranchType),
  fullName: z.string().nullable(),
  shortName: z.string().nullable(),
  description: z.string().nullable(),
  isDeleted: z.boolean(),
  lastLogin: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GetUserResponseSchema = BaseResponseSchema.extend({
  user: UserPayloadSchema
});

export const LoginResponseSchema = BaseResponseSchema.extend({
  user: UserPayloadSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshResponseSchema = LoginResponseSchema.extend({});


export class LoginResponseDto extends createZodDto(LoginResponseSchema) { }
export class LogoutResponseDto extends createZodDto(BaseResponseSchema) { }
export class RefreshResponseDto extends createZodDto(RefreshResponseSchema) { }
export class LoginDto extends createZodDto(LoginSchema) { }
