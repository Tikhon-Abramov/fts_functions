import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Link, Row } from "src/entities/fts-function/types";

import { useMemo, useState } from "react";
import { AddLink, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import { KINDS } from "src/entities/fts-function/constants";
import {
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { I18N, useTranslation } from "src/shared/i18n";
import { TypeChip } from "src/shared/ui/TypeChip";

import { Category as CategoryEnum } from "@registry/shared/enums";

export const LINK_PICKER_TEST_IDS = {
  KIND_SELECT: "select-link-kind",
  TARGET_STEP_1: "button-target-step-1",
  TARGET_STEP_2: "button-target-step-2",
  SEARCH_INPUT: "input-link-search",
  CREATE_BUTTON: "button-create-links",
} as const;

const TargetStepButtonVariant = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
type TargetStepButtonVariant =
  (typeof TargetStepButtonVariant)[keyof typeof TargetStepButtonVariant];

export type LinkPickerProps = {
  sourceRow: Row;
  allRows: Row[];
  existingLinks: Link[];
  onCreateLinks: (targets: string[], kind: FtsFunctionRelationType) => void;
};

export default function LinkPicker({
  sourceRow,
  allRows,
  existingLinks,
  onCreateLinks,
}: LinkPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  const categoryChip: Record<
    FtsFunctionCategory,
    { bg: string; color: string }
  > = {
    METHODOLOGY: c.catMethodologyChip,
    ACTUAL_ACTION: c.catActionChip,
    CONTROL_ANALYTICS: c.catControlChip,
  };

  const { data: typesAll = [] } = useConstantControllerGetTypesV1Query({});
  const categoryColorByCode = useMemo(() => {
    const m = new Map<string, string | null | undefined>();
    typesAll.forEach((tp) => {
      if (tp.category === CategoryEnum.FTS_FUNCTION_CATEGORY) {
        m.set(tp.code, tp.color);
      }
    });
    return m;
  }, [typesAll]);

  const [kind, setKind] = useState<FtsFunctionRelationType>(
    FtsFunctionRelationType.CONNECTED,
  );
  const [targetStep, setTargetStep] = useState<FtsFunctionStep>(
    sourceRow.step === FtsFunctionStep.OBJECT_SELECTION
      ? FtsFunctionStep.CLUSTERING_IMPACT
      : FtsFunctionStep.OBJECT_SELECTION,
  );
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const existingPairs = useMemo(() => {
    const pairs = new Set<string>();
    existingLinks.forEach((l) => {
      pairs.add(`${l.fromId}|${l.toId}|${l.kind}`);
      pairs.add(`${l.toId}|${l.fromId}|${l.kind}`);
    });
    return pairs;
  }, [existingLinks]);

  const candidates = useMemo(() => {
    const searchLower = search.toLowerCase();
    // The backend rejects self-links with SELF_LOOP_FORBIDDEN (defense in
    // depth, covered by tree-edges.spec.ts). We ALSO filter client-side so
    // the user never sees themselves as a candidate — no error toast for
    // an action they couldn't have meaningfully wanted to perform.
    return allRows.filter((r) => {
      if (r.id === sourceRow.id) return false;
      if (r.step !== targetStep) return false;
      if (search && !r.detailText.toLowerCase().includes(searchLower)) {
        return false;
      }
      return true;
    });
  }, [allRows, sourceRow.id, targetStep, search]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    const targets = Array.from(checked).filter((id) => {
      const pairKey = `${sourceRow.id}|${id}|${kind}`;
      return !existingPairs.has(pairKey);
    });
    if (targets.length > 0) {
      onCreateLinks(targets, kind);
    }
    setChecked(new Set());
  };

  const newCount = Array.from(checked).filter(
    (id) => !existingPairs.has(`${sourceRow.id}|${id}|${kind}`),
  ).length;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: c.bgInput,
      color: c.textBody,
      fontSize: "0.8rem",
      "& fieldset": { borderColor: c.borderMedium },
      "&:hover fieldset": { borderColor: c.borderHover },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": { color: c.textMuted, fontSize: "0.75rem" },
  };

  const selectSx = {
    bgcolor: c.bgInput,
    color: c.textBody,
    fontSize: "0.8rem",
    "& fieldset": { borderColor: c.borderMedium },
    "&:hover fieldset": { borderColor: c.borderHover },
    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    "& .MuiSelect-icon": { color: c.textMuted },
  };

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
        <Typography
          variant="caption"
          sx={{
            color: c.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.6rem",
          }}
        >
          {"Источник"}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: c.textPrimary,
            mt: 0.5,
            fontSize: "0.75rem",
            lineHeight: 1.3,
          }}
        >
          {sourceRow.detailText.length > 100
            ? sourceRow.detailText.slice(0, 100) + "..."
            : sourceRow.detailText}
        </Typography>
      </Box>

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
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as FtsFunctionRelationType)}
            label={"Тип связи"}
            sx={selectSx}
            MenuProps={{
              PaperProps: {
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
            }}
            data-testid={LINK_PICKER_TEST_IDS.KIND_SELECT}
          >
            {KINDS.map((k) => (
              <MenuItem key={k} value={k} sx={{ fontSize: "0.8rem" }}>
                {findTypeNameByCode(typesAll, k)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {(
            [
              {
                step: FtsFunctionStep.OBJECT_SELECTION,
                labelKey: I18N.linkPicker.step1Target,
                testId: LINK_PICKER_TEST_IDS.TARGET_STEP_1,
              },
              {
                step: FtsFunctionStep.CLUSTERING_IMPACT,
                labelKey: I18N.linkPicker.step2Target,
                testId: LINK_PICKER_TEST_IDS.TARGET_STEP_2,
              },
            ] as const
          ).map(({ step, labelKey, testId }) => {
            const variant: TargetStepButtonVariant =
              targetStep === step
                ? TargetStepButtonVariant.ACTIVE
                : TargetStepButtonVariant.INACTIVE;
            const styleByVariant: Record<
              TargetStepButtonVariant,
              Record<string, unknown>
            > = {
              [TargetStepButtonVariant.ACTIVE]: {
                bgcolor: theme.palette.primary.main,
                "&:hover": { bgcolor: theme.palette.primary.dark },
              },
              [TargetStepButtonVariant.INACTIVE]: {
                borderColor: c.borderMedium,
                color: c.textSecondary,
                "&:hover": { borderColor: c.borderHover },
              },
            };
            return (
              <Button
                key={step}
                variant={
                  variant === TargetStepButtonVariant.ACTIVE
                    ? "contained"
                    : "outlined"
                }
                size="small"
                onClick={() => setTargetStep(step)}
                sx={{
                  flex: 1,
                  fontSize: "0.7rem",
                  textTransform: "none",
                  ...styleByVariant[variant],
                }}
                data-testid={testId}
              >
                {t(labelKey)}
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
          sx={inputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 16, color: c.textMuted }} />
              </InputAdornment>
            ),
          }}
          data-testid={LINK_PICKER_TEST_IDS.SEARCH_INPUT}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 0.5 }}>
        <List dense disablePadding>
          {candidates.map((row) => {
            const isAlreadyLinked = existingPairs.has(
              `${sourceRow.id}|${row.id}|${kind}`,
            );
            const isChecked = checked.has(row.id);
            const catDisplay = findTypeNameByCode(typesAll, row.category);

            return (
              <ListItem
                key={row.id}
                disablePadding
                sx={{ my: 0.25 }}
                data-testid={`link-candidate-${row.id}`}
              >
                <ListItemButton
                  onClick={() => !isAlreadyLinked && toggleCheck(row.id)}
                  disabled={isAlreadyLinked}
                  sx={{
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    opacity: isAlreadyLinked ? 0.5 : 1,
                    "&:hover": { bgcolor: c.hoverOverlayStrong },
                  }}
                  data-testid={`target-${row.id}`}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      checked={isChecked || isAlreadyLinked}
                      disabled={isAlreadyLinked}
                      size="small"
                      sx={{
                        color: c.textDim,
                        "&.Mui-checked": {
                          color: isAlreadyLinked
                            ? c.textDim
                            : theme.palette.primary.main,
                        },
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
                        <TypeChip
                          code={row.category}
                          name={
                            catDisplay.length > 8
                              ? catDisplay.slice(0, 8) + "."
                              : catDisplay
                          }
                          color={categoryColorByCode.get(row.category)}
                          variant="filled"
                          fallbackColor={categoryChip[row.category].color}
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
                          {row.detailText}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.25,
                        }}
                      >
                        {row.who && (
                          <Typography
                            variant="caption"
                            sx={{ color: c.textMuted, fontSize: "0.6rem" }}
                          >
                            {row.who}
                          </Typography>
                        )}
                        {isAlreadyLinked && (
                          <Chip
                            label={"Уже связано"}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: "0.5rem",
                              height: 14,
                              bgcolor: c.actionOptimize.bg,
                              color: c.actionOptimize.color,
                              borderColor: c.actionOptimize.border,
                              "& .MuiChip-label": { px: 0.5 },
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {candidates.length === 0 && (
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
            disabled={newCount === 0}
            startIcon={<AddLink sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontSize: "0.8rem",
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
              "&.Mui-disabled": { bgcolor: c.borderMain, color: c.textDim },
            }}
            data-testid={LINK_PICKER_TEST_IDS.CREATE_BUTTON}
          >
            {t(I18N.linkPicker.createLinks, { count: newCount })}
          </Button>
        </Box>
      )}
    </Box>
  );
}
