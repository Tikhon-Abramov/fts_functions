import type { CustomPalette } from "src/app/App";
import type { RowPresentationResolver } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import type { RowsByCategory } from "src/entities/fts-function/lib/detail-grouping";
import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";

import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { CATEGORIES } from "src/entities/fts-function/constants";
import { useCategoryColors } from "src/entities/fts-function/hooks/colors/useCategoryColors";
import { FtsFunctionStep } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";

import { type CategoryColors, CategorySection } from "../rows/CategorySection";

import { StepColumnHeaderRow } from "./StepColumnHeaderRow";
import { StepTitleRow } from "./StepTitleRow";

export type DetailStepGridProps = {
  isLoading: boolean;
  isError: boolean;
  step1ByCategory: RowsByCategory;
  step2ByCategory: RowsByCategory;
  step1IndexMap: Map<string, number>;
  step2IndexMap: Map<string, number>;
  linkCountsPerCategory: Record<FtsFunctionCategory, number>;
  presentation: RowPresentationResolver;
  colorByCode: Map<string, string | null | undefined>;
  onRowClick: (id: string) => void;
  onRemoveRow: (id: string) => void;
  registerRowRef: (id: string) => (el: HTMLTableRowElement | null) => void;
};

/**
 * Left panel of the modal: loading/error states, the two sticky header rows,
 * and one `<CategorySection>` per category that contains rows in either step.
 */
export function DetailStepGrid({
  isLoading,
  isError,
  step1ByCategory,
  step2ByCategory,
  step1IndexMap,
  step2IndexMap,
  linkCountsPerCategory,
  presentation,
  colorByCode,
  onRowClick,
  onRemoveRow,
  registerRowRef,
}: DetailStepGridProps) {
  const theme = useTheme();
  const c = theme.custom;
  const categoryColors = useCategoryColors();

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={24} sx={{ color: c.accentBlue }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: c.textMuted }}>
        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
          {"Не удалось загрузить детализацию функции"}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <StepTitleRow
        step1={{
          kind: FtsFunctionStep.OBJECT_SELECTION,
          titleI18n: I18N.modal.step1Title,
          testId: "text-step1-title",
        }}
        step2={{
          kind: FtsFunctionStep.CLUSTERING_IMPACT,
          titleI18n: I18N.modal.step2Title,
          testId: "text-step2-title",
        }}
      />
      <StepColumnHeaderRow />
      {CATEGORIES.map((cat) => {
        const s1: Row[] = step1ByCategory[cat] ?? [];
        const s2: Row[] = step2ByCategory[cat] ?? [];
        const colors = resolveCategoryColors(categoryColors, cat, c);
        return (
          <CategorySection
            key={cat}
            category={cat}
            step1Rows={s1}
            step2Rows={s2}
            step1IndexMap={step1IndexMap}
            step2IndexMap={step2IndexMap}
            linkCount={linkCountsPerCategory[cat] ?? 0}
            colors={colors}
            presentation={presentation}
            colorByCode={colorByCode}
            onRowClick={onRowClick}
            onRemoveRow={onRemoveRow}
            registerRowRef={registerRowRef}
          />
        );
      })}
    </>
  );
}

function resolveCategoryColors(
  byCategory: Record<string, CategoryColors> | undefined,
  cat: FtsFunctionCategory,
  c: CustomPalette,
): CategoryColors {
  return (
    byCategory?.[cat] ?? {
      bg: "transparent",
      border: c.borderMedium,
      text: c.textSecondary,
    }
  );
}
