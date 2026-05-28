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
  const technologySelected =
      includeTechnologyFields && fields.technologicalSolution.trim().length > 0;

  return {
    category: fields.category,
    detailText: fields.detailText.trim(),
    who: emptyToUndefined(fields.who),
    actionLabel: fields.actionLabel,
    periodicity: fields.periodicity,
    complexity: fields.complexity,
    artifact: emptyToUndefined(fields.artifact),
    basis: emptyToUndefined(fields.basis),
    artifactUsage: emptyToUndefined(fields.artifactUsage),
    purpose: emptyToUndefined(fields.purpose),
    technologicalSolution: technologySelected
        ? emptyToUndefined(fields.technologicalSolution)
        : undefined,
    number: technologySelected ? emptyToUndefined(fields.number) : undefined,
    responsible: technologySelected
        ? emptyToUndefined(fields.responsible)
        : undefined,
    algorithm: technologySelected
        ? emptyToUndefined(fields.algorithm)
        : undefined,
  };
}