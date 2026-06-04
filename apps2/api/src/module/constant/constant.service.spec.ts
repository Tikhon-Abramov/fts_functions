import bcrypt from 'bcryptjs';

import { type AuditService } from '@common/audit';
import { TypeNotFoundException, UserNotFoundException } from '@common/errors/exceptions';
import {
  Category,
  FtsBranchType,
  FtsFunctionRole,
  FtsPositionRole,
  UserRole,
} from '@prisma-client';

import {
  asPrismaService,
  createPrismaMock,
  type PrismaMock,
} from '../../common/test-utils/prisma-mock';

import { ConstantService } from './constant.service';

type AuditMock = { [K in keyof AuditService]: jest.Mock };

function makeAuditMock(): AuditMock {
  return {
    recordRegister: jest.fn().mockResolvedValue(undefined),
    recordLogin: jest.fn().mockResolvedValue(undefined),
    recordLogout: jest.fn().mockResolvedValue(undefined),
    recordEmailVerified: jest.fn().mockResolvedValue(undefined),
    recordPasswordResetRequested: jest.fn().mockResolvedValue(undefined),
    recordPasswordResetCompleted: jest.fn().mockResolvedValue(undefined),
    recordTypeCreate: jest.fn().mockResolvedValue(undefined),
    recordTypeUpdate: jest.fn().mockResolvedValue(undefined),
    recordTypeDelete: jest.fn().mockResolvedValue(undefined),
    recordUserCreate: jest.fn().mockResolvedValue(undefined),
    recordUserUpdate: jest.fn().mockResolvedValue(undefined),
    recordUserDelete: jest.fn().mockResolvedValue(undefined),
  };
}

