import type { FtsFunctionActionType } from "src/entities/fts-function/model";

import { useTheme } from "@mui/material";
import { useActionChipColors } from "src/entities/fts-function/hooks/colors/useActionChipColors";
import { resolveActionDisplay } from "src/entities/fts-function/lib/resolveActionDisplay";
import { useConstantControllerGetTypesV1Query } from "src/shared/api/ftsFunctionsApi";
import { DICTIONARY_QUERY_OPTIONS } from "src/shared/api/query-options";
import { TypeChip } from "src/shared/ui/TypeChip";

export type ActionChipProps = {
  action: FtsFunctionActionType | "" | undefined;
  /** Type code → color, sourced from the dictionary. */
  colorByCode: Map<string, string | null | undefined>;
};

/**
 * Renders the `actionLabel` field of a row as a `TypeChip`. Shows a "not set"
 * chip when the row has no action assigned.
 */
export function ActionChip({ action, colorByCode }: ActionChipProps) {
  const theme = useTheme();
  const c = theme.custom;
  const actionColors = useActionChipColors();
  const { data: typesAll = [] } = useConstantControllerGetTypesV1Query(
    {},
    DICTIONARY_QUERY_OPTIONS,
  );

  if (!action) {
    return <TypeChip name={"Не указано"} fallbackColor={c.textSecondary} />;
  }
  const ac = actionColors[action];
  return (
    <TypeChip
      code={action}
      name={resolveActionDisplay(typesAll, action)}
      color={colorByCode.get(action)}
      variant="filled"
      fallbackColor={ac.color}
    />
  );
}
