// All form fields hold backend entity IDs (as strings) — the UI renders the
// human label via a typesById / usersById lookup at render time.
export type FunctionFormFields = {
  ftsFunctionNameId: string;
  ftsFunctionMarkerId: string;
  ftsCentralizationId: string;
  competencyCenterId: string;
  // The backend doesn't model "Strategy D" as a first-class field: it attaches
  // DTIs after creation. We keep this field in the form so the legacy mock UI
  // still renders; submission currently ignores it. Tracked in
  // `docs/known-limitations.md` (Frontend gaps).
  strategyProjectIds: string[];
  curatorCentralOfficeId: string;
  departmentHeadCentralOfficeId: string;
  managerInterregionalInspectionId: string;
  departmentHeadInterregionalInspectionId: string;
};

export const EMPTY_FUNCTION_FORM: FunctionFormFields = {
  ftsFunctionNameId: "",
  ftsFunctionMarkerId: "",
  ftsCentralizationId: "",
  competencyCenterId: "",
  strategyProjectIds: [],
  curatorCentralOfficeId: "",
  departmentHeadCentralOfficeId: "",
  managerInterregionalInspectionId: "",
  departmentHeadInterregionalInspectionId: "",
};

export function isFunctionFormValid(form: FunctionFormFields): boolean {
  return Object.entries(form).every(([key, value]) => {
    if (key === "strategyProjectIds") return true;

    if (Array.isArray(value)) return value.length > 0;
    return (
      value !== undefined && value !== null && String(value).trim().length > 0
    );
  });
}
