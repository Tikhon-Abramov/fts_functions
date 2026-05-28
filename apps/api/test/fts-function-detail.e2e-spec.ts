import { closeTestApp, createTestApp, type TestAppContext } from './helpers/app';
import {
  pickType,
  resolveCreateFtsFunctionDetailIds,
  resolveCreateFtsFunctionIds,
} from './helpers/fixtures';

describe('FtsFunctionDetail (e2e)', () => {
  let ctx: TestAppContext;
  let ftsFunctionId: number;

  beforeAll(async () => {
    ctx = await createTestApp();
    const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
    const create = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions',
      payload: ids,
    });
    ftsFunctionId = create.json<{ id: number }>().id;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('POST /v1/fts-functions/:id/details creates a detail', async () => {
    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: { ...detailIds, purpose: 'e2e-test' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ id: number; ftsFunctionId: number }>();
    expect(typeof body.id).toBe('number');
    expect(body.ftsFunctionId).toBe(ftsFunctionId);
  });

  it('POST /v1/fts-functions/:id/details with wrong category for step -> 422 TYPE_CATEGORY_MISMATCH', async () => {
    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
    // Put a FTS_FUNCTION_CATEGORY id into ftsFunctionStepId slot.
    const wrong = await pickType(ctx.prisma, 'FTS_FUNCTION_CATEGORY');

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: { ...detailIds, ftsFunctionStepId: wrong.id },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{
      code: string;
      params?: { column?: string; category?: string };
    }>();
    expect(body.code).toBe('TYPE_CATEGORY_MISMATCH');
    expect(body.params?.column).toBe('fts_function_step_id');
    expect(body.params?.category).toBe('FTS_FUNCTION_STEP');
  });

  it('PATCH /v1/fts-functions/details/:detailId with partial body', async () => {
    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
    const create = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: detailIds,
    });
    const detailId = create.json<{ id: number }>().id;

    const patch = await ctx.httpServer.inject({
      method: 'PATCH',
      url: `/v1/fts-functions/details/${detailId}`,
      payload: { purpose: 'updated-purpose-e2e' },
    });
    expect(patch.statusCode).toBe(200);
    const body = patch.json<{ id: number; purpose: string }>();
    expect(body.id).toBe(detailId);
    expect(body.purpose).toBe('updated-purpose-e2e');
  });

  it('DELETE /v1/fts-functions/details/:detailId soft-deletes', async () => {
    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
    const create = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: detailIds,
    });
    const detailId = create.json<{ id: number }>().id;

    const del = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/fts-functions/details/${detailId}`,
    });
    expect(del.statusCode).toBe(200);
    const body = del.json<{ id: number; isDeleted: boolean }>();
    expect(body.isDeleted).toBe(true);

    // Second delete should now 404 because ensureDetailAlive rejects deleted.
    const del2 = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/fts-functions/details/${detailId}`,
    });
    expect(del2.statusCode).toBe(404);
  });
});
