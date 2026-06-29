import { Prisma } from 'src/generated/prisma/client';


export const TypeSelect = {
  id: true,
  name: true,
  code: true,
  description: true,
  supertypeId: true,
} as const satisfies Prisma.TypeSelect;


export const UserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    patronymic: true,
    fullName: true,
    shortName: true,
    description: true,
} as const satisfies Prisma.UserSelect;
