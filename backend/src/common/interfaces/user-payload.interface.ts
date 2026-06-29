import { Prisma } from "src/generated/prisma/client";


export type UserPayload =  Prisma.UserGetPayload<{
  select: {
    id: true;
    ftsInteractionUsersId: true;
    role: true;
    ftsPositionRole: true;
    ftsFunctionRole: true;
    ftsBranchType: true;
    fullName: true;
    shortName: true;
    description: true;
    isDeleted: true;
    lastLogin: true;
    createdAt: true;
    updatedAt: true;
  }
}>