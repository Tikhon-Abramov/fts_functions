import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from "@mui/material";
import { useFeedbackControllerDeleteV1Mutation } from "../../../../store/ftsFunctionRegistry";



type ActionDeleteFormModalProps = {
    feedbackId: number | null;
    onClose: () => void;
};


export function ActionDeleteFormModal({ feedbackId, onClose }: ActionDeleteFormModalProps) {
    const theme = useTheme();
    const c = theme.custom;

    const open = feedbackId !== null;

    const [deleteAction, { isLoading: isDeleting }] = useFeedbackControllerDeleteV1Mutation();

    const handleRemove = async () => {
        try {
            await deleteAction({ id: String(feedbackId) }).unwrap();
            onClose();
        } catch (error) {
            console.error("Не удалось удалить обратную связь:", error);
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
                        bgcolor: c.bgPaper,
                        color: c.textBody,
                        border: `1px solid ${c.borderMain}`,
                    },
                },
            }}
        >
            <DialogTitle sx={{ color: c.textPrimary, fontWeight: 700 }}>
                {"Удалить обратную связь?"}
            </DialogTitle>

            <DialogContent>
                <Typography sx={{ color: c.textBody, fontSize: "0.86rem" }}>
                    {
                        "После удаления эта обратная связь исчезнет из списка. Действие нужно подтвердить."
                    }
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    disabled={isDeleting}
                    onClick={onClose}
                    sx={{ textTransform: "none" }}
                >
                    {"Отмена"}
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    disabled={isDeleting}
                    onClick={handleRemove}
                    sx={{ textTransform: "none" }}
                >
                    {isDeleting ? "Удаление..." : "Удалить"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
