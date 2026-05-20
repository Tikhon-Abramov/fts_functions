import type { FunctionFormFields } from "src/entities/fts-function/lib/function-form-schema";
import type { CreateFtsFunctionDto } from "src/shared/api/ftsFunctionsApi";

// ---------- functions ----------

/**
 * Build the backend create/update DTO (scalar id fields only — DTIs are
 * attached via a sibling mutation). Pure.
 */
export function buildFunctionDto(
  form: FunctionFormFields,
): CreateFtsFunctionDto {
  return {
    ftsFunctionNameId: Number(form.ftsFunctionNameId),
    ftsFunctionMarkerId: Number(form.ftsFunctionMarkerId),
    ftsCentralizationId: Number(form.ftsCentralizationId),
    competencyCenterId: Number(form.competencyCenterId),
    curatorCentralOfficeId: Number(form.curatorCentralOfficeId),
    departmentHeadCentralOfficeId: Number(form.departmentHeadCentralOfficeId),
    managerInterregionalInspectionId: Number(
      form.managerInterregionalInspectionId,
    ),
    departmentHeadInterregionalInspectionId: Number(
      form.departmentHeadInterregionalInspectionId,
    ),
  };
}

/**
 * Diff two DTI id lists and return the ids present in `next` but not
 * `prev`. Pure. Used to drive the additive batch-attach call on save.
 */
export function diffAddedDtis(prev: string[], next: string[]): string[] {
  const before = new Set(prev);
  return next.filter((id) => !before.has(id));
}

/**
 * Diff two DTI id lists and return the ids present in `prev` but not
 * `next`. Pure. Used to drive per-id detach calls (DELETE
 * /v1/fts-functions/:id/dtis/:dtiId) on save. Order is taken from the
 * prev list so the snackbar surfaces failures in the same order chips
 * were originally attached.
 */
export function diffRemovedDtis(prev: string[], next: string[]): string[] {
  const after = new Set(next);
  return prev.filter((id) => !after.has(id));
}
