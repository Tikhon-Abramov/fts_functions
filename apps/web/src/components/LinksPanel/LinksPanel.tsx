import type { TFunction } from "i18next";
import type { CustomPalette } from "src/app/App";
import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Link, Row } from "src/entities/fts-function/types";

import { LinkOff } from "@mui/icons-material";
import { Box, Typography, useTheme } from "@mui/material";
import { CATEGORIES } from "src/entities/fts-function/constants";
import { useCategoryColors } from "src/entities/fts-function/hooks/colors/useCategoryColors";
import { FTS_FUNCTION_STEP_NUMBER } from "src/entities/fts-function/model";
import { I18N, useTranslation } from "src/shared/i18n";

import { CategoryGroup, type CategoryGroupItem } from "./ui/CategoryGroup";

export const LINKS_PANEL_TEST_IDS = {
  SELECTED_DETAIL: "text-selected-detail",
  NO_LINKS: "text-no-links",
} as const;

export type LinksPanelProps = {
  selectedRow: Row | null;
  allLinks: Link[];
  rowMap: Map<string, Row>;
  onNavigate: (id: string) => void;
  onRemoveLink: (linkId: string) => void;
};

function collectLinkedItems(
  selectedRow: Row,
  allLinks: Link[],
  rowMap: Map<string, Row>,
): CategoryGroupItem[] {
  const items: CategoryGroupItem[] = [];
  for (const link of allLinks) {
    const targetId = link.fromId === selectedRow.id ? link.toId : link.fromId;
    const target = rowMap.get(targetId);
    if (target) items.push({ linkId: link.id, targetRow: target });
  }
  return items;
}

function groupByCategory(
  items: CategoryGroupItem[],
): Record<FtsFunctionCategory, CategoryGroupItem[]> {
  const grouped: Record<FtsFunctionCategory, CategoryGroupItem[]> = {
    METHODOLOGY: [],
    ACTUAL_ACTION: [],
    CONTROL_ANALYTICS: [],
  };
  for (const item of items) {
    grouped[item.targetRow.category].push(item);
  }
  return grouped;
}

export default function LinksPanel({
  selectedRow,
  allLinks,
  rowMap,
  onNavigate,
  onRemoveLink,
}: LinksPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  const categoryColors = useCategoryColors();

  if (!selectedRow) return <EmptySelection t={t} c={c} />;

  const linkedItems = collectLinkedItems(selectedRow, allLinks, rowMap);
  const byCategory = groupByCategory(linkedItems);

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
          {t(I18N.linksPanel.selectedLabel, {
            step: FTS_FUNCTION_STEP_NUMBER[selectedRow.step],
          })}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: c.textPrimary,
            mt: 0.5,
            fontSize: "0.8rem",
            lineHeight: 1.4,
          }}
          data-testid={LINKS_PANEL_TEST_IDS.SELECTED_DETAIL}
        >
          {selectedRow.detailText}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 0.5 }}>
        {linkedItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: c.textMuted }}>
            <Typography
              variant="body2"
              data-testid={LINKS_PANEL_TEST_IDS.NO_LINKS}
            >
              {"Связей нет"}
            </Typography>
          </Box>
        ) : (
          CATEGORIES.map((cat) => {
            const items = byCategory[cat];
            if (!items || items.length === 0) return null;
            const cc = categoryColors[cat];
            if (!cc) return null;
            return (
              <CategoryGroup
                key={cat}
                category={cat}
                items={items}
                colors={cc}
                onNavigate={onNavigate}
                onRemove={onRemoveLink}
              />
            );
          })
        )}
      </Box>
    </Box>
  );
}

// ---- inline helper (Class 26: takes t/c as props, no useTheme) ----

function EmptySelection({ t, c }: { t: TFunction; c: CustomPalette }) {
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: c.textMuted,
      }}
    >
      <LinkOff sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
      <Typography variant="body2" sx={{ textAlign: "center" }}>
        {"Выберите элемент в таблице для просмотра связей"}
      </Typography>
    </Box>
  );
}
