/**
 * `RowActionsCell` — three-icon action cluster (delete / edit / details) for
 * each row of the function registry. Pure presentation: the parent passes
 * already-bound callbacks, this component knows nothing about Redux or
 * routing.
 */
import {
  DeleteOutlineOutlined,
  EditNoteOutlined,
  OpenInNewOutlined,
} from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";

export type RowActionsCellPalette = {
  textMuted: string;
  dangerHover: string;
  accentBlue: string;
  detailBtnHover: string;
};

export type RowActionsCellLabels = {
  delete: string;
  edit: string;
  editClose: string;
  details: string;
};

export type RowActionsCellProps = {
  id: number;
  palette: RowActionsCellPalette;
  labels: RowActionsCellLabels;
  /** When true, this row is the one currently open in the form panel above
   * the table. Renders the edit icon in an active/pressed state and turns
   * the click into a close action. */
  isEditing: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onCloseEdit: () => void;
  onOpenDetails: (id: number) => void;
};

export function RowActionsCell({
  id,
  palette,
  labels,
  isEditing,
  onDelete,
  onEdit,
  onCloseEdit,
  onOpenDetails,
}: RowActionsCellProps) {
  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete(id);
  };
  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (isEditing) onCloseEdit();
    else onEdit(id);
  };
  const handleDetails = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onOpenDetails(id);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
      }}
    >
      <IconButton
        size="small"
        onClick={handleDelete}
        sx={{
          color: palette.textMuted,
          "&:hover": { color: palette.dangerHover },
        }}
        data-testid={`button-delete-${id}`}
        title={labels.delete}
      >
        <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleEdit}
        sx={{
          color: isEditing ? "#fff" : palette.accentBlue,
          bgcolor: isEditing ? palette.accentBlue : "transparent",
          "&:hover": {
            bgcolor: isEditing ? palette.accentBlue : palette.detailBtnHover,
            color: isEditing ? "#fff" : palette.accentBlue,
          },
        }}
        data-testid={`button-edit-function-${id}`}
        title={isEditing ? labels.editClose : labels.edit}
      >
        <EditNoteOutlined sx={{ fontSize: 18 }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleDetails}
        sx={{
          color: palette.accentBlue,
          "&:hover": { bgcolor: palette.detailBtnHover },
        }}
        data-testid={`button-detail-${id}`}
        title={labels.details}
      >
        <OpenInNewOutlined sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
