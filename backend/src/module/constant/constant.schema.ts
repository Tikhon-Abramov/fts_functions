import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { UserRole, FtsPositionRole, FtsFunctionRole, FtsBranchType, Category} from 'src/generated/prisma/client';
import { CodesByCategory, ValidCodes } from 'src/common/constants'


export const TypeQuerySchema = z.object({
  codes: z.array(z.string()).optional(),
  categories: z.array(z.nativeEnum(Category)).optional(),
  supertypeIds: z.array(z.number()).optional(),
}).superRefine((data, ctx) => {
    if (!data.codes?.length) return;

    const allowedCodes: Set<string> = data.categories?.length
      ? new Set(data.categories.flatMap((cat) => CodesByCategory[cat]))
      : ValidCodes;

    data.codes.forEach((code, index) => {
      if (!allowedCodes.has(code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_enum_value,
          received: code,
          options: [...allowedCodes],
          path: ['codes', index],
          message: data.categories?.length
            ? `code "${code}" не относится ни к одной из категорий: ${data.categories.join(', ')}`
            : `code "${code}" не существует в справочнике`,
        });
      }
    });
});

export const UserQuerySchema = z.object({
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  ftsPositionRoles: z.array(z.nativeEnum(FtsPositionRole)).optional(),
  ftsFunctionRoles: z.array(z.nativeEnum(FtsFunctionRole)).optional(),
  ftsBranchTypes: z.array(z.nativeEnum(FtsBranchType)).optional(),
});

export const TypeResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  supertypeId: z.number().nullable(),
});

export const UserResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  patronymic: z.string().nullable(),
  fullName: z.string().nullable(),
  shortName: z.string().nullable(),
  description: z.string().nullable(),
});

export class TypeQueryDto extends createZodDto(TypeQuerySchema) {}

export class UserQueryDto extends createZodDto(UserQuerySchema) {}

export class TypeResponseDto extends createZodDto(TypeResponseSchema) {}

export class UserResponseDto extends createZodDto(UserResponseSchema) {}
