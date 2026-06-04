import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

import {
  Category,
  FtsBranchType,
  FtsFunctionRole,
  FtsPositionRole,
  UserRole,
} from '@prisma-client';

// ── Query (existing — read-only) ────────────────────────────────────────────

export const TypeQuerySchema = z.object({
  codes: z.array(z.string()).optional(),
  categories: z.array(z.nativeEnum(Category)).optional(),
  supertypeIds: z.array(z.number()).optional(),
});

export const UserQuerySchema = z.object({
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  ftsPositionRoles: z.array(z.nativeEnum(FtsPositionRole)).optional(),
  ftsFunctionRoles: z.array(z.nativeEnum(FtsFunctionRole)).optional(),
  ftsBranchTypes: z.array(z.nativeEnum(FtsBranchType)).optional(),
});

// ── Path params (admin write endpoints) ─────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ── Type CRUD ───────────────────────────────────────────────────────────────

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Поля Type — копия столбцов модели `Type` в `apps/api/db/schema.prisma`,
 * за исключением id и счётчиков по обратным связям. `code` уникален в БД,
 * P2002 mapping в global filter превратит дубликат в `UNIQUE_CONSTRAINT`.
 *
 * Note: `category` change at update time is allowed by v1 — downstream FK
 * impact (rows referencing this Type from a different category) is asserted
 * at FtsFunction-write time via `assertTypeCategory` in the FtsFunction
 * service; admin tooling deliberately leaves the choice with the operator.
 */
export const TypeCreateSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(512),
  description: z.string().max(1024).nullable().optional(),
  supertypeId: z.number().int().positive().nullable().optional(),
  category: z.nativeEnum(Category),
  color: z.string().regex(HEX_COLOR_RE).nullable().optional(),
});

export const TypeUpdateSchema = TypeCreateSchema.partial();

export const TypeResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  supertypeId: z.number().nullable(),
  category: z.nativeEnum(Category),
  color: z.string().nullable().optional(),
});

// ── User CRUD ───────────────────────────────────────────────────────────────

/**
 * Базовая форма пользователя для admin CRUD.
 *
 * `email` уникален в БД — дубликат превращается в `UNIQUE_CONSTRAINT` через
 * глобальный prisma error mapper; на уровне DTO достаточно валидации формата.
 *
 * Role-slot consistency (`role` / `ftsPositionRole` / `ftsFunctionRole` /
 * `ftsBranchType`) валидируется НЕ здесь, а в момент привязки пользователя к
 * `FtsFunction` через `assert-user-role.ts`. Админ может создать пользователя
 * с любой допустимой комбинацией; некорректные комбинации словит ближайший
 * write на FtsFunction, ссылающийся на этого пользователя.
 *
 * Пароль опционален: если пришёл — будет захэширован bcrypt-ом и сохранён;
 * если не пришёл — `passwordHash` остаётся null, `emailVerified` = false,
 * пользователь должен будет пройти forgot-password flow для активации.
 *
 * `passwordHash` НИКОГДА не выходит наружу (см. `PrismaService` global
 * `omit: { user: { passwordHash: true } }`).
 */
export const UserCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  patronymic: z.string().max(50).nullable().optional(),
  fullName: z.string().max(160).nullable().optional(),
  shortName: z.string().max(60).nullable().optional(),
  description: z.string().max(512).nullable().optional(),
  role: z.nativeEnum(UserRole),
  ftsPositionRole: z.nativeEnum(FtsPositionRole).nullable().optional(),
  ftsFunctionRole: z.nativeEnum(FtsFunctionRole).nullable().optional(),
  ftsBranchType: z.nativeEnum(FtsBranchType),
  login: z.string().min(1).max(50).nullable().optional(),
  email: z.string().email().max(254).nullable().optional(),
  password: z.string().min(8).max(128).optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial();

export const UserResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  patronymic: z.string().nullable(),
  fullName: z.string().nullable(),
  shortName: z.string().nullable(),
  description: z.string().nullable(),
  role: z.nativeEnum(UserRole),
  ftsPositionRole: z.nativeEnum(FtsPositionRole).nullable(),
  ftsFunctionRole: z.nativeEnum(FtsFunctionRole).nullable(),
  ftsBranchType: z.nativeEnum(FtsBranchType),
});

// ── DTOs (NestJS Swagger ↔ Zod bridge) ──────────────────────────────────────

export class TypeQueryDto extends createZodDto(TypeQuerySchema) {}
export class UserQueryDto extends createZodDto(UserQuerySchema) {}
export class TypeResponseDto extends createZodDto(TypeResponseSchema) {}
export class UserResponseDto extends createZodDto(UserResponseSchema) {}
export class IdParamDto extends createZodDto(IdParamSchema) {}
export class TypeCreateDto extends createZodDto(TypeCreateSchema) {}
export class TypeUpdateDto extends createZodDto(TypeUpdateSchema) {}
export class UserCreateDto extends createZodDto(UserCreateSchema) {}
export class UserUpdateDto extends createZodDto(UserUpdateSchema) {}
