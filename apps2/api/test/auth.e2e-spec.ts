/**
 * Full e2e auth flow — exercises register → verify → login → refresh →
 * logout → forgot/reset → /me through HTTP. Email service is stubbed via
 * IEmailService override so we can read tokens straight from the recorded
 * "sent" array.
 */
import {
  type AuthTestAppContext,
  cleanupAuthUsers,
  closeAuthTestApp,
  createAuthTestApp,
} from './helpers/auth-app';

const EMAIL_PREFIX = 'auth-e2e-';
const PRIMARY_EMAIL = `${EMAIL_PREFIX}primary@x.test`;
const SECOND_EMAIL = `${EMAIL_PREFIX}second@x.test`;

describe('Auth (e2e)', () => {
  let ctx: AuthTestAppContext;

  beforeAll(async () => {
    ctx = await createAuthTestApp();
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
  });

  afterAll(async () => {
    await cleanupAuthUsers(ctx.prisma, EMAIL_PREFIX);
    await closeAuthTestApp(ctx);
  });

  beforeEach(() => {
    ctx.email.sentEmails.length = 0;
    ctx.email.sendVerificationEmail.mockClear();
    ctx.email.sendPasswordResetEmail.mockClear();
  });

  it('1. POST /v1/auth/register with valid payload → 201, user emailVerified=false', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        email: PRIMARY_EMAIL,
        password: 'Password1!',
        firstName: 'Иван',
        lastName: 'Иванов',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(ctx.email.sendVerificationEmail).toHaveBeenCalledTimes(1);

    const user = await ctx.prisma.user.findUnique({ where: { email: PRIMARY_EMAIL } });
    expect(user).toBeTruthy();
    expect(user!.emailVerified).toBe(false);
    expect(user!.isActive).toBe(true);
  });

  it('2. POST /v1/auth/register with duplicate email → 409 EMAIL_ALREADY_REGISTERED', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        email: PRIMARY_EMAIL,
        password: 'Password1!',
        firstName: 'A',
        lastName: 'B',
      },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('3. POST /v1/auth/login with unverified email → 403 EMAIL_NOT_VERIFIED', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'Password1!' },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('5. POST /v1/auth/verify-email with invalid token → 401 INVALID_TOKEN', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/verify-email',
      payload: { token: 'a'.repeat(48) },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('INVALID_TOKEN');
  });

  it('4. POST /v1/auth/verify-email with valid token → 200, user.emailVerified=true', async () => {
    const user = await ctx.prisma.user.findUnique({ where: { email: PRIMARY_EMAIL } });
    const token = user!.emailVerificationToken!;
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/verify-email',
      payload: { token },
    });
    expect(res.statusCode).toBe(200);
    const refreshed = await ctx.prisma.user.findUnique({ where: { email: PRIMARY_EMAIL } });
    expect(refreshed!.emailVerified).toBe(true);
    expect(refreshed!.emailVerificationToken).toBeNull();
  });

  it('7. POST /v1/auth/login with wrong password → 401 INVALID_CREDENTIALS', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'WrongPassword' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('INVALID_CREDENTIALS');
  });

  let primaryAccess: string;
  let primaryRefresh: string;

  it('6. POST /v1/auth/login with verified email → 200, returns tokens', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'Password1!' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; refreshToken: string; expiresIn: number }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.expiresIn).toBeGreaterThan(0);
    primaryAccess = body.accessToken;
    primaryRefresh = body.refreshToken;
  });

  it('14. GET /v1/auth/me without token → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('15. GET /v1/auth/me with valid token → 200 with user', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { authorization: `Bearer ${primaryAccess}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ email: string; emailVerified: boolean }>();
    expect(body.email).toBe(PRIMARY_EMAIL);
    expect(body.emailVerified).toBe(true);
  });

  it('8. POST /v1/auth/refresh with valid refresh → 200, new tokens', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { authorization: `Bearer ${primaryRefresh}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; refreshToken: string }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it('9. POST /v1/auth/refresh with already-rotated (blacklisted) refresh → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { authorization: `Bearer ${primaryRefresh}` },
    });
    expect(res.statusCode).toBe(401);
  });

  let secondLogin: { accessToken: string; refreshToken: string };

  it('10. POST /v1/auth/logout → 200, refresh token blacklisted', async () => {
    // Fresh login to get a new refresh.
    const login = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'Password1!' },
    });
    secondLogin = login.json();

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      headers: { authorization: `Bearer ${secondLogin.refreshToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('11. POST /v1/auth/refresh after logout → 401', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { authorization: `Bearer ${secondLogin.refreshToken}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('12. POST /v1/auth/forgot-password → 200, reset token in DB', async () => {
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/forgot-password',
      payload: { email: PRIMARY_EMAIL },
    });
    expect(res.statusCode).toBe(200);
    expect(ctx.email.sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const user = await ctx.prisma.user.findUnique({ where: { email: PRIMARY_EMAIL } });
    expect(user!.passwordResetToken).toBeTruthy();
  });

  it('13. POST /v1/auth/reset-password with valid token → 200', async () => {
    const user = await ctx.prisma.user.findUnique({ where: { email: PRIMARY_EMAIL } });
    const token = user!.passwordResetToken!;
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/reset-password',
      payload: { token, password: 'NewPassword2!' },
    });
    expect(res.statusCode).toBe(200);

    // Old password no longer works.
    const oldLogin = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'Password1!' },
    });
    expect(oldLogin.statusCode).toBe(401);

    // New password works.
    const newLogin = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: PRIMARY_EMAIL, password: 'NewPassword2!' },
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it('GET /v1/auth/check-email — throttled to 5/min/IP, 6th hit returns 429', async () => {
    const url = `/v1/auth/check-email?email=${encodeURIComponent(`${EMAIL_PREFIX}throttle@x.test`)}`;
    // First five hits — all 200.
    for (let i = 0; i < 5; i++) {
      const ok = await ctx.httpServer.inject({ method: 'GET', url });
      expect(ok.statusCode).toBe(200);
      expect(ok.json<{ available: boolean }>().available).toBe(true);
    }
    const blocked = await ctx.httpServer.inject({ method: 'GET', url });
    expect(blocked.statusCode).toBe(429);
  });

  it('verification email contains the token that was stored in DB', async () => {
    // Register a fresh user and assert email-stub token == DB token.
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        email: SECOND_EMAIL,
        password: 'Password1!',
        firstName: 'Сидор',
        lastName: 'Сидоров',
      },
    });
    expect(res.statusCode).toBe(201);

    const user = await ctx.prisma.user.findUnique({ where: { email: SECOND_EMAIL } });
    const sent = ctx.email.sentEmails.find((e) => e.to === SECOND_EMAIL);
    expect(sent).toBeDefined();
    expect(sent!.token).toBe(user!.emailVerificationToken);
    expect(sent!.kind).toBe('verification');
  });
});
