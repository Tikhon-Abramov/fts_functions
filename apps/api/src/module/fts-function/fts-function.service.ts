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
  FeedbackDetailedEntity,
  DownloadFtsFunctionEntity,
  DownloadFtsFunctionDetailEntity,
  DownloadFeedbackEntity,
  DownloadFFtsFunctionTreeEntity,
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
  feedbackDetailedSelect,
  downloadFtsFunctionSelect,
  downloadFtsFunctionDetailSelect,
  downloadFeedbackSelect,
downloadFtsFunctionTreeSelect,
} from './internal/fts-function.selects';
import {
  CreateFtsFunctionDetailDto,
  CreateFtsFunctionDto,
  CreateFtsFunctionTreeDto,
  FtsFunctionListQueryDto,
  UpdateFtsFunctionDetailDto,
  UpdateFtsFunctionDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  AcceptFeedbackDto,
} from './fts-function.schema';
import { FtsFunctionCounterService } from './fts-function-counter.service';
import { ExcelService } from '../excel/excel.service';
import * as ExcelJS from 'exceljs';


type FtsFunctionListResult = {
  items: FtsFunctionListEntity[];
  filteredTotal: number;
  overallTotal: number;
};

type SortBy = NonNullable<FtsFunctionListQueryDto['sortBy']>;
type SortDir = NonNullable<FtsFunctionListQueryDto['sortDir']>;

const ALIVE_SELECT = { id: true, isDeleted: true } as const;

type FeedbackAgreementStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

type DetailDtoWithFeedbackSourceId = UpdateFtsFunctionDetailDto &
    CreateFtsFunctionDetailDto & {
  feedbackSourceId?: number | null;
  feedbackSourceIds?: number[];
  methodologyPosition?: string | null;
  initiatorAcceptance?: string | null;
};

@Injectable()
export class FtsFunctionService {
  constructor(
      private readonly prisma: PrismaService,
      private readonly counter: FtsFunctionCounterService,
      private readonly excel: ExcelService<never>,
  ) {}

  async list(query: FtsFunctionListQueryDto): Promise<FtsFunctionListResult> {
    const where = await this.buildListWhereClause(query);

    if (where === null) {
      return {
        items: [],
        filteredTotal: 0,
        overallTotal: this.counter.overallTotal,
      };
    }

    const sortBy: SortBy = query.sortBy ?? 'createdAt';
    const sortDir: SortDir = query.sortDir ?? 'desc';

    const orderBy: Prisma.FtsFunctionOrderByWithRelationInput[] =
        sortBy === 'id'
            ? [{ id: sortDir }]
            : [{ [sortBy]: sortDir }, { id: sortDir }];

    const [items, filteredTotal] = await this.prisma.$transaction([
      this.prisma.ftsFunction.findMany({
        where,
        select: ftsFunctionListSelect,
        orderBy,
      }),
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

  async create(dto: CreateFtsFunctionDto): Promise<FtsFunctionBaseEntity> {
    await this.validateFtsFunctionWrite(dto as unknown as Record<string, unknown>);
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
          managerInterregionalInspectionId:
          dto.managerInterregionalInspectionId,
          departmentHeadCentralOfficeId: dto.departmentHeadCentralOfficeId,
          departmentHeadInterregionalInspectionId:
          dto.departmentHeadInterregionalInspectionId,
        },
        select: ftsFunctionBaseSelect,
      });
    } catch (error) {
      throw mapDuplicateNameOrRethrow(error);
    }

    this.counter.onCreate();

