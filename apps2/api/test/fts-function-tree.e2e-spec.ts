import { closeTestApp, createTestApp, type TestAppContext } from './helpers/app';
import {
  pickType,
  pickTypeOfOtherCategory,
  resolveCreateFtsFunctionDetailIds,
  resolveCreateFtsFunctionIds,
} from './helpers/fixtures';

async function createDetailPair(ctx: TestAppContext): Promise<{
  parentId: number;
  childId: number;
  ftsFunctionId: number;
}> {
  const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
  const createFn = await ctx.httpServer.inject({
    method: 'POST',
    url: '/v1/fts-functions',
    payload: ids,
  });
  const ftsFunctionId = createFn.json<{ id: number }>().id;

  const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
  const c1 = await ctx.httpServer.inject({
    method: 'POST',
    url: `/v1/fts-functions/${ftsFunctionId}/details`,
    payload: detailIds,
  });
  const c2 = await ctx.httpServer.inject({
    method: 'POST',
    url: `/v1/fts-functions/${ftsFunctionId}/details`,
    payload: detailIds,
  });

  return {
    parentId: c1.json<{ id: number }>().id,
    childId: c2.json<{ id: number }>().id,
    ftsFunctionId,
  };
}

describe('FtsFunctionTree (e2e)', () => {
  let ctx: TestAppContext;
  let relationTypeId: number;

  beforeAll(async () => {
    ctx = await createTestApp();
    relationTypeId = (await pickType(ctx.prisma, 'FTS_FUNCTION_RELATION_TYPE')).id;
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('POST /v1/fts-functions/tree creates an edge', async () => {
    const { parentId, childId } = await createDetailPair(ctx);
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload: {
        parentFtsFunctionId: parentId,
        childFtsFunctionId: childId,
        relationTypeId,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{
      parentFtsFunctionId: number;
      childFtsFunctionId: number;
      relationTypeId: number;
    }>();
    expect(body.parentFtsFunctionId).toBe(parentId);
    expect(body.childFtsFunctionId).toBe(childId);
    expect(body.relationTypeId).toBe(relationTypeId);
  });

  it('Self-loop parent===child -> 400 SELF_LOOP_FORBIDDEN', async () => {
    const { parentId } = await createDetailPair(ctx);
    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload: {
        parentFtsFunctionId: parentId,
        childFtsFunctionId: parentId,
        relationTypeId,
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ code: string }>();
    expect(body.code).toBe('SELF_LOOP_FORBIDDEN');
  });

  it('Duplicate edge -> 400 DUPLICATE_TREE_EDGE on second post', async () => {
    const { parentId, childId } = await createDetailPair(ctx);
    const payload = {
      parentFtsFunctionId: parentId,
      childFtsFunctionId: childId,
      relationTypeId,
    };
    const first = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload,
    });
    expect(second.statusCode).toBe(400);
    const body = second.json<{ code: string }>();
    expect(body.code).toBe('DUPLICATE_TREE_EDGE');
  });

  it('Wrong relation-type category -> 422 TYPE_CATEGORY_MISMATCH', async () => {
    const { parentId, childId } = await createDetailPair(ctx);
    const wrong = await pickTypeOfOtherCategory(ctx.prisma, 'FTS_FUNCTION_RELATION_TYPE');

    const res = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload: {
        parentFtsFunctionId: parentId,
        childFtsFunctionId: childId,
        relationTypeId: wrong.id,
      },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json<{
      code: string;
      params?: { column?: string; category?: string };
    }>();
    expect(body.code).toBe('TYPE_CATEGORY_MISMATCH');
    expect(body.params?.category).toBe('FTS_FUNCTION_RELATION_TYPE');
  });

  it('DELETE /v1/fts-functions/tree/:parentId/:childId removes the edge', async () => {
    const { parentId, childId } = await createDetailPair(ctx);
    await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload: {
        parentFtsFunctionId: parentId,
        childFtsFunctionId: childId,
        relationTypeId,
      },
    });

    const del = await ctx.httpServer.inject({
      method: 'DELETE',
      url: `/v1/fts-functions/tree/${parentId}/${childId}`,
    });
    expect(del.statusCode).toBe(200);

    // Confirm it's gone: posting the same edge again must succeed (201).
    const recreate = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions/tree',
      payload: {
        parentFtsFunctionId: parentId,
        childFtsFunctionId: childId,
        relationTypeId,
      },
    });
    expect(recreate.statusCode).toBe(201);
  });
});
