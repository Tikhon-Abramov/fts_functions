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
  };
}

export function isStepFilled(s: StepFields | undefined): boolean {
  // `s` is `undefined` for one render between mount and RHF defaults
  // propagating (REGRESSION: 2026-04-25 modal crash). Use full optional
  // chaining so `s.detailText` is never read on `undefined`.
  const trimmed = s?.detailText?.trim();
  return Boolean(trimmed && trimmed.length > 0);
}

function trimOrUndefined(s: string): string | undefined {
  const trimmed = s.trim();
  return trimmed || undefined;
}

export function fieldsToData(fields: StepFields) {
  return {
    category: fields.category,
    detailText: fields.detailText.trim(),
    who: trimOrUndefined(fields.who),
    actionLabel: fields.actionLabel,
    periodicity: fields.periodicity,
    complexity: fields.complexity,
    artifact: trimOrUndefined(fields.artifact),
    basis: trimOrUndefined(fields.basis),
    artifactUsage: trimOrUndefined(fields.artifactUsage),
    purpose: trimOrUndefined(fields.purpose),
  };
}