    return entity;
  }

  async update(
      id: number,
      dto: UpdateFtsFunctionDto,
  ): Promise<FtsFunctionBaseEntity> {
    await this.ensureFtsFunctionAlive(id);
    await this.validateFtsFunctionWrite(dto as unknown as Record<string, unknown>);

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

  async createDetail(
      ftsFunctionId: number,
      dto: CreateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureFtsFunctionAlive(ftsFunctionId);
    await this.validateFtsFunctionDetailWrite(dto as unknown as Record<string, unknown>);

    const detailDto = dto as DetailDtoWithFeedbackSourceId;

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.ftsFunctionDetail.create({
        data: {
          ftsFunctionId,
          ftsFunctionStepId: dto.ftsFunctionStepId,
          ftsFunctionCategoryId: dto.ftsFunctionCategoryId ?? null,
          ftsFunctionComplexityId: dto.ftsFunctionComplexityId ?? null,
          ftsFunctionExecutionFrequencyId:
              dto.ftsFunctionExecutionFrequencyId ?? null,
          whoPerformsActionId: dto.whoPerformsActionId ?? null,
          ftsFunctionActionTypeId: dto.ftsFunctionActionTypeId ?? null,
          ftsFunctionEffectivenessId: dto.ftsFunctionEffectivenessId ?? null,
          technologicalSolutionId: dto.technologicalSolutionId ?? null,
          responsibleId: dto.responsibleId ?? null,
          ftsFunctionDetails: dto.ftsFunctionDetails ?? null,
          basis: dto.basis ?? null,
          artifact: dto.artifact ?? null,
          artifactUsage: dto.artifactUsage ?? null,
          purpose: dto.purpose ?? null,
          number: dto.number ?? null,
          algorithm: dto.algorithm ?? null,
        },
        select: { id: true },
      });

      const entity = await tx.ftsFunctionDetail.findUnique({
        where: { id: created.id },
        select: ftsFunctionDetailDetailedSelect,
      });

      if (!entity) throw new FtsFunctionDetailNotFoundException(created.id);

      return entity;
    });
  }

  async updateDetail(
      detailId: number,
      dto: UpdateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureDetailAlive(detailId);
    await this.validateFtsFunctionDetailWrite(dto as unknown as Record<string, unknown>);

    const {
      feedbackSourceId: _feedbackSourceId,
      feedbackSourceIds: _feedbackSourceIds,
      ...rawData
    } = dto as DetailDtoWithFeedbackSourceId;

    return this.prisma.$transaction(async (tx) => {
      await tx.ftsFunctionDetail.update({
        where: { id: detailId },
        data: {
          ...stripUndefined(rawData as unknown as Record<string, unknown>),
        },
        select: { id: true },
      });

      const updated = await tx.ftsFunctionDetail.findUnique({
        where: { id: detailId },
        select: ftsFunctionDetailDetailedSelect,
      });

      if (!updated) throw new FtsFunctionDetailNotFoundException(detailId);

      return updated;
    });
  }

  async softDeleteDetail(
      detailId: number,
  ): Promise<FtsFunctionDetailDetailedEntity> {
    await this.ensureDetailAlive(detailId);

    return this.prisma.ftsFunctionDetail.update({
      where: { id: detailId },
      data: { isDeleted: true, deletedAt: new Date() },
      select: ftsFunctionDetailDetailedSelect,
    });
  }



  async createFeedback(
      ftsFunctionDetailId: number,
      dto: CreateFeedbackDto,
  ): Promise<FeedbackDetailedEntity> {
    await this.ensureDetailAlive(ftsFunctionDetailId);

    const sourceIds = resolveFeedbackSourceIds(
        dto as DetailDtoWithFeedbackSourceId,
    );

    return this.prisma.feedback.create({
      data: {
        ftsFunctionDetailId,
        feedbackQualityMetricsId: dto.feedbackQualityMetricsId ?? null,
        ftsMethodologyStatusId: dto.ftsMethodologyStatusId ?? null,
        problemDescription: dto.problemDescription ?? null,
        initiatorRequisites: dto.initiatorRequisites ?? null,
        initiatorAcceptance: dto.initiatorAcceptance ?? null,
        deadline: dto.deadline ?? null,
        isAccepted: null,
        ...(sourceIds.length > 0
            ? {
                feedbackSources: {
                  create: sourceIds.map((feedbackSourceId) => ({
                    feedbackSourceId,
                  })),
                },
              }
            : {}),
      },
      select: feedbackDetailedSelect,
      });
  }

  async updateFeedback(
      feedbackId: number,
      dto: UpdateFeedbackDto,
  ): Promise<FeedbackDetailedEntity> {
    const { feedbackSourceIds, ...scalar } = dto as UpdateFeedbackDto & {
      feedbackSourceIds?: number[];
    };

    return this.prisma.$transaction(async (tx) => {
      const before = await tx.feedback.findUnique({
        where: { id: feedbackId },
        select: {
          id: true,
          isAccepted: true,
        },
      });

      if (!before) {
        throw new Error(`Feedback ${feedbackId} was not found`);
      }

      const fromStatus =
          getAgreementStatusFromAccepted(before.isAccepted) ?? 'PENDING';

      const shouldMoveBackToPending = before.isAccepted !== null;

      // Полная пересборка набора источников только если массив передан явно
      if (feedbackSourceIds !== undefined) {
        const sourceIds = resolveFeedbackSourceIds({
          feedbackSourceIds,
        } as DetailDtoWithFeedbackSourceId);

        await tx.feedbackToFeedbackSource.deleteMany({
          where: { feedbackId },
        });

        if (sourceIds.length > 0) {
          await tx.feedbackToFeedbackSource.createMany({
            data: sourceIds.map((feedbackSourceId) => ({
              feedbackId,
              feedbackSourceId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.feedback.update({
        where: { id: feedbackId },
        data: {
          ...stripUndefined(scalar as unknown as Record<string, unknown>),
          ...(shouldMoveBackToPending ? { isAccepted: null } : {}),
        },
        select: { id: true },
      });

      if (shouldMoveBackToPending) {
        await tx.ftsFunctionDetailAgreementHistory.create({
          data: {
            feedbackId,
            fromStatus,
            toStatus: 'PENDING',
            comment: null,
          },
        });
      }

      const updated = await tx.feedback.findUnique({
        where: { id: feedbackId },
        select: feedbackDetailedSelect,
      });

      if (!updated) {
        throw new Error(`Feedback ${feedbackId} was not found after update`);
      }

      return updated;
    });
  }

  async deleteFeedback(feedbackId: number): Promise<FeedbackDetailedEntity> {
    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: { isDeleted: true },
      select: feedbackDetailedSelect,
    });
  }

  async acceptFeedback(
      feedbackId: number,
      isAccepted: boolean,
      rejectComment?: string,
  ): Promise<FeedbackDetailedEntity> {
    const before = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
      select: { isAccepted: true },
    });

    const toStatus: FeedbackAgreementStatus = isAccepted
        ? 'ACCEPTED'
        : 'REJECTED';

    const comment = !isAccepted && rejectComment ? rejectComment : null;

    return this.prisma.$transaction(async (tx) => {
      await tx.ftsFunctionDetailAgreementHistory.create({
        data: {
          feedbackId,
          fromStatus:
              getAgreementStatusFromAccepted(before?.isAccepted) ?? 'PENDING',
          toStatus,
          comment,
        },
      });

      return tx.feedback.update({
        where: { id: feedbackId },
        data: { isAccepted },
        select: feedbackDetailedSelect,
      });
    });
  }

  async createTreeEdge(
      dto: CreateFtsFunctionTreeDto,
  ): Promise<FtsFunctionTreeEntity> {
    if (dto.parentFtsFunctionId === dto.childFtsFunctionId) {
      throw new TreeSelfLoopException();
    }

    await assertTypeCategory(
        this.prisma,
        dto.relationTypeId,
        Category.FTS_FUNCTION_RELATION_TYPE,
    );

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

  async deleteTreeEdge(
      parentId: number,
      childId: number,
  ): Promise<FtsFunctionTreeEntity> {
    const existing = await this.prisma.ftsFunctionTree.findUnique({
      where: {
        parentFtsFunctionId_childFtsFunctionId: {
          parentFtsFunctionId: parentId,
          childFtsFunctionId: childId,
        },
      },
      select: ftsFunctionTreeSelect,
    });

    if (!existing) {
      throw new FtsFunctionTreeEdgeNotFoundException(parentId, childId);
    }

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

  async attachDti(
      ftsFunctionId: number,
      dtiId: number,
  ): Promise<FtsFunctionToDtiEntity> {
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

    await assertTypesCategories(
        this.prisma,
        dtiIds.map((id) => ({ id, expected: Category.FTS_DTI })),
    );

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

  async detachDti(
      ftsFunctionId: number,
      dtiId: number,
  ): Promise<FtsFunctionToDtiEntity> {
    const existing = await this.prisma.ftsFunctionToDti.findUnique({
      where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
      select: ftsFunctionToDtiSelect,
    });

    if (!existing) {
      throw new FtsFunctionDtiLinkNotFoundException(ftsFunctionId, dtiId);
    }

    await this.prisma.ftsFunctionToDti.delete({
      where: { ftsFunctionId_dtiId: { ftsFunctionId, dtiId } },
    });

    return existing;
  }

  private async buildListWhereClause(
      query: FtsFunctionListQueryDto,
  ): Promise<Prisma.FtsFunctionWhereInput | null> {
    const where: Prisma.FtsFunctionWhereInput = {};

    if (!query.includeDeleted) where.isDeleted = false;

    if (query.ftsCentralizationIds) {
      where.ftsCentralizationId = { in: query.ftsCentralizationIds };
    }

    if (query.competencyCenterIds) {
      where.competencyCenterId = { in: query.competencyCenterIds };
    }

    if (query.ftsFunctionNameIds) {
      where.ftsFunctionNameId = { in: query.ftsFunctionNameIds };
    }

    if (query.ftsFunctionMarkerIds) {
      where.ftsFunctionMarkerId = { in: query.ftsFunctionMarkerIds };
    }

    if (query.dtiIds) {
      where.dtis = {
        some: {
          dtiId: { in: query.dtiIds },
        },
      };
    }

    if (query.curatorCentralOfficeIds) {
      where.curatorCentralOfficeId = { in: query.curatorCentralOfficeIds };
    }

    if (query.departmentHeadCentralOfficeIds) {
      where.departmentHeadCentralOfficeId = {
        in: query.departmentHeadCentralOfficeIds,
      };
    }

    if (query.managerInterregionalInspectionIds) {
      where.managerInterregionalInspectionId = {
        in: query.managerInterregionalInspectionIds,
      };
    }

    if (query.departmentHeadInterregionalInspectionIds) {
      where.departmentHeadInterregionalInspectionId = {
        in: query.departmentHeadInterregionalInspectionIds,
      };
    }

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

      where.id = where.id
          ? { in: matchedIds, ...(where.id as object) }
          : { in: matchedIds };
    }

    return where;
  }

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

  private async ensureFtsFunctionAlive(id: number): Promise<void> {
    const f = await this.prisma.ftsFunction.findUnique({
      where: { id },
      select: ALIVE_SELECT,
    });

    if (!f || f.isDeleted) throw new FtsFunctionNotFoundException(id);
  }

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

  private async validateFtsFunctionWrite(
      dto: Record<string, unknown>,
  ): Promise<void> {
    const typeChecks = collectTypeChecks(dto, FTS_FUNCTION_TYPE_FIELDS);
    const userChecks: Array<Promise<void>> = [];

    for (const slot of FTS_FUNCTION_USER_SLOTS) {
      const id = dto[`${slot}Id`];

      if (id != null) {
        userChecks.push(assertUserRole(this.prisma, id as number, slot));
      }
    }

    await Promise.all([
      assertTypesCategories(this.prisma, typeChecks),
      ...userChecks,
    ]);
  }

  private async validateFtsFunctionDetailWrite(
      dto: Record<string, unknown>,
  ): Promise<void> {
    await assertTypesCategories(
        this.prisma,
        collectTypeChecks(dto, FTS_FUNCTION_DETAIL_TYPE_FIELDS),
    );
  }

  async getDownload(): Promise<ExcelJS.Buffer> {
    const [ftsFunctions, ftsFunctionDetails, feedback, tree] = await Promise.all([
      this.prisma.ftsFunction.findMany({
        where: { isDeleted: false },
        select: downloadFtsFunctionSelect,
        orderBy: { id: 'asc' }
      }),

      this.prisma.ftsFunctionDetail.findMany({
        where: {
          isDeleted: false,
          ftsFunction: { isDeleted: false },
        },
        select: downloadFtsFunctionDetailSelect,
        orderBy: [
          { ftsFunctionId: 'asc' },
          { ftsFunctionStepId: 'asc' },
          { ftsFunctionCategoryId: 'asc' },
        ],
      }),

      this.prisma.feedback.findMany({
        where: {
          isDeleted: false,
          ftsFunctionDetail: {
            isDeleted: false,
            ftsFunction: { isDeleted: false },
          },
        },
        select: downloadFeedbackSelect,
        orderBy: [
          { ftsFunctionDetail: { ftsFunctionId: 'asc' } },
          { ftsFunctionDetail: { ftsFunctionStepId: 'asc' } },
          { ftsFunctionDetail: { ftsFunctionCategoryId: 'asc' } },
        ],
      }),

      this.prisma.ftsFunctionTree.findMany({
        where: {
          parentFtsFunction: {
            isDeleted: false,
            ftsFunction: { isDeleted: false },
          },
        },
        select: downloadFtsFunctionTreeSelect,
        orderBy: [
          { parentFtsFunction: { ftsFunctionId: 'asc' } },
          { parentFtsFunction: { ftsFunctionStepId: 'asc' } },
          { parentFtsFunction: { ftsFunctionCategoryId: 'asc' } },
        ],
      }),
    ]);

    return this.excel.createExcelWorkbook({
      sheets: [
        {
          name: 'Функции',
          data: ftsFunctions,
          columns: [
            {
              header: 'ID',
              map: (row: DownloadFtsFunctionEntity) => row.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFtsFunctionEntity) => row.ftsFunctionName.name,
            },
            {
              header: 'Маркер функции',
              map: (row: DownloadFtsFunctionEntity) => row.ftsFunctionMarker.name,
            },
            {
              header: 'Стратегия Д, DTI',
              map: (row: DownloadFtsFunctionEntity) => {
                const dtis = row.dtis.map(
                  ({ dti }) => dti.name ? `${dti.code}, ${dti.name}` : dti.code
                );

                return dtis?.join(';\n');
              },
            },
            {
              header: 'Централизация функции',
              map: (row: DownloadFtsFunctionEntity) => row.ftsCentralization.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFtsFunctionEntity) => row.competencyCenter.name,
            },
            {
              header: 'Куратор ЦА',
              map: (row: DownloadFtsFunctionEntity) => row.curatorCentralOffice.fullName,
            },
            {
              header: 'НУ / ЗНУ',
              map: (row: DownloadFtsFunctionEntity) => row.departmentHeadCentralOffice.fullName,
            },
            {
              header: 'Менеджер МИУДОЛ',
              map: (row: DownloadFtsFunctionEntity) => row.managerInterregionalInspection.fullName,
            },
            {
              header: 'НИ / ЗНИ',
              map: (row: DownloadFtsFunctionEntity) => row.departmentHeadInterregionalInspection.fullName,
            },
            {
              header: 'Дата создания',
              map: (row: DownloadFtsFunctionEntity) => row.createdAt,
            },
            {
              header: 'Дата обновления',
              map: (row: DownloadFtsFunctionEntity) => row.updatedAt,
            },
          ],
        },
        {
          name: 'Детализации функций',
          data: ftsFunctionDetails,
          columns: [
            {
              header: 'ID функции',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionId,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFtsFunctionDetailEntity) => row.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Шаг функции',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionStep.name,
            },
            {
              header: 'Категория функции',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionCategory?.name,
            },
            {
              header: 'Детализация',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionDetails,
            },
            {
              header: 'Периодичность выполнения',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionExecutionFrequency?.name,
            },
            {
              header: 'Сложности функции',
              map: (row: DownloadFtsFunctionDetailEntity) => row.ftsFunctionComplexity?.name,
            },
            {
              header: 'Артефакт',
              map: (row: DownloadFtsFunctionDetailEntity) => row.artifact,
            },
            {
              header: 'Основание',
              map: (row: DownloadFtsFunctionDetailEntity) => row.basis,
            },
            {
              header: 'Как используется артефакт',
              map: (row: DownloadFtsFunctionDetailEntity) => row.artifactUsage,
            },
            {
              header: 'Зачем выполняется',
              map: (row: DownloadFtsFunctionDetailEntity) => row.purpose,
            },
            {
              header: 'Технологическое решение',
              map: (row: DownloadFtsFunctionDetailEntity) => row.technologicalSolution?.name,
            },
            {
              header: 'Номер ПЗ / АЗ',
              map: (row: DownloadFtsFunctionDetailEntity) => row.number,
            },
            {
              header: 'Ответственный',
              map: (row: DownloadFtsFunctionDetailEntity) => row.technologicalSolution?.name,
            },
            {
              header: 'Алгоритм срабатывания',
              map: (row: DownloadFtsFunctionDetailEntity) => row.algorithm,
            },
          
            {
              header: 'Дата создания',
              map: (row: DownloadFtsFunctionDetailEntity) => row.createdAt,
            },
            {
              header: 'Дата обновления',
              map: (row: DownloadFtsFunctionDetailEntity) => row.updatedAt,
            },
          ],
        },
        {
          name: 'Обратная связь',
          data: feedback,
          columns: [
            {
              header: 'ID функции',
              map: (row: DownloadFeedbackEntity) => row.ftsFunctionDetail.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFeedbackEntity) => row.ftsFunctionDetail.id,
            },
            {
              header: 'ID обратной связи',
              map: (row: DownloadFeedbackEntity) => row.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFeedbackEntity) => row.ftsFunctionDetail.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFeedbackEntity) => row.ftsFunctionDetail.ftsFunctionDetails,
            },
            {
              header: 'Источники обратной связи',
              map: (row: DownloadFeedbackEntity) => {
                return row.feedbackSources.map(
                  ({ feedbackSource }) => feedbackSource.name
                ).join(';\n');
              },
            },
            {
              header: 'Метрики качества процесса в рамках обратной связи',
              map: (row: DownloadFeedbackEntity) => row.feedbackQualityMetrics?.name,
            },
            {
              header: 'Описание проблемы с указанием источника, метрики, способа решения',
              map: (row: DownloadFeedbackEntity) => row.problemDescription,
            },
            {
              header: 'Реквизиты автора инициативы',
              map: (row: DownloadFeedbackEntity) => row.initiatorRequisites,
            },
            {
              header: 'Методология позиции ЦА ФНС России',
              map: (row: DownloadFeedbackEntity) => row.ftsMethodologyStatus?.name,
            },
            {
              header: 'Акцепт автора инициативы',
              map: (row: DownloadFeedbackEntity) => row.initiatorAcceptance,
            },
            {
              header: 'Методологическая позиция ЦА ФНС России из справочника',
              map: (row: DownloadFeedbackEntity) => row.ftsMethodologyStatus?.name,
            },
            {
              header: 'Срок реализации доработки',
              map: (row: DownloadFeedbackEntity) => row.deadline,
            },
            {
              header: 'Согласовано',
              map: (row: DownloadFeedbackEntity) => row.isAccepted ? 'Да' : 'Нет',
            },
          ],
        },
        {
          name: 'Дерево функций',
          data: tree,
          columns: [
            {
              header: 'ID функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.parentFtsFunction.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.parentFtsFunction.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.parentFtsFunction.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.parentFtsFunction.ftsFunctionDetails,
            },
            {
              header: '',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.relationType.name,
            },
            {
              header: 'ID функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.childFtsFunction.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.childFtsFunction.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.childFtsFunction.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFFtsFunctionTreeEntity) => row.childFtsFunction.ftsFunctionDetails,
            },
          ],
        },
      ]
    });
  }
}



