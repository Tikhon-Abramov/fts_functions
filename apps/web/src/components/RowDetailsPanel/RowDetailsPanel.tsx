import type { CustomPalette } from "src/app/App";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";

import { useRowDetailsDraft } from "./hooks/useRowDetailsDraft";
import { RowDetailsEdit } from "./ui/RowDetailsEdit";
import { RowDetailsView } from "./ui/RowDetailsView";

type RowDetailsPanelProps = {
    row: Row | null;
    typesAll: TypeResponseDto[] | undefined;
    onUpdateRow: (id: string, updates: Partial<Row>) => void;
    onUploadAlgorithmFile: (
        detailId: string,
        file: File,
    ) => Promise<string | null>;
};

export default function RowDetailsPanel({
                                            row,
                                            typesAll,
                                            onUpdateRow,
                                            onUploadAlgorithmFile,
                                        }: RowDetailsPanelProps) {
    const theme = useTheme();
    const c = theme.custom;

    const [algorithmFile, setAlgorithmFile] = useState<File | null>(null);

    const { editing, draft, startEdit, cancelEdit, finishEdit, setField } =
        useRowDetailsDraft(row);

    const editDraft = useMemo<Row | null>(() => {
        if (!row) return null;

        return {
            ...row,
            ...draft,
        };
    }, [row, draft]);

    const handleStartEdit = useCallback(() => {
        setAlgorithmFile(null);
        startEdit();
    }, [startEdit]);

    const handleCancel = useCallback(() => {
        setAlgorithmFile(null);
        cancelEdit();
    }, [cancelEdit]);

    const handleSave = useCallback(async () => {
        if (!row) return;

        let nextDraft: Partial<Row> = {
            ...draft,
        };

        if (algorithmFile) {
            const uploadedFileName = await onUploadAlgorithmFile(
                row.id,
                algorithmFile,
            );

            if (!uploadedFileName) return;

            nextDraft = {
                ...nextDraft,
                filePath: uploadedFileName,
            };
        }

        onUpdateRow(row.id, nextDraft);
        setAlgorithmFile(null);
        finishEdit();
    }, [
        row,
        draft,
        algorithmFile,
        onUploadAlgorithmFile,
        onUpdateRow,
        finishEdit,
    ]);

    if (!row) {
        return <EmptyState c={c} />;
    }

    if (editing && editDraft) {
        return (
            <RowDetailsEdit
                draft={editDraft}
                typesAll={typesAll ?? []}
                algorithmFile={algorithmFile}
                onChangeField={setField}
                onChangeAlgorithmFile={setAlgorithmFile}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <RowDetailsView
            row={row}
            typesAll={typesAll ?? []}
            onStartEdit={handleStartEdit}
        />
    );
}

function EmptyState({ c }: { c: CustomPalette }) {
    return (
        <Box
            sx={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                textAlign: "center",
                bgcolor: c.bgSurface,
            }}
        >
            <Typography
                sx={{
                    color: c.textMuted,
                    fontSize: "0.8rem",
                    lineHeight: 1.4,
                }}
            >
                {"Выберите строку в таблице, чтобы увидеть сведения"}
            </Typography>
        </Box>
    );
}