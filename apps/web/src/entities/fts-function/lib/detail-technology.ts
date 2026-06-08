import type {
  Feedback,
  FeedbackFormInput,
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
  ACTION_STATUS: "ACTION_STATUS",
} as const;

export const TECHNOLOGY_DETAIL_LABELS = {
  technologicalSolution: "Технологическое решение",
  number: "Номер ПЗ / АЗ",
  responsible: "Ответственный",
  algorithm: "Результат отработки",
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

export type TechnologyFieldsShape = {
  step?: string | undefined;
  technologicalSolution?: string | undefined;
  number?: string | undefined;
  responsible?: string | undefined;
  algorithm?: string | undefined;
  filePath?: string | undefined;
};

export type FeedbackStatus = "pending" | "accepted" | "rejected";

const TECHNOLOGY_TASK_OPTION_NAME_PARTS = [
  "автоматическое задание",
  "пользовательское задание",
] as const;

function normalizeDictionaryValue(value: string | undefined | null): string {
  return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

function trim(value: string | undefined | null): string {
  return value?.trim() ?? "";
}

export function isActualActionCategory(
  category: string | undefined | null,
): boolean {
  return category === FtsFunctionCategory.ACTUAL_ACTION;
}

export function shouldShowTechnologyResultFields(
  step: string | undefined | null,
): boolean {
  return step === FtsFunctionStep.OBJECT_SELECTION;
}

export function getAlgorithmAttachmentLabel(
  _step: string | undefined | null,
): string {
  return "Результат отработки";
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
  fields: TechnologyFieldsShape | null | undefined,
): boolean {
  return Boolean(trim(fields?.technologicalSolution));
}

export function isTechnologyTaskSolution(
  value: string | undefined | null,
  typesAll: TypeResponseDto[] | undefined,
): boolean {
  const type = findTypeByCodeOrName(
    typesAll,
    DETAIL_TYPE_CATEGORY.TECHNOLOGICAL_SOLUTION,
    value,
  );

  const normalized = normalizeDictionaryValue(
    `${type?.name ?? ""} ${type?.code ?? ""} ${value ?? ""}`,
  );

  return TECHNOLOGY_TASK_OPTION_NAME_PARTS.some((part) =>
    normalized.includes(part),
  );
}

export function hasAlgorithmTextOrFile(
  fields: TechnologyFieldsShape | null | undefined,
): boolean {
  return Boolean(trim(fields?.algorithm) || trim(fields?.filePath));
}

export function areTechnologyRequiredFieldsFilled(
  fields: TechnologyFieldsShape | null | undefined,
  typesAll: TypeResponseDto[] | undefined,
): boolean {
  if (!hasTechnologicalSolution(fields)) return true;

  const taskFieldsRequired = isTechnologyTaskSolution(
    fields?.technologicalSolution,
    typesAll,
  );

  const taskFieldsFilled = !taskFieldsRequired
    ? true
    : Boolean(trim(fields?.number) && trim(fields?.responsible));

  const resultFieldsFilled = !shouldShowTechnologyResultFields(fields?.step)
    ? true
    : hasAlgorithmTextOrFile(fields);

  return taskFieldsFilled && resultFieldsFilled;
}

export function cleanupTechnologyFields<T extends TechnologyFieldsShape>(
  fields: T,
  enabled: boolean,
): T {
  if (enabled && trim(fields.technologicalSolution)) return fields;

  return {
    ...fields,
    technologicalSolution: "",
    number: "",
    responsible: "",
    algorithm: "",
    filePath: "",
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
  fields: Partial<FeedbackFormInput> | null | undefined,
): boolean {
  return Boolean(
    fields?.feedbackSourceIds?.length &&
      fields?.feedbackQualityMetricId?.trim() &&
      fields?.ftsMethodologyStatusId?.trim() &&
      fields?.problemDescription?.trim() &&
      fields?.initiatorRequisites?.trim() &&
      fields?.deadline?.trim() &&
      fields?.initiatorAcceptance?.trim(),
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
