import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { AuditService } from '@common/audit';
import { TypeNotFoundException, UserNotFoundException } from '@common/errors/exceptions';
import { buildWhereInArrays, stripUndefined } from '@common/prisma';
import { Prisma } from '@prisma-client';

import { PrismaService } from '../prisma/prisma.service';

import {
  TypeCreateDto,
  TypeQueryDto,
  TypeResponseDto,
  TypeUpdateDto,
  UserCreateDto,
  UserQueryDto,
  UserResponseDto,
  UserUpdateDto,
} from './constant.schema';

const TYPE_FIELD_MAP = {
  codes: 'code',
  categories: 'category',
  supertypeIds: 'supertypeId',
} as const satisfies { [K in keyof TypeQueryDto]?: keyof Prisma.TypeWhereInput };

const USER_FIELD_MAP = {
  roles: 'role',
  ftsPositionRoles: 'ftsPositionRole',
  ftsFunctionRoles: 'ftsFunctionRole',
  ftsBranchTypes: 'ftsBranchType',
} as const satisfies { [K in keyof UserQueryDto]?: keyof Prisma.UserWhereInput };

const TYPE_RESPONSE_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  supertypeId: true,
  category: true,
  color: true,
} as const satisfies Prisma.TypeSelect;

const USER_RESPONSE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  patronymic: true,
  fullName: true,
  shortName: true,
  description: true,
  role: true,
  ftsPositionRole: true,
  ftsFunctionRole: true,
  ftsBranchType: true,
} as const satisfies Prisma.UserSelect;

const BCRYPT_ROUNDS = 12;

/**
 * Constants service — read API стояло первым (`getTypes` / `getUsers`),
 * админ-CRUD добавился в один заход поверх него.
 *
 * Проверки целостности:
 * - **Type.code @unique** → P2002 → `UNIQUE_CONSTRAINT` (через global filter).
 * - **Type.id с FK-references** при DELETE → P2003 → `FOREIGN_KEY_CONSTRAINT`
 *   (Prisma `onDelete: Restrict` по умолчанию на FtsFunction-relations к Type).
 * - **User.email/login @unique** → P2002 → `UNIQUE_CONSTRAINT`.
 * - **User soft-delete**: `isDeleted=true` + `deletedAt=now()`. Возвращаем
 *   обычный response shape — `getUsers` уже скрывает удалённых через `isDeleted: false`.
 *
 * Role-slot consistency у `User` НЕ валидируется на этом уровне (см. JSDoc
 * на `UserCreateSchema`). Админ-CRUD сознательно даёт админу свободу;
 * ошибочную комбинацию словит ближайший FtsFunction write через
 * `assert-user-role.ts`.
 */
