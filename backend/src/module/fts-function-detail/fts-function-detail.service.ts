import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFtsFunctionDetailDto, UpdateFtsFunctionDetailDto, FtsFunctionDetailItemsDto, FtsFunctionDetailBaseDto, FtsFunctionDetailPreviewDto, FtsFunctionDetailsRelationQueryDto, FtsFunctionDetailsRelationDto, FtsFunctionDetailsRelationDeleteQueryDto, CreateFtsFunctionDetailsRelationDto } from './fts-function-detail.schema';
import { FtsFunctionDetailBaseSelect, FtsFunctionDetailPreviewSelect, getFtsFunctionDetailRelationsSelect } from './fts-function-detail.select';
import { Code, HistoryEntityType } from 'src/common/constants';
import { TypeSelect } from '../constant/constant.select';



@Injectable()
export class FtsFunctionDetailService {
  private readonly HISTORY_ENTITY_TYPE = HistoryEntityType.FTS_FUNCTION_DETAIL;

  constructor(private readonly prisma: PrismaService) { }


  private async ensureExists(id: number) {
    const existing = await this.prisma.ftsFunctionDetail.findUnique({
      where: { id },
      select: {
        isDeleted: true,
        ...FtsFunctionDetailBaseSelect,
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Детализация функции не найдена');
    }

    return existing;
  }


  private async relationExists(parentFtsFunctionId: number, childFtsFunctionId: number): Promise<boolean> {
    const tree = await this.prisma.ftsFunctionTree.findMany({
      where: {
        OR: [
          {
            parentFtsFunctionId: parentFtsFunctionId,
            childFtsFunctionId: childFtsFunctionId,
          },
          {
            parentFtsFunctionId: childFtsFunctionId,
            childFtsFunctionId: parentFtsFunctionId,
          },
        ],
      },
      select: {
        parentFtsFunction: { select: FtsFunctionDetailBaseSelect },
        childFtsFunction: { select: FtsFunctionDetailBaseSelect },
        relationType: { select: TypeSelect },
      },
    });

    return tree.length > 0;
  }


  private async detailsByStep(
    ftsFunctionId: number,
    categoryCode: string,
    stepCode: string
  ): Promise<FtsFunctionDetailPreviewDto[]> {
    return this.prisma.ftsFunctionDetail.findMany({
      where: {
        isDeleted: false,
        ftsFunctionId,
        ftsFunctionCategory: { category: 'FTS_FUNCTION_CATEGORY', code: categoryCode },
        ftsFunctionStep: { category: 'FTS_FUNCTION_STEP', code: stepCode },
      },
      select: FtsFunctionDetailPreviewSelect,
      orderBy: [{ order: 'asc' }, { id: 'desc' }],
    });
  }


  private buildCategoryGroup(
    objectSelection: FtsFunctionDetailPreviewDto[],
    clusteringImpact: FtsFunctionDetailPreviewDto[],
  ) {
    return {
      itemsByStep: { objectSelection, clusteringImpact },
      meta: {
        stepOne: objectSelection.length,
        stepTwo: clusteringImpact.length,
      },
    };
  }


  private buildRelationsFilter(query: FtsFunctionDetailsRelationQueryDto): Prisma.FtsFunctionDetailWhereInput {
    const { type, ftsFunctionId, ftsFunctionDetailId, ftsFunctionStepId, relationTypeId, search } = query;

    const relationsFilter = {
      OR: [
        { parents: { some: { parentFtsFunctionId: ftsFunctionDetailId, relationTypeId } } },
        { children: { some: { childFtsFunctionId: ftsFunctionDetailId, relationTypeId } } },
      ],
    };
    const where: Prisma.FtsFunctionDetailWhereInput = {
      isDeleted: false,
      ftsFunctionId,
      ftsFunctionStepId,
      ftsFunctionDetails: search ? { contains: search } : undefined,
    };
    if (type === 'RELATED')
      where.OR = relationsFilter.OR;
    else if (type === 'UNRELATED')
      where.NOT = relationsFilter;

    return where;
  }


  /// Получение списка детализаций
  async getAllFtsFunctionDetails(ftsFunctionId: number): Promise<FtsFunctionDetailItemsDto> {
    const existing = await this.prisma.ftsFunction.findUnique({
      where: { id: ftsFunctionId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Функция не найдена');
    }

    const [
      methodologyS1, methodologyS2,
      actualActionS1, actualActionS2,
      controlAnalyticsS1, controlAnalyticsS2,
    ] = await Promise.all([
      this.detailsByStep(ftsFunctionId, 'METHODOLOGY', 'OBJECT_SELECTION'),
      this.detailsByStep(ftsFunctionId, 'METHODOLOGY', 'CLUSTERING_IMPACT'),
      this.detailsByStep(ftsFunctionId, 'ACTUAL_ACTION', 'OBJECT_SELECTION'),
      this.detailsByStep(ftsFunctionId, 'ACTUAL_ACTION', 'CLUSTERING_IMPACT'),
      this.detailsByStep(ftsFunctionId, 'CONTROL_ANALYTICS', 'OBJECT_SELECTION'),
      this.detailsByStep(ftsFunctionId, 'CONTROL_ANALYTICS', 'CLUSTERING_IMPACT'),
    ]);

    const methodology = this.buildCategoryGroup(methodologyS1, methodologyS2);
    const actualAction = this.buildCategoryGroup(actualActionS1, actualActionS2);
    const controlAnalytics = this.buildCategoryGroup(controlAnalyticsS1, controlAnalyticsS2);

    return {
      itemsByCategory: { methodology, actualAction, controlAnalytics },
      meta: {
        stepOne: methodology.meta.stepOne + actualAction.meta.stepOne + controlAnalytics.meta.stepOne,
        stepTwo: methodology.meta.stepTwo + actualAction.meta.stepTwo + controlAnalytics.meta.stepTwo,
      },
    };
  }


  /// Получение детализации функции по ID
  getFtsFunctionDetailById(id: number): Promise<FtsFunctionDetailBaseDto> {
    return this.ensureExists(id);
  }


  /// Создание детализации
  async create(userId: number, data: CreateFtsFunctionDetailDto): Promise<FtsFunctionDetailBaseDto> {
    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunctionDetail = await tr.ftsFunctionDetail.create({
        data: {
          creatorId: userId,
          ...data,
        },
        select: FtsFunctionDetailBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: ftsFunctionDetail.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        },
      });

      return ftsFunctionDetail;
    });
  }


  /// Обновление детализации
  async update(userId: number, id: number, data: UpdateFtsFunctionDetailDto): Promise<FtsFunctionDetailBaseDto> {
    const oldData = await this.ensureExists(id);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunctionDetail = await tr.ftsFunctionDetail.update({
        where: { id },
        data: {
          updaterId: userId,
          ...data,
        },
        select: FtsFunctionDetailBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: ftsFunctionDetail.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return ftsFunctionDetail;
    });
  }


  /// Логическое удаление детализации
  async delete(userId: number, id: number): Promise<FtsFunctionDetailBaseDto> {
    await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunctionDetail = await tr.ftsFunctionDetail.update({
        where: { id },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
        select: FtsFunctionDetailBaseSelect,
      });

      await this.prisma.feedback.updateMany({
        where: {
          ftsFunctionDetailId: ftsFunctionDetail.id,
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await this.prisma.action.updateMany({
        where: {
          ftsFunctionDetailId: ftsFunctionDetail.id,
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await this.prisma.file.updateMany({
        where: {
          ftsFunctionDetailId: ftsFunctionDetail.id,
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: ftsFunctionDetail.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          createdAt: now,
        },
      });

      return ftsFunctionDetail;
    });
  }


  /// Изменение порядка расположения детализаций
  async reorderFtsFunctionDetails(userId: number, ftsFunctionId: number, orderedIds: number[]): Promise<FtsFunctionDetailItemsDto> {
    const existing = await this.prisma.ftsFunction.findUnique({
      where: { id: ftsFunctionId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Функция не найдена');
    }

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const oldData = await tr.ftsFunctionDetail.findMany({
        where: { id: { in: orderedIds } },
        select: { id: true, order: true },
      });

      for (const [order, id] of orderedIds.entries()) {
        await tr.ftsFunctionDetail.update({
          where: { id },
          data: {
            reordererId: userId,
            reorderedAt: new Date(),
            order,
          },
        });
      }

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.order,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return this.getAllFtsFunctionDetails(ftsFunctionId);
    });
  }


  /// Получение связанных и не связанных детализаций с выбранной
  async getRelations(query: FtsFunctionDetailsRelationQueryDto): Promise<FtsFunctionDetailsRelationDto> {
    await this.ensureExists(query.ftsFunctionDetailId);

    const filter = this.buildRelationsFilter(query);

    const getRelationsByCategory = (ftsFunctionCategoryCode: string) => this.prisma.ftsFunctionDetail.findMany({
      where: {
        ...filter,
        ftsFunctionCategory: { category: 'FTS_FUNCTION_CATEGORY', code: ftsFunctionCategoryCode },
      },
      select: getFtsFunctionDetailRelationsSelect(query.ftsFunctionDetailId),
      orderBy: [{ ftsFunctionStepId: 'desc' }, { order: 'asc' }, { id: 'desc' }],
    });

    const [methodology, actualAction, controlAnalytics] = await Promise.all([
      getRelationsByCategory(Code.FTS_FUNCTION_CATEGORY.METHODOLOGY),
      getRelationsByCategory(Code.FTS_FUNCTION_CATEGORY.ACTUAL_ACTION),
      getRelationsByCategory(Code.FTS_FUNCTION_CATEGORY.CONTROL_ANALYTICS),
    ]);

    return { methodology, actualAction, controlAnalytics };
  }


  /// Создание связи между детализациями функций
  async createRelation(userId: number, data: CreateFtsFunctionDetailsRelationDto): Promise<void> {
    for (const { parentFtsFunctionId, childFtsFunctionId } of data) {
      await this.ensureExists(parentFtsFunctionId);
      await this.ensureExists(childFtsFunctionId);
      const isExists = await this.relationExists(parentFtsFunctionId, childFtsFunctionId);
      if (isExists) {
        throw new BadRequestException("Связь уже существует");
      }
    }


    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      await tr.ftsFunctionTree.createMany({
        data: data.map(d => ({ ...d, creatorId: userId }))
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.relations,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        },
      });
    });
  }


  /// Удаление связи между детализациями функций
  async deleteRelation(userId: number, data: FtsFunctionDetailsRelationDeleteQueryDto): Promise<void> {
    await this.ensureExists(data.parentFtsFunctionId);
    await this.ensureExists(data.childFtsFunctionId);
    const isExists = await this.relationExists(data.parentFtsFunctionId, data.childFtsFunctionId);

    if (!isExists) {
      throw new BadRequestException("Связь не найдена");
    }

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      await tr.ftsFunctionTree.deleteMany({
        where: {
          OR: [
            {
              parentFtsFunctionId: data.parentFtsFunctionId,
              childFtsFunctionId: data.childFtsFunctionId,
            },
            {
              parentFtsFunctionId: data.childFtsFunctionId,
              childFtsFunctionId: data.parentFtsFunctionId,
            },
          ],
        }
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.relations,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          // oldValue: oldData,
        },
      });
    });
  }
}
