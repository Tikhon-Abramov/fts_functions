import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';
import process from 'node:process';
import { usersSeed } from './users';
import { constantsSeed } from './constants';
import { seedFtsFunctions } from './fts-functions';

dotenv.config();

async function main(): Promise<void> {
  const adapter = new PrismaMariaDb(process.env['DATABASE_URL'] as string);
  const prisma = new PrismaClient({ adapter });

  // await clearLocks(prisma);

  // await prisma.ftsFunctionTree.deleteMany();
  // await prisma.ftsFunctionDetail.deleteMany();
  // await prisma.ftsFunctionToDti.deleteMany();
  // await prisma.ftsFunction.deleteMany();
  // await prisma.type.deleteMany();
  // await prisma.user.deleteMany();

  await constantsSeed(prisma);
  // await usersSeed(prisma);
  // await seedFtsFunctions(prisma);

  process.exit(0);
}

void main();
