import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FtsFunctionResponseDto, FtsFunctionQueryDto, FtsFunctionSortDto, FtsFunctionFilterDto, UpdateFtsFunctionDto, CreateFtsFunctionDto, FtsFunctionDto } from './fts-function.schema';
import { FtsFunctionSelect } from './fts-function.select';
import { Code, HistoryEntityType } from 'src/common/constants'
import { SortedFieldsType, OrderDirectionType } from './fts-function.type';



@Injectable()
export class FtsFunctionService {
  private readonly HISTORY_ENTITY_TYPE = HistoryEntityType.FTS_FUNCTION;

  constructor(private readonly prisma: PrismaService) {}


  private buildSortedField(field: SortedFieldsType, order: OrderDirectionType): Prisma.FtsFunctionOrderByWithRelationInput {
    const orderMap: Record<SortedFieldsType, Prisma.FtsFunctionOrderByWithRelationInput> = {
      id: { id: order },
      competencyCenterId: { competencyCenter: { name: order } },
      ftsFunctionNameId: { ftsFunctionName: { name: order } },
      ftsFunctionMarkerId: { ftsFunctionMarker: { name: order } },
      ftsCentralizationId: { ftsCentralization: { name: order } },
      curatorCentralOfficeId: { curatorCentralOffice: { shortName: order } },
      managerInterregionalInspectionId: { managerInterregionalInspection: { shortName: order } },
      departmentHeadCentralOfficeId: { departmentHeadCentralOffice: { shortName: order } },
      departmentHeadInterregionalInspectionId: { departmentHeadInterregionalInspection: { shortName: order } },
    };

    return orderMap[field];
  }
  

  /// Формирование сортировки функций
  private buildOrderBy(sort?: FtsFunctionSortDto | FtsFunctionSortDto[]): Prisma.FtsFunctionOrderByWithRelationInput | Prisma.FtsFunctionOrderByWithRelationInput[] {
    if (!sort) {
      return { id: 'desc' };
    }

    const sorts = Array.isArray(sort) ? sort : [sort];
    return sorts.map(s => this.buildSortedField(s.field, s.order));
  }


  /// Формирование фильтра функций
  private buildWhere(filter?: FtsFunctionFilterDto): Prisma.FtsFunctionWhereInput {
    const where: Prisma.FtsFunctionWhereInput = {};

    where.id = filter?.ids?.length 
      ? { in: filter.ids } 
      : undefined;

    where.ftsFunctionNameId = filter?.ftsFunctionNameIds?.length 
      ? { in: filter.ftsFunctionNameIds } 
      : undefined;

    where.competencyCenterId = filter?.competencyCenterIds?.length 
      ? { in: filter.competencyCenterIds } 
      : undefined;

    where.ftsFunctionMarkerId = filter?.ftsFunctionMarkerIds?.length 
      ? { in: filter.ftsFunctionMarkerIds } 
      : undefined;

    where.ftsCentralizationId = filter?.ftsCentralizationIds?.length 
      ? { in: filter.ftsCentralizationIds } 
      : undefined;

    where.curatorCentralOfficeId = filter?.curatorCentralOfficeIds?.length 
      ? { in: filter.curatorCentralOfficeIds } 
      : undefined;

    where.managerInterregionalInspectionId = filter?.managerInterregionalInspectionIds?.length 
      ? { in: filter.managerInterregionalInspectionIds } 
      : undefined;

    where.departmentHeadCentralOfficeId = filter?.departmentHeadCentralOfficeIds?.length 
      ? { in: filter.departmentHeadCentralOfficeIds } 
      : undefined;

    where.departmentHeadInterregionalInspectionId = filter?.departmentHeadInterregionalInspectionIds?.length 
      ? { in: filter.departmentHeadInterregionalInspectionIds } 
      : undefined;

    where.dtis = filter?.dtiIds?.length 
      ? { some: { typeId: { in: filter.dtiIds } } } 
      : undefined;

  
    return where;
  }


