import { TypeCategoryMismatchException } from '@common/errors/exceptions';
import { asPrismaService, createPrismaMock, type PrismaMock } from '@common/test-utils/prisma-mock';
import { Category, Prisma } from '@prisma-client';

import { assertTypeCategory } from './assert-type-category';

describe('assertTypeCategory', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  it('resolves when the Type row category matches', async () => {
    prisma.type.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      category: Category.FTS_CENTRALIZATION,
    });

    await expect(
      assertTypeCategory(asPrismaService(prisma), 1, Category.FTS_CENTRALIZATION),
    ).resolves.toBeUndefined();

    expect(prisma.type.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws TypeCategoryMismatchException with structured params when category mismatches', async () => {
    prisma.type.findUniqueOrThrow.mockResolvedValue({
      id: 7,
      category: Category.FTS_FUNCTION_NAME,
    });

    let thrown: TypeCategoryMismatchException | undefined;
    try {
      await assertTypeCategory(asPrismaService(prisma), 7, Category.FTS_CENTRALIZATION);
    } catch (e) {
      thrown = e as TypeCategoryMismatchException;
    }
    expect(thrown).toBeInstanceOf(TypeCategoryMismatchException);
    const body = thrown!.getResponse() as {
      code: string;
      params: { table: string; column: string; category: string };
    };
    expect(body.code).toBe('TYPE_CATEGORY_MISMATCH');
    expect(body.params).toEqual({
      table: 'fts_functions',
      column: 'fts_centralization_id',
      category: 'FTS_CENTRALIZATION',
    });
  });

  it('structured params contain table.column for FTS_DTI category', async () => {
    prisma.type.findUniqueOrThrow.mockResolvedValue({
      id: 3,
      category: Category.FTS_CENTRALIZATION,
    });

    let thrown: TypeCategoryMismatchException | undefined;
    try {
      await assertTypeCategory(asPrismaService(prisma), 3, Category.FTS_DTI);
    } catch (e) {
      thrown = e as TypeCategoryMismatchException;
    }
    expect(thrown).toBeInstanceOf(TypeCategoryMismatchException);
    const body = thrown!.getResponse() as {
      params: { table: string; column: string; category: string };
    };
    expect(body.params.category).toBe(Category.FTS_DTI);
    expect(body.params.table.length).toBeGreaterThan(0);
    expect(body.params.column.length).toBeGreaterThan(0);
  });

  it('propagates Prisma P2025 when Type row does not exist', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('No Type found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    prisma.type.findUniqueOrThrow.mockRejectedValue(p2025);

    await expect(
      assertTypeCategory(asPrismaService(prisma), 999, Category.FTS_CENTRALIZATION),
    ).rejects.toBe(p2025);
  });
});
