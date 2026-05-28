import type { RowPresentationResolver } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";

import {
  Box,
  Table,
  TableBody,
  TableContainer,
  Typography,
  useTheme,
} from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import {
  FTS_FUNCTION_STEP_NUMBER,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import { CATEGORY_ROW_HEIGHT } from "src/shared/config/ui";
import { I18N, useTranslation } from "src/shared/i18n";

import { CountChip, Emphasis } from "../chips/CountChip";

import { DataRow } from "./DataRow";

export type CategoryColors = {
  bg: string;
  border: string;
  text: string;
};

export type CategorySectionProps = {
  category: FtsFunctionCategory;
  step1Rows: Row[];
  step2Rows: Row[];
  step1IndexMap: Map<string, number>;
  step2IndexMap: Map<string, number>;
  linkCount: number;
  colors: CategoryColors;
  presentation: RowPresentationResolver;
  colorByCode: Map<string, string | null | undefined>;
  onRowClick: (id: string) => void;
  onRemoveRow: (id: string) => void;
  registerRowRef: (id: string) => (el: HTMLTableRowElement | null) => void;
};

/**
 * One category banner + the two step columns containing its rows. Hidden
 * when both steps have no rows for the category.
 */
export function CategorySection({
  category,
  step1Rows,
  step2Rows,
  step1IndexMap,
  step2IndexMap,
  linkCount,
  colors,
  presentation,
  colorByCode,
  onRowClick,
  onRemoveRow,
  registerRowRef,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  const { data: typesAll = [] } = useConstantControllerGetTypesV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );

  if (!step1Rows.length && !step2Rows.length) return null;

  return (
    <>
      <Box
        sx={{
          height: CATEGORY_ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1,
          bgcolor: colors.bg,
          borderLeft: `3px solid ${colors.border}`,
          borderBottom: `1px solid ${c.borderLight}`,
        }}
        data-testid={`header-cat-${category}`}
      >
        <Typography
          sx={{
            color: colors.text,
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        >
          {findTypeNameByCode(typesAll, category)}
        </Typography>
        <CountChip
          label={t(I18N.modal.step1Short, { count: step1Rows.length })}
        />
        <CountChip
          label={t(I18N.modal.step2Short, { count: step2Rows.length })}
        />
        {linkCount > 0 && (
          <CountChip
            label={t(I18N.modal.linksCount, { count: linkCount })}
            emphasis={Emphasis.ACCENT}
          />
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 2px 1fr",
          gap: 0,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <CategoryStepTable
            rows={step1Rows}
            indexMap={step1IndexMap}
            step={FtsFunctionStep.OBJECT_SELECTION}
            presentation={presentation}
            colorByCode={colorByCode}
            onRowClick={onRowClick}
            onRemoveRow={onRemoveRow}
            registerRowRef={registerRowRef}
          />
        </Box>
        <Box sx={{ bgcolor: c.borderDivider }} />
        <Box sx={{ minWidth: 0 }}>
          <CategoryStepTable
            rows={step2Rows}
            indexMap={step2IndexMap}
            step={FtsFunctionStep.CLUSTERING_IMPACT}
            presentation={presentation}
            colorByCode={colorByCode}
            onRowClick={onRowClick}
            onRemoveRow={onRemoveRow}
            registerRowRef={registerRowRef}
          />
        </Box>
      </Box>
    </>
  );
}

type CategoryStepTableProps = {
  rows: Row[];
  indexMap: Map<string, number>;
  step: FtsFunctionStep;
  presentation: RowPresentationResolver;
  colorByCode: Map<string, string | null | undefined>;
  onRowClick: (id: string) => void;
  onRemoveRow: (id: string) => void;
  registerRowRef: (id: string) => (el: HTMLTableRowElement | null) => void;
};

function CategoryStepTable({
  rows,
  indexMap,
  step,
  presentation,
  colorByCode,
  onRowClick,
  onRemoveRow,
  registerRowRef,
}: CategoryStepTableProps) {
  const stepNumber = FTS_FUNCTION_STEP_NUMBER[step];
  return (
    <TableContainer sx={{ overflow: "visible" }}>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableBody>
          {rows.map((row) => {
            const idx = indexMap.get(row.id);
            const label = idx !== undefined ? `${stepNumber}.${idx}` : "";
            return (
              <DataRow
                key={row.id}
                row={row}
                indexLabel={label}
                presentation={presentation}
                colorByCode={colorByCode}
                onClick={onRowClick}
                onRemove={onRemoveRow}
                registerRef={registerRowRef}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
