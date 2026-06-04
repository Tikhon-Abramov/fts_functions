import type { ChangeEvent } from "react";

import {
    AttachFile,
    Close,
    Download,
    InsertDriveFileOutlined,
    UploadFile,
} from "@mui/icons-material";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";

export type FileAttachmentInputProps = {
    fileName?: string;
    selectedFile?: File | null;
    disabled?: boolean;
    testId?: string;
    isDownloading?: boolean;
    onChangeFile: (file: File | null) => void;
    onDownloadFile?: () => void;
};

export function FileAttachmentInput({
                                        fileName,
                                        selectedFile,
                                        disabled = false,
                                        testId,
                                        isDownloading = false,
                                        onChangeFile,
                                        onDownloadFile,
                                    }: FileAttachmentInputProps) {
    const theme = useTheme();
    const c = theme.custom;

    const savedFileName = fileName?.trim() ?? "";
    const visibleFileName = selectedFile?.name || savedFileName;
    const hasFile = Boolean(visibleFileName);
    const canDownload = Boolean(savedFileName && !selectedFile && onDownloadFile);
    const isClickable = canDownload && !disabled && !isDownloading;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;

        onChangeFile(file);
        event.target.value = "";
    };

    const handleDownload = () => {
        if (!isClickable) return;

        onDownloadFile?.();
    };

    return (
        <Box data-testid={testId}>
            <Paper
                variant="outlined"
                sx={{
                    p: 1,
                    borderRadius: 1.5,
                    borderColor: canDownload ? theme.palette.primary.main : c.borderLight,
                    bgcolor: canDownload ? `${theme.palette.primary.main}10` : c.bgInput,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    minHeight: 44,
                    transition: "all 0.15s ease",
                    "&:hover": canDownload
                        ? {
                            borderColor: theme.palette.primary.dark,
                            bgcolor: `${theme.palette.primary.main}1f`,
                        }
                        : undefined,
                }}
            >
                <Tooltip
                    title={
                        canDownload
                            ? isDownloading
                                ? "Файл скачивается..."
                                : "Скачать файл"
                            : hasFile
                                ? visibleFileName
                                : "Файл не прикреплён"
                    }
                >
                    <Box
                        component={canDownload ? "button" : "div"}
                        type={canDownload ? "button" : undefined}
                        onClick={handleDownload}
                        sx={{
                            minWidth: 0,
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            cursor: isClickable ? "pointer" : "default",
                            color: canDownload ? theme.palette.primary.main : c.textBody,
                            bgcolor: "transparent",
                            border: 0,
                            p: 0,
                            textAlign: "left",
                            font: "inherit",
                            opacity: isDownloading ? 0.7 : 1,
                            transition: "opacity 0.15s ease",
                            "&:hover .file-name": canDownload
                                ? {
                                    textDecoration: "underline",
                                }
                                : undefined,
                        }}
                    >
                        {isDownloading ? (
                            <CircularProgress
                                size={16}
                                thickness={4}
                                sx={{
                                    color: theme.palette.primary.main,
                                    flexShrink: 0,
                                }}
                            />
                        ) : hasFile ? (
                            <InsertDriveFileOutlined
                                sx={{
                                    fontSize: 18,
                                    color: canDownload ? theme.palette.primary.main : c.textBody,
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <AttachFile
                                sx={{
                                    fontSize: 18,
                                    color: c.textMuted,
                                    flexShrink: 0,
                                }}
                            />
                        )}

                        <Typography
                            className="file-name"
                            sx={{
                                color: hasFile
                                    ? canDownload
                                        ? theme.palette.primary.main
                                        : c.textBody
                                    : c.textDim,
                                fontSize: "0.78rem",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                fontWeight: canDownload ? 700 : 400,
                                textDecoration: canDownload ? "underline" : "none",
                                textUnderlineOffset: "3px",
                            }}
                            title={visibleFileName || "Файл не прикреплён"}
                        >
                            {isDownloading
                                ? "Скачивание..."
                                : visibleFileName || "Файл не прикреплён"}
                        </Typography>

                        {canDownload && !isDownloading && (
                            <Download
                                sx={{
                                    fontSize: 16,
                                    color: theme.palette.primary.main,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                    </Box>
                </Tooltip>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {selectedFile && !disabled && (
                        <Tooltip title="Убрать выбранный файл">
                            <IconButton
                                size="small"
                                onClick={() => onChangeFile(null)}
                                sx={{
                                    color: c.textMuted,
                                    "&:hover": {
                                        color: theme.palette.error.main,
                                        bgcolor: "transparent",
                                    },
                                }}
                            >
                                <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Button
                        component="label"
                        size="small"
                        disabled={disabled}
                        startIcon={<UploadFile sx={{ fontSize: 16 }} />}
                        sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            cursor: disabled ? 'no-drop' : undefined,
                            color: c.accentBlue,
                            flexShrink: 0,
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        {hasFile ? "Заменить" : "Прикрепить"}

                        <input hidden type="file" disabled={disabled} onChange={handleChange} />
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default FileAttachmentInput;