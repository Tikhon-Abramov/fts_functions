import { Add, RestartAlt, Save } from "@mui/icons-material";
import { Box, Button, CircularProgress, useTheme } from "@mui/material";
export const FUNCTION_FORM_ACTIONS_TEST_IDS = {
  SAVE: "fn-form-save",
  CANCEL: "fn-form-cancel",
  CLEAR: "button-clear-form",
} as const;

export type FunctionFormActionsProps = {
  isEdit: boolean;
  valid: boolean;
  isDirty: boolean;
  submitting: boolean;
  onClear: () => void;
  onCancel: () => void;
};

/**
 * Submit / cancel / clear buttons. The "submit" button is type="submit" so the
 * RHF `<form onSubmit>` handler runs (no manual `onClick` wiring needed).
 */
export function FunctionFormActions({
  isEdit,
  valid,
  isDirty,
  submitting,
  onClear,
  onCancel,
}: FunctionFormActionsProps) {
  const theme = useTheme();
  const c = theme.custom;

  const submitLabel = isEdit ? "Сохранить" : "Добавить функцию";

  const submitDisabled = isEdit
    ? !valid || submitting || !isDirty
    : !valid || submitting;

  const submitGradientActive = isEdit ? valid && isDirty : valid;

  return (
    <Box sx={{ display: "flex", gap: 1.5 }}>
      <Button
        type="submit"
        variant="contained"
        disabled={submitDisabled}
        startIcon={<SubmitIcon submitting={submitting} isEdit={isEdit} />}
        sx={{
          textTransform: "none",
          fontSize: "0.78rem",
          px: 2.5,
          background: submitGradientActive
            ? `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`
            : undefined,
          "&:hover": {
            background: `linear-gradient(135deg, ${c.gradientFromHover}, ${c.gradientToHover})`,
          },
        }}
        data-testid={FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE}
      >
        {submitLabel}
      </Button>
      {isEdit ? (
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            textTransform: "none",
            fontSize: "0.78rem",
            color: c.textSecondary,
            borderColor: c.borderMedium,
            "&:hover": {
              borderColor: c.borderHover,
              bgcolor: c.hoverOverlayStrong,
            },
          }}
          data-testid={FUNCTION_FORM_ACTIONS_TEST_IDS.CANCEL}
        >
          {"Отменить"}
        </Button>
      ) : (
        <Button
          variant="outlined"
          onClick={onClear}
          startIcon={<RestartAlt sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: "none",
            fontSize: "0.78rem",
            color: c.textSecondary,
            borderColor: c.borderMedium,
            "&:hover": {
              borderColor: c.borderHover,
              bgcolor: c.hoverOverlayStrong,
            },
          }}
          data-testid={FUNCTION_FORM_ACTIONS_TEST_IDS.CLEAR}
        >
          {"Очистить"}
        </Button>
      )}
    </Box>
  );
}

function SubmitIcon({
  submitting,
  isEdit,
}: {
  submitting: boolean;
  isEdit: boolean;
}) {
  if (submitting) return <CircularProgress size={14} sx={{ color: "white" }} />;
  if (isEdit) return <Save sx={{ fontSize: 16 }} />;
  return <Add sx={{ fontSize: 16 }} />;
}
