import { useState } from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { Add, Close, LinkOff } from "@mui/icons-material";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId, selectSelectedFtsFunctionDetailName, selectSelectedFtsFunctionStep, type FtsFunctionStep } from "../../../../store/uiSlice";
import { RelationsViewItems } from "./RelationsViewItems";
import { RelationsAddForm } from "./RelationsAddForm";



const FtsFunctionStepNameMap: Record<FtsFunctionStep, string> = {
    OBJECT_SELECTION: 'Шаг 1',
    CLUSTERING_IMPACT: 'Шаг 2',
}


export function Relations() {
    const theme = useTheme();
    const c = theme.custom;

    const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);
    const selectedFtsFunctionDetailName = useAppSelector(selectSelectedFtsFunctionDetailName);
    const selectedFtsFunctionStep = useAppSelector(selectSelectedFtsFunctionStep);

    const isSelected = !!selectedFtsFunctionDetailId;
    const selectedStepName = selectedFtsFunctionStep && FtsFunctionStepNameMap[selectedFtsFunctionStep];

    const [isAdding, setIsAdding] = useState(false);

    if (!isSelected) {
        return (
            <Box
                sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: c.textMuted,
                }}
            >
                <LinkOff sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                    {"Выберите элемент в таблице для просмотра связей"}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                overflowX: "auto",
            }}
        >
            <Box
                sx={{ p: 2, borderBottom: `1px solid ${c.borderMain}`, flexShrink: 0 }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        mb: 2,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: c.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontSize: "0.6rem",
                        }}
                    >
                        {isAdding ? 'Источник' : `Выбрано (${selectedStepName})`}
                    </Typography>

                    <Button
                        size="small"
                        variant={isAdding ? "outlined" : "contained"}
                        color={isAdding ? "inherit" : "primary"}
                        startIcon={isAdding ? <Close sx={{ fontSize: 16 }} /> : <Add sx={{ fontSize: 16 }} />}
                        onClick={() => setIsAdding((prev) => !prev)}
                        sx={{
                            width: 100,
                            textTransform: "none",
                            fontSize: "0.72rem",
                            flexShrink: 0,
                        }}
                    >
                        {isAdding ? "Отмена" : "Связать"}
                    </Button>
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        color: c.textPrimary,
                        mt: 0.5,
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                    }}
                >
                    {selectedFtsFunctionDetailName}
                </Typography>
            </Box>
            
        <Box sx={{ flex: 1, overflow: "auto", px: 0.5 }}>
            {isAdding ? <RelationsAddForm /> : <RelationsViewItems />}
        </Box>
        </Box>
    );
}