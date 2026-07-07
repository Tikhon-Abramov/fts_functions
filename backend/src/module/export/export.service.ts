import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ExcelService } from "../excel/excel.service";
import { downloadActionSelect, downloadFeedbackSelect, downloadFtsFunctionDetailSelect, downloadFtsFunctionSelect, downloadFtsFunctionTreeSelect } from "./export.select";
import { Category } from "src/generated/prisma/client";
import { DownloadActionEntity, DownloadFeedbackEntity, DownloadFFtsFunctionTreeEntity, DownloadFtsFunctionDetailEntity, DownloadFtsFunctionEntity } from "./export.entity";
import { Code } from "src/common/constants";


@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excel: ExcelService<true>,
  ) {}

  async getDownload(): Promise<Buffer> {
    const [
      ftsFunctions,
      ftsFunctionDetails,
      feedback,
      tree,
      actions,
      methodologyStatuses,
    ] = await Promise.all([
        this.prisma.ftsFunction.findMany({
          where: { isDeleted: false },
          select: downloadFtsFunctionSelect,
          orderBy: { id: 'asc' },
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
        this.prisma.feedback.findMany({
          where: {
            isDeleted: false,
            ftsFunctionDetail: {
              isDeleted: false,
              ftsFunction: { isDeleted: false },
              actions: { some: { isDeleted: false } }
            },
            actionId: { not: null }
          },
          select: downloadActionSelect,
          orderBy: [
            { ftsFunctionDetail: { ftsFunctionId: 'asc' } },
            { ftsFunctionDetail: { ftsFunctionStepId: 'asc' } },
            { ftsFunctionDetail: { ftsFunctionCategoryId: 'asc' } },
          ],
        }),
        this.prisma.type.findMany({
          where: { category: Category.FTS_METHODOLOGY_STATUS },
          select: { id: true, name: true },
        }),
      ]);

    const methodologyStatusNameById = new Map(
      methodologyStatuses.map((item) => [item.id, item.name]),
    );

    const workbookBuffer = await this.excel.createExcelWorkbook({
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
              map: (row: DownloadFtsFunctionEntity) =>
                row.ftsFunctionName.name,
            },
            {
              header: 'Маркер функции',
              map: (row: DownloadFtsFunctionEntity) =>
                row.ftsFunctionMarker.name,
            },
            {
              header: 'Стратегия Д, DTI',
              map: (row: DownloadFtsFunctionEntity) => {
                const dtis = row.dtis.map(({ type }) =>
                  type.name ? `${type.code}, ${type.name}` : type.code,
                );

                return dtis.join(';\n');
              },
            },
            {
              header: 'Централизация функции',
              map: (row: DownloadFtsFunctionEntity) =>
                row.ftsCentralization.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFtsFunctionEntity) =>
                row.competencyCenter.name,
            },
            {
              header: 'Куратор ЦА',
              map: (row: DownloadFtsFunctionEntity) =>
                row.curatorCentralOffice.fullName,
            },
            {
              header: 'НУ / ЗНУ',
              map: (row: DownloadFtsFunctionEntity) =>
                row.departmentHeadCentralOffice.fullName,
            },
            {
              header: 'Менеджер МИУДОЛ',
              map: (row: DownloadFtsFunctionEntity) =>
                row.managerInterregionalInspection.fullName,
            },
            {
              header: 'НИ / ЗНИ',
              map: (row: DownloadFtsFunctionEntity) =>
                row.departmentHeadInterregionalInspection.fullName,
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
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunction.competencyCenter.name,
            },
            {
              header: 'Шаг функции',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunctionStep.name,
            },
            {
              header: 'Категория функции',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunctionCategory?.name,
            },
            {
              header: 'Наименование действия',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunctionDetails,
            },
            {
              header: 'Периодичность выполнения',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunctionExecutionFrequency?.name,
            },
            {
              header: 'Сложности функции',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.ftsFunctionComplexity?.name,
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
              header: 'Лицо, выполняющее действие',
              map: (row: DownloadFtsFunctionDetailEntity) => {
                if (row.personPerformingAction?.code === Code.PERSON_PERFORMING_ACTION.OTHER_PERSON)
                  return `${row.personPerformingAction.name}: ${row.otherPersonPerformingAction}`;

                return row.personPerformingAction?.name;
              },
            },
            {
              header:
                'Полнота действий - метрика полноты отработки объектов',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.actionsСompleteness,
            },
            {
              header: 'Эффективность действий КПЭ',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.actionsEffectiveness,
            },
            {
              header: 'Технологическое решение',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.technologicalSolution?.name,
            },
            {
              header: 'Номер ПЗ / АЗ',
              map: (row: DownloadFtsFunctionDetailEntity) => row.number,
            },
            {
              header: 'Ответственный',
              map: (row: DownloadFtsFunctionDetailEntity) =>
                row.responsible?.name,
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
              map: (row: DownloadFeedbackEntity) =>
                row.ftsFunctionDetail?.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFeedbackEntity) =>
                row.ftsFunctionDetail?.id,
            },
            {
              header: 'ID обратной связи',
              map: (row: DownloadFeedbackEntity) => row.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFeedbackEntity) =>
                row.ftsFunctionDetail?.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFeedbackEntity) =>
                row.ftsFunctionDetail?.ftsFunction.competencyCenter.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFeedbackEntity) =>
                row.ftsFunctionDetail?.ftsFunctionDetails,
            },
            {
              header: 'Источники обратной связи',
              map: (row: DownloadFeedbackEntity) =>
                row.feedbackSources
                  .map(({ type }) => type.name)
                  .join(';\n'),
            },
            {
              header: 'Метрики качества процесса в рамках обратной связи',
              map: (row: DownloadFeedbackEntity) =>
                row.feedbackQualityMetrics?.name,
            },
            {
              header:
                'Описание проблемы с указанием источника, метрики, способа решения',
              map: (row: DownloadFeedbackEntity) => row.problemDescription,
            },
            {
              header: 'Реквизиты автора инициативы',
              map: (row: DownloadFeedbackEntity) => row.initiatorRequisites,
            },
            {
              header: 'Методология позиции ЦА ФНС России',
              map: (row: DownloadFeedbackEntity) =>
                row.ftsMethodologyStatus?.name,
            },
            {
              header: 'Акцепт автора инициативы',
              map: (row: DownloadFeedbackEntity) => row.initiatorAcceptance,
            },
            {
              header: 'Срок реализации доработки',
              map: (row: DownloadFeedbackEntity) => row.deadline,
            },
            {
              header: 'Согласовано',
              map: (row: DownloadFeedbackEntity) => row.acceptStatus?.name,
            },
          ],
        },
        {
          name: 'Дерево функций',
          data: tree,
          columns: [
            {
              header: 'ID функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.parentFtsFunction.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.parentFtsFunction.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.parentFtsFunction.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.parentFtsFunction.ftsFunction.competencyCenter.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.parentFtsFunction.ftsFunctionDetails,
            },
            {
              header: '',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.relationType.name,
            },
            {
              header: 'ID функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.childFtsFunction.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.childFtsFunction.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.childFtsFunction.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.childFtsFunction.ftsFunction.competencyCenter.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadFFtsFunctionTreeEntity) =>
                row.childFtsFunction.ftsFunctionDetails,
            },
          ],
        },
        {
          name: 'Операции',
          data: actions,
          columns: [
            {
              header: 'ID функции',
              map: (row: DownloadActionEntity) =>
                row.ftsFunctionDetail?.ftsFunction.id,
            },
            {
              header: 'ID детализации',
              map: (row: DownloadActionEntity) => row.ftsFunctionDetail?.id,
            },
            {
              header: 'Наименование функции',
              map: (row: DownloadActionEntity) => row.ftsFunctionDetail?.ftsFunction.ftsFunctionName.name,
            },
            {
              header: 'Центр компетенции',
              map: (row: DownloadActionEntity) => row.ftsFunctionDetail?.ftsFunction.competencyCenter.name,
            },
            {
              header: 'Детализация функции',
              map: (row: DownloadActionEntity) => row.ftsFunctionDetail?.ftsFunctionDetails,
            },
            {
              header: 'Статус',
              map: (row: DownloadActionEntity) => row.action?.status.name,
            },
            {
              header: 'Описание',
              map: (row: DownloadActionEntity) => row.action?.description,
            },
            {
              header: 'Источники обратной связи',
              map: (row: DownloadActionEntity) =>
                row.feedbackSources
                  .map(({ type }) => type.name)
                  .join(';\n'),
            },
            {
              header: 'Метрики качества процесса в рамках обратной связи',
              map: (row: DownloadActionEntity) =>
                row.feedbackQualityMetrics?.name,
            },
            {
              header: 'Методология позиции ЦА ФНС России',
              map: (row: DownloadActionEntity) =>
                methodologyStatusNameById.get(row.ftsMethodologyStatusId ?? 0),
            },
            {
              header:
                'Описание проблемы с указанием источника, метрики, способа решения',
              map: (row: DownloadActionEntity) => row.problemDescription,
            },
            {
              header: 'Реквизиты автора инициативы',
              map: (row: DownloadActionEntity) => row.initiatorRequisites,
            },
            {
              header: 'Срок реализации доработки',
              map: (row: DownloadActionEntity) => row.deadline,
            },
            {
              header: 'Акцепт автора инициативы',
              map: (row: DownloadActionEntity) =>
                row.initiatorAcceptance,
            },
          ],
        },
      ],
    });

    return Buffer.from(workbookBuffer as unknown as Uint8Array);
  }
}
