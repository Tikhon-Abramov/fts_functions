import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectDeleteableFtsFunctionId, selectFtsFunctionName, setDeleteableFtsFunction, ThemeMode } from "../../store/uiSlice";
import { useFtsFunctionControllerDeleteV1Mutation } from "../../store/ftsFunctionRegistry";


const DANGER_HOVER_DARK = "#dc2626";
const DANGER_HOVER_LIGHT = "#b91c1c";
const BACKDROP_DARK = "rgba(0,0,0,0.6)";
const BACKDROP_LIGHT = "rgba(0,0,0,0.4)";



export function DeleteFunctionDialog() {
    const dispatch = useAppDispatch();
    const deleteableFtsFunctionId = useAppSelector(selectDeleteableFtsFunctionId);
    const deleteableFtsFunctionName = useAppSelector(selectFtsFunctionName);

    const [captchaInput, setCaptchaInput] = useState<string>('');

    const theme = useTheme();
    const c = theme.custom;
    const isDarkMode = theme.palette.mode === ThemeMode.DARK;

    const open = useMemo(() => deleteableFtsFunctionId !== null, [deleteableFtsFunctionId])

    const expectedCaptcha = useMemo(() => (
        deleteableFtsFunctionId ? `delete id ${deleteableFtsFunctionId}` : ''
    ), [deleteableFtsFunctionId]);
    
    const captchaMatches = captchaInput.length > 0 && captchaInput === expectedCaptcha;
    const captchaWrong = captchaInput.length >= expectedCaptcha.length && !captchaMatches;
    const dangerHoverStrong = isDarkMode ? DANGER_HOVER_DARK : DANGER_HOVER_LIGHT;
    const backdropColor = isDarkMode ? BACKDROP_DARK : BACKDROP_LIGHT;

    const [deleteFtFunction] = useFtsFunctionControllerDeleteV1Mutation();

    useEffect(() => {
        setCaptchaInput('');
    }, [deleteableFtsFunctionId]);

    const handleClose = useCallback(() => {
        dispatch(setDeleteableFtsFunction({}));
    }, [dispatch]);

    const handleSubmit = useCallback(async () => {
        if (!deleteableFtsFunctionId || !captchaMatches) return;

        try {
            await deleteFtFunction({
                id: String(deleteableFtsFunctionId)
            }).unwrap();

            // dispatch(showSuccessToast(result.message));
        } catch (error) {
            console.error('Failed to delete fts function:', error);
        } finally {
            dispatch(setDeleteableFtsFunction({}));
        }
    }, [dispatch, deleteableFtsFunctionId, captchaMatches, deleteFtFunction]);



    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: backdropColor,
                    },
                },
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
                Подтверждение удаления
            </DialogTitle>

            <DialogContent>
                {deleteableFtsFunctionName && (
                    <Box sx={{ mb: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: c.textMuted, display: "block", mb: 0.5 }}
                        >
                            Наименование функции:
                        </Typography>

                        <Typography sx={{ color: c.textPrimary, fontWeight: 600 }}>
                            {deleteableFtsFunctionName}
                        </Typography>
                    </Box>
                )}

                <Typography sx={{ color: c.textBody, fontSize: "0.88rem", mb: 1 }}>
                    Это действие необратимо.
                </Typography>

                <Typography sx={{ color: c.textSecondary, fontSize: "0.82rem", mb: 1.5 }}>
                    {"Чтобы подтвердить удаление, введите"}{" "}
                    <Box
                        component="span"
                        sx={{
                            color: c.textPrimary,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                        }}
                    >
                        {expectedCaptcha}
                    </Box>{" "}
                    {"в поле ниже:"}
                </Typography>

                <TextField
                    value={captchaInput}
                    onChange={(event) => setCaptchaInput(event.target.value)}
                    placeholder={expectedCaptcha}
                    fullWidth
                    size="small"
                    autoFocus
                    error={captchaWrong}
                    helperText={captchaWrong ? "Текст не совпадает — проверьте ID." : " "}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: c.bgInput,
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.85rem",
                            "& fieldset": {
                                borderColor: c.borderMedium,
                            },
                            "&:hover fieldset": {
                                borderColor: c.borderHover,
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: theme.palette.primary.main,
                            },
                        },
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleClose}
                    sx={{ textTransform: "none", fontSize: "0.82rem" }}
                >
                    Отмена
                </Button>

                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!captchaMatches}
                    sx={{
                        textTransform: "none",
                        fontSize: "0.82rem",
                        bgcolor: c.dangerHover,
                        "&:hover": { bgcolor: dangerHoverStrong },
                        "&.Mui-disabled": {
                            bgcolor: c.borderMain,
                            color: c.textDim,
                        },
                    }}
                >
                    Удалить
                </Button>
            </DialogActions>
        </Dialog>
    );
}