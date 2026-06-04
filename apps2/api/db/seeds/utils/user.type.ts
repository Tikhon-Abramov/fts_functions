import {
  type FtsBranchType,
  type FtsFunctionRole,
  type FtsPositionRole,
  type UserRole,
} from '@prisma-generated/enums';

export type UserType = {
  role: UserRole;
  ftsPositionRole?: FtsPositionRole;
  ftsFunctionRole?: FtsFunctionRole;
  ftsBranchType: FtsBranchType;
  firstName: string;
  lastName: string;
  patronymic?: string;
  description?: string;
};