@Injectable()
export class ConstantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Type READ ──────────────────────────────────────────────────────────────

  getTypes(query: TypeQueryDto): Promise<TypeResponseDto[]> {
    const where: Prisma.TypeWhereInput = buildWhereInArrays(query, TYPE_FIELD_MAP);
    return this.prisma.type.findMany({
      where,
      select: TYPE_RESPONSE_SELECT,
    });
  }

  // ── Type WRITE ─────────────────────────────────────────────────────────────

  async createType(dto: TypeCreateDto, actorUserId: number | null): Promise<TypeResponseDto> {
    const entity = await this.prisma.type.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        supertypeId: dto.supertypeId ?? null,
        category: dto.category,
        color: dto.color ?? null,
      },
      select: TYPE_RESPONSE_SELECT,
    });

    await this.audit.recordTypeCreate({
      actorUserId,
      entityId: entity.id,
      changes: { after: entity },
    });
    return entity;
  }

  async updateType(
    id: number,
    dto: TypeUpdateDto,
    actorUserId: number | null,
  ): Promise<TypeResponseDto> {
    const before = await this.prisma.type.findUnique({
      where: { id },
      select: TYPE_RESPONSE_SELECT,
    });
    if (!before) throw new TypeNotFoundException(id);

    const after = await this.prisma.type.update({
      where: { id },
      data: stripUndefined(dto as Record<string, unknown>),
      select: TYPE_RESPONSE_SELECT,
    });

    await this.audit.recordTypeUpdate({
      actorUserId,
      entityId: id,
      changes: { before, after },
    });
    return after;
  }

  async deleteType(id: number, actorUserId: number | null): Promise<void> {
    const before = await this.prisma.type.findUnique({
      where: { id },
      select: TYPE_RESPONSE_SELECT,
    });
    if (!before) throw new TypeNotFoundException(id);

    // Hard delete — Type записи это справочник, soft-delete тут не нужен.
    // Если на эту строку ссылается FtsFunction / FtsFunctionDetail / FtsFunctionTree —
    // Prisma вернёт P2003, а global filter переведёт это в `FOREIGN_KEY_CONSTRAINT` (409).
    await this.prisma.type.delete({ where: { id } });

    await this.audit.recordTypeDelete({
      actorUserId,
      entityId: id,
      changes: { before },
    });
  }

  // ── User READ ──────────────────────────────────────────────────────────────

  getUsers(query: UserQueryDto): Promise<UserResponseDto[]> {
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      ...buildWhereInArrays<UserQueryDto, Prisma.UserWhereInput>(query, USER_FIELD_MAP),
    };

    return this.prisma.user.findMany({
      where,
      select: USER_RESPONSE_SELECT,
    });
  }

  // ── User WRITE ─────────────────────────────────────────────────────────────

  async createUser(dto: UserCreateDto, actorUserId: number | null): Promise<UserResponseDto> {
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS) : null;

    const entity = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        patronymic: dto.patronymic ?? null,
        fullName: dto.fullName ?? this.buildFullName(dto),
        shortName: dto.shortName ?? null,
        description: dto.description ?? null,
        role: dto.role,
        ftsPositionRole: dto.ftsPositionRole ?? null,
        ftsFunctionRole: dto.ftsFunctionRole ?? null,
        ftsBranchType: dto.ftsBranchType,
        login: dto.login ?? null,
        email: dto.email ?? null,
        passwordHash,
        // Email-verified только если админ задал и email, и пароль — иначе
        // пользователь будет в forgot-password flow и подтвердит сам.
        emailVerified: false,
      },
      select: USER_RESPONSE_SELECT,
    });

    await this.audit.recordUserCreate({
      actorUserId,
      entityId: entity.id,
      changes: { after: entity },
    });
    return entity;
  }

  async updateUser(
    id: number,
    dto: UserUpdateDto,
    actorUserId: number | null,
  ): Promise<UserResponseDto> {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: USER_RESPONSE_SELECT,
    });
    if (!before || (await this.isSoftDeleted(id))) throw new UserNotFoundException(id);

    const data: Record<string, unknown> = stripUndefined(dto as Record<string, unknown>);
    // Пароль никогда не идёт в data напрямую — только хэш. И ключ переименовывается.
    if (typeof dto.password === 'string') {
      delete data['password'];
      data['passwordHash'] = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    const after = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_RESPONSE_SELECT,
    });

    await this.audit.recordUserUpdate({
      actorUserId,
      entityId: id,
      changes: { before, after },
    });
    return after;
  }

  async deleteUser(id: number, actorUserId: number | null): Promise<void> {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: USER_RESPONSE_SELECT,
    });
    if (!before || (await this.isSoftDeleted(id))) throw new UserNotFoundException(id);

    // Soft-delete: пользователь может ссылаться из FtsFunction (curator/manager/heads).
    // Hard-delete сломал бы FK-references; soft-delete чистый.
    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.audit.recordUserDelete({
      actorUserId,
      entityId: id,
      changes: { before },
    });
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async isSoftDeleted(id: number): Promise<boolean> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { isDeleted: true },
    });
    return row?.isDeleted === true;
  }

  private buildFullName(dto: {
    firstName: string;
    lastName: string;
    patronymic?: string | null | undefined;
  }): string | null {
    const parts = [dto.lastName, dto.firstName, dto.patronymic ?? null].filter(
      (p): p is string => typeof p === 'string' && p.length > 0,
    );
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
