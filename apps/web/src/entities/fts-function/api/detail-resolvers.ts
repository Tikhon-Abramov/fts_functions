import type {
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
  DETAIL_TYPE_CATEGORY,
  findTypeByCodeOrName,
  isActualActionCategory,
  isTechnologyTaskSolution,
  shouldShowTechnologyResultFields,
  type TypeCategory,
} from "src/entities/fts-function/lib/detail-technology";

export type ResolvedDetailDto = CreateFtsFunctionDetailDto &
  UpdateFtsFunctionDetailDto &
  Record<string, unknown>;

export type DetailInput = {
  step: FtsFunctionStep;
  category: FtsFunctionCategory;
  periodicity?: FtsFunctionExecutionFrequency | "" | undefined;
  complexity?: FtsFunctionComplexity | "" | undefined;
  detailText?: string | undefined;
  who?: string | undefined;
  actionLabel?: string | "" | undefined;
  artifact?: string | undefined;
  basis?: string | undefined;
  artifactUsage?: string | undefined;
  purpose?: string | undefined;
  actionsCompleteness?: string | undefined;
  actionsEffectiveness?: string | undefined;
  technologicalSolution?: string | undefined;
  number?: string | undefined;
  responsible?: string | undefined;
  algorithm?: string | undefined;
  filePath?: string | undefined;
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

type DetailFeedbackFields = {
  feedbackSource: string;
  feedbackQualityMetric: string;
  methodologyPosition: string;
  problemDescription: string;
  initiatorRequisites: string;
  deadline: string;
  initiatorAcceptance: string;
};

function trimValue(value: string | null | undefined): string {
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

function buildFeedbackFields(item: DetailInput): DetailFeedbackFields {
  return {
    feedbackSource: trimValue(item.feedbackSource),
    feedbackQualityMetric: trimValue(item.feedbackQualityMetric),
    methodologyPosition: trimValue(item.methodologyPosition),
    problemDescription: trimValue(item.problemDescription),
    initiatorRequisites: trimValue(item.initiatorRequisites),
    deadline: trimValue(item.deadline),
    initiatorAcceptance: trimValue(item.initiatorAcceptance),
  };
}

function hasFeedbackFields(fields: DetailFeedbackFields): boolean {
  return Boolean(
    fields.feedbackSource ||
      fields.feedbackQualityMetric ||
      fields.methodologyPosition ||
      fields.problemDescription ||
      fields.initiatorRequisites ||
      fields.deadline ||
      fields.initiatorAcceptance,
  );
}

function hasRequiredFeedbackFields(fields: DetailFeedbackFields): boolean {
  return Boolean(
    fields.feedbackSource &&
      fields.feedbackQualityMetric &&
      fields.methodologyPosition &&
      fields.problemDescription &&
      fields.initiatorRequisites &&
      fields.deadline &&
      fields.initiatorAcceptance,
  );
}

export function resolveDetailDto(
  item: DetailInput,
  types: TypeResponseDto[] | undefined,
): ResolvedDetailDto | null {
  const stepId = findTypeIdByCode(types, item.step);
  const categoryId = findTypeIdByCode(types, item.category);

  if (stepId == null || categoryId == null) return null;

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

  const actionLabel = trimValue(item.actionLabel);

  const ftsFunctionActionTypeId = actionLabel
    ? findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.FTS_FUNCTION_ACTION_TYPE,
        actionLabel,
      )
    : null;

  if (actionLabel && ftsFunctionActionTypeId === null) {
    return null;
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

  const taskFieldsRequired = isTechnologyTaskSolution(
    technologicalSolutionCode,
    types,
  );
  const resultFieldsRequired = shouldShowTechnologyResultFields(item.step);

  const number = trimValue(item.number);
  const responsibleValue = trimValue(item.responsible);
  const algorithm = resultFieldsRequired ? trimValue(item.algorithm) : "";
  const filePath = resultFieldsRequired ? trimValue(item.filePath) : "";

  let responsibleId: string | number | null = null;

  if (technologicalSolutionId !== null) {
    if (taskFieldsRequired) {
      if (!number || !responsibleValue) return null;

      responsibleId = findTypeIdByCategoryAndCodeOrName(
        types,
        DETAIL_TYPE_CATEGORY.RESPONSIBLE,
        responsibleValue,
      );

      if (responsibleId === null) return null;
    }

    if (resultFieldsRequired && !algorithm && !filePath) {
      return null;
    }
  }

  const feedbackFields = buildFeedbackFields(item);
  const includeFeedbackFields =
    includeActualActionFields && hasFeedbackFields(feedbackFields);

  const feedbackSourceId: string | number | null =
    includeFeedbackFields && feedbackFields.feedbackSource
      ? findTypeIdByCodeOrNull(types, feedbackFields.feedbackSource)
      : null;

  const ftsFunctionEffectivenessId: string | number | null =
    includeFeedbackFields && feedbackFields.feedbackQualityMetric
      ? findTypeIdByCodeOrNull(types, feedbackFields.feedbackQualityMetric)
      : null;

  const ftsMethodologyStatusId: string | number | null =
    includeFeedbackFields && feedbackFields.methodologyPosition
      ? findTypeIdByCategoryAndCodeOrName(
          types,
          DETAIL_TYPE_CATEGORY.FTS_METHODOLOGY_STATUS,
          feedbackFields.methodologyPosition,
        )
      : null;

  if (includeFeedbackFields) {
    if (!hasRequiredFeedbackFields(feedbackFields)) return null;

    if (
      feedbackSourceId === null ||
      ftsFunctionEffectivenessId === null ||
      ftsMethodologyStatusId === null
    ) {
      return null;
    }
  }

  return {
    ftsFunctionStepId: stepId,
    ftsFunctionCategoryId: categoryId,
    ftsFunctionActionTypeId,
    ftsFunctionComplexityId: complexityId,
    ftsFunctionExecutionFrequencyId: frequencyId,
    whoPerformsActionId,
    ftsFunctionDetails: item.detailText ?? "",
    artifact: trimValue(item.artifact) || null,
    basis: trimValue(item.basis) || null,
    artifactUsage: trimValue(item.artifactUsage) || null,
    purpose: null,
    actionsCompleteness: trimValue(item.actionsCompleteness) || null,
    actionsСompleteness: trimValue(item.actionsCompleteness) || null,
    actionsEffectiveness: trimValue(item.actionsEffectiveness) || null,
    technologicalSolutionId,
    responsibleId: taskFieldsRequired ? responsibleId : null,
    number: taskFieldsRequired ? number : null,
    algorithm: technologicalSolutionId !== null && resultFieldsRequired
      ? algorithm
      : null,
    filePath: technologicalSolutionId !== null && resultFieldsRequired
      ? filePath
      : null,
    ftsFunctionEffectivenessId:
      includeFeedbackFields && ftsFunctionEffectivenessId !== null
        ? ftsFunctionEffectivenessId
        : null,
    feedbackSourceId:
      includeFeedbackFields && feedbackSourceId !== null
        ? feedbackSourceId
        : null,
    ftsMethodologyStatusId:
      includeFeedbackFields && ftsMethodologyStatusId !== null
        ? ftsMethodologyStatusId
        : null,
    problemDescription: includeFeedbackFields
      ? feedbackFields.problemDescription || null
      : null,
    initiatorRequisites: includeFeedbackFields
      ? feedbackFields.initiatorRequisites || null
      : null,
    deadline: includeFeedbackFields ? feedbackFields.deadline || null : null,
    isAccepted: includeFeedbackFields ? item.isAccepted ?? null : null,
    rejectComment: includeFeedbackFields
      ? trimValue(item.rejectComment) || null
      : null,
  };
}

export function buildDetailInputFromRow(
  existing: Row,
  updates: Partial<Row>,
): DetailInput {
  const merged = { ...existing, ...updates } as Row & {
    actionLabel?: string;
    feedbackSource?: string;
    feedbackQualityMetric?: string;
    problemDescription?: string;
    initiatorRequisites?: string;
    methodologyPosition?: string;
    deadline?: string;
    initiatorAcceptance?: string;
    isAccepted?: boolean | null;
    rejectComment?: string;
  };

  return {
    step: merged.step,
    category: merged.category,
    periodicity: merged.periodicity,
    complexity: merged.complexity,
    detailText: merged.detailText,
    who: merged.who,
    actionLabel: merged.actionLabel ?? "",
    artifact: merged.artifact,
    basis: merged.basis,
    artifactUsage: merged.artifactUsage,
    purpose: merged.purpose,
    actionsCompleteness: merged.actionsCompleteness,
    actionsEffectiveness: merged.actionsEffectiveness,
    technologicalSolution: merged.technologicalSolution,
    number: merged.number,
    responsible: merged.responsible,
    algorithm: merged.algorithm,
    filePath: merged.filePath,
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
