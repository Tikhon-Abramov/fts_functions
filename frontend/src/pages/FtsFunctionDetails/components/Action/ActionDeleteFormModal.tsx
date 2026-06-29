import { Box, Button, Dialog, DialogActions, DialogTitle, Typography, useTheme } from "@mui/material";
import { useActionControllerDeleteV1Mutation } from "../../../../store/ftsFunctionRegistry";



type ActionDeleteFormModalProps = {
  actionId: number | null;
  onClose: () => void;
};


export function ActionDeleteFormModal({ actionId, onClose }: ActionDeleteFormModalProps) {
  const theme = useTheme();
  const c = theme.custom;

  const open = actionId !== null;

  const [deleteAction, { isLoading: isDeleting }] = useActionControllerDeleteV1Mutation();

  const handleRemove = async () => { 
    try {
      await deleteAction({ id: String(actionId) }).unwrap();
      onClose();
    } catch (error) {
      console.error("Не удалось удалить операцию:", error);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isDeleting) onClose();
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
        {"Удалить операцию?"}
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Typography sx={{ color: c.textMuted, fontSize: "0.8rem" }}>
          {"Операция будет удалена из списка операций."}
        </Typography>
      </Box>

      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button
          onClick={onClose}
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
