import type {
  Feedback,
  FeedbackFormInput,
  Row,
} from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import {
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";

export type TypeCategory = string;

export const DETAIL_TYPE_CATEGORY = {
  FTS_FUNCTION_STEP: "FTS_FUNCTION_STEP",
  FTS_FUNCTION_CATEGORY: "FTS_FUNCTION_CATEGORY",
  FTS_FUNCTION_COMPLEXITY: "FTS_FUNCTION_COMPLEXITY",
  FTS_FUNCTION_EXECUTION_FREQUENCY: "FTS_FUNCTION_EXECUTION_FREQUENCY",
  WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION",
  FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE",
  FTS_FUNCTION_EFFECTIVENESS: "FTS_FUNCTION_EFFECTIVENESS",
  TECHNOLOGICAL_SOLUTION: "TECHNOLOGICAL_SOLUTION",
  FEEDBACK_SOURCE: "FEEDBACK_SOURCE",
  FEEDBACK_QUALITY_METRICS: "FEEDBACK_QUALITY_METRICS",
  RESPONSIBLE: "RESPONSIBLE",
  FTS_METHODOLOGY_STATUS: "FTS_METHODOLOGY_STATUS",
} as const;

export const TECHNOLOGY_DETAIL_LABELS = {
  technologicalSolution: "Технологическое решение",
  number: "Номер ПЗ / АЗ",
  responsible: "Ответственный",
  algorithm: "Алгоритм срабатывания",
} as const;

export const FEEDBACK_DETAIL_LABELS = {
  feedbackSource: "Источник обратной связи",
  feedbackQualityMetric: "Метрики качества процесса в рамках обратной связи",
  methodologyPosition: "Методология позиции ЦА ФНС России",
  methodologyStatus: "Методология позиции ЦА ФНС России",
  problemDescription:
    "Описание проблемы с указанием источника, метрики, способа решения",
  initiatorRequisites: "Реквизиты автора инициативы",
  deadline: "Срок реализации доработки",
  initiatorAcceptance: "Акцепт автора инициативы",
} as const;

export type TechnologyFieldsShape = Pick<
  Row,
  "technologicalSolution" | "number" | "responsible" | "algorithm"
>;

export type FeedbackStatus = "pending" | "accepted" | "rejected";

function normalizeDictionaryValue(value: string | undefined | null): string {
  return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

export function isActualActionCategory(
  category: string | undefined | null,
): boolean {
  return category === FtsFunctionCategory.ACTUAL_ACTION;
}

export function getAlgorithmAttachmentLabel(
  step: string | undefined | null,
): string {
  return step === FtsFunctionStep.CLUSTERING_IMPACT
    ? "Результат отработки"
    : "Алгоритм срабатывания";
}

export function getTypeCodeOptionsByCategory(
  typesAll: TypeResponseDto[] | undefined,
  category: TypeCategory,
): TypeResponseDto[] {
  return (typesAll ?? []).filter((item) => String(item.category) === category);
}

export function getTypeNameOptionsByCategory(
  typesAll: TypeResponseDto[] | undefined,
  category: TypeCategory,
): string[] {
  return getTypeCodeOptionsByCategory(typesAll, category).map(
    (item) => item.name,
  );
}

export function findTypeByCodeOrName(
  typesAll: TypeResponseDto[] | undefined,
  category: TypeCategory,
  value: string | undefined | null,
): TypeResponseDto | undefined {
  const normalized = normalizeDictionaryValue(value);

  if (!normalized) return undefined;

  return (typesAll ?? []).find((item) => {
    if (String(item.category) !== category) return false;

    return (
      normalizeDictionaryValue(item.code) === normalized ||
      normalizeDictionaryValue(item.name) === normalized
    );
  });
}

export function hasTechnologicalSolution(
  fields: Partial<TechnologyFieldsShape>,
): boolean {
  return Boolean(fields.technologicalSolution?.trim());
}

export function areTechnologyRequiredFieldsFilled(
  fields: Partial<TechnologyFieldsShape>,
): boolean {
  if (!hasTechnologicalSolution(fields)) return true;

  return Boolean(
    fields.number?.trim() &&
      fields.responsible?.trim() &&
      fields.algorithm?.trim(),
  );
}

export function cleanupTechnologyFields<T extends TechnologyFieldsShape>(
  fields: T,
  enabled: boolean,
): T {
  if (enabled && fields.technologicalSolution?.trim()) return fields;

  return {
    ...fields,
    technologicalSolution: "",
    number: "",
    responsible: "",
    algorithm: "",
  };
}

export function hasFeedback(
  feedback: Partial<Feedback | FeedbackFormInput> | null | undefined,
): boolean {
  if (!feedback) return false;

  return Boolean(
    feedback.feedbackSourceIds?.length ||
      feedback.feedbackQualityMetricId ||
      feedback.ftsMethodologyStatusId ||
      feedback.problemDescription?.trim() ||
      feedback.initiatorRequisites?.trim() ||
      feedback.deadline?.trim() ||
      feedback.initiatorAcceptance?.trim(),
  );
}

export function areFeedbackRequiredFieldsFilled(
  fields: Partial<FeedbackFormInput>,
): boolean {
  return Boolean(
    fields.feedbackSourceIds?.length &&
      fields.feedbackQualityMetricId?.trim() &&
      fields.ftsMethodologyStatusId?.trim() &&
      fields.problemDescription?.trim() &&
      fields.initiatorRequisites?.trim() &&
      fields.deadline?.trim() &&
      fields.initiatorAcceptance?.trim(),
  );
}

export function getFeedbackStatus(
  feedback: Partial<Feedback> | null | undefined,
): FeedbackStatus | null {
  if (!hasFeedback(feedback)) return null;

  if (feedback?.isAccepted === true) return "accepted";
  if (feedback?.isAccepted === false) return "rejected";

  return "pending";
}
