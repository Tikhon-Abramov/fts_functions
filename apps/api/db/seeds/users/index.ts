import { readFile } from 'fs/promises';
import process from 'node:process';
import { type PrismaClient } from 'src/generated/prisma/client';

import { createFullName, createShortName } from '../utils/create-users-name';
import { type UserType } from '../utils/user.type';

export async function usersSeed(prisma: PrismaClient) {
  const json = await readFile(`${process.cwd()}/db/seeds/users/accounts.json`, 'utf8');
  const accounts: UserType[] = JSON.parse(json);

  for (const user of accounts) {
    const fullName = createFullName(user);
    const shortName = createShortName(user);

    await prisma.user.create({
      data: {
        ...user,
        fullName,
        shortName,
      },
    });
  }
}
