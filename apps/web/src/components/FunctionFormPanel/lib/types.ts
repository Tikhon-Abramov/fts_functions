/**
 * The two modes the function form operates in. Class 2 const-as-const registry —
 * call sites reference `FunctionFormPanelMode.CREATE` / `.EDIT` rather than
 * raw `"create"` / `"edit"` literals.
 */
export const FunctionFormPanelMode = {
  CREATE: "create",
  EDIT: "edit",
} as const;
export type FunctionFormPanelMode =
  (typeof FunctionFormPanelMode)[keyof typeof FunctionFormPanelMode];
