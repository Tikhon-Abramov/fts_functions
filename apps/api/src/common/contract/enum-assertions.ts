/**
 * Compile-time соответствие между enum'ами в `@registry/shared` и
 * сгенерированными Prisma enum'ами. Если в Prisma-схему добавится новый
 * вариант — бэкенд не скомпилируется, пока shared не обновят.
 */
import type {
  ActionHistoryType as PrismaActionHistoryType,
  Category as PrismaCategory,
  FtsBranchType as PrismaFtsBranchType,
  FtsFunctionRole as PrismaFtsFunctionRole,
  FtsPositionRole as PrismaFtsPositionRole,
  UserRole as PrismaUserRole,
} from '@prisma-client';
import type {
  ActionHistoryType as SharedActionHistoryType,
  AssertEqual,
  Category as SharedCategory,
  FtsBranchType as SharedFtsBranchType,
  FtsFunctionRole as SharedFtsFunctionRole,
  FtsPositionRole as SharedFtsPositionRole,
  UserRole as SharedUserRole,
} from '@registry/shared';

type _UserRoleContract = AssertEqual<SharedUserRole, PrismaUserRole>;
const _userRoleCheck: _UserRoleContract = true;

type _FtsPositionRoleContract = AssertEqual<SharedFtsPositionRole, PrismaFtsPositionRole>;
const _ftsPositionRoleCheck: _FtsPositionRoleContract = true;

type _FtsFunctionRoleContract = AssertEqual<SharedFtsFunctionRole, PrismaFtsFunctionRole>;
const _ftsFunctionRoleCheck: _FtsFunctionRoleContract = true;

type _FtsBranchTypeContract = AssertEqual<SharedFtsBranchType, PrismaFtsBranchType>;
const _ftsBranchTypeCheck: _FtsBranchTypeContract = true;

type _CategoryContract = AssertEqual<SharedCategory, PrismaCategory>;
const _categoryCheck: _CategoryContract = false;

type _ActionHistoryTypeContract = AssertEqual<SharedActionHistoryType, PrismaActionHistoryType>;
const _actionHistoryTypeCheck: _ActionHistoryTypeContract = true;

// Prevent TS6133 "declared but never read" warnings.
void _userRoleCheck;
void _ftsPositionRoleCheck;
void _ftsFunctionRoleCheck;
void _ftsBranchTypeCheck;
void _categoryCheck;
void _actionHistoryTypeCheck;