  private async ensureExists(id: number) {
    const existing = await this.prisma.ftsFunction.findUnique({
      where: { id },
      select: { 
        isDeleted: true,
        ...FtsFunctionSelect,
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Функция не найдена');
    }

    return existing;
  }


  private async ensureFtsFunctionNameIsUnique(
    ftsFunctionNameId: number | undefined,
    otherFtsFunctionName: string | undefined,
    excludeId?: number,
  ) {
    if (!ftsFunctionNameId && !otherFtsFunctionName) return;

    const ftsFunctionNameType = await this.prisma.type.findUnique({
      where: { id: ftsFunctionNameId },
      select: { code: true },
    });
    const isOtherFtsFunctionName = ftsFunctionNameType?.code === Code.FTS_FUNCTION_NAME.FTS_FUNCTION_OTHER;

    if (isOtherFtsFunctionName && !otherFtsFunctionName) {
      throw new BadRequestException('Не указано иное наименование функции');
    }

    const existing = await this.prisma.ftsFunction.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        isDeleted: false,
        ftsFunctionNameId,
        ...(isOtherFtsFunctionName ? { otherFtsFunctionName } : {})
      },
      select: { id: true },
    });

    if (!!existing) {
      throw new BadRequestException('Функция с таким наименованием уже существует.');
    }
  }


  /// Получение всего списка функций
  async getAllFtsFunctions({ filter, sort }: FtsFunctionQueryDto): Promise<FtsFunctionResponseDto> {
    const where = this.buildWhere(filter);
    const orderBy = this.buildOrderBy(sort);

    const [total, filteredTotal, items] = await Promise.all([
      this.prisma.ftsFunction.count({ where: { isDeleted: false } }),
      this.prisma.ftsFunction.count({ where: { ...where, isDeleted: false } }),
      this.prisma.ftsFunction.findMany({
        where: { ...where, isDeleted: false },
        select: FtsFunctionSelect,
        orderBy,
      })
    ]);

    return {
      items,
      meta: { total, filteredTotal },
    }
  }


  /// Получение функции по ID
  getFtsFunctionById(id: number): Promise<FtsFunctionDto> {
    return this.ensureExists(id);
  }


  /// Создание функции
  async create(userId:number, data: CreateFtsFunctionDto): Promise<FtsFunctionDto> {
    const { dtiIds, ...otherData } = data;
    await this.ensureFtsFunctionNameIsUnique(data.ftsFunctionNameId, data.otherFtsFunctionName);

    const dtis = {
      createMany: {
        data: (dtiIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunction = await tr.ftsFunction.create({
        data: {
          creatorId: userId,
          ...otherData,
          ...(dtis.createMany.data.length > 0 ? { dtis } : {}),
        },
        select: FtsFunctionSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE,
          entityId: ftsFunction.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        }
      });

      return ftsFunction;
    });
  }


  /// Обновление функции
  async update(userId:number, id: number, data: UpdateFtsFunctionDto): Promise<FtsFunctionDto> {
    const { dtiIds, ...otherData } = data;
    const oldData = await this.ensureExists(id);
    await this.ensureFtsFunctionNameIsUnique(data.ftsFunctionNameId, data.otherFtsFunctionName, id);

    const dtis = {
      createMany: {
        deleteMany: {},
        data: (dtiIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunction = await tr.ftsFunction.update({
        where: { id },
        data: {
          updaterId: userId,
          ...otherData,
          ...(dtis.createMany.data.length > 0 ? { dtis } : {}),
        },
        select: FtsFunctionSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE,
          entityId: ftsFunction.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        }
      });

      return ftsFunction;
    });
  }


  /// Удаление функции
  async delete(userId:number, id: number): Promise<FtsFunctionDto> {
    await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const ftsFunction = await tr.ftsFunction.update({
        where: { id },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
        select: FtsFunctionSelect,
      });

      await this.prisma.ftsFunctionDetail.updateMany({
        where: { 
          ftsFunctionId: ftsFunction.id,
          isDeleted: false,
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await this.prisma.feedback.updateMany({
        where: {
          ftsFunctionDetail: { 
            ftsFunctionId: ftsFunction.id,
            isDeleted: false,
          },
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await this.prisma.action.updateMany({
        where: {
          ftsFunctionDetail: { 
            ftsFunctionId: ftsFunction.id,
            isDeleted: false,
          },
        },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

      await this.prisma.file.updateMany({
        where: {
          ftsFunctionDetail: { 
            ftsFunctionId: ftsFunction.id,
            isDeleted: false,
          },
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
          entityType: this.HISTORY_ENTITY_TYPE,
          entityId: ftsFunction.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          createdAt: now,
        }
      });

      return ftsFunction;
    })
  }
}
