import { useTheme } from "@mui/material";
import { FtsFunctionCategory } from "src/entities/fts-function/model";

export type CategoryColor = { bg: string; border: string; text: string };

export function useCategoryColors(): Record<
  FtsFunctionCategory,
  CategoryColor
> {
  const theme = useTheme();
  const c = theme.custom;
  return {
    [FtsFunctionCategory.METHODOLOGY]: c.catMethodology,
    [FtsFunctionCategory.ACTUAL_ACTION]: c.catAction,
    [FtsFunctionCategory.CONTROL_ANALYTICS]: c.catControl,
  };
}
