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

function trimValue(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function findTypeIdByCategoryAndCodeOrName(
    types: TypeResponseDto[] | undefined,
    category: TypeCategory,
    value: string | undefined | null,
): number | null {
  return findTypeByCodeOrName(types, category, value)?.id ?? null;
}

function resolveRequiredTypeId(
    types: TypeResponseDto[] | undefined,
    category: TypeCategory,
    value: string | undefined | null,
): number | null {
  const trimmed = trimValue(value);
  if (!trimmed) return null;

  return findTypeIdByCategoryAndCodeOrName(types, category, trimmed);
}

function hasFeedbackFields(item: DetailInput): boolean {
  return Boolean(
      trimValue(item.feedbackSource) ||
      trimValue(item.feedbackQualityMetric) ||
      trimValue(item.problemDescription) ||
      trimValue(item.initiatorRequisites) ||
      trimValue(item.methodologyPosition) ||
      trimValue(item.deadline) ||
      trimValue(item.initiatorAcceptance),
  );
}

export function resolveDetailDto(
    item: DetailInput,
    types: TypeResponseDto[] | undefined,
): ResolvedDetailDto | null {
  const stepId = resolveRequiredTypeId(
      types,
      DETAIL_TYPE_CATEGORY.FTS_FUNCTION_STEP,
      item.step,
  );

  const categoryId = resolveRequiredTypeId(
      types,
      DETAIL_TYPE_CATEGORY.FTS_FUNCTION_CATEGORY,
      item.category,
  );

  const actionId = resolveRequiredTypeId(
      types,
      DETAIL_TYPE_CATEGORY.FTS_FUNCTION_ACTION_TYPE,
      item.actionLabel,
  );

  if (stepId == null || categoryId == null || actionId == null) return null;

  let complexityId: number | null = null;

  if (item.complexity) {
    complexityId = resolveRequiredTypeId(
        types,
        DETAIL_TYPE_CATEGORY.FTS_FUNCTION_COMPLEXITY,
        item.complexity,
    );

    if (complexityId == null) return null;
  }

  let frequencyId: number | null = null;

  if (item.periodicity) {
    frequencyId = resolveRequiredTypeId(
        types,
        DETAIL_TYPE_CATEGORY.FTS_FUNCTION_EXECUTION_FREQUENCY,
        item.periodicity,
    );

    if (frequencyId == null) return null;
  }

  let whoPerformsActionId: number | null = null;

  if (trimValue(item.who)) {
    whoPerformsActionId = resolveRequiredTypeId(
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
          ? resolveRequiredTypeId(
              types,
              DETAIL_TYPE_CATEGORY.TECHNOLOGICAL_SOLUTION,
              technologicalSolutionCode,
          )
          : null;

  if (technologicalSolutionCode && technologicalSolutionId === null) {
    return null;
  }

  const number = trimValue(item.number);
  const responsibleCode = trimValue(item.responsible);
  const algorithm = trimValue(item.algorithm);

  let responsibleId: number | null = null;

  if (technologicalSolutionId !== null) {
    const technologyFields = {
      technologicalSolution: technologicalSolutionCode,
      number,
      responsible: responsibleCode,
      algorithm,
    };

    if (!areTechnologyRequiredFieldsFilled(technologyFields)) return null;
    if (!number || !responsibleCode || !algorithm) return null;

    responsibleId = resolveRequiredTypeId(
        types,
        DETAIL_TYPE_CATEGORY.RESPONSIBLE,
        responsibleCode,
    );

    if (responsibleId === null) return null;
  }

  const includeFeedbackFields =
      includeActualActionFields && hasFeedbackFields(item);

  const feedbackSourceCode = includeFeedbackFields
      ? trimValue(item.feedbackSource)
      : "";

  const feedbackSourceId =
      feedbackSourceCode.length > 0
          ? resolveRequiredTypeId(
              types,
              DETAIL_TYPE_CATEGORY.FEEDBACK_SOURCE,
              feedbackSourceCode,
          )
          : null;

  const feedbackQualityMetricCode = includeFeedbackFields
      ? trimValue(item.feedbackQualityMetric)
      : "";

  const feedbackQualityMetricsId =
      feedbackQualityMetricCode.length > 0
          ? resolveRequiredTypeId(
              types,
              DETAIL_TYPE_CATEGORY.FEEDBACK_QUALITY_METRICS,
              feedbackQualityMetricCode,
          )
          : null;

  const problemDescription = trimValue(item.problemDescription);
  const initiatorRequisites = trimValue(item.initiatorRequisites);
  const methodologyPosition = trimValue(item.methodologyPosition);
  const deadline = trimValue(item.deadline);
  const initiatorAcceptance = trimValue(item.initiatorAcceptance);

  if (includeFeedbackFields) {
    const feedbackFields = {
      feedbackSource: feedbackSourceCode,
      feedbackQualityMetric: feedbackQualityMetricCode,
      problemDescription,
      initiatorRequisites,
      methodologyPosition,
      deadline,
      initiatorAcceptance,
    };

    if (!areFeedbackRequiredFieldsFilled(feedbackFields)) return null;

    if (feedbackSourceId === null || feedbackQualityMetricsId === null) {
      return null;
    }
  }

  const feedbackPayload: Record<string, unknown> = includeFeedbackFields
      ? {
        feedbackSourceIds: feedbackSourceId === null ? [] : [feedbackSourceId],
        feedbackQualityMetricsId,
        ftsMethodologyStatusId: null,
        methodologyPosition: methodologyPosition || null,
        problemDescription: problemDescription || null,
        initiatorRequisites: initiatorRequisites || null,
        deadline: deadline || null,
        initiatorAcceptance: initiatorAcceptance || null,
        isAccepted: item.isAccepted ?? null,
        rejectComment: trimValue(item.rejectComment) || null,
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
    artifact: trimValue(item.artifact) || null,
    basis: trimValue(item.basis) || null,
    artifactUsage: trimValue(item.artifactUsage) || null,
    purpose: trimValue(item.purpose) || null,

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
  };
}