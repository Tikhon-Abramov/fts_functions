import { useMemo, useState } from "react";
import { Box, Button, Checkbox, Chip, FormControl, InputAdornment, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, TextField, Typography, useTheme } from "@mui/material";
import { AddLink, Search } from "@mui/icons-material";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "../../../../store";
import { selectSelectedFtsFunctionDetailId, selectSelectedFtsFunctionId, selectSelectedFtsFunctionStep, type FtsFunctionStep } from "../../../../store/uiSlice";
import { useConstantControllerGetTypesV1Query, useFtsFunctionDetailControllerCreateRelationV1Mutation, useFtsFunctionDetailControllerGetRelationsV1Query } from "../../../../store/ftsFunctionRegistry";
import { createOtionsFromTypes } from "../../../../utils/create-options";



const FtsFunctionStepNameMap: Record<FtsFunctionStep, string> = {
  OBJECT_SELECTION: 'Шаг 1',
  CLUSTERING_IMPACT: 'Шаг 2',
};
const StepValues: FtsFunctionStep[] = ['OBJECT_SELECTION', 'CLUSTERING_IMPACT'];


export function RelationsAddForm() {
  const theme = useTheme();
  const c = theme.custom;

  const selectedFtsFunctionId = useAppSelector(selectSelectedFtsFunctionId);
  const selectedFtsFunctionDetailId = useAppSelector(selectSelectedFtsFunctionDetailId);
  const selectedFtsFunctionStep = useAppSelector(selectSelectedFtsFunctionStep);
  const isSelected = !!selectedFtsFunctionId && !!selectedFtsFunctionDetailId;

  // ===== Фильтры запроса =====
  const [relationTypeId, setRelationTypeId] = useState<number | null>(null);
  const [stepCode, setStepCode] = useState<FtsFunctionStep | null>(selectedFtsFunctionStep);
  const [search, setSearch] = useState("");

  // ===== Локальный выбор кандидатов =====
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const [createRelations, { isLoading: isCreating }] = useFtsFunctionDetailControllerCreateRelationV1Mutation();

  // ===== Справочники для фильтров =====
  const { data: ftsFunctionStep } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_STEP'] });
  const { data: ftsFunctionRelationType } = useConstantControllerGetTypesV1Query({ categories: ['FTS_FUNCTION_RELATION_TYPE'] });

  const ftsFunctionRelationTypeOptions = useMemo(() => createOtionsFromTypes(ftsFunctionRelationType), [ftsFunctionRelationType]);

  const ftsFunctionStepId = useMemo(() => {
    if (!stepCode || !ftsFunctionStep) return undefined;

    return ftsFunctionStep.find(({ code }) => stepCode === code)?.id ?? undefined;
  }, [ftsFunctionStep, stepCode]);


  // ===== Несвязанные кандидаты с учётом фильтров =====
  const { data: ftsFunctionDetails } = useFtsFunctionDetailControllerGetRelationsV1Query(
    isSelected
      ? {
        ftsFunctionId: selectedFtsFunctionId,
        ftsFunctionDetailId: selectedFtsFunctionDetailId,
        type: 'UNRELATED',
        // relationTypeId: relationTypeId || undefined,
        ftsFunctionStepId: ftsFunctionStepId ?? undefined,
        search: search.trim() || undefined,
      }
      : skipToken
  );

  const items = useMemo(() => {
    if (!ftsFunctionDetails?.data) return [];

    const { methodology, actualAction, controlAnalytics } = ftsFunctionDetails.data;

    return [
      ...methodology,
      ...actualAction,
      ...controlAnalytics,
    ];
  }, [ftsFunctionDetails]);

  const categoryChip: Record<string, { bg: string; color: string }> = {
    METHODOLOGY: c.catMethodologyChip,
    ACTUAL_ACTION: c.catActionChip,
    CONTROL_ANALYTICS: c.catControlChip,
  };

  const toggleCheck = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedFtsFunctionDetailId || relationTypeId == null || checked.size === 0 || isCreating) return;

    try {
      await createRelations({
        createFtsFunctionDetailsRelationDto: Array.from(checked).map((id) => ({
          parentFtsFunctionId: id,
          childFtsFunctionId: selectedFtsFunctionDetailId,
          relationTypeId,
        })),
      }).unwrap();
      setChecked(new Set());
    } catch (error) {
      console.error("Не удалось создать связи:", error);
    }
  };

  


  return (
    <>
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel
            sx={{
              color: c.textMuted,
              fontSize: "0.75rem",
              "&.Mui-focused": { color: theme.palette.primary.main },
            }}
          >
            {"Тип связи"}
          </InputLabel>
          <Select<number | null>
            value={relationTypeId}
            onChange={(e) => setRelationTypeId(e.target.value ? Number(e.target.value) : null)}
            label={"Тип связи"}
            sx={{
              bgcolor: c.bgInput,
              color: c.textBody,
              fontSize: "0.78rem",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: c.borderMedium },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: c.borderHover },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.primary.main },
            }}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    bgcolor: c.bgMenu,
                    color: c.textBody,
                    border: `1px solid ${c.borderMain}`,
                    "& .MuiMenuItem-root": {
                      "&:hover": { bgcolor: c.hoverOverlayStrong },
                      "&.Mui-selected": { bgcolor: c.selectedBg },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="" sx={{ fontSize: "0.8rem" }}>
              {"Все"}
            </MenuItem>
            {ftsFunctionRelationTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: "0.8rem" }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {StepValues.map((code) => {
            const isActive = stepCode === code;

            return (
              <Button
                key={code}
                variant={isActive ? "contained" : "outlined"}
                size="small"
                onClick={() => setStepCode(code)}
                sx={{
                  flex: 1,
                  fontSize: "0.7rem",
                  textTransform: "none",
                  ...(isActive
                    ? {
                      bgcolor: theme.palette.primary.main,
                      "&:hover": { bgcolor: theme.palette.primary.dark },
                    }
                    : {
                      borderColor: c.borderMedium,
                      color: c.textSecondary,
                      "&:hover": { borderColor: c.borderHover },
                    }),
                }}
              >
                {FtsFunctionStepNameMap[code]}
              </Button>
            );
          })}
        </Box>

        <TextField
          placeholder={"Поиск по детализации..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: c.bgInput,
              color: c.textBody,
              fontSize: "0.78rem",
              "& fieldset": { borderColor: c.borderMedium },
              "&:hover fieldset": { borderColor: c.borderHover },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: c.textMuted }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 0.5 }}>
        <List dense disablePadding>
          {items.map((row) => {
            const id = Number(row.id);
            const isChecked = checked.has(id);
            const categoryCode = row.ftsFunctionCategory.code;
            const categoryName = row.ftsFunctionCategory.name;
            const chipColor = categoryChip[categoryCode];

            return (
              <ListItem
                key={row.id}
                disablePadding
                sx={{ my: 0.25 }}
              >
                <ListItemButton
                  onClick={() => toggleCheck(id)}
                  sx={{
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    "&:hover": { bgcolor: c.hoverOverlayStrong },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      checked={isChecked}
                      size="small"
                      sx={{
                        color: c.textDim,
                        "&.Mui-checked": { color: theme.palette.primary.main },
                        p: 0.25,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 0.75,
                        }}
                      >
                        <Chip
                          label={
                            categoryName.length > 8
                              ? categoryName.slice(0, 8) + "."
                              : categoryName
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            flexShrink: 0,
                            height: 22,
                            fontSize: "0.7rem",
                            bgcolor: chipColor?.bg,
                            color: chipColor?.color,
                            border: 'hidden',
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: c.textBody,
                            fontSize: "0.7rem",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {row.ftsFunctionDetails}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      row.whoPerformsAction && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.25,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: c.textMuted, fontSize: "0.6rem" }}
                          >
                            {row.whoPerformsAction.name}
                          </Typography>
                        </Box>
                      )
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {items.length === 0 && (
            <Box sx={{ p: 2, textAlign: "center", color: c.textMuted }}>
              <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                {"Нет подходящих элементов"}
              </Typography>
            </Box>
          )}
        </List>
      </Box>

      {checked.size > 0 && (
        <Box
          sx={{ p: 2, borderTop: `1px solid ${c.borderMain}`, flexShrink: 0 }}
        >
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreate}
            disabled={(relationTypeId === null) || (checked.size === 0)}
            startIcon={<AddLink sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
              "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
            }}
          >
            {`Создать связи (${checked.size})`}
          </Button>
        </Box>
      )}
    </>
  );
}
