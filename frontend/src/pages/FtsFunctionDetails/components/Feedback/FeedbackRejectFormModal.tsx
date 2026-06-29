import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, useTheme } from "@mui/material";
import { useFeedbackControllerAcceptV1Mutation } from "../../../../store/ftsFunctionRegistry";
import { useState } from "react";



type ActionDeleteFormModalProps = {
    feedbackId: number;
    rejectStatusId: number;
    open: boolean;
    onClose: () => void;
};


export function ActionDeleteFormModal({ feedbackId, rejectStatusId, open, onClose }: ActionDeleteFormModalProps) {
    const theme = useTheme();
    const c = theme.custom;

    const [comment, setComment] = useState<string>('');

    const [rejectAction, { isLoading: isRejecting }] = useFeedbackControllerAcceptV1Mutation();

    const handleReject = async () => {
        try {
            await rejectAction({
                id: String(feedbackId),
                acceptFeedbackDto: { acceptStatusId: rejectStatusId, comment },
            }).unwrap();
            onClose();
        } catch (error) {
            console.error("Не удалось удалить обратную связь:", error);
        }
    };


    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!isRejecting) onClose();
            }}
            fullWidth
            maxWidth="sm"
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
                Причина отказа в согласовании
            </DialogTitle>

            <DialogContent>
                <TextField
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    label={"Причина отказа *"}
                    multiline
                    minRows={4}
                    fullWidth
                    sx={{ mt: 1 }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ textTransform: "none" }}
                >
                    {"Отмена"}
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    disabled={!comment.trim() || isRejecting}
                    onClick={handleReject}
                    sx={{ textTransform: "none" }}
                >
                    {"Не согласовано"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
