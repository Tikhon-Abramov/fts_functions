import type { FtsFunctionCounterService } from './fts-function-counter.service';

import { Prisma } from '@prisma-client';

import {
  DuplicateTreeEdgeException,
  FtsFunctionDetailNotFoundException,
  FtsFunctionDtiLinkNotFoundException,
  FtsFunctionNotFoundException,
  FtsFunctionTreeEdgeNotFoundException,
  FunctionNameDuplicateException,
  TreeSelfLoopException,
} from '../../common/errors/exceptions';
import {
  asPrismaService,
  createPrismaMock,
  type PrismaMock,
} from '../../common/test-utils/prisma-mock';

import { FtsFunctionService } from './fts-function.service';

// Mock the assert helpers — keep them as jest fns that resolve by default.
jest.mock('./internal/assert-type-category', () => ({
  assertTypeCategory: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./internal/assert-types-categories', () => ({
  assertTypesCategories: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./internal/assert-user-role', () => {
  const actual = jest.requireActual('./internal/assert-user-role');
  return {
    ...actual,
    assertUserRole: jest.fn().mockResolvedValue(undefined),
  };
});

import { assertTypeCategory } from './internal/assert-type-category';
import { assertTypesCategories } from './internal/assert-types-categories';
import { assertUserRole } from './internal/assert-user-role';

const mockedAssertTypeCategory = assertTypeCategory as jest.MockedFunction<
  typeof assertTypeCategory
>;
const mockedAssertTypesCategories = assertTypesCategories as jest.MockedFunction<
  typeof assertTypesCategories
>;
const mockedAssertUserRole = assertUserRole as jest.MockedFunction<typeof assertUserRole>;

describe('FtsFunctionService', () => {
  let prisma: PrismaMock;
  let service: FtsFunctionService;
  let counter: {
    overallTotal: number;
    onCreate: jest.Mock;
    onSoftDelete: jest.Mock;
    refresh: jest.Mock;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    counter = {
      overallTotal: 0,
      onCreate: jest.fn(),
      onSoftDelete: jest.fn(),
      refresh: jest.fn().mockResolvedValue(undefined),
    };
    service = new FtsFunctionService(
      asPrismaService(prisma),
      counter as unknown as FtsFunctionCounterService,
    );
    mockedAssertTypeCategory.mockClear();
    mockedAssertTypeCategory.mockResolvedValue(undefined);
    mockedAssertTypesCategories.mockClear();
    mockedAssertTypesCategories.mockResolvedValue(undefined);
    mockedAssertUserRole.mockClear();
    mockedAssertUserRole.mockResolvedValue(undefined);
  });

  //////////////////////////////////////////////////////////////////////////////
  // list
  //////////////////////////////////////////////////////////////////////////////

  describe('list', () => {
    it('includes isDeleted:false by default and ANDs filters', async () => {
      prisma.ftsFunction.findMany.mockResolvedValue([
        { id: 1, createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
      ]);
      prisma.ftsFunction.count.mockResolvedValue(1);
      counter.overallTotal = 7;

      const result = await service.list({
        competencyCenterIds: [10],
        ftsFunctionNameIds: [20],
      });

      expect(prisma.ftsFunction.findMany).toHaveBeenCalledTimes(1);
      const args = prisma.ftsFunction.findMany.mock.calls[0][0];
      expect(args.where).toEqual({
        isDeleted: false,
        competencyCenterId: { in: [10] },
        ftsFunctionNameId: { in: [20] },
      });
      expect(result.items.length).toBe(1);
      expect(result.filteredTotal).toBe(1);
      expect(result.overallTotal).toBe(7);
    });

    it('when includeDeleted=true omits isDeleted filter', async () => {
      prisma.ftsFunction.findMany.mockResolvedValue([]);
      prisma.ftsFunction.count.mockResolvedValue(0);

      await service.list({ includeDeleted: true });

      const args = prisma.ftsFunction.findMany.mock.calls[0][0];
      expect(args.where).toEqual({});
    });

    it('selects dtis on each list row so the registry table can render the DTI column', async () => {
      const dtiPayload = [{ dti: { id: 7, name: 'ЕНК', code: 'ENK' } }];
      prisma.ftsFunction.findMany.mockResolvedValue([
        {
          id: 1,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          dtis: dtiPayload,
        },
      ]);
      prisma.ftsFunction.count.mockResolvedValue(1);

      const result = await service.list({});

      const args = prisma.ftsFunction.findMany.mock.calls[0][0];
      // The list select must pull the DTI join — assert the shape of `select.dtis`.
      expect(args.select).toBeDefined();
      expect(args.select.dtis).toBeDefined();
      expect(args.select.dtis.select.dti.select).toEqual({
        id: true,
        name: true,
        code: true,
      });
      // And the returned items must propagate the join through unchanged.
      expect(result.items[0]).toMatchObject({ id: 1, dtis: dtiPayload });
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // getById
  //////////////////////////////////////////////////////////////////////////////

  describe('getById', () => {
    it('returns entity when alive', async () => {
      const entity = { id: 1, isDeleted: false };
      prisma.ftsFunction.findUnique.mockResolvedValue(entity);

      await expect(service.getById(1)).resolves.toBe(entity);
    });

    it('throws FtsFunctionNotFoundException when not found', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue(null);
      await expect(service.getById(99)).rejects.toBeInstanceOf(FtsFunctionNotFoundException);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // create
  //////////////////////////////////////////////////////////////////////////////

  describe('create', () => {
    it('calls type and user asserts, then prisma.create', async () => {
      const created = { id: 42 };
      prisma.ftsFunction.create.mockResolvedValue(created);

      const dto = {
        ftsCentralizationId: 1,
        ftsFunctionNameId: 2,
        competencyCenterId: 3,
        ftsFunctionMarkerId: 4,
        curatorCentralOfficeId: 10,
        managerInterregionalInspectionId: 11,
        departmentHeadCentralOfficeId: 12,
        departmentHeadInterregionalInspectionId: 13,
      };

      const result = await service.create(dto);

      // Type-category checks are now batched into a single round-trip via
      // assertTypesCategories — one call carrying the 4 (id, expected) pairs.
      expect(mockedAssertTypesCategories).toHaveBeenCalledTimes(1);
      expect(mockedAssertTypesCategories.mock.calls[0]![1]).toHaveLength(4);
      expect(mockedAssertUserRole).toHaveBeenCalledTimes(4);
      expect(prisma.ftsFunction.create).toHaveBeenCalledTimes(1);
      expect(result).toBe(created);
    });

    it('creating with a unique nameId still works (regression guard)', async () => {
      const created = { id: 7 };
      prisma.ftsFunction.create.mockResolvedValue(created);

      await expect(
        service.create({
          ftsCentralizationId: 1,
          ftsFunctionNameId: 99,
          competencyCenterId: 3,
          ftsFunctionMarkerId: 4,
          curatorCentralOfficeId: 10,
          managerInterregionalInspectionId: 11,
          departmentHeadCentralOfficeId: 12,
          departmentHeadInterregionalInspectionId: 13,
        }),
      ).resolves.toBe(created);

      expect(counter.onCreate).toHaveBeenCalledTimes(1);
    });

    it('maps Prisma P2002 on fts_function_name_id to FunctionNameDuplicateException (409)', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 't',
        meta: { target: ['fts_function_name_id'] },
      });
      prisma.ftsFunction.create.mockRejectedValue(err);

      await expect(
        service.create({
          ftsCentralizationId: 1,
          ftsFunctionNameId: 2,
          competencyCenterId: 3,
          ftsFunctionMarkerId: 4,
          curatorCentralOfficeId: 10,
          managerInterregionalInspectionId: 11,
          departmentHeadCentralOfficeId: 12,
          departmentHeadInterregionalInspectionId: 13,
        }),
      ).rejects.toBeInstanceOf(FunctionNameDuplicateException);

      // Counter must NOT advance on a duplicate-name failure.
      expect(counter.onCreate).not.toHaveBeenCalled();
    });

    it('maps P2002 reported as the constraint key name to FunctionNameDuplicateException', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 't',
        meta: { target: 'fts_functions_fts_function_name_id_key' },
      });
      prisma.ftsFunction.create.mockRejectedValue(err);

      await expect(
        service.create({
          ftsCentralizationId: 1,
          ftsFunctionNameId: 2,
          competencyCenterId: 3,
          ftsFunctionMarkerId: 4,
          curatorCentralOfficeId: 10,
          managerInterregionalInspectionId: 11,
          departmentHeadCentralOfficeId: 12,
          departmentHeadInterregionalInspectionId: 13,
        }),
      ).rejects.toBeInstanceOf(FunctionNameDuplicateException);
    });

    it('rethrows P2002 on a different unique target unchanged', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 't',
        meta: { target: ['some_other_field'] },
      });
      prisma.ftsFunction.create.mockRejectedValue(err);

      await expect(
        service.create({
          ftsCentralizationId: 1,
          ftsFunctionNameId: 2,
          competencyCenterId: 3,
          ftsFunctionMarkerId: 4,
          curatorCentralOfficeId: 10,
          managerInterregionalInspectionId: 11,
          departmentHeadCentralOfficeId: 12,
          departmentHeadInterregionalInspectionId: 13,
        }),
      ).rejects.toBe(err);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // update
  //////////////////////////////////////////////////////////////////////////////

  describe('update', () => {
    it('refuses update when row is soft-deleted', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: true });

      await expect(service.update(1, { ftsCentralizationId: 5 } as any)).rejects.toBeInstanceOf(
        FtsFunctionNotFoundException,
      );
      expect(prisma.ftsFunction.update).not.toHaveBeenCalled();
    });

    it('throws FtsFunctionNotFoundException when row does not exist', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue(null);
      await expect(service.update(7, {} as any)).rejects.toBeInstanceOf(
        FtsFunctionNotFoundException,
      );
    });

    it('calls asserts only for fields being changed', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      prisma.ftsFunction.update.mockResolvedValue({ id: 1 });

      await service.update(1, { curatorCentralOfficeId: 99 });

      // assertTypesCategories is always called (with an empty list when no
      // type-category fields are present in the dto) — verify list is empty.
      expect(mockedAssertTypesCategories).toHaveBeenCalledTimes(1);
      expect(mockedAssertTypesCategories.mock.calls[0]![1]).toHaveLength(0);
      expect(mockedAssertUserRole).toHaveBeenCalledTimes(1);
      expect(mockedAssertUserRole.mock.calls[0]![2]).toBe('curatorCentralOffice');
    });

    it('maps Prisma P2002 on fts_function_name_id from update to FunctionNameDuplicateException', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 't',
        meta: { target: ['fts_function_name_id'] },
      });
      prisma.ftsFunction.update.mockRejectedValue(err);

      await expect(service.update(1, { ftsFunctionNameId: 9 })).rejects.toBeInstanceOf(
        FunctionNameDuplicateException,
      );
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // softDelete
  //////////////////////////////////////////////////////////////////////////////

  describe('softDelete', () => {
    it('sets isDeleted=true and deletedAt to a date', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      prisma.ftsFunction.update.mockResolvedValue({ id: 1, isDeleted: true });

      await service.softDelete(1);

      const updateArgs = prisma.ftsFunction.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 1 });
      expect(updateArgs.data.isDeleted).toBe(true);
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    });

    it('throws FtsFunctionNotFoundException when already deleted (idempotency is NOT implemented; alive-check rejects)', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: true });
      await expect(service.softDelete(1)).rejects.toBeInstanceOf(FtsFunctionNotFoundException);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // createTreeEdge
  //////////////////////////////////////////////////////////////////////////////

  describe('createTreeEdge', () => {
    it('rejects on self-loop', async () => {
      await expect(
        service.createTreeEdge({
          parentFtsFunctionId: 1,
          childFtsFunctionId: 1,
          relationTypeId: 10,
        } as any),
      ).rejects.toBeInstanceOf(TreeSelfLoopException);
    });

    it('rejects on duplicate edge', async () => {
      prisma.ftsFunctionDetail.findUnique
        .mockResolvedValueOnce({ id: 1, isDeleted: false })
        .mockResolvedValueOnce({ id: 2, isDeleted: false });
      prisma.ftsFunctionTree.findUnique.mockResolvedValue({ parentFtsFunctionId: 1 });

      await expect(
        service.createTreeEdge({
          parentFtsFunctionId: 1,
          childFtsFunctionId: 2,
          relationTypeId: 10,
        } as any),
      ).rejects.toBeInstanceOf(DuplicateTreeEdgeException);
    });

    it('creates an edge when all checks pass', async () => {
      prisma.ftsFunctionDetail.findUnique
        .mockResolvedValueOnce({ id: 1, isDeleted: false })
        .mockResolvedValueOnce({ id: 2, isDeleted: false });
      prisma.ftsFunctionTree.findUnique.mockResolvedValue(null);
      const edge = { parentFtsFunctionId: 1, childFtsFunctionId: 2, relationTypeId: 10 };
      prisma.ftsFunctionTree.create.mockResolvedValue(edge);

      const result = await service.createTreeEdge({
        parentFtsFunctionId: 1,
        childFtsFunctionId: 2,
        relationTypeId: 10,
      });

      expect(mockedAssertTypeCategory).toHaveBeenCalledTimes(1);
      expect(result).toBe(edge);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // deleteTreeEdge
  //////////////////////////////////////////////////////////////////////////////

  describe('deleteTreeEdge', () => {
    it('throws FtsFunctionTreeEdgeNotFoundException when edge does not exist', async () => {
      prisma.ftsFunctionTree.findUnique.mockResolvedValue(null);
      await expect(service.deleteTreeEdge(1, 2)).rejects.toBeInstanceOf(
        FtsFunctionTreeEdgeNotFoundException,
      );
    });

    it('deletes and returns the edge when it exists', async () => {
      const edge = { parentFtsFunctionId: 1, childFtsFunctionId: 2 };
      prisma.ftsFunctionTree.findUnique.mockResolvedValue(edge);
      prisma.ftsFunctionTree.delete.mockResolvedValue(edge);

      const result = await service.deleteTreeEdge(1, 2);
      expect(prisma.ftsFunctionTree.delete).toHaveBeenCalled();
      expect(result).toBe(edge);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // attachDti / detachDti
  //////////////////////////////////////////////////////////////////////////////

  describe('attachDti', () => {
    it('uses upsert (idempotent)', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      const upserted = { ftsFunctionId: 1, dtiId: 5 };
      prisma.ftsFunctionToDti.upsert.mockResolvedValue(upserted);

      const result = await service.attachDti(1, 5);

      expect(prisma.ftsFunctionToDti.upsert).toHaveBeenCalledTimes(1);
      expect(mockedAssertTypeCategory).toHaveBeenCalledTimes(1);
      expect(result).toBe(upserted);
    });
  });

  describe('detachDti', () => {
    it('throws FtsFunctionDtiLinkNotFoundException when not attached', async () => {
      prisma.ftsFunctionToDti.findUnique.mockResolvedValue(null);
      await expect(service.detachDti(1, 5)).rejects.toBeInstanceOf(
        FtsFunctionDtiLinkNotFoundException,
      );
    });

    it('removes existing link', async () => {
      const link = { ftsFunctionId: 1, dtiId: 5 };
      prisma.ftsFunctionToDti.findUnique.mockResolvedValue(link);
      prisma.ftsFunctionToDti.delete.mockResolvedValue(link);

      const result = await service.detachDti(1, 5);
      expect(prisma.ftsFunctionToDti.delete).toHaveBeenCalled();
      expect(result).toBe(link);
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Detail CRUD
  //////////////////////////////////////////////////////////////////////////////

  describe('createDetail', () => {
    it('asserts parent alive and all type categories, then creates', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      const created = { id: 10 };
      prisma.ftsFunctionDetail.create.mockResolvedValue(created);

      const dto = {
        ftsFunctionStepId: 1,
        ftsFunctionCategoryId: 2,
        ftsFunctionComplexityId: 3,
        ftsFunctionExecutionFrequencyId: 4,
        ftsFunctionActionTypeId: 5,
      };
      const result = await service.createDetail(1, dto);
      // Detail validator now batches the 5 type-category checks into one call.
      expect(mockedAssertTypesCategories).toHaveBeenCalledTimes(1);
      expect(mockedAssertTypesCategories.mock.calls[0]![1]).toHaveLength(5);
      expect(result).toBe(created);
    });

    it('throws when parent function is soft-deleted', async () => {
      prisma.ftsFunction.findUnique.mockResolvedValue({ id: 1, isDeleted: true });
      await expect(service.createDetail(1, {} as any)).rejects.toBeInstanceOf(
        FtsFunctionNotFoundException,
      );
    });
  });

  describe('updateDetail', () => {
    it('throws FtsFunctionDetailNotFoundException on soft-deleted row', async () => {
      prisma.ftsFunctionDetail.findUnique.mockResolvedValue({ id: 1, isDeleted: true });
      await expect(service.updateDetail(1, {} as any)).rejects.toBeInstanceOf(
        FtsFunctionDetailNotFoundException,
      );
    });

    it('asserts only changed fields', async () => {
      prisma.ftsFunctionDetail.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      prisma.ftsFunctionDetail.update.mockResolvedValue({ id: 1 });
      await service.updateDetail(1, { ftsFunctionStepId: 9 });
      expect(mockedAssertTypesCategories).toHaveBeenCalledTimes(1);
      expect(mockedAssertTypesCategories.mock.calls[0]![1]).toHaveLength(1);
    });
  });

  describe('softDeleteDetail', () => {
    it('sets isDeleted=true and deletedAt', async () => {
      prisma.ftsFunctionDetail.findUnique.mockResolvedValue({ id: 1, isDeleted: false });
      prisma.ftsFunctionDetail.update.mockResolvedValue({ id: 1 });

      await service.softDeleteDetail(1);
      const args = prisma.ftsFunctionDetail.update.mock.calls[0][0];
      expect(args.data.isDeleted).toBe(true);
      expect(args.data.deletedAt).toBeInstanceOf(Date);
    });

    it('throws FtsFunctionDetailNotFoundException on already deleted row (alive-check)', async () => {
      prisma.ftsFunctionDetail.findUnique.mockResolvedValue({ id: 1, isDeleted: true });
      await expect(service.softDeleteDetail(1)).rejects.toBeInstanceOf(
        FtsFunctionDetailNotFoundException,
      );
    });
  });
});
