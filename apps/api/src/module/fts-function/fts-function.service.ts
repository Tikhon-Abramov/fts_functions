/**
 * FtsFunctionService — service layer for FtsFunction + FtsFunctionDetail +
 * tree edges + DTI links.
 *
 * The soft-delete filter, counter fan-out, and audit-log writes are
 * applied by hand inside each method; the planned `prisma.$extends`
 * refactor that would centralise them is documented in
 * `docs/known-limitations.md` (Backend gaps).
 */
import type {
  FtsFunctionBaseEntity,
  FtsFunctionDetailDetailedEntity,
  FtsFunctionDetailedEntity,
  FtsFunctionListEntity,
  FtsFunctionToDtiEntity,
  FtsFunctionTreeEntity,
} from './internal/fts-function.entity';

import { Injectable } from '@nestjs/common';

import {
  DuplicateTreeEdgeException,
  FtsFunctionDetailNotFoundException,
  FtsFunctionDtiLinkNotFoundException,
  FtsFunctionNotFoundException,
  FtsFunctionTreeEdgeNotFoundException,
  FunctionNameDuplicateException,
  TreeSelfLoopException,
} from '@common/errors/exceptions';
import { isPrismaUniqueError, stripUndefined } from '@common/prisma';
import { Category, Prisma } from '@prisma-client';

import { PrismaService } from '../prisma/prisma.service';

import { assertTypeCategory } from './internal/assert-type-category';
import { assertTypesCategories } from './internal/assert-types-categories';
import { assertUserRole, UserRoleSlot } from './internal/assert-user-role';
import {
  ftsFunctionBaseSelect,
  ftsFunctionDetailDetailedSelect,
  ftsFunctionDetailedSelect,
  ftsFunctionListSelect,
  ftsFunctionToDtiSelect,
  ftsFunctionTreeSelect,
} from './internal/fts-function.selects';
import {
  CreateFtsFunctionDetailDto,
  CreateFtsFunctionDto,
  CreateFtsFunctionTreeDto,
  FtsFunctionListQueryDto,
  UpdateFtsFunctionDetailDto,
  UpdateFtsFunctionDto,
} from './fts-function.schema';
import { FtsFunctionCounterService } from './fts-function-counter.service';

type FtsFunctionListResult = {
  items: FtsFunctionListEntity[];
  filteredTotal: number;
  overallTotal: number;
};

type SortBy = NonNullable<FtsFunctionListQueryDto['sortBy']>;
type SortDir = NonNullable<FtsFunctionListQueryDto['sortDir']>;

const ALIVE_SELECT = { id: true, isDeleted: true } as const;

