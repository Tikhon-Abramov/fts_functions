import {
  ACTIONS,
  CATEGORIES,
  COMPLEXITIES,
  PERIODICITIES,
} from "src/entities/fts-function/constants";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
} from "src/entities/fts-function/model";
import { cleanupTechnologyFields } from "src/entities/fts-function/lib/detail-technology";
import { z } from "zod";

const categoryEnum = z.enum(
    CATEGORIES as [FtsFunctionCategory, ...FtsFunctionCategory[]],
);

const actionEnum = z.enum(
    ACTIONS as [FtsFunctionActionType, ...FtsFunctionActionType[]],
);

const periodicityEnum = z.enum(
    PERIODICITIES as [
      FtsFunctionExecutionFrequency,
      ...FtsFunctionExecutionFrequency[],
    ],
);

const complexityEnum = z.enum(
    COMPLEXITIES as [FtsFunctionComplexity, ...FtsFunctionComplexity[]],
);

export const stepFieldsSchema = z.object({
  category: categoryEnum,
  detailText: z.string(),
  who: z.string(),
  actionLabel: actionEnum,
  periodicity: periodicityEnum,
  complexity: complexityEnum,
  artifact: z.string(),
  basis: z.string(),
  artifactUsage: z.string(),
  purpose: z.string(),
  technologicalSolution: z.string(),
  number: z.string(),
  responsible: z.string(),
  algorithm: z.string(),
});

export type StepFields = z.infer<typeof stepFieldsSchema>;

export const addItemSchema = z.object({
  s1: stepFieldsSchema,
  s2: stepFieldsSchema,
});

export type AddItemFormValues = z.infer<typeof addItemSchema>;

export function emptyStep(): StepFields {
  return {
    category: FtsFunctionCategory.METHODOLOGY,
    detailText: "",
    who: "",
    actionLabel: FtsFunctionActionType.KEEP,
    periodicity: FtsFunctionExecutionFrequency.DAILY,
    complexity: FtsFunctionComplexity.MIDDLE,
    artifact: "",
    basis: "",
    artifactUsage: "",
    purpose: "",
    technologicalSolution: "",
    number: "",
    responsible: "",
    algorithm: "",
  };
}

export function isStepFilled(s: StepFields | undefined): boolean {
  return Boolean(s?.detailText?.trim());
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : undefined;
}

export function fieldsToData(
    fields: StepFields,
    includeTechnologyFields: boolean,
) {
  const normalized = cleanupTechnologyFields(fields, includeTechnologyFields);

  return {
    category: normalized.category,
    detailText: normalized.detailText.trim(),
    who: emptyToUndefined(normalized.who),
    actionLabel: normalized.actionLabel,
    periodicity: normalized.periodicity,
    complexity: normalized.complexity,
    artifact: emptyToUndefined(normalized.artifact),
    basis: emptyToUndefined(normalized.basis),
    artifactUsage: emptyToUndefined(normalized.artifactUsage),
    purpose: emptyToUndefined(normalized.purpose),
    technologicalSolution: emptyToUndefined(normalized.technologicalSolution),
    number: emptyToUndefined(normalized.number),
    responsible: emptyToUndefined(normalized.responsible),
    algorithm: emptyToUndefined(normalized.algorithm),
  };
}