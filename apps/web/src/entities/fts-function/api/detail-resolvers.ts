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

// ---------- types ----------

/**
 * UI-shaped detail payload used by the detailization modal's Add / Update
 * flows. Every enum field already holds the backend code — `resolveDetailDto`
 * just looks up the matching Type.id by code.
 */
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
};

// ---------- functions ----------

/**
 * Resolve a UI `DetailInput` into the backend `CreateFtsFunctionDetailDto`.
 *
 * Pure: the result depends solely on the passed-in `item` and `types`
 * dictionary. Returns `null` when any required dictionary id is missing
 * (usually because `/constants/type` hasn't returned yet) — callers should
 * surface a snackbar rather than submit.
 */
export function resolveDetailDto(
  item: DetailInput,
  types: TypeResponseDto[] | undefined,
): CreateFtsFunctionDetailDto | null {
  if (!item.actionLabel) return null;
  const stepId = findTypeIdByCode(types, item.step);
  const categoryId = findTypeIdByCode(types, item.category);
  const actionId = findTypeIdByCode(types, item.actionLabel);
  if (stepId == null || categoryId == null || actionId == null) return null;

  // Optional fields: null when user left empty (legitimate), but a failed
  // dictionary lookup on a *provided* value must wait (return null DTO so the
  // caller surfaces "dicts loading"). Resolve to `number | null` explicitly so
  // the DTO type doesn't widen to `undefined`.
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
  // `who` is the display NAME (Type.name) the user picked from the autocomplete
  // (e.g. "ФНС", "ТНО / ПРД"). Look it up in the types dict to get the FK id.
  // Empty string = user cleared = persist null.
  let whoPerformsActionId: number | null = null;
  if (item.who && item.who.trim().length > 0) {
    const trimmed = item.who.trim();
    const match = (types ?? []).find(
      (tt) =>
        tt.category === Category.WHO_PERFORMS_ACTION && tt.name === trimmed,
    );
    if (match) whoPerformsActionId = match.id;
    // No match: free-text the user typed isn't in the dict — drop silently
    // (alternative: return null to surface a "pick from list" snackbar; for
    // now we tolerate free-form to avoid blocking saves on typos).
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
  };
}

/**
 * Merge the existing `Row` with the partial `updates` and produce the shape
 * expected by `resolveDetailDto`. Pure.
 */
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
  };
}
