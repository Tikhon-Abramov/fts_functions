import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";
import type { I18nKey } from "src/shared/i18n";

import { Box, Typography, useTheme } from "@mui/material";
import { FtsFunctionStep } from "src/entities/fts-function/model";
import { STEP_TITLE_HEIGHT } from "src/shared/config/ui";
import { useTranslation } from "src/shared/i18n";

type StepDef = {
  /** Domain identifier for the step — drives the dot color via a Record lookup. */
  kind: FtsFunctionStep;
  titleI18n: I18nKey;
  testId: string;
};

export type StepTitleRowProps = {
  step1: StepDef;
  step2: StepDef;
};

/**
 * Sticky two-column row that introduces each step. Replaces the 70-line
 * copy-paste pair the modal had at HEAD: only the dot color, label, and
 * testid differ between sides.
 */
export function StepTitleRow({ step1, step2 }: StepTitleRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  const colorByStep: Record<FtsFunctionStep, string> = {
    [FtsFunctionStep.OBJECT_SELECTION]: theme.palette.primary.main,
    [FtsFunctionStep.CLUSTERING_IMPACT]: theme.palette.success.main,
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 2px 1fr",
        gap: 0,
        minWidth: 0,
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <StepTitleCell
        t={t}
        c={c}
        step={step1}
        dotColor={colorByStep[step1.kind]}
      />
      <Box sx={{ bgcolor: c.borderDivider }} />
      <StepTitleCell
        t={t}
        c={c}
        step={step2}
        dotColor={colorByStep[step2.kind]}
      />
    </Box>
  );
}

type StepTitleCellProps = {
  t: TFunction;
  c: CustomPalette;
  step: StepDef;
  dotColor: string;
};

function StepTitleCell({ t, c, step, dotColor }: StepTitleCellProps) {
  return (
    <Box
      sx={{
        bgcolor: c.bgPaper,
        px: 2,
        height: STEP_TITLE_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderBottom: `1px solid ${c.borderMain}`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: dotColor,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="subtitle2"
        sx={{
          color: c.textBody,
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
        data-testid={step.testId}
      >
        {t(step.titleI18n)}
      </Typography>
    </Box>
  );
}
