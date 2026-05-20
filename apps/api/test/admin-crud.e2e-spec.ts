/**
 * Admin CRUD on /v1/constants/{type,user} — RolesGuard + audit log + Prisma
 * mappers. Bootstraps via createAuthTestApp so we can promote a registered
 * user to ADMIN against the live e2e DB (the regular auth flow only ever
 * mints USER-role accounts).
 */
import { Category, FtsBranchType, UserRole } from '@prisma-client';

import {
  type AuthTestAppContext,
  cleanupAuthUsers,
  closeAuthTestApp,
  createAuthTestApp,
} from './helpers/auth-app';

const EMAIL_PREFIX = 'admin-e2e-';
const ADMIN_EMAIL = `${EMAIL_PREFIX}admin@x.test`;
const NORMAL_EMAIL = `${EMAIL_PREFIX}user@x.test`;
const PASSWORD = 'Password1!';

async function registerVerifyLogin(
  ctx: AuthTestAppContext,
  email: string,
  role: 'ADMIN' | 'USER',
): Promise<string> {
  await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/auth/register',
    payload: { email, password: PASSWORD, firstName: 'A', lastName: 'B' },
  });
  // Force-verify email and (for admins) flip role — tests can't go through
  // the seed pipeline mid-flight.
  await ctx.prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationSentAt: null,
      role,
    },
  });
  const login = await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { identifier: email, password: PASSWORD },
  });
  return login.json<{ accessToken: string }>().accessToken;
}

describe('Admin CRUD (e2e)', () => {
  let ctx: AuthTestAppContext;
  let adminToken: string;
  let userToken: string;
  let createdTypeId: number;
  let createdUserId: number;

  beforeAll(async () => {
    ctx = await createAuthTestApp();
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
    adminToken = await registerVerifyLogin(ctx, ADMIN_EMAIL, 'ADMIN');
    userToken = await registerVerifyLogin(ctx, NORMAL_EMAIL, 'USER');
  });

  afterAll(async () => {
    // Clean up Type rows we created — by code prefix, leaves seeds intact.
    await ctx.prisma.type.deleteMany({ where: { code: { startsWith: 'ADM_E2E_' } } });
    // Clean up the admin-created user (admin-e2e flow created an extra one).
    if (createdUserId) {
      await ctx.prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
    await closeAuthTestApp(ctx);
  });

  // ── Type CRUD ──────────────────────────────────────────────────────────────

  it('POST /v1/constants/type without auth → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/constants/type',
      payload: { code: 'ADM_E2E_X', name: 'X', category: Category.FTS_CENTRALIZATION },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /v1/constants/type as USER → 403', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/constants/type',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { code: 'ADM_E2E_Y', name: 'Y', category: Category.FTS_CENTRALIZATION },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /v1/constants/type as ADMIN → 201, row persisted, audit row written', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/constants/type',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        code: 'ADM_E2E_NEW',
        name: 'Новое значение',
        category: Category.FTS_CENTRALIZATION,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: number; code: string }>();
    expect(body.code).toBe('ADM_E2E_NEW');
    createdTypeId = body.id;

    const audit = await ctx.prisma.auditLog.findFirst({
      where: { event: 'admin.type_create' },
      orderBy: { id: 'desc' },
    });
    expect(audit).toBeTruthy();
  });

  it('POST /v1/constants/type with duplicate code → 409 UNIQUE_CONSTRAINT', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/constants/type',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        code: 'ADM_E2E_NEW',
        name: 'X',
        category: Category.FTS_CENTRALIZATION,
      },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json<{ code: string }>().code).toBe('UNIQUE_CONSTRAINT');
  });

  it('PATCH /v1/constants/type/:id as ADMIN → 200, name updated', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: `/v1/constants/type/${createdTypeId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'Renamed' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ name: string }>().name).toBe('Renamed');
  });

  it('PATCH /v1/constants/type/:id with non-existent id → 404 TYPE_NOT_FOUND', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/constants/type/99999999',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ code: string }>().code).toBe('TYPE_NOT_FOUND');
  });

  it('DELETE /v1/constants/type/:id as ADMIN → 204', async () => {
    const res = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/constants/type/${createdTypeId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(204);
    const stillThere = await ctx.prisma.type.findUnique({ where: { id: createdTypeId } });
    expect(stillThere).toBeNull();
  });

  // ── User CRUD ──────────────────────────────────────────────────────────────

  it('POST /v1/constants/user as ADMIN → 201, response excludes passwordHash', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/constants/user',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        firstName: 'Админ',
        lastName: 'Создал',
        role: UserRole.USER,
        ftsBranchType: FtsBranchType.CENTRAL_OFFICE,
        password: 'TempPass1!',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<Record<string, unknown>>();
    expect(body['firstName']).toBe('Админ');
    expect(body).not.toHaveProperty('passwordHash');
    expect(body).not.toHaveProperty('emailVerificationToken');
    expect(body).not.toHaveProperty('passwordResetToken');
    createdUserId = body['id'] as number;
  });

  it('PATCH /v1/constants/user/:id as ADMIN → 200, firstName changed', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: `/v1/constants/user/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { firstName: 'Renamed' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ firstName: string }>().firstName).toBe('Renamed');
  });

  it('DELETE /v1/constants/user/:id as ADMIN → 204, soft-delete (isDeleted=true)', async () => {
    const res = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/constants/user/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(204);
    const row = await ctx.prisma.user.findUnique({ where: { id: createdUserId } });
    expect(row).toBeTruthy();
    expect(row!.isDeleted).toBe(true);
    expect(row!.deletedAt).toBeInstanceOf(Date);
  });

  it('DELETE /v1/constants/user/:id again → 404 USER_NOT_FOUND (already soft-deleted)', async () => {
    const res = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/constants/user/${createdUserId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json<{ code: string }>().code).toBe('USER_NOT_FOUND');
  });

  // ── Read endpoints stay public ─────────────────────────────────────────────

  it('GET /v1/constants/type without auth → 200 (still @Public())', async () => {
    const res = await ctx.httpServer.inject({ method: 'GET', url: '/v1/constants/type' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /v1/constants/user without auth → 200 (still @Public())', async () => {
    const res = await ctx.httpServer.inject({ method: 'GET', url: '/v1/constants/user' });
    expect(res.statusCode).toBe(200);
  });
});
