import { UserRole, FtsPositionRole, FtsFunctionRole, FtsBranchType } from "src/generated/prisma/client";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
}

export type BaseTokenPayload = {
  sub: number;
  iat: number;
  nbf: number;
};

export type AccessTokenPayload = BaseTokenPayload & {
  role: UserRole;
  ftsBranchType: FtsBranchType;
  isDeleted: boolean;
};

export type RefreshTokenPayload = BaseTokenPayload & {
  jti: string;
};

export type RefreshTokenCreationResult = {
  refreshToken: string;
}

export type TokenMetadata = {
  ipAddress?: string;
  userAgent?: string;
}
