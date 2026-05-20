import { UserRoleMismatchException } from '@common/errors/exceptions';
import { FtsBranchType, FtsFunctionRole } from '@prisma-client';

import { type PrismaService } from '../../prisma/prisma.service';

/**
 * Коды нарушений роли пользователя — единственная регистрационная точка.
 * Значения совпадают с DTO-префиксами (`<slot>Id`), поэтому используются как
 * для типизации, так и в `FTS_FUNCTION_USER_SLOTS` (см. сервис).
 */
export const UserRoleSlot = {
  CURATOR_CENTRAL_OFFICE: 'curatorCentralOffice',
  MANAGER_INTERREGIONAL_INSPECTION: 'managerInterregionalInspection',
  DEPARTMENT_HEAD_CENTRAL_OFFICE: 'departmentHeadCentralOffice',
  DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION: 'departmentHeadInterregionalInspection',
} as const;

export type UserRoleSlot = (typeof UserRoleSlot)[keyof typeof UserRoleSlot];

type UserRoleExpectation = {
  ftsBranchType: FtsBranchType;
  /** Ожидаемая роль в функции ФНС; undefined — любая (null допустим). */
  ftsFunctionRole?: FtsFunctionRole;
  /** Требуется ли наличие должностной роли (FtsPositionRole), любое значение. */
  requireFtsPositionRole?: boolean;
};

const EXPECTATIONS: Record<UserRoleSlot, UserRoleExpectation> = {
  [UserRoleSlot.CURATOR_CENTRAL_OFFICE]: {
    ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
    ftsFunctionRole: FtsFunctionRole.CURATOR,
  },
  [UserRoleSlot.MANAGER_INTERREGIONAL_INSPECTION]: {
    ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
    ftsFunctionRole: FtsFunctionRole.MANAGER,
  },
  [UserRoleSlot.DEPARTMENT_HEAD_CENTRAL_OFFICE]: {
    ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
    requireFtsPositionRole: true,
  },
  [UserRoleSlot.DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION]: {
    ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
    requireFtsPositionRole: true,
  },
};

/**
 * Проверяет, что пользователь подходит под ожидаемую роль слота функции ФНС.
 * Бросает {@link UserRoleMismatchException} при несоответствии.
 */
export async function assertUserRole(
  prisma: PrismaService,
  userId: number,
  slot: UserRoleSlot,
): Promise<void> {
  const expectation = EXPECTATIONS[slot];
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      isDeleted: true,
      ftsBranchType: true,
      ftsFunctionRole: true,
      ftsPositionRole: true,
    },
  });

  if (user.isDeleted) {
    throw new UserRoleMismatchException(slot);
  }

  if (user.ftsBranchType !== expectation.ftsBranchType) {
    throw new UserRoleMismatchException(slot);
  }

  if (
    expectation.ftsFunctionRole !== undefined &&
    user.ftsFunctionRole !== expectation.ftsFunctionRole
  ) {
    throw new UserRoleMismatchException(slot);
  }

  if (expectation.requireFtsPositionRole && user.ftsPositionRole == null) {
    throw new UserRoleMismatchException(slot);
  }
}
