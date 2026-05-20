/**
 * Profile e2e — exercises /v1/profile (GET / PATCH / email / password /
 * avatar). MinioService is stubbed to a recorder, IEmailService is stubbed
 * so we can assert email-change re-verification triggers a send.
 */
import {
  type AuthTestAppContext,
  cleanupAuthUsers,
  closeAuthTestApp,
  createAuthTestApp,
} from './helpers/auth-app';

const EMAIL_PREFIX = 'profile-e2e-';
const USER_EMAIL = `${EMAIL_PREFIX}me@x.test`;
const USER_PASSWORD = 'Password1!';
const NEW_EMAIL = `${EMAIL_PREFIX}renamed@x.test`;

async function registerAndVerify(ctx: AuthTestAppContext): Promise<void> {
  await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/auth/register',
    payload: {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      firstName: 'Иван',
      lastName: 'Иванов',
    },
  });
  const user = await ctx.prisma.user.findUnique({ where: { email: USER_EMAIL } });
  await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/auth/verify-email',
    payload: { token: user!.emailVerificationToken! },
  });
}

async function login(
  ctx: AuthTestAppContext,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { identifier: email, password },
  });
  return res.json();
}

describe('Profile (e2e)', () => {
  let ctx: AuthTestAppContext;
  let access: string;
  let userId: number;

  beforeAll(async () => {
    ctx = await createAuthTestApp();
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
    await registerAndVerify(ctx);
    const tokens = await login(ctx, USER_EMAIL, USER_PASSWORD);
    access = tokens.accessToken;
    const user = await ctx.prisma.user.findUnique({ where: { email: USER_EMAIL } });
    userId = user!.id;
  });

  afterAll(async () => {
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
    await closeAuthTestApp(ctx);
  });

  beforeEach(() => {
    ctx.email.sentEmails.length = 0;
    ctx.email.sendVerificationEmail.mockClear();
    ctx.minio.uploads.length = 0;
    ctx.minio.putObjects.length = 0;
    ctx.minio.deletes.length = 0;
    ctx.minio.deleteObject.mockClear();
    ctx.minio.putObject.mockClear();
  });

  it('1. GET /v1/profile without auth → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/profile',
    });
    expect(res.statusCode).toBe(401);
  });

  it('2. GET /v1/profile authenticated → 200 with user', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/profile',
      headers: { authorization: `Bearer ${access}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: number; email: string; emailVerified: boolean }>();
    expect(body.id).toBe(userId);
    expect(body.email).toBe(USER_EMAIL);
    expect(body.emailVerified).toBe(true);
  });

  it('3. PATCH /v1/profile with fullName → 200, updated', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile',
      headers: { authorization: `Bearer ${access}` },
      payload: { fullName: 'Иван Иванович Иванов' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ fullName: string }>();
    expect(body.fullName).toBe('Иван Иванович Иванов');
  });

  it('3a. GET /v1/profile carries firstName/lastName/patronymic + avatarKey', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/profile',
      headers: { authorization: `Bearer ${access}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      firstName: string;
      lastName: string;
      patronymic: string | null;
      avatarKey: string | null;
      avatarUrl: string | null;
    }>();
    expect(body.firstName).toBe('Иван');
    expect(body.lastName).toBe('Иванов');
    expect(body.patronymic).toBeNull();
    // Avatar may be set or not depending on suite ordering — both fields
    // must at least be present (never undefined).
    expect(body.avatarKey === null || typeof body.avatarKey === 'string').toBe(true);
    expect(body.avatarUrl === null || typeof body.avatarUrl === 'string').toBe(true);
  });

  it('3b. PATCH /v1/profile with name parts → fullName auto-derived, "" patronymic → null', async () => {
    // firstName + lastName change: backend recomputes fullName as
    // `<lastName> <firstName>`.
    const res1 = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile',
      headers: { authorization: `Bearer ${access}` },
      payload: { firstName: 'Пётр', lastName: 'Петров', patronymic: 'Сергеевич' },
    });
    expect(res1.statusCode).toBe(200);
    const body1 = res1.json<{
      firstName: string;
      lastName: string;
      patronymic: string | null;
      fullName: string;
    }>();
    expect(body1.firstName).toBe('Пётр');
    expect(body1.lastName).toBe('Петров');
    expect(body1.patronymic).toBe('Сергеевич');
    expect(body1.fullName).toBe('Петров Пётр Сергеевич');

    // Empty patronymic ("") → stored as null and dropped from derived fullName.
    const res2 = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile',
      headers: { authorization: `Bearer ${access}` },
      payload: { patronymic: '' },
    });
    expect(res2.statusCode).toBe(200);
    const body2 = res2.json<{ patronymic: string | null; fullName: string }>();
    expect(body2.patronymic).toBeNull();
    expect(body2.fullName).toBe('Петров Пётр');
  });

  it('5. PATCH /v1/profile/password with wrong current → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile/password',
      headers: { authorization: `Bearer ${access}` },
      payload: { currentPassword: 'WrongPwd!!', newPassword: 'NewSecret11' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('6. PATCH /v1/profile/password with right current → 200, returns new tokens', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile/password',
      headers: { authorization: `Bearer ${access}` },
      payload: { currentPassword: USER_PASSWORD, newPassword: 'NewSecret11' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; refreshToken: string }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    // Switch to new password for the rest of the suite.
    const t = await login(ctx, USER_EMAIL, 'NewSecret11');
    access = t.accessToken;
  });

  it('7. POST /v1/profile/avatar/presigned-url → 200 with uploadUrl + key', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/presigned-url',
      headers: { authorization: `Bearer ${access}` },
      payload: { contentType: 'image/png' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ uploadUrl: string; key: string; getUrl: string }>();
    expect(body.uploadUrl).toContain('https://minio.test/upload/');
    expect(body.key).toMatch(new RegExp(`^avatars/${userId}/[0-9a-f-]+\\.png$`));
    expect(ctx.minio.uploads).toHaveLength(1);
  });

  it('8. POST /v1/profile/avatar/confirm → 200, profile reflects new avatar', async () => {
    const presign = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/presigned-url',
      headers: { authorization: `Bearer ${access}` },
      payload: { contentType: 'image/jpeg' },
    });
    const { key } = presign.json<{ key: string }>();

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/confirm',
      headers: { authorization: `Bearer ${access}` },
      payload: { key },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ avatarUrl: string | null }>();
    expect(body.avatarUrl).toContain('https://minio.test/download/');

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
    expect(user!.avatarKey).toBe(key);
  });

  it('10. POST /v1/profile/avatar (multipart) → 200, profile reflects new avatar key', async () => {
    // Tiny synthetic PNG: 1x1 pixel, 67 bytes. Doesn't need to be a real
    // image — service trusts the declared MIME on the multipart part.
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4' +
        '8900000000017352474200aece1ce90000000d49444154789c63600100000005' +
        '0001a5f645400000000049454e44ae426082',
      'hex',
    );
    const boundary = '----E2EBoundary' + Math.random().toString(16).slice(2);
    const head =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="me.png"\r\n` +
      `Content-Type: image/png\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(head, 'utf8'), png, Buffer.from(tail, 'utf8')]);

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar',
      headers: {
        authorization: `Bearer ${access}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'content-length': String(body.length),
      },
      payload: body,
    });
    expect(res.statusCode).toBe(200);
    const profile = res.json<{ avatarKey: string | null; avatarUrl: string | null }>();
    expect(profile.avatarKey).toMatch(new RegExp(`^avatars/${userId}/[0-9a-f-]+\\.png$`));
    expect(profile.avatarUrl).toContain('https://minio.test/download/');
    expect(ctx.minio.putObject).toHaveBeenCalledTimes(1);
    expect(ctx.minio.putObjects[0]?.contentType).toBe('image/png');
    expect(ctx.minio.putObjects[0]?.size).toBe(png.length);

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
    expect(user!.avatarKey).toBe(profile.avatarKey);
  });

  it('9. POST /v1/profile/avatar/confirm second time (overwrite) → 200, old key deleted', async () => {
    // First confirm
    const presign1 = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/presigned-url',
      headers: { authorization: `Bearer ${access}` },
      payload: { contentType: 'image/png' },
    });
    const { key: firstKey } = presign1.json<{ key: string }>();
    await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/confirm',
      headers: { authorization: `Bearer ${access}` },
      payload: { key: firstKey },
    });

    ctx.minio.deletes.length = 0;
    ctx.minio.deleteObject.mockClear();

    // Second confirm (overwrite)
    const presign2 = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/presigned-url',
      headers: { authorization: `Bearer ${access}` },
      payload: { contentType: 'image/png' },
    });
    const { key: secondKey } = presign2.json<{ key: string }>();
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/profile/avatar/confirm',
      headers: { authorization: `Bearer ${access}` },
      payload: { key: secondKey },
    });
    expect(res.statusCode).toBe(200);

    // Give the fire-and-forget delete a tick to fire.
    await new Promise((r) => setTimeout(r, 50));
    expect(ctx.minio.deleteObject).toHaveBeenCalledWith(firstKey);
  });

  it('4. PATCH /v1/profile/email → 202, emailVerified=false, verify email sent', async () => {
    const res = await ctx.httpServer.inject({
      method: 'PATCH',
      url: '/v1/profile/email',
      headers: { authorization: `Bearer ${access}` },
      payload: { newEmail: NEW_EMAIL },
    });
    expect(res.statusCode).toBe(202);
    expect(ctx.email.sendVerificationEmail).toHaveBeenCalledTimes(1);

    const user = await ctx.prisma.user.findUnique({ where: { id: userId } });
    expect(user!.email).toBe(NEW_EMAIL);
    expect(user!.emailVerified).toBe(false);
    expect(user!.emailVerificationToken).toBeTruthy();
  });
});
