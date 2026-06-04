import { closeTestApp, createTestApp, type TestAppContext } from './helpers/app';

describe('Constants (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('GET /v1/constants/type returns all seeded types', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/constants/type',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ id: number; code: string }>>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(100); // seed produces 117
  });

  it('GET /v1/constants/type filters by categories[]=FTS_COMPETENCY_CENTER', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/constants/type?categories[]=FTS_COMPETENCY_CENTER',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ id: number }>>();
    // Seed has 12 competency-center rows.
    expect(body.length).toBe(12);
  });

  it('GET /v1/constants/user returns non-deleted users', async () => {
    const res = await ctx.httpServer.inject({
      method: 'GET',
      url: '/v1/constants/user',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ id: number }>>();
    expect(body.length).toBeGreaterThanOrEqual(40);
  });
});
