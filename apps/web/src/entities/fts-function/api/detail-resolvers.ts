import type {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";
import type {
  CreateFtsFunctionDetailDto,
  TypeResponseDto,
  UpdateFtsFunctionDetailDto,
} from "src/shared/api/ftsFunctionsApi";

import {
  areFeedbackRequiredFieldsFilled,
  areTechnologyRequiredFieldsFilled,
  DETAIL_TYPE_CATEGORY,
  findTypeByCodeOrName,
  hasFeedback,
  isActualActionCategory,
  type TypeCategory,
} from "src/entities/fts-function/lib/detail-technology";

export type ResolvedDetailDto = CreateFtsFunctionDetailDto &
    UpdateFtsFunctionDetailDto &
    Record<string, unknown>;

export type DetailInput = {
  step: FtsFunctionStep;
  category: FtsFunctionCategory;
  actionLabel: FtsFunctionActionType | "";
  periodicity?: FtsFunctionExecutionFrequency | "" | undefined;
  complexity?: FtsFunctionComplexity | "" | undefined;
  detailText?: string | undefined;
  who?: string | undefined;
  artifact?: string | undefined;
  basis?: string | undefined;
  artifactUsage?: string | undefined;
  purpose?: string | undefined;

  technologicalSolution?: string | undefined;
  number?: string | undefined;
  responsible?: string | undefined;
  algorithm?: string | undefined;

  feedbackSource?: string | undefined;
  feedbackQualityMetric?: string | undefined;
  problemDescription?: string | undefined;
  initiatorRequisites?: string | undefined;
  methodologyPosition?: string | undefined;
  deadline?: string | undefined;
  initiatorAcceptance?: string | undefined;
  isAccepted?: boolean | null | undefined;
  rejectComment?: string | undefined;
};

function trimValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function findTypeIdByCategoryAndCodeOrName(
    types: TypeResponseDto[] | undefined,
    category: TypeCategory,
    value: string | undefined | null,
): number | null {
  return findTypeByCodeOrName(types, category, value)?.id ?? null;
}

export function resolveDetailDto(
    item: DetailInput,
    types: TypeResponseDto[] | undefined,
): ResolvedDetailDto | null {
  const stepId = findTypeIdByCategoryAndCodeOrName(
      types,
      DETAIL_TYPE_CATEGORY.FTS_FUNCTION_STEP,
      item.step,
  );

  const categoryId = findTypeIdByCategoryAndCodeOrName(
      types,
      DETAIL_TYPE_CATEGORY.FTS_FUNCTION_CATEGORY,
      item.category,
  );

  const actionId = item.actionLabel
      ? findTypeIdByCategoryAndCodeOrName(
          types,
          DETAIL_TYPE_CATEGORY.FTS_FUNCTION_ACTION_TYPE,
          item.actionLabel,
      )
      : null;

  if (stepId == null || categoryId == null || actionId == null) return null;

  let complexityId: number | null = null;

  if (item.complexity) {
    complexityId = findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.FTS_FUNCTION_COMPLEXITY,
        item.complexity,
    );

    if (complexityId == null) return null;
  }

  let frequencyId: number | null = null;

  if (item.periodicity) {
    frequencyId = findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.FTS_FUNCTION_EXECUTION_FREQUENCY,
        item.periodicity,
    );

    if (frequencyId == null) return null;
  }

  let whoPerformsActionId: number | null = null;

  if (item.who && item.who.trim().length > 0) {
    whoPerformsActionId = findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.WHO_PERFORMS_ACTION,
        item.who,
    );
  }

  const includeActualActionFields = isActualActionCategory(item.category);

  const technologicalSolutionCode = includeActualActionFields
      ? trimValue(item.technologicalSolution)
      : "";

  const technologicalSolutionId =
      technologicalSolutionCode.length > 0
          ? findTypeIdByCategoryAndCodeOrName(
              types,
              DETAIL_TYPE_CATEGORY.TECHNOLOGICAL_SOLUTION,
              technologicalSolutionCode,
          )
          : null;

  if (technologicalSolutionCode && technologicalSolutionId === null) {
    return null;
  }

  const number = trimValue(item.number);
  const responsibleValue = trimValue(item.responsible);
  const algorithm = trimValue(item.algorithm);

  let responsibleId: number | null = null;

  if (technologicalSolutionId !== null) {
    if (!areTechnologyRequiredFieldsFilled(item)) return null;
    if (!number || !responsibleValue || !algorithm) return null;

    responsibleId = findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.RESPONSIBLE,
        responsibleValue,
    );

    if (responsibleId === null) return null;
  }

  const includeFeedbackFields = includeActualActionFields && hasFeedback(item);

  const feedbackSourceCode = includeFeedbackFields
      ? trimValue(item.feedbackSource)
      : "";

  const feedbackSourceId =
      feedbackSourceCode.length > 0
          ? findTypeIdByCategoryAndCodeOrName(
              types,
              DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
              feedbackSourceCode,
          )
          : null;

  const feedbackQualityMetricCode = includeFeedbackFields
      ? trimValue(item.feedbackQualityMetric)
      : "";

  const ftsFunctionEffectivenessId =
      feedbackQualityMetricCode.length > 0
          ? findTypeIdByCategoryAndCodeOrName(
              types,
              DETAIL_TYPE_CATEGORY.FTS_FUNCTION_EFFECTIVENESS,
              feedbackQualityMetricCode,
          )
          : null;

  if (includeFeedbackFields) {
    if (!areFeedbackRequiredFieldsFilled(item)) return null;

    if (feedbackSourceId === null || ftsFunctionEffectivenessId === null) {
      return null;
    }
  }

  const feedbackPayload: Record<string, unknown> = includeFeedbackFields
      ? {
        feedbackSourceIds: feedbackSourceId === null ? [] : [feedbackSourceId],
        ftsFunctionEffectivenessId,
        ftsMethodologyStatusId: null,
        methodologyPosition: item.methodologyPosition?.trim() || null,
        problemDescription: item.problemDescription?.trim() || null,
        initiatorRequisites: item.initiatorRequisites?.trim() || null,
        deadline: item.deadline?.trim() || null,
        initiatorAcceptance: item.initiatorAcceptance?.trim() || null,
        isAccepted: item.isAccepted ?? null,
        rejectComment: item.rejectComment?.trim() || null,
      }
      : {};

  const dto: ResolvedDetailDto = {
    ftsFunctionStepId: stepId,
    ftsFunctionCategoryId: categoryId,
    ftsFunctionActionTypeId: actionId,
    ftsFunctionComplexityId: complexityId,
    ftsFunctionExecutionFrequencyId: frequencyId,
    whoPerformsActionId,
    ftsFunctionDetails: item.detailText ?? "",
    artifact: item.artifact?.trim() || null,
    basis: item.basis?.trim() || null,
    artifactUsage: item.artifactUsage?.trim() || null,
    purpose: item.purpose?.trim() || null,

    technologicalSolutionId,
    responsibleId,
    number: technologicalSolutionId !== null ? number : null,
    algorithm: technologicalSolutionId !== null ? algorithm : null,

    ...feedbackPayload,
  };

  return dto;
}

export function buildDetailInputFromRow(
    existing: Row,
    updates: Partial<Row>,
): DetailInput {
  const merged = { ...existing, ...updates };

  return {
    step: merged.step,
    category: merged.category,
    actionLabel: merged.actionLabel,
    periodicity: merged.periodicity,
    complexity: merged.complexity,
    detailText: merged.detailText,
    who: merged.who,
    artifact: merged.artifact,
    basis: merged.basis,
    artifactUsage: merged.artifactUsage,
    purpose: merged.purpose,

    technologicalSolution: merged.technologicalSolution,
    number: merged.number,
    responsible: merged.responsible,
    algorithm: merged.algorithm,

    feedbackSource: merged.feedbackSource,
    feedbackQualityMetric: merged.feedbackQualityMetric,
    problemDescription: merged.problemDescription,
    initiatorRequisites: merged.initiatorRequisites,
    methodologyPosition: merged.methodologyPosition,
    deadline: merged.deadline,
    initiatorAcceptance: merged.initiatorAcceptance,
    isAccepted: merged.isAccepted,
    rejectComment: merged.rejectComment,
  };
}