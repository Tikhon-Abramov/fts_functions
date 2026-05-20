import { useCallback, useEffect, useMemo, useRef } from "react";
import { Add, EditOutlined } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Collapse,
  Paper,
  useTheme,
} from "@mui/material";
import { FunctionFormPanelMode } from "src/components/FunctionFormPanel/lib/types";
import { useDictionary } from "src/entities/fts-function/hooks/data/useDictionary";
import { useFunctionForm } from "src/entities/fts-function/hooks/form/useFunctionForm";
import {
  useConstantControllerGetTypesV1Query,
  useConstantControllerGetUsersV1Query,
  useFtsFunctionControllerListV1Query,
} from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import { I18N, useTranslation } from "src/shared/i18n";

import { Category } from "@registry/shared/enums";

import { FunctionFormActions } from "./ui/FunctionFormActions";
import { FunctionFormFields } from "./ui/FunctionFormFields";
import { FunctionFormHeader } from "./ui/FunctionFormHeader";

export type { FunctionFormPanelMode } from "./lib/types";

export const FUNCTION_FORM_PANEL_TEST_IDS = {
  PANEL: "fn-form-panel",
  BODY: "fn-form-body",
} as const;

export type FunctionFormPanelProps = {
  expanded: boolean;
  onToggleExpanded: () => void;
  mode: FunctionFormPanelMode;
  editingFunctionId?: number | undefined;
  onCreated?: ((newId: number) => void) | undefined;
  onSaved?: ((id: number) => void) | undefined;
  onCancelEdit?: (() => void) | undefined;
};

const PANEL_DICTIONARY_CATEGORIES = [
  Category.FTS_CENTRALIZATION,
  Category.FTS_FUNCTION_NAME,
  Category.FTS_FUNCTION_MARKER,
  Category.FTS_COMPETENCY_CENTER,
  Category.FTS_DTI,
] as const;

/**
 * Container/orchestrator for the create/edit Function form. Form state +
 * mutations live in `useFunctionForm`; the visual pieces live in
 * `./function-form/*`. RHF's `formState.isDirty` is the SINGLE source of truth
 * for both the Save-button enablement and the discard-confirm prompt — the old
 * parallel `hasUnsavedEdits` JSON-stringify path is gone.
 */
export default function FunctionFormPanel({
  expanded,
  onToggleExpanded,
  mode,
  editingFunctionId,
  onCreated,
  onSaved,
  onCancelEdit,
}: FunctionFormPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  const { data: types = [] } = useConstantControllerGetTypesV1Query(
    { categories: [...PANEL_DICTIONARY_CATEGORIES] },
    DICTIONARY_QUERY_OPTIONS,
  );
  const { data: usersAll = [] } = useConstantControllerGetUsersV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );
  // Alive functions list — used to filter out FTS_FUNCTION_NAME options that
  // are already taken (the service blocks alive duplicates with 409, so don't
  // even let the user pick one). In edit mode we keep the current row's name
  // visible by excluding it from the "taken" set.
  // Internal app — <50 alive functions in practice. Backend caps `limit` at 200
  // (see `MAX_LIMIT` in `apps/api/src/common/pagination/pagination.constants.ts`).
  const { data: aliveList } = useFtsFunctionControllerListV1Query(
    { limit: 200 },
    DICTIONARY_QUERY_OPTIONS,
  );
  const { byCategory } = useDictionary(types);

  const availableFunctionNames = useMemo(() => {
    const all = byCategory[Category.FTS_FUNCTION_NAME] ?? [];
    const items = aliveList?.items ?? [];
    const takenNameIds = new Set(
      items
        .filter((fn) => fn.id !== editingFunctionId)
        .map((fn) => fn.ftsFunctionNameId),
    );
    return all.filter((t) => !takenNameIds.has(t.id));
  }, [byCategory, aliveList, editingFunctionId]);

  const { form, onSubmit, submitting, loading, isEdit, audit } =
    useFunctionForm({
      mode,
      editingFunctionId,
      expanded,
      onCreated,
      onSaved,
    });

  const {
    formState: { isValid, isDirty },
    reset,
  } = form;

  const firstFieldRef = useRef<HTMLDivElement | null>(null);
  const setFirstFieldRef = useCallback((node: HTMLDivElement | null) => {
    firstFieldRef.current = node;
  }, []);
  const prevExpandedRef = useRef(expanded);

  // Confirm-on-discard shares isDirty with the Save button — single source of
  // truth replaces the old `hasUnsavedEdits` JSON-stringify path.
  const handleToggleExpanded = useCallback(() => {
    if (expanded && isDirty) {
      const ok = window.confirm("Отменить изменения?");
      if (!ok) return;
    }
    onToggleExpanded();
  }, [expanded, isDirty, onToggleExpanded, t]);

  const handleClear = useCallback(() => {
    reset();
  }, [reset]);

  const handleCloseEdit = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm("Отменить изменения?");
      if (!ok) return;
    }
    reset();
    onCancelEdit?.();
    if (expanded) onToggleExpanded();
  }, [isDirty, reset, onCancelEdit, expanded, onToggleExpanded, t]);

  // Focus the first field when the panel is first expanded (create mode only).
  useEffect(() => {
    if (
      expanded &&
      !prevExpandedRef.current &&
      mode === FunctionFormPanelMode.CREATE
    ) {
      const el = firstFieldRef.current;
      if (el) {
        const trigger = el.querySelector<HTMLElement>(
          '[role="combobox"], [tabindex]',
        );
        trigger?.focus();
      }
    }
    prevExpandedRef.current = expanded;
  }, [expanded, mode]);

  const headerTitle = isEdit
    ? t(I18N.registry.editFunction, { id: editingFunctionId })
    : "Добавить функцию";
  const headerIcon = isEdit ? (
    <EditOutlined sx={{ fontSize: 18, color: c.accentBlue }} />
  ) : (
    <Add sx={{ fontSize: 18, color: c.accentBlue }} />
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: c.bgPaper,
        border: `1px solid ${c.borderMain}`,
        borderRadius: 2,
        mb: 2,
        overflow: "hidden",
        flexShrink: 0,
      }}
      data-testid={FUNCTION_FORM_PANEL_TEST_IDS.PANEL}
    >
      <FunctionFormHeader
        title={headerTitle}
        icon={headerIcon}
        expanded={expanded}
        isEdit={isEdit}
        showHint={!expanded && !isEdit}
        onToggle={handleToggleExpanded}
        onClose={handleCloseEdit}
        audit={audit ?? undefined}
      />
      <Collapse in={expanded} timeout={250}>
        <Box
          sx={{ px: 2.5, pb: 2.5, pt: 1 }}
          data-testid={FUNCTION_FORM_PANEL_TEST_IDS.BODY}
        >
          {loading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={24} sx={{ color: c.accentBlue }} />
            </Box>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <FunctionFormFields
                control={form.control}
                centralizations={byCategory[Category.FTS_CENTRALIZATION]}
                functionNames={availableFunctionNames}
                markers={byCategory[Category.FTS_FUNCTION_MARKER]}
                competencyCenters={byCategory[Category.FTS_COMPETENCY_CENTER]}
                dtis={byCategory[Category.FTS_DTI]}
                users={usersAll}
                firstFieldRef={setFirstFieldRef}
              />
              <FunctionFormActions
                isEdit={isEdit}
                valid={isValid}
                isDirty={isDirty}
                submitting={submitting}
                onClear={handleClear}
                onCancel={handleCloseEdit}
              />
            </form>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
