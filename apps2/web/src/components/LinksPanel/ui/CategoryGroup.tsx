import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Row } from "src/entities/fts-function/types";

import { Box, List, Typography } from "@mui/material";
import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import { I18N, useTranslation } from "src/shared/i18n";

import { LinkRow } from "./LinkRow";

export type CategoryGroupItem = { linkId: string; targetRow: Row };

export type CategoryGroupProps = {
  category: FtsFunctionCategory;
  items: CategoryGroupItem[];
  colors: { bg: string; border: string; text: string };
  onNavigate: (id: string) => void;
  onRemove: (linkId: string) => void;
};

export function CategoryGroup({
  category,
  items,
  colors,
  onNavigate,
  onRemove,
}: CategoryGroupProps) {
  const { t } = useTranslation();
  const { data: typesAll = [] } = useConstantControllerGetTypesV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );
  return (
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
            bgcolor: colors.border,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: colors.text, fontSize: "0.65rem", fontWeight: 600 }}
          data-testid={`links-cat-${category}`}
        >
          {t(I18N.linksPanel.categoryCount, {
            name: findTypeNameByCode(typesAll, category),
            count: items.length,
          })}
        </Typography>
      </Box>
      <List dense disablePadding>
        {items.map(({ linkId, targetRow }) => (
          <LinkRow
            key={linkId}
            linkId={linkId}
            targetRow={targetRow}
            onNavigate={onNavigate}
            onRemove={onRemove}
          />
        ))}
      </List>
    </Box>
  );
}
