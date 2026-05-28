import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";
import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useCallback } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTranslation } from "src/shared/i18n";

import { useRowDetailsDraft } from "./hooks/useRowDetailsDraft";
import { RowDetailsEdit } from "./ui/RowDetailsEdit";
import { RowDetailsView } from "./ui/RowDetailsView";

type RowDetailsPanelProps = {
  row: Row | null;
  typesAll: TypeResponseDto[] | undefined;
  onUpdateRow: (id: string, updates: Partial<Row>) => void;
};

export default function RowDetailsPanel({
  row,
  typesAll,
  onUpdateRow,
}: RowDetailsPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  const { editing, draft, startEdit, cancelEdit, finishEdit, setField } =
    useRowDetailsDraft(row);

  const handleSave = useCallback(() => {
    if (!row) return;
    onUpdateRow(row.id, draft);
    finishEdit();
  }, [row, draft, onUpdateRow, finishEdit]);

  if (!row) return <EmptyState t={t} c={c} />;

  if (editing) {
    return (
      <RowDetailsEdit
        draft={draft}
        typesAll={typesAll ?? []}
        onChangeField={setField}
        onSave={handleSave}
        onCancel={cancelEdit}
      />
    );
  }

  return (
    <RowDetailsView
      row={row}
      typesAll={typesAll ?? []}
      onStartEdit={startEdit}
    />
  );
}

// ---- inline helper (Class 26: takes c/t as props) ----

function EmptyState({ t, c }: { t: TFunction; c: CustomPalette }) {
  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: c.textDim,
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontSize: "0.78rem", textAlign: "center" }}
        data-testid="text-no-row-selected"
      >
        {"Выберите строку в таблице, чтобы увидеть сведения"}
      </Typography>
    </Box>
  );
}
