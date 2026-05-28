/**
 * Test-only factory producing a deeply-mocked PrismaService.
 * Used by *.spec.ts files — NOT imported from production code.
 */
import type { PrismaService } from '../../module/prisma/prisma.service';

type Fn = jest.Mock;

export type PrismaModelMock = {
  findMany: Fn;
  findUnique: Fn;
  findUniqueOrThrow: Fn;
  findFirst: Fn;
  create: Fn;
  update: Fn;
  delete: Fn;
  deleteMany: Fn;
  upsert: Fn;
  count: Fn;
};

export type PrismaMock = {
  type: PrismaModelMock;
  user: PrismaModelMock;
  ftsFunction: PrismaModelMock;
  ftsFunctionDetail: PrismaModelMock;
  ftsFunctionTree: PrismaModelMock;
  ftsFunctionToDti: PrismaModelMock;
  refreshTokenBlacklist: PrismaModelMock;
  auditLog: PrismaModelMock;
  $transaction: Fn;
};

function makeModel(): PrismaModelMock {
  return {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  };
}

export function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    type: makeModel(),
    user: makeModel(),
    ftsFunction: makeModel(),
    ftsFunctionDetail: makeModel(),
    ftsFunctionTree: makeModel(),
    ftsFunctionToDti: makeModel(),
    refreshTokenBlacklist: makeModel(),
    auditLog: makeModel(),
    // default: execute promises sequentially (like prisma does) and collect
    $transaction: jest.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Array<Promise<unknown>>);
      }
      if (typeof arg === 'function') {
        return (arg as (p: PrismaMock) => unknown)(mock);
      }
      return arg;
    }),
  };
  return mock;
}

/** Cast helper — the mock implements the surface used by services. */
export function asPrismaService(mock: PrismaMock): PrismaService {
  return mock as unknown as PrismaService;
}
