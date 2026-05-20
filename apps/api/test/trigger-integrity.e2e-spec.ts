/**
 * Defense-in-depth check: the DB triggers installed by
 * `db/sql/mounts/type-category-constraint.mount.ts` must FIRE even when we
 * bypass the Nest service layer and go straight at the table with raw SQL.
 *
 * This proves that even if a future developer adds a code path that forgets
 * to call `assertTypeCategory`, the database itself still refuses the write
 * with SQLSTATE 45000 and the canonical `TYPE_CATEGORY_MISMATCH:` message.
 */
import { closeTestApp, createTestApp, type TestAppContext } from './helpers/app';
import {
  pickType,
  pickTypeOfOtherCategory,
  pickUser,
  resolveCreateFtsFunctionDetailIds,
  resolveCreateFtsFunctionIds,
} from './helpers/fixtures';

describe('Trigger integrity — defense in depth (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('INSERT fts_functions with wrong-category fts_centralization_id throws SQLSTATE 45000 with TYPE_CATEGORY_MISMATCH', async () => {
    const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
    const wrong = await pickType(ctx.prisma, 'FTS_DTI');

    let caught: unknown;
    try {
      await ctx.prisma.$executeRawUnsafe(
        `INSERT INTO fts_functions (
           fts_centralization_id, fts_function_name_id, competency_center_id,
           fts_function_marker_id, curator_central_office_id,
           manager_interregional_inspection_id,
           department_head_central_office_id,
           department_head_interregional_inspection_id,
           created_at, updated_at, is_deleted
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3), 0)`,
        wrong.id, // <-- wrong category in fts_centralization_id slot
        ids.ftsFunctionNameId,
        ids.competencyCenterId,
        ids.ftsFunctionMarkerId,
        ids.curatorCentralOfficeId,
        ids.managerInterregionalInspectionId,
        ids.departmentHeadCentralOfficeId,
        ids.departmentHeadInterregionalInspectionId,
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();

    const msg = (caught as Error).message;

    console.log('[trigger-integrity fts_functions] raw error:\n' + msg);

    expect(msg).toMatch(/TYPE_CATEGORY_MISMATCH/);
    expect(msg).toMatch(/fts_functions\.fts_centralization_id/);
    expect(msg).toMatch(/FTS_CENTRALIZATION/);
  });

  it('INSERT fts_function_details with wrong-category fts_function_step_id throws SQLSTATE 45000', async () => {
    // Need a live parent fts_function row for the FK.
    const parentIds = await resolveCreateFtsFunctionIds(ctx.prisma);
    const parentCreate = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions',
      payload: parentIds,
    });
    const ftsFunctionId = parentCreate.json<{ id: number }>().id;

    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
    const wrong = await pickTypeOfOtherCategory(ctx.prisma, 'FTS_FUNCTION_STEP');

    let caught: unknown;
    try {
      await ctx.prisma.$executeRawUnsafe(
        `INSERT INTO fts_function_details (
           fts_function_id, fts_function_step_id, fts_function_category_id,
           fts_function_complexity_id, fts_function_execution_frequency_id,
           fts_function_action_type_id, created_at, updated_at, is_deleted
         ) VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3), 0)`,
        ftsFunctionId,
        wrong.id, // <-- wrong category for step
        detailIds.ftsFunctionCategoryId,
        detailIds.ftsFunctionComplexityId,
        detailIds.ftsFunctionExecutionFrequencyId,
        detailIds.ftsFunctionActionTypeId,
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();

    const msg = (caught as Error).message;

    console.log('[trigger-integrity fts_function_details] raw error:\n' + msg);

    expect(msg).toMatch(/TYPE_CATEGORY_MISMATCH/);
    expect(msg).toMatch(/fts_function_details\.fts_function_step_id/);
    expect(msg).toMatch(/FTS_FUNCTION_STEP/);
  });

  it('INSERT fts_function_tree with wrong-category relation_type_id throws SQLSTATE 45000', async () => {
    // Prepare two real detail rows so the FKs succeed and only the trigger fires.
    const ids = await resolveCreateFtsFunctionIds(ctx.prisma);
    const createFn = await ctx.httpServer.inject({
      method: 'POST',
      url: '/v1/fts-functions',
      payload: ids,
    });
    const ftsFunctionId = createFn.json<{ id: number }>().id;

    const detailIds = await resolveCreateFtsFunctionDetailIds(ctx.prisma);
    const a = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: detailIds,
    });
    const b = await ctx.httpServer.inject({
      method: 'POST',
      url: `/v1/fts-functions/${ftsFunctionId}/details`,
      payload: detailIds,
    });
    const parentId = a.json<{ id: number }>().id;
    const childId = b.json<{ id: number }>().id;

    const wrong = await pickTypeOfOtherCategory(ctx.prisma, 'FTS_FUNCTION_RELATION_TYPE');

    let caught: unknown;
    try {
      await ctx.prisma.$executeRawUnsafe(
        `INSERT INTO fts_function_tree (
           parent_fts_function_id, child_fts_function_id, relation_type_id, created_at
         ) VALUES (?, ?, ?, NOW(3))`,
        parentId,
        childId,
        wrong.id,
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();

    const msg = (caught as Error).message;

    console.log('[trigger-integrity fts_function_tree] raw error:\n' + msg);

    expect(msg).toMatch(/TYPE_CATEGORY_MISMATCH/);
    expect(msg).toMatch(/fts_function_tree\.relation_type_id/);
    expect(msg).toMatch(/FTS_FUNCTION_RELATION_TYPE/);
  });

  // Keep the pickUser helper imported somewhere so fixture dependency tree is
  // consistent across specs.
  it('pickUser helper sanity', async () => {
    const u = await pickUser(ctx.prisma, {
      ftsBranchType: 'CENTRAL_OFFICE',
      ftsFunctionRole: 'CURATOR',
    });
    expect(typeof u.id).toBe('number');
  });
});
