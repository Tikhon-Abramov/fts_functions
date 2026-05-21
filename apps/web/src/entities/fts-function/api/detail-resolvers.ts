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

import { findTypeIdByCode } from "src/entities/fts-function/api/mappers";
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

function findTypeIdByCodeOrNull(
    types: TypeResponseDto[] | undefined,
    code: string,
): number | null {
  return findTypeIdByCode(types, code) ?? null;
}

function findTypeIdByCategoryAndName(
    types: TypeResponseDto[] | undefined,
    category: TypeCategory,
    name: string,
): number | null {
  const trimmed = name.trim();

  if (!trimmed) return null;

  return (
      (types ?? []).find(
          (type) => type.category === category && type.name === trimmed,
      )?.id ?? null
  );
}

function findTypeIdByCategoryAndCodeOrName(
    types: TypeResponseDto[] | undefined,
    category: TypeCategory,
    value: string,
): number | null {
  return findTypeByCodeOrName(types, category, value)?.id ?? null;
}

export function resolveDetailDto(
    item: DetailInput,
    types: TypeResponseDto[] | undefined,
): ResolvedDetailDto | null {
  if (!item.actionLabel) return null;

  const stepId = findTypeIdByCode(types, item.step);
  const categoryId = findTypeIdByCode(types, item.category);
  const actionId = findTypeIdByCode(types, item.actionLabel);

  if (stepId == null || categoryId == null || actionId == null) return null;

  let complexityId: number | null = null;

  if (item.complexity) {
    const id = findTypeIdByCode(types, item.complexity);
    if (id == null) return null;
    complexityId = id;
  }

  let frequencyId: number | null = null;

  if (item.periodicity) {
    const id = findTypeIdByCode(types, item.periodicity);
    if (id == null) return null;
    frequencyId = id;
  }

  let whoPerformsActionId: number | null = null;

  if (item.who && item.who.trim().length > 0) {
    whoPerformsActionId = findTypeIdByCategoryAndName(
        types,
        DETAIL_TYPE_CATEGORY.WHO_PERFORMS_ACTION,
        item.who,
    );
  }

  const includeActualActionFields = isActualActionCategory(item.category);

  const technologicalSolutionCode = includeActualActionFields
      ? trimValue(item.technologicalSolution)
      : "";

  const technologicalSolutionId: string | number | null =
      technologicalSolutionCode.length > 0
          ? findTypeIdByCodeOrNull(types, technologicalSolutionCode)
          : null;

  if (technologicalSolutionCode && technologicalSolutionId === null) {
    return null;
  }

  const number = trimValue(item.number);
  const responsibleName = trimValue(item.responsible);
  const algorithm = trimValue(item.algorithm);

  let responsibleId: string | number | null = null;

  if (technologicalSolutionId !== null) {
    if (!areTechnologyRequiredFieldsFilled(item)) return null;
    if (!number || !responsibleName || !algorithm) return null;

    responsibleId = findTypeIdByCategoryAndName(
        types,
        DETAIL_TYPE_CATEGORY.RESPONSIBLE,
        responsibleName,
    );

    if (responsibleId === null) return null;
  }

  const includeFeedbackFields = includeActualActionFields && hasFeedback(item);

  const feedbackSourceCode = includeFeedbackFields
      ? trimValue(item.feedbackSource)
      : "";

  const feedbackSourceId: string | number | null =
      feedbackSourceCode.length > 0
          ? findTypeIdByCodeOrNull(types, feedbackSourceCode)
          : null;

  const feedbackQualityMetricCode = includeFeedbackFields
      ? trimValue(item.feedbackQualityMetric)
      : "";

  const ftsFunctionEffectivenessId: string | number | null =
      feedbackQualityMetricCode.length > 0
          ? findTypeIdByCodeOrNull(types, feedbackQualityMetricCode)
          : null;

  const methodologyPosition = includeFeedbackFields
      ? trimValue(item.methodologyPosition)
      : "";

  const ftsMethodologyStatusId: string | number | null = methodologyPosition
      ? findTypeIdByCategoryAndCodeOrName(
          types,
          DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
          methodologyPosition,
      )
      : null;

  if (includeFeedbackFields) {
    if (!areFeedbackRequiredFieldsFilled(item)) return null;

    if (
        feedbackSourceId === null ||
        ftsFunctionEffectivenessId === null ||
        ftsMethodologyStatusId === null
    ) {
      return null;
    }
  }

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

    /**
     * Backend хранит источник обратной связи через join-связь,
     * поэтому отправляем именно feedbackSourceIds.
     */
    feedbackSourceIds:
        includeFeedbackFields && feedbackSourceId !== null
            ? [feedbackSourceId]
            : [],
    ftsFunctionEffectivenessId:
        includeFeedbackFields && ftsFunctionEffectivenessId !== null
            ? ftsFunctionEffectivenessId
            : null,
    ftsMethodologyStatusId:
        includeFeedbackFields && ftsMethodologyStatusId !== null
            ? ftsMethodologyStatusId
            : null,
    problemDescription: includeFeedbackFields
        ? item.problemDescription?.trim() || null
        : null,
    initiatorRequisites: includeFeedbackFields
        ? item.initiatorRequisites?.trim() || null
        : null,
    deadline: includeFeedbackFields ? item.deadline?.trim() || null : null,

    isAccepted: includeFeedbackFields ? (item.isAccepted ?? null) : null,
    rejectComment: includeFeedbackFields
        ? item.rejectComment?.trim() || null
        : null,
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