import { z } from "zod";

/**
 * Zod schema for the Function create/edit form. Every scalar id is a stringified
 * number bound to a MUI control; the empty string represents "not selected".
 *
 * `min(1)` rejects the empty string, which is the only invalid state we model
 * — backend resolves the actual id on submit. RHF's `formState.isValid` is the
 * single source of truth for submit-button enablement.
 */
export const functionFormSchema = z.object({
  ftsFunctionNameId: z.string().min(1),
  ftsFunctionMarkerId: z.string().min(1),
  ftsCentralizationId: z.string().min(1),
  competencyCenterId: z.string().min(1),
  curatorCentralOfficeId: z.string().min(1),
  departmentHeadCentralOfficeId: z.string().min(1),
  managerInterregionalInspectionId: z.string().min(1),
  departmentHeadInterregionalInspectionId: z.string().min(1),
  strategyProjectIds: z.array(z.string()).default([]),
});

export type FunctionFormFields = z.infer<typeof functionFormSchema>;

export const EMPTY_FUNCTION_FORM: FunctionFormFields = {
  ftsFunctionNameId: "",
  ftsFunctionMarkerId: "",
  ftsCentralizationId: "",
  competencyCenterId: "",
  curatorCentralOfficeId: "",
  departmentHeadCentralOfficeId: "",
  managerInterregionalInspectionId: "",
  departmentHeadInterregionalInspectionId: "",
  strategyProjectIds: [],
};
