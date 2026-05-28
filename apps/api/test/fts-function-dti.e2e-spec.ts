import { closeTestApp, createTestApp, type TestAppContext } from './helpers/app';
import { pickType, pickTypeOfOtherCategory, resolveCreateFtsFunctionIds } from './helpers/fixtures';

describe('FtsFunctionToDti (e2e)', () => {
  let ctx: TestAppContext;
  let ftsFunctionId: number;
  let dtiId: number;

  beforeAll(async () => {
    ctx = await createTestApp();

    const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
    const create = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions',
      payload: ids,
    });
    ftsFunctionId = create.json<{ id: number }>().id;
    dtiId = (await pickType(ctx.prisma, 'FTS_DTI')).id;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('POST attaches a dti and is idempotent', async () => {
    const first = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${dtiId}`,
    });
    expect(first.statusCode).toBe(201);
    const body1 = first.json<{ ftsFunctionId: number; dtiId: number }>();
    expect(body1.ftsFunctionId).toBe(ftsFunctionId);
    expect(body1.dtiId).toBe(dtiId);

    // re-post -> same 201 (upsert) with same body
    const second = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${dtiId}`,
    });
    expect(second.statusCode).toBe(201);
    const body2 = second.json<{ ftsFunctionId: number; dtiId: number }>();
    expect(body2.ftsFunctionId).toBe(ftsFunctionId);
    expect(body2.dtiId).toBe(dtiId);
  });

  it('POST with non-DTI type -> 422 TYPE_CATEGORY_MISMATCH', async () => {
    const wrong = await pickTypeOfOtherCategory(ctx.prisma, 'FTS_DTI');
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${wrong.id}`,
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{ code: string; params?: { category?: string } }>();
    expect(body.code).toBe('TYPE_CATEGORY_MISMATCH');
    expect(body.params?.category).toBe('FTS_DTI');
  });

  it('DELETE detaches; detaching missing returns 404', async () => {
    // Make sure the attachment exists first.
    await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${dtiId}`,
    });

    const del = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${dtiId}`,
    });
    expect(del.statusCode).toBe(200);

    const del2 = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/fts-functions/${ftsFunctionId}/dtis/${dtiId}`,
    });
    expect(del2.statusCode).toBe(404);
  });

  describe('POST :id/dtis/batch', () => {
    let batchFunctionId: number;
    let dtiIds: number[];

    beforeAll(async () => {
      // Use a fresh function so it doesn't share state with the single-attach tests.
      const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
      const create = await ctx.httpServer.inject({
        method: 'POST',
        url: '/v1/fts-functions',
        payload: ids,
      });
      batchFunctionId = create.json<{ id: number }>().id;

      const dtiRows = await ctx.prisma.type.findMany({
        where: { category: 'FTS_DTI' as never },
        select: { id: true },
        take: 5,
      });
      if (dtiRows.length < 5) {
        throw new Error('Need at least 5 FTS_DTI seed rows for batch e2e');
      }
      dtiIds = dtiRows.map((r) => r.id);
    });

    it('happy path: attaches 3 DTIs in a single call', async () => {
      const first3 = dtiIds.slice(0, 3);
      const res = await ctx.httpServer.inject({
        method: 'POST',
        url: `/v1/fts-functions/${batchFunctionId}/dtis/batch`,
        payload: { dtiIds: first3 },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ id: number; dtis: Array<{ dtiId: number }> }>();
      expect(body.id).toBe(batchFunctionId);
      const attached = body.dtis.map((d) => d.dtiId).sort((a, b) => a - b);
      expect(attached).toEqual([...first3].sort((a, b) => a - b));
    });

    it('idempotent re-post: same 3 DTIs — no error, no duplicates', async () => {
      const first3 = dtiIds.slice(0, 3);
      const res = await ctx.httpServer.inject({
        method: 'POST',
        url: `/v1/fts-functions/${batchFunctionId}/dtis/batch`,
        payload: { dtiIds: first3 },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ dtis: Array<{ dtiId: number }> }>();
      const attached = body.dtis.map((d) => d.dtiId).sort((a, b) => a - b);
      expect(attached).toEqual([...first3].sort((a, b) => a - b));
    });

    it('partial overlap: 2 new + 1 existing -> 5 attached after (additive)', async () => {
      // Current state: first3 (0,1,2) attached. Send (2, 3, 4) -> end state = (0..4).
      const overlap = [dtiIds[2], dtiIds[3], dtiIds[4]];
      const res = await ctx.httpServer.inject({
        method: 'POST',
        url: `/v1/fts-functions/${batchFunctionId}/dtis/batch`,
        payload: { dtiIds: overlap },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ dtis: Array<{ dtiId: number }> }>();
      const attached = body.dtis.map((d) => d.dtiId).sort((a, b) => a - b);
      expect(attached).toEqual([...dtiIds].sort((a, b) => a - b));
    });

    it('wrong category -> 422 TYPE_CATEGORY_MISMATCH', async () => {
      const wrong = await pickTypeOfOtherCategory(ctx.prisma, 'FTS_DTI');
      const res = await ctx.httpServer.inject({
        method: 'POST',
        url: `/v1/fts-functions/${batchFunctionId}/dtis/batch`,
        payload: { dtiIds: [dtiIds[0], wrong.id] },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json<{ code: string; params?: { category?: string } }>();
      expect(body.code).toBe('TYPE_CATEGORY_MISMATCH');
      expect(body.params?.category).toBe('FTS_DTI');
    });
  });
});