const FTS_FUNCTION_TYPE_FIELDS = {
  ftsCentralizationId: Category.FTS_CENTRALIZATION,
  ftsFunctionNameId: Category.FTS_FUNCTION_NAME,
  competencyCenterId: Category.FTS_COMPETENCY_CENTER,
  ftsFunctionMarkerId: Category.FTS_FUNCTION_MARKER,
} satisfies Record<string, Category>;

const FTS_FUNCTION_DETAIL_TYPE_FIELDS = {
  ftsFunctionStepId: Category.FTS_FUNCTION_STEP,
  ftsFunctionCategoryId: Category.FTS_FUNCTION_CATEGORY,
  ftsFunctionComplexityId: Category.FTS_FUNCTION_COMPLEXITY,
  ftsFunctionExecutionFrequencyId: Category.FTS_FUNCTION_EXECUTION_FREQUENCY,
  whoPerformsActionId: Category.WHO_PERFORMS_ACTION,
  ftsFunctionActionTypeId: Category.FTS_FUNCTION_ACTION_TYPE,
  ftsFunctionEffectivenessId: Category.FTS_FUNCTION_EFFECTIVENESS,
  feedbackQualityMetricsId: Category.FEEDBACK_QUALITY_METRICS,
  technologicalSolutionId: Category.TECHNOLOGICAL_SOLUTION,
  responsibleId: Category.RESPONSIBLE,
  ftsMethodologyStatusId: Category.FTS_METHODOLOGY_STATUS,
  feedbackSourceId: Category.FEEDBACK_SOURCE,
  feedbackSourceIds: Category.FEEDBACK_SOURCE,
} satisfies Record<string, Category>;

