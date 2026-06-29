import { Box, IconButton } from "@mui/material";
import { DeleteOutlineOutlined, EditNoteOutlined, OpenInNewOutlined } from "@mui/icons-material";



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
  palette: RowActionsCellPalette;
  labels: RowActionsCellLabels;
  isEditing: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onCloseEdit: () => void;
  onOpenDetails: () => void;
};



export function RowActionsCell({
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
    onDelete();
  };
  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (isEditing) onCloseEdit();
    else onEdit();
  };
  const handleDetails = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onOpenDetails();
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
        title={labels.details}
      >
        <OpenInNewOutlined sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
