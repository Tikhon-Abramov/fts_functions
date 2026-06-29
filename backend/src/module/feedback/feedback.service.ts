import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto, AcceptFeedbackDto, FeedbackItemsDto, FeedbackBaseDto } from './feedback.schema';
import { FeedbackPreviewSelect, FeedbackBaseSelect } from './feedback.select';
import { Code, HistoryEntityType } from 'src/common/constants';


@Injectable()
export class FeedbackService {
  private readonly HISTORY_ENTITY_TYPE = HistoryEntityType.FEEDBACK;

  constructor(private readonly prisma: PrismaService) { }


  private async ensureExists(id: number) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
      select: {
        isDeleted: true,
        ...FeedbackBaseSelect,
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Обратная связь не найдена');
    }

    return existing;
  }


  private async ensureExistsFtsFunctionDetail(id: number) {
    const existing = await this.prisma.ftsFunctionDetail.findUnique({
      where: { id },
      select: { isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Детализация функции не найдена');
    }
  }


  /// Получение всего списка обратной связи
  async getAllFeedbacks(ftsFunctionDetailId: number): Promise<FeedbackItemsDto> {
    await this.ensureExistsFtsFunctionDetail(ftsFunctionDetailId);

    return this.prisma.feedback.findMany({
      where: {
        isDeleted: false,
        ftsFunctionDetailId,
      },
      select: FeedbackPreviewSelect,
      orderBy: [{ order: 'asc' }, { id: 'desc' }],
    });
  }


  async getFeedbackById(id: number): Promise<FeedbackBaseDto> {
    return this.ensureExists(id);
  }


  /// Создание обратной связи
  async create(userId: number, data: CreateFeedbackDto): Promise<FeedbackBaseDto> {
    await this.ensureExistsFtsFunctionDetail(data.ftsFunctionDetailId);

    const { ftsFunctionDetailId, feedbackQualityMetricsId, ftsMethodologyStatusId, feedbackSourceIds, ...otherData } = data;

    const feedbackSources = {
      createMany: {
        data: (feedbackSourceIds ?? []).map(typeId => ({ typeId })),
      },
    };

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.create({
        data: {
          creator: { connect: { id: userId } },
          ...otherData,
          ftsFunctionDetail: { connect: { id: ftsFunctionDetailId } },
          feedbackQualityMetrics: { connect: { id: feedbackQualityMetricsId } },
          ftsMethodologyStatus: { connect: { id: ftsMethodologyStatusId } },
          ...(feedbackSources.createMany.data.length > 0 ? { feedbackSources } : {}),
          acceptStatus: { connect: { code: Code.FEEDBACK_ACCEPT_STATUS.PENDING } },
          agreementHistory: {
            create: {
              acceptor: { connect: { id: userId } },
              acceptStatus: {
                connect: { code: Code.FEEDBACK_ACCEPT_STATUS.PENDING }
              },
            },
          },
        },
        select: FeedbackBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.INSERT } },
        },
      });

      return feedback;
    });
  }


  /// Обновление обратной связи
  async update(userId: number, id: number, data: UpdateFeedbackDto): Promise<FeedbackBaseDto> {
    const oldData = await this.ensureExists(id);

    const { ftsFunctionDetailId, feedbackQualityMetricsId, ftsMethodologyStatusId, feedbackSourceIds, ...otherData } = data;

    const feedbackSources = {
      deleteMany: {},
      createMany: {
        data: (feedbackSourceIds ?? []).map(typeId => ({ typeId })),
      },
    };

    const acceptStatus = {
      connect: { code: Code.FEEDBACK_ACCEPT_STATUS.PENDING },
    };

    const agreementHistory = {
      create: {
        acceptor: { connect: { id: userId } },
        acceptStatus: {
          connect: { code: Code.FEEDBACK_ACCEPT_STATUS.PENDING }
        },
      },
    };

    const isRejected = oldData.acceptStatus.code === Code.FEEDBACK_ACCEPT_STATUS.REJECTED;

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.update({
        where: { id },
        data: {
          updater: { connect: { id: userId } },
          ...otherData,
          ...(ftsFunctionDetailId !== undefined ? { ftsFunctionDetail: { connect: { id: ftsFunctionDetailId } } } : {}),
          ...(feedbackQualityMetricsId !== undefined ? { feedbackQualityMetrics: { connect: { id: feedbackQualityMetricsId } } } : {}),
          ...(ftsMethodologyStatusId !== undefined ? { ftsMethodologyStatus: { connect: { id: ftsMethodologyStatusId } } } : {}),
          ...(feedbackSources.createMany.data.length > 0 ? { feedbackSources } : {}),
          ...(isRejected ? { acceptStatus } : {}),
          ...(isRejected ? { agreementHistory } : {})
        },
        select: FeedbackBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return feedback;
    });
  }


  /// Логическое удаление обратной связи
  async delete(userId: number, id: number): Promise<FeedbackBaseDto> {
    await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const feedback = await tr.feedback.update({
        where: { id },
        data: {
          deleterId: userId,
          isDeleted: true,
          deletedAt: now,
        },
        select: FeedbackBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.common,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.DELETE } },
        },
      });

      return feedback;
    });
  }


  /// Согласование обратной связи (акцепт / отказ)
  async accept(userId: number, id: number, data: AcceptFeedbackDto): Promise<FeedbackBaseDto> {
    const oldData = await this.ensureExists(id);

    const now = new Date();

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const status = await tr.type.findUnique({
        where: { id: data.acceptStatusId },
        select: { code: true },
      });

      if (!status) {
        throw new NotFoundException('Статус согласования не найден');
      }

      const isAccepted = status.code === Code.FEEDBACK_ACCEPT_STATUS.ACCEPTED;

      const feedback = await tr.feedback.update({
        where: { id },
        data: {
          acceptor: { connect: { id: userId } },
          acceptStatus: { connect: { id: data.acceptStatusId } },
          acceptedAt: isAccepted ? now : null,
          agreementHistory: {
            create: {
              acceptor: { connect: { id: userId } },
              acceptStatus: { connect: { id: data.acceptStatusId } },
              comment: data.comment ?? null,
            },
          },
        },
        select: FeedbackBaseSelect,
      });

      await tr.historyLog.create({
        data: {
          user: { connect: { id: userId } },
          entityType: this.HISTORY_ENTITY_TYPE.accept,
          entityId: feedback.id,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return feedback;
    });
  }


  /// Изменение порядка расположения обратных связей
  async reorderFeedbacks(userId: number, ftsFunctionDetailId: number, orderedIds: number[]): Promise<FeedbackItemsDto> {
    await this.ensureExistsFtsFunctionDetail(ftsFunctionDetailId);

    return this.prisma.$transaction(async (tr: Prisma.TransactionClient) => {
      const oldData = await tr.feedback.findMany({
        where: { ftsFunctionDetailId },
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
          entityType: this.HISTORY_ENTITY_TYPE.order,
          actionType: { connect: { code: Code.ACTION_HISTORY_TYPE.UPDATE } },
          oldValue: oldData,
        },
      });

      return this.getAllFeedbacks(ftsFunctionDetailId);
    });
  }
}
