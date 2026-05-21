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
import { Category } from "@registry/shared/enums";

const DetailTypeCategory = {
  WHO_PERFORMS_ACTION: Category.WHO_PERFORMS_ACTION,
  TECHNOLOGICAL_SOLUTION: "TECHNOLOGICAL_SOLUTION",
  RESPONSIBLE: "RESPONSIBLE",
} as const;

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

function findTypeIdByCategoryAndName(
    types: TypeResponseDto[] | undefined,
    category: string,
    name: string,
): number | null {
  const trimmed = name.trim();

  if (!trimmed) return null;

  return (
      (types ?? []).find(
          (type) => String(type.category) === category && type.name === trimmed,
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
    const id = findTypeIdByCategoryAndName(
        types,
        DetailTypeCategory.WHO_PERFORMS_ACTION,
        item.who,
    );

    if (id != null) whoPerformsActionId = id;
  }

  const technologicalSolutionCode = trimValue(item.technologicalSolution);
  const technologicalSolutionId = technologicalSolutionCode
      ? findTypeIdByCode(types, technologicalSolutionCode)
      : null;

  if (technologicalSolutionCode && technologicalSolutionId == null) {
    return null;
  }

  const number = trimValue(item.number);
  const responsibleName = trimValue(item.responsible);
  const algorithm = trimValue(item.algorithm);

  let responsibleId: number | null = null;

  if (technologicalSolutionId != null) {
    if (!number || !responsibleName || !algorithm) return null;

    responsibleId = findTypeIdByCategoryAndName(
        types,
        DetailTypeCategory.RESPONSIBLE,
        responsibleName,
    );

    if (responsibleId == null) return null;
  }

  const dto: CreateFtsFunctionDetailDto & Record<string, unknown> = {
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
    number: technologicalSolutionId != null ? number : null,
    algorithm: technologicalSolutionId != null ? algorithm : null,
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