@Injectable()
export class FtsFunctionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly counter: FtsFunctionCounterService,
  ) {}

  // ── LIST / DETAIL ──────────────────────────────────────────────────────────

  async list(query: FtsFunctionListQueryDto): Promise<FtsFunctionListResult> {
    const where = await this.buildListWhereClause(query);

    if (where === null) {
      return { items: [], filteredTotal: 0, overallTotal: this.counter.overallTotal };
    }

    const sortBy: SortBy = query.sortBy ?? 'createdAt';
    const sortDir: SortDir = query.sortDir ?? 'desc';
    const orderBy: Prisma.FtsFunctionOrderByWithRelationInput[] =
      sortBy === 'id' ? [{ id: sortDir }] : [{ [sortBy]: sortDir }, { id: sortDir }];

    const [items, filteredTotal] = await this.prisma.$transaction([
      this.prisma.ftsFunction.findMany({ where, select: ftsFunctionListSelect, orderBy }),
      this.prisma.ftsFunction.count({ where }),
    ]);

    return { items, filteredTotal, overallTotal: this.counter.overallTotal };
  }

  async getById(id: number): Promise<FtsFunctionDetailedEntity> {
    const entity = await this.prisma.ftsFunction.findUnique({
      where: { id },
      select: ftsFunctionDetailedSelect,
    });
    if (!entity) throw new FtsFunctionNotFoundException(id);
    return entity;
  }

  // ── FtsFunction CRUD ───────────────────────────────────────────────────────

  async create(dto: CreateFtsFunctionDto): Promise<FtsFunctionBaseEntity> {
    await this.validateFtsFunctionWrite(dto as unknown as Record<string, number | undefined>);
    await this.ensureFtsFunctionNameAvailable(dto.ftsFunctionNameId);

    let entity: FtsFunctionBaseEntity;
    try {
      entity = await this.prisma.ftsFunction.create({
        data: {
          ftsCentralizationId: dto.ftsCentralizationId,
          ftsFunctionNameId: dto.ftsFunctionNameId,
          competencyCenterId: dto.competencyCenterId,
          ftsFunctionMarkerId: dto.ftsFunctionMarkerId,
          curatorCentralOfficeId: dto.curatorCentralOfficeId,
          managerInterregionalInspectionId: dto.managerInterregionalInspectionId,
          departmentHeadCentralOfficeId: dto.departmentHeadCentralOfficeId,
          departmentHeadInterregionalInspectionId: dto.departmentHeadInterregionalInspectionId,
        },
        select: ftsFunctionBaseSelect,
      });
    } catch (error) {
      throw mapDuplicateNameOrRethrow(error);
    }

    this.counter.onCreate();
    return entity;
  }

  async update(id: number, dto: UpdateFtsFunctionDto): Promise<FtsFunctionBaseEntity> {
    await this.ensureFtsFunctionAlive(id);
    await this.validateFtsFunctionWrite(dto as unknown as Record<string, number | undefined>);
    if (dto.ftsFunctionNameId !== undefined) {
      await this.ensureFtsFunctionNameAvailable(dto.ftsFunctionNameId, id);
    }

    try {
      return await this.prisma.ftsFunction.update({
        where: { id },
        data: stripUndefined(dto as unknown as Record<string, unknown>),
        select: ftsFunctionBaseSelect,
      });
    } catch (error) {
      throw mapDuplicateNameOrRethrow(error);
    }
  }

  async softDelete(id: number): Promise<FtsFunctionBaseEntity> {
    await this.ensureFtsFunctionAlive(id);

    const entity = await this.prisma.ftsFunction.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
      select: ftsFunctionBaseSelect,
    });
    this.counter.onSoftDelete();
    return entity;
  }

  // ── FtsFunctionDetail CRUD ─────────────────────────────────────────────────

  async createDetail(
    ftsFunctionId: number,
    dto: CreateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureFtsFunctionAlive(ftsFunctionId);
    await this.validateFtsFunctionDetailWrite(dto as unknown as Record<string, number | undefined>);

    return this.prisma.ftsFunctionDetail.create({
      data: {
        ftsFunctionId,
        ftsFunctionStepId: dto.ftsFunctionStepId,
        ftsFunctionCategoryId: dto.ftsFunctionCategoryId ?? null,
        ftsFunctionComplexityId: dto.ftsFunctionComplexityId ?? null,
        ftsFunctionExecutionFrequencyId: dto.ftsFunctionExecutionFrequencyId ?? null,
        whoPerformsActionId: dto.whoPerformsActionId ?? null,
        ftsFunctionActionTypeId: dto.ftsFunctionActionTypeId ?? null,
        ftsFunctionEffectivenessId: dto.ftsFunctionEffectivenessId ?? null,
        ftsFunctionDetails: dto.ftsFunctionDetails ?? null,
        basis: dto.basis ?? null,
        artifact: dto.artifact ?? null,
        artifactUsage: dto.artifactUsage ?? null,
        purpose: dto.purpose ?? null,
      },
      select: ftsFunctionDetailDetailedSelect,
    });
  }

  async updateDetail(
    detailId: number,
    dto: UpdateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureDetailAlive(detailId);
    await this.validateFtsFunctionDetailWrite(dto as unknown as Record<string, number | undefined>);

    return this.prisma.ftsFunctionDetail.update({
      where: { id: detailId },
      data: stripUndefined(dto as unknown as Record<string, unknown>),
      select: ftsFunctionDetailDetailedSelect,
    });
  }

  async softDeleteDetail(detailId: number): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureDetailAlive(detailId);

    return this.prisma.ftsFunctionDetail.update({
      where: { id: detailId },
      data: { isDeleted: true, deletedAt: new Date() },
      select: ftsFunctionDetailDetailedSelect,
    });
  }

  // ── Tree edges ─────────────────────────────────────────────────────────────

  async createTreeEdge(dto: CreateFtsFunctionTreeDto): Promise<FtsFunctionTreeEntity> {
    if (dto.parentFtsFunctionId === dto.childFtsFunctionId) {
      throw new TreeSelfLoopException();
    }

    await assertTypeCategory(this.prisma, dto.relationTypeId, Category.FTS_FUNCTION_RELATION_TYPE);

    const [parent, child] = await Promise.all([
      this.prisma.ftsFunctionDetail.findUnique({
        where: { id: dto.parentFtsFunctionId },
        select: ALIVE_SELECT,
      }),
      this.prisma.ftsFunctionDetail.findUnique({
        where: { id: dto.childFtsFunctionId },
        select: ALIVE_SELECT,
      }),
    ]);
    if (!parent || parent.isDeleted) {
      throw new FtsFunctionDetailNotFoundException(dto.parentFtsFunctionId);
    }
    if (!child || child.isDeleted) {
      throw new FtsFunctionDetailNotFoundException(dto.childFtsFunctionId);
    }

    const existing = await this.prisma.ftsFunctionTree.findUnique({
      where: {
        parentFtsFunctionId_childFtsFunctionId: {
          parentFtsFunctionId: dto.parentFtsFunctionId,
          childFtsFunctionId: dto.childFtsFunctionId,
        },
      },
      select: { parentFtsFunctionId: true },
    });
    if (existing) throw new DuplicateTreeEdgeException();

    return this.prisma.ftsFunctionTree.create({
      data: {
        parentFtsFunctionId: dto.parentFtsFunctionId,
        childFtsFunctionId: dto.childFtsFunctionId,
        relationTypeId: dto.relationTypeId,
      },
      select: ftsFunctionTreeSelect,
    });
  }

  async deleteTreeEdge(parentId: number, childId: number): Promise<FtsFunctionTreeEntity> {
    const existing = await this.prisma.ftsFunctionTree.findUnique({
      where: {
        parentFtsFunctionId_childFtsFunctionId: {
          parentFtsFunctionId: parentId,
          childFtsFunctionId: childId,
        },
      },
      select: ftsFunctionTreeSelect,
    });
    if (!existing) throw new FtsFunctionTreeEdgeNotFoundException(parentId, childId);

    await this.prisma.ftsFunctionTree.delete({
      where: {
        parentFtsFunctionId_childFtsFunctionId: {
          parentFtsFunctionId: parentId,
          childFtsFunctionId: childId,
        },
      },
    });

    return existing;
  }

  // ── DTIs ───────────────────────────────────────────────────────────────────

  async attachDti(ftsFunctionId: number, dtiId: number): Promise<FtsFunctionToDtiEntity> {
    await this.ensureFtsFunctionAlive(ftsFunctionId);
    await assertTypeCategory(this.prisma, dtiId, Category.FTS_DTI);

    return this.prisma.ftsFunctionToDti.upsert({
      where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
      create: { ftsFunctionId, dtiId },
      update: {},
      select: ftsFunctionToDtiSelect,
    });
  }

  async batchAttachDtis(
    ftsFunctionId: number,
    dtiIds: number[],
  ): Promise<FtsFunctionDetailedEntity> {
    await this.ensureFtsFunctionAlive(ftsFunctionId);

    // Validate every dtiId belongs to FTS_DTI in one round-trip (mirrors
    // attachDti's per-id assert).
    await assertTypesCategories(
      this.prisma,
      dtiIds.map((id) => ({ id, expected: Category.FTS_DTI })),
    );

    // Idempotent upserts inside a single transaction. Additive only —
    // existing attachments not present in dtiIds are preserved.
    await this.prisma.$transaction(
      dtiIds.map((dtiId) =>
        this.prisma.ftsFunctionToDti.upsert({
          where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
          create: { ftsFunctionId, dtiId },
          update: {},
          select: ftsFunctionToDtiSelect,
        }),
      ),
    );

    return this.getById(ftsFunctionId);
  }

  async detachDti(ftsFunctionId: number, dtiId: number): Promise<FtsFunctionToDtiEntity> {
    const existing = await this.prisma.ftsFunctionToDti.findUnique({
      where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
      select: ftsFunctionToDtiSelect,
    });
    // Missing join row is a missing LINK, not a missing function — typed
    // exception so the client/i18n layer can disambiguate.
    if (!existing) throw new FtsFunctionDtiLinkNotFoundException(ftsFunctionId, dtiId);

    await this.prisma.ftsFunctionToDti.delete({
      where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
    });

    return existing;
  }

  // ── List internals (private) ───────────────────────────────────────────────

  /**
   * Filter portion of the WHERE clause. Returns `null` when free-text search
   * matched zero rows so the caller can short-circuit with an empty page.
   */
  private async buildListWhereClause(
    query: FtsFunctionListQueryDto,
  ): Promise<Prisma.FtsFunctionWhereInput | null> {
    const where: Prisma.FtsFunctionWhereInput = {};

    if (!query.includeDeleted) where.isDeleted = false;
    if (query.competencyCenterIds) where.competencyCenterId = { in: query.competencyCenterIds };
    if (query.ftsFunctionNameIds) where.ftsFunctionNameId = { in: query.ftsFunctionNameIds };
    if (query.ftsFunctionMarkerIds) where.ftsFunctionMarkerId = { in: query.ftsFunctionMarkerIds };
    if (query.curatorCentralOfficeIds) {
      where.curatorCentralOfficeId = { in: query.curatorCentralOfficeIds };
    }
    if (query.managerInterregionalInspectionIds) {
      where.managerInterregionalInspectionId = {
        in: query.managerInterregionalInspectionIds,
      };
    }

    // Numeric ID filters — the DataGrid "ID" column posts one of these per
    // picked operator (=, !=, >, >=, <, <=, isAnyOf). The search clause below
    // merges into the same `where.id` object if present.
    const idFilter: Record<string, unknown> = {};
    if (query.ids) idFilter['in'] = query.ids;
    if (query.idNot !== undefined) idFilter['not'] = query.idNot;
    if (query.idGt !== undefined) idFilter['gt'] = query.idGt;
    if (query.idGte !== undefined) idFilter['gte'] = query.idGte;
    if (query.idLt !== undefined) idFilter['lt'] = query.idLt;
    if (query.idLte !== undefined) idFilter['lte'] = query.idLte;
    if (Object.keys(idFilter).length > 0) {
      where.id = idFilter;
    }

    if (query.search) {
      const matchedIds = await this.buildSearchFilter(query.search);
      if (matchedIds.length === 0) return null;
      where.id = where.id ? { in: matchedIds, ...(where.id as object) } : { in: matchedIds };
    }

    return where;
  }

  /** FULLTEXT search on `fts_function_details` → owning FtsFunction IDs. */
  private async buildSearchFilter(search: string): Promise<number[]> {
    const matchedIds = await this.prisma.$queryRawUnsafe<Array<{ id: number }>>(
      `SELECT DISTINCT d.fts_function_id AS id
         FROM fts_function_details d
         WHERE d.is_deleted = 0
           AND MATCH (d.fts_function_details, d.basis, d.artifact, d.artifact_usage, d.purpose)
               AGAINST (? IN NATURAL LANGUAGE MODE)`,
      search,
    );
    return matchedIds.map((r) => r.id);
  }

  // ── Helpers (private) ──────────────────────────────────────────────────────

  private async ensureFtsFunctionAlive(id: number): Promise<void> {
    const f = await this.prisma.ftsFunction.findUnique({
      where: { id },
      select: ALIVE_SELECT,
    });
    if (!f || f.isDeleted) throw new FtsFunctionNotFoundException(id);
  }

  // Uniqueness for ALIVE rows only — soft-deleted rows are allowed to retain
  // their `ftsFunctionNameId`, which is what makes "delete + recreate with the
  // same name" work. `excludeId` lets `update()` skip the row being edited.
  private async ensureFtsFunctionNameAvailable(
    ftsFunctionNameId: number,
    excludeId?: number,
  ): Promise<void> {
    const conflict = await this.prisma.ftsFunction.findFirst({
      where: {
        ftsFunctionNameId,
        isDeleted: false,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) throw new FunctionNameDuplicateException();
  }

  private async ensureDetailAlive(id: number): Promise<void> {
    const d = await this.prisma.ftsFunctionDetail.findUnique({
      where: { id },
      select: ALIVE_SELECT,
    });
    if (!d || d.isDeleted) throw new FtsFunctionDetailNotFoundException(id);
  }

  private async validateFtsFunctionWrite(dto: Record<string, number | undefined>): Promise<void> {
    const typeChecks = collectTypeChecks(dto, FTS_FUNCTION_TYPE_FIELDS);

    const userChecks: Array<Promise<void>> = [];
    for (const slot of FTS_FUNCTION_USER_SLOTS) {
      // DTO key convention: <slot>Id (e.g. curatorCentralOffice → curatorCentralOfficeId).
      const id = dto[`${slot}Id`];
      if (id != null) userChecks.push(assertUserRole(this.prisma, id, slot));
    }

    // Type checks: single findMany round-trip (was up to 4 parallel findUniqueOrThrow).
    await Promise.all([assertTypesCategories(this.prisma, typeChecks), ...userChecks]);
  }

  private async validateFtsFunctionDetailWrite(
    dto: Record<string, number | undefined>,
  ): Promise<void> {
    await assertTypesCategories(
      this.prisma,
      collectTypeChecks(dto, FTS_FUNCTION_DETAIL_TYPE_FIELDS),
    );
  }
}

// ── Validation tables (module-private) ────────────────────────────────────────

/** Maps a DTO field name → expected Category for FtsFunction type FKs. */
const FTS_FUNCTION_TYPE_FIELDS = {
  ftsCentralizationId: Category.FTS_CENTRALIZATION,
  ftsFunctionNameId: Category.FTS_FUNCTION_NAME,
  competencyCenterId: Category.FTS_COMPETENCY_CENTER,
  ftsFunctionMarkerId: Category.FTS_FUNCTION_MARKER,
} satisfies Record<string, Category>;

/** Maps a DTO field name → expected Category for FtsFunctionDetail type FKs. */
const FTS_FUNCTION_DETAIL_TYPE_FIELDS = {
  ftsFunctionStepId: Category.FTS_FUNCTION_STEP,
  ftsFunctionCategoryId: Category.FTS_FUNCTION_CATEGORY,
  ftsFunctionComplexityId: Category.FTS_FUNCTION_COMPLEXITY,
  ftsFunctionExecutionFrequencyId: Category.FTS_FUNCTION_EXECUTION_FREQUENCY,
  whoPerformsActionId: Category.WHO_PERFORMS_ACTION,
  ftsFunctionActionTypeId: Category.FTS_FUNCTION_ACTION_TYPE,
  ftsFunctionEffectivenessId: Category.FTS_FUNCTION_EFFECTIVENESS,
} satisfies Record<string, Category>;

/** DTO field name === UserRoleSlot for the four user FKs. */
const FTS_FUNCTION_USER_SLOTS: readonly UserRoleSlot[] = Object.values(UserRoleSlot);

function collectTypeChecks(
  dto: Record<string, number | null | undefined>,
  fields: Record<string, Category>,
): Array<{ id: number; expected: Category }> {
  const out: Array<{ id: number; expected: Category }> = [];
  for (const [key, expected] of Object.entries(fields)) {
    const id = dto[key];
    // Optional FK fields can arrive as null (user cleared) or undefined (not in
    // partial update). Both mean "no type to validate" — skip. The previous
    // `!== undefined` check let `null` through, which Prisma then rejected
    // with "Argument `in` is missing" → masked save failures as 500s.
    if (id != null) out.push({ id, expected });
  }
  return out;
}

/**
 * If the Prisma error is a P2002 on the `ftsFunctionNameId` unique
 * constraint, surface it as the dedicated 409 — the frontend keys off
 * `FUNCTION_NAME_DUPLICATE` to render an inline "уже существует" message.
 *
 * Other unique-constraint hits (or any other error) bubble up untouched so
 * the global filter can map them generically.
 */
const DuplicateNameError = FunctionNameDuplicateException;
function mapDuplicateNameOrRethrow(error: unknown): unknown {
  if (!isPrismaUniqueError(error)) return error;
  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target)
    ? target.filter((x): x is string => typeof x === 'string')
    : typeof target === 'string'
      ? [target]
      : [];
  // Prisma reports the constraint name (`fts_functions_fts_function_name_id_key`)
  // for MySQL; some adapters return the column list (`fts_function_name_id`).
  // Match either shape.
  const matchesNameUnique = fields.some(
    (f) => f === 'fts_function_name_id' || f.endsWith('fts_function_name_id_key'),
  );
  if (matchesNameUnique) return new DuplicateNameError();
  return error;
}
