import { Delete } from "@mui/icons-material";
import { Box, Chip, IconButton, List, ListItemButton, ListItemText, Typography, useTheme } from "@mui/material";
import { selectSelectedFtsFunctionDetailId, selectSelectedFtsFunctionId, setSelectedFtsFunctionDetail, type FtsFunctionStep } from "../../../../store/uiSlice";
import { useFtsFunctionDetailControllerDeleteRelationV1Mutation, useFtsFunctionDetailControllerGetRelationsV1Query } from "../../../../store/ftsFunctionRegistry";
import { useAppDispatch, useAppSelector } from "../../../../store";
import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useMemo } from "react";


const FtsFunctionStepNameMap: Record<FtsFunctionStep, string> = {
  OBJECT_SELECTION: 'Шаг 1',
  CLUSTERING_IMPACT: 'Шаг 2',
}

type LinkRowProps = {
  ftsFunctionDetails: string;
  relationType: string;
  ftsFunctionStep: string;
  whoPerformsAction: string | undefined;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

function LinkRow({ ftsFunctionDetails, relationType, ftsFunctionStep, whoPerformsAction, onClick, onDelete, isDeleting }: LinkRowProps) {
  const theme = useTheme();
  const c = theme.custom;


  return (

    <ListItemButton
      onClick={onClick}
      sx={{
        py: 0.5,
        px: 1.5,
        borderRadius: 1,
        mx: 0.5,
        my: 0.25,
        "&:hover": { bgcolor: c.hoverOverlayStrong },
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={relationType ?? "Связь"}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.58rem",
                height: 18,
                bgcolor: c.linkBadgeBg,
                color: c.linkBadgeColor,
                borderColor: c.linkBadgeBorder,
                "& .MuiChip-label": { px: 0.5 },
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: c.textBody,
                fontSize: "0.72rem",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {ftsFunctionDetails}
            </Typography>
          </Box>
        }
        secondary={
          <Typography variant="caption" sx={{ color: c.textMuted, fontSize: "0.6rem" }}>
            {ftsFunctionStep}{whoPerformsAction ? ` · ${whoPerformsAction}` : ''}
          </Typography>
        }
      />
      <IconButton
        size="small"
        disabled={isDeleting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{
          color: c.textMuted,
          "&:hover": { color: c.dangerHover },
          ml: 0.5,
          flexShrink: 0,
        }}
      >
        <Delete sx={{ fontSize: 14 }} />
      </IconButton>
    </ListItemButton>
  )
}


export function RelationsViewItems() {
  const theme = useTheme();
  const c = theme.custom;

  const dispatch = useAppDispatch();

  const selectedFtsFunctionId = useAppSelector(selectSelectedFtsFunctionId);
  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);

  const isSelected = !!selectedFtsFunctionId && !!selectedFtsFunctionDetailId;

  const [deleteRelation, { isLoading: isDeleting }] = useFtsFunctionDetailControllerDeleteRelationV1Mutation();

  const { data: relations } = useFtsFunctionDetailControllerGetRelationsV1Query(
    isSelected ? { 
        ftsFunctionId: selectedFtsFunctionId,
        ftsFunctionDetailId: selectedFtsFunctionDetailId, 
        type: 'RELATED',
    } : skipToken
  );

  const linksByCategories = useMemo(() => {
    if (!relations?.data) return [];

    const { methodology, actualAction, controlAnalytics } = relations.data;

    const data = [
      {
        items: methodology,
        categoryColor: c.catMethodology,
        title: `Методология`,
        count: methodology.length,
      },
      {
        items: actualAction,
        categoryColor: c.catAction,
        title: `Фактическое действие`,
        count: actualAction.length,
      },
      {
        items: controlAnalytics,
        categoryColor: c.catControl,
        title: `Контроль / Аналитика`,
        count: controlAnalytics.length,
      },
    ];

    return data.filter(({ count }) => count > 0);
  }, [relations, c]);

  const total = useMemo(() => linksByCategories.reduce(
    (result, { count }) => result + count, 0),
    [linksByCategories]
  );

  const handleClick = useCallback((id: number, name: string, ftsFunctionStep: string, ftsFunctionCategory: string) => {
    dispatch(setSelectedFtsFunctionDetail({ id, name, ftsFunctionStep, ftsFunctionCategory }))
  }, [dispatch]);

  const handleDelete = useCallback(async (id: number) => {
    if (!selectedFtsFunctionDetailId) return;
    try {
      await deleteRelation({ parentFtsFunctionId: id, childFtsFunctionId: selectedFtsFunctionDetailId }).unwrap()
    } catch (e) {
      console.error(e);
    }
  }, [selectedFtsFunctionDetailId]);


  if (total === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: c.textMuted }}>
        <Typography
          variant="body2"
        >
          {"Связей нет"}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {linksByCategories.map(({ items, categoryColor, title, count }) => (
        <Box sx={{ mt: 1 }}>
          <Box
            sx={{
              px: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 14,
                borderRadius: 1,
                bgcolor: categoryColor.border,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: categoryColor.text, fontSize: "0.65rem", fontWeight: 600 }}
            >
              {`${title} (${count})`}
            </Typography>
          </Box>
          <List dense disablePadding>
            {items.map(({ id, ftsFunctionDetails, ftsFunctionStep, ftsFunctionCategory, whoPerformsAction, parents, children }) => {
              const target = parents.length ? parents : children;
              const relationType = target[0].relationType.name;

              return (
                <LinkRow
                  ftsFunctionDetails={ftsFunctionDetails}
                  ftsFunctionStep={FtsFunctionStepNameMap[ftsFunctionStep.code as FtsFunctionStep]}
                  whoPerformsAction={whoPerformsAction?.name}
                  relationType={relationType}
                  onClick={() => handleClick(Number(id), ftsFunctionDetails, ftsFunctionStep.code, ftsFunctionCategory.code)}
                  onDelete={() => handleDelete(Number(id))}
                  isDeleting={isDeleting}
                />
              )
            })}
          </List>
        </Box>
      ))}

    </>
  )
}