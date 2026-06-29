import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto, UpdateActionDto, ActionItemsDto, ActionBaseDto, CreateActionsFeedbackDto, UpdateActionsFeedbackDto, UpdateGeneralInfoActionsDto, GeneralInfoActionsDto } from './action.schema';
import { ActionPreviewSelect, ActionBaseSelect } from './action.select';
import { Code, HistoryEntityType } from 'src/common/constants';


@Injectable()
export class ActionService {
  private readonly HISTORY_ENTITY_TYPE = HistoryEntityType.ACTION;

  constructor(private readonly prisma: PrismaService) { }


  private async ensureExists(id: number) {
    const existing = await this.prisma.action.findUnique({
      where: { id },
      select: {
        isDeleted: true,
        ...ActionBaseSelect,
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Действие не найдено');
    }

    return existing;
  }


  private async ensureExistsFtsFunctionDetail(id: number): Promise<GeneralInfoActionsDto> {
    const existing = await this.prisma.ftsFunctionDetail.findUnique({
      where: { id },
      select: {
        isDeleted: true, 
        actionsInput: true,
        actionsOutput: true,
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Детализация функции не найдена');
    }

    return {
      actionsInput: existing.actionsInput,
      actionsOutput: existing.actionsOutput,
    };
  }


  /// Получение общей информации о действиях
  getGeneralInfoActions(ftsFunctionDetailId: number): Promise<GeneralInfoActionsDto> {
    return this.ensureExistsFtsFunctionDetail(ftsFunctionDetailId);
  }


  /// Обновление общей информации о действиях
  async updateGeneralInfoActions(userId: number, ftsFunctionDetailId: number, data: UpdateGeneralInfoActionsDto): Promise<GeneralInfoActionsDto> {
    const oldData = await this.ensureExistsFtsFunctionDetail(ftsFunctionDetailId);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const infoActions = await tr.ftsFunctionDetail.update({
        where: { id: ftsFunctionDetailId },
        data: {
          updaterId: userId,
          ...data,
        },
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.generalInfo,
          entityId: infoActions.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: { ...oldData },
        },
      });

      return infoActions;
    });
  }


  /// Получение всего списка действий
  getAllActions(ftsFunctionDetailId: number): Promise<ActionItemsDto> {
    return this.prisma.action.findMany({
      where: {
        isDeleted: false,
        ftsFunctionDetailId,
      },
      select: ActionPreviewSelect,
      orderBy: [{ order: 'asc' }, { id: 'desc' }],
    });
  }


  /// Получение действия по ID
  getActionById(id: number): Promise<ActionBaseDto> {
    return this.ensureExists(id);
  }


  /// Создание действия
  async create(userId: number, data: CreateActionDto): Promise<ActionBaseDto> {
    await this.ensureExistsFtsFunctionDetail(data.ftsFunctionDetailId);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.create({
        data: {
          creatorId: userId,
          ...data,
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        },
      });

      return action;
    });
  }


  /// Обновление действия
  async update(userId: number, id: number, data: UpdateActionDto): Promise<ActionBaseDto> {
    const oldData = await this.ensureExists(id);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.update({
        where: { id },
        data: {
          updaterId: userId,
          ...data,
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return action;
    });
  }


  /// Логическое удаление действия
  async delete(userId: number, id: number): Promise<ActionBaseDto> {
    const oldData = await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.update({
        where: { id },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          oldValue: oldData,
        },
      });

      return action;
    });
  }


  /// Добавление обратной связи действия
  async createFeedback(userId: number, id: number, data: CreateActionsFeedbackDto): Promise<ActionBaseDto> {
    const oldData = await this.ensureExists(id);

    const { feedbackSourceIds, ...otherData } = data;

    const feedbackSources = {
      createMany: {
        data: (feedbackSourceIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.update({
        where: { id },
        data: {
          updaterId: userId,
          ...otherData,
          ...(feedbackSources.createMany.data.length > 0 ? { feedbackSources } : {}),
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
          oldValue: oldData,
        }
      });

      return action;
    });
  }


  /// Обновление обратной связи действия
  async updateFeedback(userId: number, id: number, data: UpdateActionsFeedbackDto): Promise<ActionBaseDto> {
    const oldData = await this.ensureExists(id);

    const { feedbackSourceIds, ...otherData } = data;

    const feedbackSources = {
      deleteMany: {},
      createMany: {
        data: (feedbackSourceIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.update({
        where: { id },
        data: {
          updaterId: userId,
          ...otherData,
          ...(feedbackSources.createMany.data.length > 0 ? { feedbackSources } : {}),
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
          oldValue: oldData,
        }
      });

      return action;
    });
  }


  /// Удаление обратной связи действия
  async deleteFeedback(userId: number, id: number): Promise<ActionBaseDto> {
    const oldData = await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const action = await tr.action.update({
        where: { id },
        data: {
          updaterId: userId,
          feedbackQualityMetricsId: null,
          ftsMethodologyStatusId: null,
          problemDescription: null,
          initiatorRequisites: null,
          initiatorAcceptance: null,
          deadline: null,
        },
        select: ActionBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback,
          entityId: action.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          oldValue: oldData,
        },
      });

      return action;
    });
  }


  /// Изменение порядка расположения операций
  async reorderActions(userId: number, ftsFunctionDetailId: number, orderedIds: number[]): Promise<ActionItemsDto> {
    await this.ensureExistsFtsFunctionDetail(ftsFunctionDetailId);
    
    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const oldData = await tr.action.findMany({
        where: { ftsFunctionDetailId },
        select: { id: true, order: true },
      });

      for (const [order, id] of orderedIds.entries()) {
        await tr.action.update({
          where: { id },
          data: {
            reordererId: userId,
            updatedAt: new Date(),
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

      return this.getAllActions(ftsFunctionDetailId);
    });
  }
}
