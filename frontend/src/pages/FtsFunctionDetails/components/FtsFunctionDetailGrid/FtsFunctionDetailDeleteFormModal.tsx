import { Box, Button, Dialog, DialogActions, DialogTitle, Typography, useTheme } from "@mui/material";
import { useFtsFunctionDetailControllerDeleteV1Mutation } from "../../../../store/ftsFunctionRegistry";
import { useAppDispatch, useAppSelector } from "../../../../store";
import { selectDeleteableFtsFunctionDetailId, setDeleteableFtsFunctionDetail } from "../../../../store/uiSlice";
import { useCallback } from "react";



export function FtsFunctionDetailDeleteFormModal() {
  const theme = useTheme();
  const c = theme.custom;

  const dispatch = useAppDispatch();

  const deleteableFtsFunctionDetailId = useAppSelector(selectDeleteableFtsFunctionDetailId);

  const open = deleteableFtsFunctionDetailId !== null;

  const [deleteFtsFunctionDetail, { isLoading: isDeleting }] = useFtsFunctionDetailControllerDeleteV1Mutation();

  const handleRemove = async () => {
    try {
      await deleteFtsFunctionDetail({ id: String(deleteableFtsFunctionDetailId) }).unwrap();
      handleClose();
    } catch (error) {
      console.error("Не удалось удалить детализацию:", error);
    }
  };

  const handleClose = useCallback(() => {
    dispatch(setDeleteableFtsFunctionDetail(null));
  }, [dispatch])

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isDeleting) handleClose();
      }}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            bgcolor: c.bgSurface,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: "0.95rem", fontWeight: 700, pb: 0.5 }}>
        Удалить детализацию?
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Typography sx={{ color: c.textMuted, fontSize: "0.8rem" }}>
          Детализация будет удалена со всеми её сведениями, связями, обратными связями и операциями.
        </Typography>
      </Box>

      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          sx={{ textTransform: "none", fontSize: "0.78rem", color: c.textSecondary }}
        >
          {"Отмена"}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleRemove}
          disabled={isDeleting}
          sx={{ textTransform: "none", fontSize: "0.78rem" }}
        >
          {isDeleting ? "Удаление..." : "Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