describe('ConstantService', () => {
  let prisma: PrismaMock;
  let audit: AuditMock;
  let service: ConstantService;

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = makeAuditMock();
    service = new ConstantService(asPrismaService(prisma), audit as unknown as AuditService);
  });

  // ── Type READ ──────────────────────────────────────────────────────────────

  describe('getTypes', () => {
    it('passes codes/categories/supertypeIds filters as {in: ...}', async () => {
      prisma.type.findMany.mockResolvedValue([]);

      await service.getTypes({
        codes: ['A', 'B'],
        categories: [Category.FTS_CENTRALIZATION],
        supertypeIds: [10],
      });

      const args = prisma.type.findMany.mock.calls[0][0];
      expect(args.where).toEqual({
        code: { in: ['A', 'B'] },
        category: { in: [Category.FTS_CENTRALIZATION] },
        supertypeId: { in: [10] },
      });
    });

    it('omits filters when query fields are undefined', async () => {
      prisma.type.findMany.mockResolvedValue([]);
      await service.getTypes({});
      const args = prisma.type.findMany.mock.calls[0][0];
      expect(args.where).toEqual({});
    });
  });

  // ── Type CRUD: createType ──────────────────────────────────────────────────

  describe('createType', () => {
    it('persists the row and writes admin.type_create audit', async () => {
      const created = {
        id: 5,
        code: 'NEW',
        name: 'Новое',
        description: null,
        supertypeId: null,
        category: Category.FTS_CENTRALIZATION,
        color: null,
      };
      prisma.type.create.mockResolvedValue(created);

      const result = await service.createType(
        {
          code: 'NEW',
          name: 'Новое',
          category: Category.FTS_CENTRALIZATION,
        },
        42,
      );

      expect(prisma.type.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'NEW',
            name: 'Новое',
            category: Category.FTS_CENTRALIZATION,
            description: null,
            supertypeId: null,
            color: null,
          }),
        }),
      );
      expect(audit.recordTypeCreate).toHaveBeenCalledWith({
        actorUserId: 42,
        entityId: 5,
        changes: { after: created },
      });
      expect(result).toBe(created);
    });

    it('forwards optional fields when provided', async () => {
      prisma.type.create.mockResolvedValue({ id: 6 });
      await service.createType(
        {
          code: 'X',
          name: 'X',
          category: Category.FTS_DTI,
          description: 'D',
          supertypeId: 1,
          color: '#ff00aa',
        },
        null,
      );
      expect(prisma.type.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'D',
            supertypeId: 1,
            color: '#ff00aa',
          }),
        }),
      );
    });

    it('propagates Prisma P2002 — global filter maps to UNIQUE_CONSTRAINT', async () => {
      const err = new Error('Unique constraint failed');
      (err as unknown as { code: string }).code = 'P2002';
      prisma.type.create.mockRejectedValue(err);
      await expect(
        service.createType({ code: 'DUP', name: 'X', category: Category.FTS_CENTRALIZATION }, null),
      ).rejects.toBe(err);
    });
  });

  // ── Type CRUD: updateType ──────────────────────────────────────────────────

  describe('updateType', () => {
    it('updates only provided fields (stripUndefined) and writes audit with before/after', async () => {
      const before = {
        id: 1,
        code: 'A',
        name: 'A',
        description: null,
        supertypeId: null,
        category: Category.FTS_CENTRALIZATION,
        color: null,
      };
      const after = { ...before, name: 'Renamed' };
      prisma.type.findUnique.mockResolvedValue(before);
      prisma.type.update.mockResolvedValue(after);

      const result = await service.updateType(1, { name: 'Renamed' }, 42);

      expect(prisma.type.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { name: 'Renamed' } }),
      );
      expect(audit.recordTypeUpdate).toHaveBeenCalledWith({
        actorUserId: 42,
        entityId: 1,
        changes: { before, after },
      });
      expect(result).toBe(after);
    });

    it('throws TypeNotFoundException when row missing', async () => {
      prisma.type.findUnique.mockResolvedValue(null);
      await expect(service.updateType(999, { name: 'X' }, null)).rejects.toBeInstanceOf(
        TypeNotFoundException,
      );
      expect(prisma.type.update).not.toHaveBeenCalled();
      expect(audit.recordTypeUpdate).not.toHaveBeenCalled();
    });
  });

  // ── Type CRUD: deleteType ──────────────────────────────────────────────────

  describe('deleteType', () => {
    it('hard-deletes the row and writes admin.type_delete audit', async () => {
      const before = { id: 3, code: 'A' };
      prisma.type.findUnique.mockResolvedValue(before);
      prisma.type.delete.mockResolvedValue({});
      await service.deleteType(3, 42);
      expect(prisma.type.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(audit.recordTypeDelete).toHaveBeenCalledWith({
        actorUserId: 42,
        entityId: 3,
        changes: { before },
      });
    });

    it('throws TypeNotFoundException when row missing', async () => {
      prisma.type.findUnique.mockResolvedValue(null);
      await expect(service.deleteType(999, null)).rejects.toBeInstanceOf(TypeNotFoundException);
      expect(prisma.type.delete).not.toHaveBeenCalled();
    });

    it('propagates Prisma P2003 — global filter maps to FOREIGN_KEY_CONSTRAINT', async () => {
      prisma.type.findUnique.mockResolvedValue({ id: 3 });
      const err = new Error('FK constraint');
      (err as unknown as { code: string }).code = 'P2003';
      prisma.type.delete.mockRejectedValue(err);
      await expect(service.deleteType(3, null)).rejects.toBe(err);
    });
  });

  // ── User READ ──────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('applies isDeleted:false by default', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.getUsers({});
      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ isDeleted: false });
    });

    it('layers all role filters as {in: ...}', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await service.getUsers({
        roles: [UserRole.ADMIN],
        ftsPositionRoles: [FtsPositionRole.CHIEF],
        ftsFunctionRoles: [FtsFunctionRole.CURATOR],
        ftsBranchTypes: [FtsBranchType.CENTRAL_OFFICE],
      });

      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.where).toEqual({
        isDeleted: false,
        role: { in: [UserRole.ADMIN] },
        ftsPositionRole: { in: [FtsPositionRole.CHIEF] },
        ftsFunctionRole: { in: [FtsFunctionRole.CURATOR] },
        ftsBranchType: { in: [FtsBranchType.CENTRAL_OFFICE] },
      });
    });
  });

  // ── User CRUD: createUser ──────────────────────────────────────────────────

  describe('createUser', () => {
    it('creates user without password — passwordHash stays null', async () => {
      const created = {
        id: 1,
        firstName: 'Иван',
        lastName: 'Иванов',
        patronymic: null,
        fullName: 'Иванов Иван',
        shortName: null,
        description: null,
        role: UserRole.USER,
        ftsPositionRole: null,
        ftsFunctionRole: null,
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
      };
      prisma.user.create.mockResolvedValue(created);

      await service.createUser(
        {
          firstName: 'Иван',
          lastName: 'Иванов',
          role: UserRole.USER,
          ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        },
        42,
      );

      const data = prisma.user.create.mock.calls[0][0].data as {
        passwordHash: string | null;
        emailVerified: boolean;
        fullName: string | null;
      };
      expect(data.passwordHash).toBeNull();
      expect(data.emailVerified).toBe(false);
      // buildFullName auto-derives "Иванов Иван" when fullName not provided.
      expect(data.fullName).toBe('Иванов Иван');
      expect(audit.recordUserCreate).toHaveBeenCalledWith({
        actorUserId: 42,
        entityId: 1,
        changes: { after: created },
      });
    });

    it('hashes password via bcrypt when provided', async () => {
      prisma.user.create.mockResolvedValue({ id: 2 });

      await service.createUser(
        {
          firstName: 'A',
          lastName: 'B',
          role: UserRole.USER,
          ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
          password: 'Password1!',
        },
        null,
      );

      const data = prisma.user.create.mock.calls[0][0].data as { passwordHash: string };
      expect(typeof data.passwordHash).toBe('string');
      expect(data.passwordHash).not.toBe('Password1!');
      expect(await bcrypt.compare('Password1!', data.passwordHash)).toBe(true);
    });

    it('does not include "password" plain-text key in Prisma data', async () => {
      prisma.user.create.mockResolvedValue({ id: 3 });
      await service.createUser(
        {
          firstName: 'A',
          lastName: 'B',
          role: UserRole.USER,
          ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
          password: 'Password1!',
        },
        null,
      );
      const data = prisma.user.create.mock.calls[0][0].data as Record<string, unknown>;
      expect(data).not.toHaveProperty('password');
    });

    it('uses caller-supplied fullName verbatim when provided', async () => {
      prisma.user.create.mockResolvedValue({ id: 4 });
      await service.createUser(
        {
          firstName: 'A',
          lastName: 'B',
          fullName: 'Custom Name',
          role: UserRole.USER,
          ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        },
        null,
      );
      const data = prisma.user.create.mock.calls[0][0].data as { fullName: string };
      expect(data.fullName).toBe('Custom Name');
    });
  });

  // ── User CRUD: updateUser ──────────────────────────────────────────────────

  describe('updateUser', () => {
    const baseUser = {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      patronymic: null,
      fullName: null,
      shortName: null,
      description: null,
      role: UserRole.USER,
      ftsPositionRole: null,
      ftsFunctionRole: null,
      ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
    };

    it('strips undefined keys and writes audit with before/after', async () => {
      prisma.user.findUnique
        // first call: full row
        .mockResolvedValueOnce(baseUser)
        // second call: isSoftDeleted check
        .mockResolvedValueOnce({ isDeleted: false });
      prisma.user.update.mockResolvedValue({ ...baseUser, firstName: 'Z' });

      await service.updateUser(1, { firstName: 'Z' }, 42);

      const updateArgs = prisma.user.update.mock.calls[0][0];
      expect(updateArgs.data).toEqual({ firstName: 'Z' });
      expect(audit.recordUserUpdate).toHaveBeenCalled();
    });

    it('hashes password key into passwordHash on update', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce({ isDeleted: false });
      prisma.user.update.mockResolvedValue(baseUser);

      await service.updateUser(1, { password: 'NewPass1!' }, null);

      const data = prisma.user.update.mock.calls[0][0].data as Record<string, unknown>;
      expect(data).not.toHaveProperty('password');
      expect(data['passwordHash']).toBeDefined();
      expect(await bcrypt.compare('NewPass1!', String(data['passwordHash']))).toBe(true);
    });

    it('throws UserNotFoundException when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.updateUser(999, { firstName: 'X' }, null)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });

    it('throws UserNotFoundException when user is soft-deleted', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce({ isDeleted: true });
      await expect(service.updateUser(1, { firstName: 'X' }, null)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── User CRUD: deleteUser (soft) ───────────────────────────────────────────

  describe('deleteUser', () => {
    it('flips isDeleted=true / deletedAt=now and writes admin.user_delete audit', async () => {
      const before = { id: 7, firstName: 'X', lastName: 'Y' };
      prisma.user.findUnique
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce({ isDeleted: false });
      prisma.user.update.mockResolvedValue({});

      await service.deleteUser(7, 42);

      const args = prisma.user.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 7 });
      expect(args.data.isDeleted).toBe(true);
      expect(args.data.deletedAt).toBeInstanceOf(Date);
      expect(audit.recordUserDelete).toHaveBeenCalledWith({
        actorUserId: 42,
        entityId: 7,
        changes: { before },
      });
    });

    it('does NOT hard-delete (prisma.user.delete is never called)', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 7 })
        .mockResolvedValueOnce({ isDeleted: false });
      prisma.user.update.mockResolvedValue({});
      await service.deleteUser(7, null);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('throws UserNotFoundException when user is missing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteUser(999, null)).rejects.toBeInstanceOf(UserNotFoundException);
    });

    it('throws UserNotFoundException when user is already soft-deleted', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 7 })
        .mockResolvedValueOnce({ isDeleted: true });
      await expect(service.deleteUser(7, null)).rejects.toBeInstanceOf(UserNotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
