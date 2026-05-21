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
} from "src/shared/api/ftsFunctionsApi";

import { findTypeIdByCode } from "src/entities/fts-function/api/mappers";
import {
  areTechnologyRequiredFieldsFilled,
  DETAIL_TYPE_CATEGORY,
  isActualActionCategory,
  type TypeCategory,
} from "src/entities/fts-function/lib/detail-technology";

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

export function resolveDetailDto(
    item: DetailInput,
    types: TypeResponseDto[] | undefined,
): CreateFtsFunctionDetailDto | null {
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

  const includeTechnologyFields = isActualActionCategory(item.category);

  const technologicalSolutionCode = includeTechnologyFields
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

  return {
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
  };
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