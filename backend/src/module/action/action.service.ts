import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto, UpdateActionDto, ActionItemsDto, ActionBaseDto, CreateActionsFeedbackDto, UpdateActionsFeedbackDto, UpdateGeneralInfoActionsDto, GeneralInfoActionsDto, ActionsFeedbackDto } from './action.schema';
import { ActionPreviewSelect, ActionBaseSelect, ActionsFeedbackSelect } from './action.select';
import { Code, HistoryEntityType } from 'src/common/constants';


@Injectable()
export class ActionService {
  private readonly HISTORY_ENTITY_TYPE = HistoryEntityType.ACTION;

  constructor(private readonly prisma: PrismaService) { }


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


  private async ensureExists(id: number): Promise<Omit<ActionBaseDto, 'feedbacks'>>;
  private async ensureExists(id: number, includeFeedbacks: false): Promise<Omit<ActionBaseDto, 'feedbacks'>>;
  private async ensureExists(id: number, includeFeedbacks: true): Promise<ActionBaseDto>;
  private async ensureExists(
    id: number,
    includeFeedbacks = false,
  ): Promise<ActionBaseDto | Omit<ActionBaseDto, 'feedbacks'>> {
    const { feedbacks, ...select } = ActionBaseSelect;

    const existing = await this.prisma.action.findUnique({
      where: { id },
      select: {
        isDeleted: true,
        ...select,
        ...(includeFeedbacks ? { feedbacks } : {}),
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Операция не найдена');
    }

    return existing as unknown as ActionBaseDto;
  }


  private async ensureExistsFeedback(id: number) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
      select: {
        isDeleted: true,
        ...ActionsFeedbackSelect
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Обратная связь операции не найдена');
    }

    return existing;
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
        select: {
          id: true,
          actionsInput: true,
          actionsOutput: true,
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
    return this.ensureExists(id, true);
  }


  /// Создание действия
  async create(userId: number, data: CreateActionDto): Promise<ActionBaseDto> {
    await this.ensureExistsFtsFunctionDetail(data.ftsFunctionDetailId);

    if (data.personPerformingActionId) {
      const type = await this.prisma.type.findUnique({
        where: { id: data.personPerformingActionId },
        select: { code: true },
      });

      if (
        (type?.code === Code.PERSON_PERFORMING_ACTION.OTHER_PERSON)
        && !data.otherPersonPerformingAction?.trim()
      ) {
        throw new BadRequestException('Не указано иное лицо, выполняющее действие');
      }
    }

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

    if (data.personPerformingActionId) {
      const type = await this.prisma.type.findUnique({
        where: { id: data.personPerformingActionId },
        select: { code: true },
      });

      if (
        !data.otherPersonPerformingAction?.trim()
        && (type?.code === Code.PERSON_PERFORMING_ACTION.OTHER_PERSON)
        && (oldData.personPerformingAction?.code === Code.PERSON_PERFORMING_ACTION.OTHER_PERSON)
      ) {
        throw new BadRequestException('Необходимо указать иное лицо, выполняющее действие, или выбрать другое значение');
      }
    }

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
    const oldData = await this.ensureExists(id, true);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      await this.prisma.feedback.updateMany({
        where: { actionId: id, isDeleted: false },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
      });

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
          oldValue: { ...oldData },
        },
      });

      return action;
    });
  }


  /// Добавление обратной связи действия
  async createFeedback(userId: number, id: number, data: CreateActionsFeedbackDto): Promise<ActionsFeedbackDto> {
    await this.ensureExists(id);

    const { feedbackSourceIds, ...otherData } = data;

    const feedbackSources = {
      createMany: {
        data: (feedbackSourceIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.create({
        data: {
          creatorId: userId,
          actionId: id,
          ...otherData,
          ...(feedbackSources.createMany.data.length > 0 ? { feedbackSources } : {}),
        },
        select: ActionsFeedbackSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback.common,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        }
      });

      return feedback;
    });
  }


  /// Обновление обратной связи действия
  async updateFeedback(userId: number, id: number, data: UpdateActionsFeedbackDto): Promise<ActionsFeedbackDto> {
    const oldData = await this.ensureExistsFeedback(id);

    const { feedbackSourceIds, ...otherData } = data;

    const feedbackSourcesData = (feedbackSourceIds ?? []).map(typeId => ({ typeId }));

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.update({
        where: { id },
        data: {
          updaterId: userId,
          ...otherData,
          ...(feedbackSourceIds
            ? { feedbackSources: { deleteMany: {}, createMany: { data: feedbackSourcesData } } }
            : {}),
        },
        select: ActionsFeedbackSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback.common,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        }
      });

      return feedback;
    });
  }


  /// Удаление обратной связи действия
  async deleteFeedback(userId: number, id: number): Promise<ActionsFeedbackDto> {
    const oldData = await this.ensureExistsFeedback(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.update({
        where: { id },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
        select: ActionsFeedbackSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.feedback.common,
          entityId: id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
          oldValue: oldData,
        },
      });

      return feedback;
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

      return this.getAllActions(ftsFunctionDetailId);
    });
  }


  /// Изменение порядка расположения обратных связей операции
  async reorderActionsFeedbacks(userId: number, actionId: number, orderedIds: number[]): Promise<ActionBaseDto> {
    await this.ensureExists(actionId);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const oldData = await tr.feedback.findMany({
        where: { actionId },
        select: { id: true, order: true },
      });

      for (const [order, id] of orderedIds.entries()) {
        await tr.feedback.update({
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
          entityType: this.HISTORY_ENTITY_TYPE.feedback.order,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return this.getActionById(actionId);
    });
  }
}
