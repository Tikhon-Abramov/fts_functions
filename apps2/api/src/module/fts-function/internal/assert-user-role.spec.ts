import { UserRoleMismatchException } from '@common/errors/exceptions';
import { asPrismaService, createPrismaMock, type PrismaMock } from '@common/test-utils/prisma-mock';
import { FtsBranchType, FtsFunctionRole, FtsPositionRole } from '@prisma-client';

import { assertUserRole, UserRoleSlot } from './assert-user-role';

describe('assertUserRole', () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  function mockUser(
    overrides: Partial<{
      isDeleted: boolean;
      ftsBranchType: FtsBranchType | null;
      ftsFunctionRole: FtsFunctionRole | null;
      ftsPositionRole: FtsPositionRole | null;
    }> = {},
  ): void {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      isDeleted: false,
      ftsBranchType: null,
      ftsFunctionRole: null,
      ftsPositionRole: null,
      ...overrides,
    });
  }

  async function expectMismatch(id: number, slot: UserRoleSlot): Promise<void> {
    let thrown: unknown;
    try {
      await assertUserRole(asPrismaService(prisma), id, slot);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(UserRoleMismatchException);
    const body = (thrown as UserRoleMismatchException).getResponse() as {
      code: string;
      params: { slot: string };
    };
    expect(body.code).toBe('USER_ROLE_MISMATCH');
    expect(body.params.slot).toBe(slot);
  }

  describe('curatorCentralOffice', () => {
    const slot: UserRoleSlot = UserRoleSlot.CURATOR_CENTRAL_OFFICE;

    it('passes with CENTRAL_OFFICE + CURATOR', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsFunctionRole: FtsFunctionRole.CURATOR,
      });
      await expect(assertUserRole(asPrismaService(prisma), 1, slot)).resolves.toBeUndefined();
    });

    it('throws when ftsBranchType mismatches', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsFunctionRole: FtsFunctionRole.CURATOR,
      });
      await expectMismatch(1, slot);
    });

    it('throws when ftsFunctionRole mismatches', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsFunctionRole: FtsFunctionRole.MANAGER,
      });
      await expectMismatch(1, slot);
    });

    it('throws when user isDeleted', async () => {
      mockUser({
        isDeleted: true,
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsFunctionRole: FtsFunctionRole.CURATOR,
      });
      await expectMismatch(1, slot);
    });
  });

  describe('managerInterregionalInspection', () => {
    const slot: UserRoleSlot = UserRoleSlot.MANAGER_INTERREGIONAL_INSPECTION;

    it('passes with INTERREGIONAL_INSPECTION + MANAGER', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsFunctionRole: FtsFunctionRole.MANAGER,
      });
      await expect(assertUserRole(asPrismaService(prisma), 2, slot)).resolves.toBeUndefined();
    });

    it('throws on wrong branch', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsFunctionRole: FtsFunctionRole.MANAGER,
      });
      await expectMismatch(2, slot);
    });

    it('throws on wrong function role', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsFunctionRole: FtsFunctionRole.CURATOR,
      });
      await expectMismatch(2, slot);
    });

    it('throws when user isDeleted', async () => {
      mockUser({
        isDeleted: true,
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsFunctionRole: FtsFunctionRole.MANAGER,
      });
      await expectMismatch(2, slot);
    });
  });

  describe('departmentHeadCentralOffice', () => {
    const slot: UserRoleSlot = UserRoleSlot.DEPARTMENT_HEAD_CENTRAL_OFFICE;

    it('passes with CENTRAL_OFFICE + any non-null FtsPositionRole', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsPositionRole: FtsPositionRole.CHIEF,
      });
      await expect(assertUserRole(asPrismaService(prisma), 3, slot)).resolves.toBeUndefined();
    });

    it('throws when ftsPositionRole is null', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsPositionRole: null,
      });
      await expectMismatch(3, slot);
    });

    it('throws on wrong branch', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsPositionRole: FtsPositionRole.CHIEF,
      });
      await expectMismatch(3, slot);
    });

    it('throws when user isDeleted', async () => {
      mockUser({
        isDeleted: true,
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsPositionRole: FtsPositionRole.CHIEF,
      });
      await expectMismatch(3, slot);
    });
  });

  describe('departmentHeadInterregionalInspection', () => {
    const slot: UserRoleSlot = UserRoleSlot.DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION;

    it('passes with INTERREGIONAL_INSPECTION + any non-null FtsPositionRole', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsPositionRole: FtsPositionRole.DEPUTY_CHIEF,
      });
      await expect(assertUserRole(asPrismaService(prisma), 4, slot)).resolves.toBeUndefined();
    });

    it('throws on missing position role', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsPositionRole: null,
      });
      await expectMismatch(4, slot);
    });

    it('throws on wrong branch', async () => {
      mockUser({
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        ftsPositionRole: FtsPositionRole.DEPUTY_CHIEF,
      });
      await expectMismatch(4, slot);
    });

    it('throws when user isDeleted', async () => {
      mockUser({
        isDeleted: true,
        ftsBranchType: FtsBranchType.INTERREGIONAL_INSPECTION,
        ftsPositionRole: FtsPositionRole.DEPUTY_CHIEF,
      });
      await expectMismatch(4, slot);
    });
  });
});