const FTS_FUNCTION_USER_SLOTS: readonly UserRoleSlot[] =
    Object.values(UserRoleSlot);

function collectTypeChecks(
    dto: Record<string, unknown>,
    fields: Record<string, Category>,
): Array<{ id: number; expected: Category }> {
  const out: Array<{ id: number; expected: Category }> = [];

  for (const [key, expected] of Object.entries(fields)) {
    const value = dto[key];

    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const id of value) {
        if (id != null) out.push({ id: Number(id), expected });
      }

      continue;
    }

    out.push({ id: Number(value), expected });
  }

  return out;
}

function resolveFeedbackSourceIds(dto: DetailDtoWithFeedbackSourceId): number[] {
  if (Array.isArray(dto.feedbackSourceIds)) {
    return dto.feedbackSourceIds.map(Number).filter((id) => Number.isFinite(id));
  }

  if (dto.feedbackSourceId != null) {
    return [Number(dto.feedbackSourceId)].filter((id) => Number.isFinite(id));
  }

  return [];
}

function getAgreementStatusFromAccepted(
    isAccepted: boolean | null | undefined,
): FeedbackAgreementStatus | null {
  if (isAccepted === true) return 'ACCEPTED';
  if (isAccepted === false) return 'REJECTED';
  if (isAccepted === null) return 'PENDING';

  return null;
}

const DuplicateNameError = FunctionNameDuplicateException;

function mapDuplicateNameOrRethrow(error: unknown): unknown {
  if (!isPrismaUniqueError(error)) return error;

  const target = (error.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target)
      ? target.filter((x): x is string => typeof x === 'string')
      : typeof target === 'string'
          ? [target]
          : [];

  const matchesNameUnique = fields.some(
      (f) => f === 'fts_function_name_id' || f.endsWith('fts_function_name_id_key'),
  );

  if (matchesNameUnique) return new DuplicateNameError();

  return error;
}